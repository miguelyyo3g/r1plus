// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseclient';

interface ChatViewProps {
  user: AuthUser;
}

const normalizePhone = (p: string) => p ? p.replace(/\D/g, '').slice(-9) : '';

// --- NUEVO: FUNCIÓN MAESTRA DE ORDENAMIENTO ---
const sortConversations = (chats: any[]) => {
  return [...chats].sort((a, b) => {
    const getWeight = (c: any) => {
      if (c.status === 'accepted' || c.status === 'active') return 3; // Primeros: Chats abiertos
      if (c.status === 'pending' && !c.isSms) return 2; // Segundos: Pendientes plataforma (🟢)
      if (c.isSms) return 1; // Terceros: SMS pendientes (🔴)
      return 0;
    };
    const wA = getWeight(a);
    const wB = getWeight(b);
    if (wA !== wB) return wB - wA; // Ordena por importancia
    return b.unread - a.unread; // En caso de empate, los no leídos primero
  });
};

export default function ChatView({ user }: ChatViewProps) {
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [inputMessage, setInputMessage] = useState('');
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const [toastInfo, setToastInfo] = useState<{name: string, text: string} | null>(null);
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [crmClients, setCrmClients] = useState<any[]>([]);

  const activeChatIdRef = useRef(activeChatId);
  const activeChatDbIdRef = useRef('');
  const isMobileChatOpenRef = useRef(isMobileChatOpen);
  const globalChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  // --- ESTADOS PARA PULSACIÓN LARGA ---
  const pressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  // --- MOTOR MULTI-TENANT ---
  const isManager = user.role === 'admin' || user.role === 'supplier_owner' || user.role === 'gerente';

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    const dbId = conversations.find(c => c.id === activeChatId)?.dbId;
    activeChatDbIdRef.current = dbId || '';
  }, [activeChatId, conversations]);

  useEffect(() => { isMobileChatOpenRef.current = isMobileChatOpen; }, [isMobileChatOpen]);

  const activeChat = conversations.find(c => c.id === activeChatId);
  const activeMessages = messages[activeChatId] || [];

  useEffect(() => {
    if (!user.id) return;

    const fetchNetworkAndCRM = async () => {
      try {
        let clientsQ = supabase.from('clients').select('*');
        if (!isManager) clientsQ = clientsQ.eq('user_id', user.id);
        const { data: clientsData } = await clientsQ;
        if (clientsData) setCrmClients(clientsData);
      } catch (err) {}

      // Lógica 🔴 a 🟢: Comprobar SMS pendientes y autoconectar si ya se han registrado
      const storedSms = JSON.parse(localStorage.getItem(`r1plus_sms_invites_${user.id}`) || '[]');
      if (storedSms.length > 0) {
        const smsPhones = storedSms.map((s:any) => s.phone);
        const { data: joinedProfiles } = await supabase.from('profiles').select('id, name, phone').in('phone', smsPhones);
        
        if (joinedProfiles && joinedProfiles.length > 0) {
          const joinedPhones = joinedProfiles.map(p => normalizePhone(p.phone));
          const remainingSms = storedSms.filter((s:any) => !joinedPhones.includes(s.phone));
          localStorage.setItem(`r1plus_sms_invites_${user.id}`, JSON.stringify(remainingSms));
          
          for (const jp of joinedProfiles) {
             const { data: ex } = await supabase.from('network_connections').select('*').or(`and(requester_id.eq.${user.id},receiver_id.eq.${jp.id}),and(requester_id.eq.${jp.id},receiver_id.eq.${user.id})`);
             if (!ex || ex.length === 0) {
               await supabase.from('network_connections').insert([{ requester_id: user.id, receiver_id: jp.id, status: 'pending' }]);
             }
          }
        }
      }

      const { data: connections } = await supabase.from('network_connections').select('*').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      let loadedChats: any[] = [];
      if (connections && connections.length > 0) {
        const otherUserIds = connections.map(c => c.requester_id === user.id ? c.receiver_id : c.requester_id);
        const { data: profiles } = await supabase.from('profiles').select('id, name, phone, company').in('id', otherUserIds);
        
        const { data: unreadData } = await supabase.from('messages').select('connection_id').eq('is_read', false).neq('sender_id', user.id);
        const unreadCounts: Record<string, number> = {};
        unreadData?.forEach(msg => { unreadCounts[msg.connection_id] = (unreadCounts[msg.connection_id] || 0) + 1; });
        
        if (profiles) {
          loadedChats = connections.map(conn => {
            const isRequester = conn.requester_id === user.id;
            const otherId = isRequester ? conn.receiver_id : conn.requester_id;
            const otherProfile = profiles.find(p => p.id === otherId);
            const isAccepted = conn.status === 'accepted';
            
            return {
              id: `req-${otherId}`, dbId: conn.id, name: otherProfile?.name || 'Usuario',
              lastMessage: isAccepted ? 'Toca para ver mensajes' : (isRequester ? '🟢 Esperando a que acepte...' : '👋 Quiere conectar contigo'),
              time: 'Reciente', unread: unreadCounts[conn.id] || 0, phone: otherProfile?.phone || '',
              company: otherProfile?.company || '', status: conn.status, isIncomingRequest: !isRequester && conn.status === 'pending',
              isSms: false
            };
          });
        }
      }

      const finalStoredSms = JSON.parse(localStorage.getItem(`r1plus_sms_invites_${user.id}`) || '[]');
      const smsChats = finalStoredSms.map((s:any) => ({...s, isSms: true}));
      
      const allChats = [...loadedChats, ...smsChats];
      setConversations(sortConversations(allChats)); // Aplicar orden maestro
      
      if (!activeChatIdRef.current && allChats.length > 0) setActiveChatId(sortConversations(allChats)[0].id);
    };

    fetchNetworkAndCRM();

    const channel = supabase.channel('r1plus_global_channel', { config: { broadcast: { ack: false, self: false } } });
    globalChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.sender_id !== user.id) setTypingStatus(prev => ({ ...prev, [payload.payload.connection_id]: payload.payload.is_typing }));
      })
      .on('broadcast', { event: 'new_message' }, async ({ payload }) => {
        const newMsg = payload;
        if (newMsg.sender_id === user.id) return;
        const isMobile = window.innerWidth < 640;
        const isChatVisible = !isMobile || isMobileChatOpenRef.current;
        const timeNow = new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (activeChatDbIdRef.current === newMsg.connection_id) {
          setMessages(p => {
            const currentMsgs = p[activeChatIdRef.current] || [];
            if (currentMsgs.some(m => m.text === newMsg.text && m.time === timeNow)) return p;
            return { ...p, [activeChatIdRef.current]: [...currentMsgs, { id: newMsg.id, sender: 'contact', text: newMsg.text, time: timeNow, type: newMsg.type }] };
          });
          setTypingStatus(prev => ({ ...prev, [newMsg.connection_id]: false }));
          if (isChatVisible && !document.hidden) await supabase.from('messages').update({ is_read: true }).eq('connection_id', newMsg.connection_id).neq('sender_id', user.id);
        } 
        
        const isViewingThisChat = activeChatDbIdRef.current === newMsg.connection_id && isChatVisible && !document.hidden;
        if (!isViewingThisChat) {
          setConversations(prev => {
            const updated = prev.map(c => c.dbId === newMsg.connection_id ? { ...c, unread: c.unread + 1, lastMessage: newMsg.type === 'text' ? newMsg.text : '📁 Archivo' } : c);
            return sortConversations(updated); // Reordenar tras nuevo mensaje
          });
          setToastInfo({ name: 'Nuevo mensaje', text: newMsg.type === 'text' ? newMsg.text : '📁 Archivo adjunto' });
          setTimeout(() => setToastInfo(null), 4000); 
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'network_connections' }, () => { fetchNetworkAndCRM(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { fetchNetworkAndCRM(); }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  useEffect(() => {
    if (!activeChat?.dbId || !user.id || activeChat.isSms) return;
    const loadChatHistory = async () => {
      const { data } = await supabase.from('messages').select('*').eq('connection_id', activeChat.dbId).order('created_at', { ascending: true });
      if (data) {
        const loadedMsgs = data.map(m => ({
          id: m.id, sender: m.sender_id === user.id ? 'user' : 'contact', text: m.text,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: m.type
        }));
        setMessages(p => ({ ...p, [activeChatId]: loadedMsgs }));
        const isMobile = window.innerWidth < 640;
        if (!isMobile || isMobileChatOpen) {
          await supabase.from('messages').update({ is_read: true }).eq('connection_id', activeChat.dbId).neq('sender_id', user.id);
          setConversations(prev => sortConversations(prev.map(c => c.id === activeChatId ? { ...c, unread: 0 } : c)));
        }
      }
    };
    loadChatHistory();
  }, [activeChatId, activeChat?.dbId, user.id, isMobileChatOpen]); 

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeChatId, isMobileChatOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) { handleUnifiedSearch(searchQuery); } 
    else { setGlobalSearchResults([]); }
  }, [searchQuery]);

  const handleUnifiedSearch = async (query: string) => {
    try {
      const qLower = query.toLowerCase();
      const qNorm = normalizePhone(query);
      
      const crmMatches = crmClients.filter(c => (c.name && c.name.toLowerCase().includes(qLower)) || (c.phone && normalizePhone(c.phone).includes(qNorm)));
      const { data: dbMatches } = await supabase.from('profiles').select('id, name, company, phone').or(`name.ilike.%${query}%,phone.ilike.%${qNorm}%`).limit(15);
      
      const unified: any[] = [];
      const addMatch = (match: any, type: string, globalId: string | null = null) => {
        const normP = normalizePhone(match.phone);
        if (!unified.find(u => normalizePhone(u.phone) === normP)) {
          unified.push({
            id: globalId || `local-${normP}`,
            globalId: globalId,
            name: match.name || 'Desconocido',
            phone: match.phone,
            company: match.company || '',
            isRegistered: !!globalId,
            source: type
          });
        }
      };

      (dbMatches || []).forEach(db => { if (db.id !== user.id) addMatch(db, 'r1_global', db.id); });
      crmMatches.forEach(crm => {
        const normCrm = normalizePhone(crm.phone);
        const dbMatch = (dbMatches || []).find(db => normalizePhone(db.phone) === normCrm);
        addMatch(crm, 'crm', dbMatch ? dbMatch.id : null);
      });

      const onlyNumbers = query.replace(/\D/g, '');
      if (onlyNumbers.length >= 9 && !unified.find(u => normalizePhone(u.phone).includes(onlyNumbers))) {
         unified.push({ id: `new-${onlyNumbers}`, globalId: null, name: `Invitar al ${onlyNumbers}`, phone: onlyNumbers, company: 'Nuevo Número', isRegistered: false, source: 'new' });
      }

      setGlobalSearchResults(unified.filter(u => u.globalId !== user.id));
    } catch (err) {}
  };

  const handlePickFromAgenda = async () => {
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        if (contacts && contacts.length > 0) {
          const rawPhone = contacts[0].tel?.[0] || '';
          const rawName = contacts[0].name?.[0] || 'Desconocido';
          const normP = normalizePhone(rawPhone);

          if (!normP) { alert('El contacto no tiene un número válido.'); return; }

          const { data: dbMatch } = await supabase.from('profiles').select('id, name, phone').ilike('phone', `%${normP}%`).single();
          if (dbMatch) { handleSendFriendRequest(dbMatch.id, dbMatch.name || rawName); } 
          else { handleInviteSMS(rawName, rawPhone); }
        }
      } catch (ex) {}
    } else {
      alert('Tu navegador no permite abrir la agenda nativa. Por favor, escribe el número a mano en el buscador.');
    }
  };

  const openMobileChat = (chatId: string) => { setActiveChatId(chatId); setIsMobileChatOpen(true); };

  const handleSendFriendRequest = async (receiverId: string, receiverName: string) => {
    try {
      const { data: existing } = await supabase.from('network_connections')
        .select('*')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`);
      
      let targetDbId;
      if (!existing || existing.length === 0) {
        const { data, error } = await supabase.from('network_connections').insert([{ requester_id: user.id, receiver_id: receiverId, status: 'pending' }]).select();
        if (error) throw error;
        targetDbId = data[0].id;
      } else { targetDbId = existing[0].id; }
      
      setSearchQuery('');
      setGlobalSearchResults([]);
      
      setConversations(prev => {
        if (prev.find(c => c.id === `req-${receiverId}`)) return sortConversations(prev);
        const newConv = {
          id: `req-${receiverId}`, dbId: targetDbId, name: receiverName,
          lastMessage: 'Toca para escribir primer mensaje...', time: 'Reciente', unread: 0, phone: '',
          company: '', status: 'pending', isIncomingRequest: false, isSms: false
        };
        return sortConversations([newConv, ...prev]);
      });

      setActiveChatId(`req-${receiverId}`);
      if (window.innerWidth < 640) setIsMobileChatOpen(true);
      
    } catch (err: any) { alert(`Error al conectar: ${err.message}`); }
  };

  const handleInviteSMS = (name: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.location.href = `sms:${cleanPhone}?body=¡Hola! Me he descargado r1plus para gestionar obras y facturas. Instálatela gratis aquí para que estemos conectados: https://r1plus.vercel.app`;
    setSearchQuery('');
    setGlobalSearchResults([]);

    const newSms = { id: `sms-${cleanPhone}`, dbId: `sms-${cleanPhone}`, name: name, lastMessage: 'Esperando a que instale la app...', time: 'Reciente', unread: 0, phone: cleanPhone, status: 'sms_pending', isIncomingRequest: false, isSms: true };
    const stored = JSON.parse(localStorage.getItem(`r1plus_sms_invites_${user.id}`) || '[]');
    
    if (!stored.find((s:any) => s.phone === cleanPhone)) {
      stored.push(newSms);
      localStorage.setItem(`r1plus_sms_invites_${user.id}`, JSON.stringify(stored));
      setConversations(prev => sortConversations([newSms, ...prev]));
    }

    setActiveChatId(`sms-${cleanPhone}`);
    if (window.innerWidth < 640) setIsMobileChatOpen(true);
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      await supabase.from('network_connections').update({ status: 'accepted' }).eq('id', connectionId);
      setConversations(prev => sortConversations(prev.map(c => c.dbId === connectionId ? { ...c, status: 'accepted', isIncomingRequest: false, lastMessage: 'Toca para ver mensajes' } : c)));
    } catch (err: any) {}
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      await supabase.from('network_connections').delete().eq('id', connectionId);
      setConversations(prev => sortConversations(prev.filter(c => c.dbId !== connectionId)));
    } catch (err) {}
  };

  // --- LÓGICA DE PULSACIÓN LARGA PARA BORRAR CUALQUIER CHAT ---
  const handlePressStart = (chat: any) => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (confirm(`¿Quieres eliminar la conversación con ${chat.name}?`)) {
        handleDeleteChat(chat);
      }
    }, 2000); // 2 segundos exactos
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleDeleteChat = async (chat: any) => {
    if (chat.isSms) {
      // Borrar de almacenamiento local
      const stored = JSON.parse(localStorage.getItem(`r1plus_sms_invites_${user.id}`) || '[]');
      const filtered = stored.filter((s: any) => s.phone !== chat.phone);
      localStorage.setItem(`r1plus_sms_invites_${user.id}`, JSON.stringify(filtered));
      setConversations(prev => sortConversations(prev.filter(c => !(c.isSms && c.phone === chat.phone))));
    } else {
      // Borrar conexión oficial en base de datos
      try {
        await supabase.from('network_connections').delete().eq('id', chat.dbId);
        setConversations(prev => sortConversations(prev.filter(c => c.dbId !== chat.dbId)));
      } catch (err) {}
    }
    
    // Si tenías el chat abierto, te lo quita de la pantalla principal
    if (activeChatIdRef.current === chat.id) {
      setActiveChatId('');
      if (window.innerWidth < 640) setIsMobileChatOpen(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    if (isLongPress.current) {
      isLongPress.current = false; // Fue un borrado, no lo abras
      return;
    }
    openMobileChat(chatId);
  };

  const sendRealtimeMessage = async (text: string, type: string) => {
    if (!activeChat?.dbId || activeChat.isSms) return;
    const tempId = Date.now().toString();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(p => ({ ...p, [activeChatIdRef.current]: [...(p[activeChatIdRef.current] || []), { id: tempId, sender: 'user', text, time: timeNow, type }] }));
    if (globalChannelRef.current) {
      globalChannelRef.current.send({
        type: 'broadcast', event: 'new_message',
        payload: { id: tempId, connection_id: activeChat.dbId, sender_id: user.id, text, type, created_at: new Date().toISOString() }
      });
      globalChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { connection_id: activeChat.dbId, sender_id: user.id, is_typing: false } });
    }
    await supabase.from('messages').insert([{ connection_id: activeChat.dbId, sender_id: user.id, text, type, is_read: false }]);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (activeChat?.dbId && !activeChat.isSms && globalChannelRef.current) {
      globalChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { connection_id: activeChat.dbId, sender_id: user.id, is_typing: true } });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        globalChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { connection_id: activeChat.dbId, sender_id: user.id, is_typing: false } });
      }, 2500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage('');
    setShowAttachMenu(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await sendRealtimeMessage(text, 'text');
  };

  const uploadFileToSupabase = async (file: File) => {
    if (!activeChat?.dbId || activeChat.isSms) return null;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${activeChat.dbId}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      alert(`Error al subir: ${error.message}`);
      return null;
    } finally { setIsUploading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat?.dbId || activeChat.isSms) return;
    setShowAttachMenu(false);
    const publicUrl = await uploadFileToSupabase(file);
    if (publicUrl) await sendRealtimeMessage(`${file.name}|${publicUrl}`, 'image');
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat?.dbId || activeChat.isSms) return;
    setShowAttachMenu(false);
    const publicUrl = await uploadFileToSupabase(file);
    if (publicUrl) await sendRealtimeMessage(`${file.name}|${publicUrl}`, 'document');
  };

  const handleSendLocation = async () => {
    if (!navigator.geolocation) { alert('Tu navegador no soporta GPS.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setShowAttachMenu(false);
        await sendRealtimeMessage(`📍 Mi ubicación:\nhttps://maps.google.com/?q=${latitude},${longitude}`, 'location');
      },
      () => { alert('Activa el GPS para compartir.'); setShowAttachMenu(false); }, { enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden relative w-full max-w-full">
      
      {toastInfo && (
        <div className="absolute top-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 transition-transform border border-slate-700">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex justify-center items-center text-xl shrink-0">💬</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{toastInfo.name}</div>
            <div className="text-xs text-slate-300 truncate">{toastInfo.text}</div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
          <p className="font-bold text-slate-800 text-sm">Subiendo archivo...</p>
        </div>
      )}

      {/* CABECERA BÚSQUEDA CON EL BOTÓN DE LA AGENDA NATIVA AL LADO */}
      <div className={`p-3 border-b border-slate-200 bg-slate-50 flex-col shrink-0 w-full ${isMobileChatOpen ? 'hidden sm:flex' : 'flex'}`}>
        <div className="relative flex gap-2">
          <input 
            type="text" 
            placeholder="🔍 Buscar contacto por nombre o número..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-500 shadow-sm" 
          />
          <button 
            onClick={handlePickFromAgenda} 
            className="w-11 shrink-0 bg-slate-800 text-white rounded-lg flex items-center justify-center text-xl hover:bg-slate-700 transition shadow-sm" 
            title="Abrir Agenda del Móvil"
          >
            📇
          </button>
        </div>
        
        {searchQuery.length > 2 && (
          <div className="absolute top-16 left-3 right-3 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
            {globalSearchResults.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm font-medium">Sin resultados.</div>
            ) : (
              globalSearchResults.map((u, idx) => (
                <div 
                  key={u.id || idx} 
                  onClick={() => u.isRegistered ? handleSendFriendRequest(u.globalId, u.name) : handleInviteSMS(u.name, u.phone)} 
                  className="p-3 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                      {u.isRegistered && '🟢'} {u.name}
                    </div>
                    <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
                      {u.phone}
                    </div>
                  </div>
                  <span className="text-indigo-400 text-lg group-hover:translate-x-1 transition-transform">›</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden relative w-full">
        
        <div className={`w-full sm:w-72 border-r border-slate-200 bg-white flex-col shrink-0 overflow-y-auto ${isMobileChatOpen ? 'hidden sm:flex' : 'flex'}`}>
          <div className="flex border-b border-slate-200 shrink-0 w-full">
            <button className="flex-1 py-3 text-sm font-bold uppercase bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600">
              Chats Activos
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-50 w-full select-none">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm font-medium mt-4">Aún no tienes chats.</div>
            ) : (
              conversations.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => handleChatClick(chat.id)}
                  onMouseDown={() => handlePressStart(chat)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={() => handlePressStart(chat)}
                  onTouchEnd={handlePressEnd}
                  onTouchMove={handlePressEnd}
                  className={`p-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between w-full transition ${chat.isIncomingRequest ? 'bg-emerald-50/50' : ''}`}
                >
                  <div className="min-w-0 flex-1 overflow-hidden pointer-events-none">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-slate-800 text-sm truncate pr-2 flex items-center">
                        {chat.isSms && <span className="mr-1.5 text-xs">🔴</span>}
                        {!chat.isSms && chat.status === 'pending' && !chat.isIncomingRequest && <span className="mr-1.5 text-xs">🟢</span>}
                        {chat.isIncomingRequest && <span className="mr-1.5 text-emerald-600 text-xs">👋</span>}
                        {chat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{chat.time}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${chat.status === 'pending' ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                      {typingStatus[chat.dbId] ? <span className="text-emerald-500 font-bold italic animate-pulse">escribiendo...</span> : chat.lastMessage}
                    </p>
                  </div>
                  {chat.unread > 0 && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 shadow-sm animate-pulse pointer-events-none">{chat.unread}</span>}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 flex-col bg-slate-50 relative w-full overflow-hidden ${isMobileChatOpen ? 'flex' : 'hidden sm:flex'}`}>
          {activeChat ? (
            <>
              <div className="p-3 bg-white border-b border-slate-200 flex items-center shrink-0 shadow-sm z-10 w-full">
                <button onClick={() => setIsMobileChatOpen(false)} className="sm:hidden mr-3 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold text-xl shrink-0">←</button>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{activeChat.name}</h3>
                  {typingStatus[activeChat.dbId] ? (
                    <p className="text-xs font-bold text-emerald-500 mt-0.5 truncate animate-pulse">escribiendo...</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{activeChat.phone} {activeChat.company && `· ${activeChat.company}`}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3 relative w-full overflow-x-hidden">
                {activeChat.isIncomingRequest && (
                  <div className="absolute inset-0 bg-slate-50 z-10 flex flex-col items-center justify-center p-6 text-center w-full">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner animate-bounce">👋</div>
                    <h4 className="text-xl font-black text-slate-800 mb-2">{activeChat.name}</h4>
                    <p className="text-sm text-slate-600 mb-6 max-w-xs">Quiere conectar contigo en r1plus.</p>
                    <div className="flex gap-3 w-full max-w-xs">
                      <button onClick={() => handleRejectRequest(activeChat.dbId)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-lg font-bold transition text-sm">Rechazar</button>
                      <button onClick={() => handleAcceptRequest(activeChat.dbId)} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow-md transition text-sm">Aceptar</button>
                    </div>
                  </div>
                )}
                
                {activeMessages.map(msg => {
                  const isUser = msg.sender === 'user';
                  const [fileName, fileUrl] = msg.text.includes('|') ? msg.text.split('|') : [msg.text, ''];

                  return (
                    <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm relative break-words ${isUser ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                        {msg.type === 'image' ? (
                          <div className="flex flex-col gap-2">
                            <img src={fileUrl || fileName} alt="Adjunto" className="rounded-lg max-w-full h-auto object-cover" />
                            <a href={fileUrl || fileName} download={fileName} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-1.5 text-xs font-bold w-full mt-1 px-3 py-2 rounded-lg transition ${isUser ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}>⬇ Foto</a>
                          </div>
                        ) : msg.type === 'document' ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 bg-black/10 p-2.5 rounded-lg">
                              <span className="text-2xl">📄</span><span className="font-bold text-xs truncate max-w-[180px]">{fileName}</span>
                            </div>
                            <a href={fileUrl || fileName} download={fileName} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-1.5 text-xs font-bold w-full mt-1 px-3 py-2 rounded-lg transition ${isUser ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}>⬇️ Descargar</a>
                          </div>
                        ) : msg.type === 'location' ? (
                          <div className="flex flex-col gap-2">
                            <span className="font-bold flex items-center gap-1.5 text-xs"><span className="text-xl">📍</span> {msg.text.split('\n')[0]}</span>
                            <a href={msg.text.split('\n')[1]} target="_blank" rel="noopener noreferrer" className={`text-xs font-bold underline ${isUser ? 'text-indigo-200' : 'text-indigo-600'}`}>Abrir Maps</a>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}
                        <span className={`block text-[10px] text-right mt-1 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {showAttachMenu && !activeChat.isSms && (
                <div className="absolute bottom-20 left-3 right-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex justify-between z-50">
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl transition">
                    <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex justify-center items-center text-2xl">📷</div><span className="text-xs font-bold text-slate-600">Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl transition">
                    <div className="h-12 w-12 bg-sky-100 text-sky-600 rounded-full flex justify-center items-center text-2xl">📄</div><span className="text-xs font-bold text-slate-600">Archivo</span>
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleDocumentUpload} />
                  </label>
                  <button type="button" onClick={handleSendLocation} className="flex flex-col items-center gap-1.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl transition">
                    <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex justify-center items-center text-2xl">📍</div><span className="text-xs font-bold text-slate-600">Ubicación</span>
                  </button>
                </div>
              )}

              {activeChat.isSms ? (
                <div className="p-4 bg-rose-50 text-center text-xs text-rose-600 font-bold border-t border-rose-200 shrink-0 w-full">
                  🔴 Invitación enviada. El chat se abrirá cuando instale la app.
                </div>
              ) : activeChat.status === 'accepted' || activeChat.status === 'active' || (activeChat.status === 'pending' && !activeChat.isIncomingRequest) ? (
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0 relative z-20 w-full">
                  <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2.5 rounded-full cursor-pointer transition text-xl shrink-0 text-slate-500 hover:text-indigo-600 bg-slate-100">📎</button>
                  <input type="text" placeholder="Escribe tu mensaje..." value={inputMessage} onChange={handleTyping} className="flex-1 p-3 rounded-lg border border-slate-300 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 shadow-inner w-full" />
                  <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg text-sm shadow-md hover:bg-indigo-700 transition shrink-0">Enviar</button>
                </form>
              ) : (
                <div className="p-4 bg-slate-100 text-center text-xs text-slate-500 font-bold border-t border-slate-200 shrink-0 w-full">
                  🔒 Esperando a que acepte la solicitud.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400 text-sm font-bold">Selecciona un chat.</div>
          )}
        </div>
      </div>
    </div>
  );
}