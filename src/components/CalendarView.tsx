// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AuthUser } from './LoginPage';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface CalendarViewProps {
  user: AuthUser;
}

export default function CalendarView({ user }: CalendarViewProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [externalCalendars, setExternalCalendars] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [showVisadas, setShowVisadas] = useState(false);
  const [syncStatus, setSyncStatus] = useState('🔴 Conectando...');

  // BÚSQUEDA
  const [searchTerm, setSearchTerm] = useState('');

  // BORRADO SEGURO (3 CLICS)
  const [deleteClickCount, setDeleteClickCount] = useState<Record<string, number>>({});

  // CONTROL DE TARJETAS EXPANDIDAS
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // AUTOCOMPLETADO CRM
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [crmSuggestions, setCrmSuggestions] = useState<any[]>([]);
  const [showCrmSuggestions, setShowCrmSuggestions] = useState(false);
  const [showQuickNewCrm, setShowQuickNewCrm] = useState(false);
  const [quickCrm, setQuickCrm] = useState({ name: '', phone: '', address: '' });

  // MODALES
  const [showEventModal, setShowEventModal] = useState(false);
  const [showExternalCalModal, setShowExternalCalModal] = useState(false);
  const [showManageCatsModal, setShowManageCatsModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // FORMULARIO DE EVENTO / NOTA
  const [isSinFecha, setIsSinFecha] = useState(false);
  const [eventForm, setEventForm] = useState({
    id: null,
    title: '',
    description: '',
    client_name: '',
    phone: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    category: 'General',
    calendar_key: '',
    attachments: [],
    voice_notes: []
  });

  // GOOGLE CALENDAR
  const [newCalName, setNewCalName] = useState('');
  const [newCalUrl, setNewCalUrl] = useState('');

  // GRABADORA DE AUDIO RÁPIDA
  const [recordingTargetId, setRecordingTargetId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // SELECTOR MULTIMEDIA
  const quickMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadTargetId, setActiveUploadTargetId] = useState<string | null>(null);

  // 🧬 NORMALIZADOR ABSOLUTO DE URLS DE GOOGLE
  const normalizeCalKey = (urlStr: string) => {
    if (!urlStr) return '';
    try {
      let clean = urlStr.trim().toLowerCase().split('?')[0]; 
      clean = clean.replace(/^https?:\/\//, ''); 
      clean = clean.replace('calendar.google.com/calendar/ical/', ''); 
      return clean; 
    } catch {
      return urlStr.trim().toLowerCase();
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAgenda = async () => {
      try {
        const { data: myCals } = await supabase
          .from('external_calendars')
          .select('*')
          .eq('user_id', String(user.id));

        const mySharedKeys = (myCals || []).map(c => normalizeCalKey(c.url)).filter(Boolean);

        const [resCats, resCrm, resEvents] = await Promise.all([
          supabase.from('calendar_categories').select('*').eq('user_id', String(user.id)).order('name', { ascending: true }),
          supabase.from('clients').select('*').order('name', { ascending: true }),
          supabase.from('calendar_events').select('*').order('created_at', { ascending: false })
        ]);

        if (!isMounted) return;

        if (resCats.data) setCategoryList(resCats.data);
        if (resCrm.data) setCrmClients(resCrm.data);
        if (myCals) setExternalCalendars(myCals);

        let validEvents = (resEvents.data || []).filter(ev => {
          if (ev.user_id === user.id) return true; 
          if (ev.calendar_key && mySharedKeys.includes(normalizeCalKey(ev.calendar_key))) return true; 
          return false;
        });

        const existingGoogleUids = new Set(validEvents.map(e => e.google_uid).filter(Boolean));

        if (myCals && myCals.length > 0) {
          for (const cal of myCals) {
            try {
              const url = cal.url.trim();
              const key = normalizeCalKey(url);
              const res = await fetch(`/api/calendar-sync?url=${encodeURIComponent(url)}`);
              
              if (res.ok) {
                const icsText = await res.text();
                if (icsText && icsText.includes('BEGIN:VCALENDAR')) {
                  const parsedIcsEvents = parseICS(icsText, cal.name, key);

                  const toInsert = parsedIcsEvents
                    .filter(p => !existingGoogleUids.has(p.google_uid))
                    .map(p => ({
                      title: p.title || 'Evento Google',
                      description: p.description || '',
                      address: p.address || '',
                      phone: '',
                      client_name: '',
                      date: p.date || null,
                      time: p.time || 'Flexible',
                      category: cal.name,
                      google_uid: p.google_uid,
                      calendar_key: key, 
                      attachments: [],
                      voice_notes: [],
                      is_visada: false,
                      user_id: user.id
                    }));

                  if (toInsert.length > 0) {
                    const { data: insertedData } = await supabase.from('calendar_events').insert(toInsert).select();
                    if (insertedData) {
                      validEvents = [...insertedData, ...validEvents];
                      toInsert.forEach(item => existingGoogleUids.add(item.google_uid));
                    }
                  }
                }
              }
            } catch (e) {
              console.warn(`Error de sync ICS: ${cal.name}`);
            }
          }
        }

        setEvents(validEvents);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAgenda();

    // 🔴🟢 ESCUCHA DE CANAL GLOBAL DE BASE DE DATOS QUIRÚRGICA
    const channel = supabase.channel('agenda_espejo_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, (payload) => {
        console.log('⚡ Sincronización entrante:', payload.eventType);
        
        if (payload.eventType === 'INSERT') {
          setEvents(prev => {
            if (prev.some(ev => ev.id === payload.new.id)) return prev;
            if (payload.new.google_uid && prev.some(ev => ev.google_uid === payload.new.google_uid)) return prev;
            return [payload.new, ...prev];
          });
        } 
        else if (payload.eventType === 'UPDATE') {
          setEvents(prev => prev.map(ev => ev.id === payload.new.id ? { ...ev, ...payload.new } : ev));
        } 
        else if (payload.eventType === 'DELETE') {
          setEvents(prev => prev.filter(ev => ev.id !== payload.old.id));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSyncStatus('🟢 Espejo Vinculado');
        else if (status === 'CLOSED') setSyncStatus('🔴 Desconectado');
        else if (status === 'CHANNEL_ERROR') setSyncStatus('⚠️ Error de Red');
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const toggleExpandCard = (id: string) => {
    setExpandedCardIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parseICS = (icsData: string, calendarName: string, calKey: string) => {
    const parsed: any[] = [];
    const cleanIcs = icsData.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = cleanIcs.split(/\r\n|\n|\r/);
    
    let inEvent = false;
    let current: any = {};

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        current = { 
          google_uid: '', calendar_key: calKey, category: calendarName, is_visada: false, attachments: [], voice_notes: [] 
        };
      } else if (line === 'END:VEVENT') {
        if (current.title) {
          if (!current.google_uid) current.google_uid = `${current.title}_${current.date || ''}_${current.time || ''}`;
          parsed.push(current);
        }
        inEvent = false;
        current = {};
      } else if (inEvent) {
        if (line.startsWith('UID:')) {
          current.google_uid = line.substring(4).trim();
        } else if (line.startsWith('SUMMARY:')) {
          current.title = line.substring(8).replace(/\\,/g, ',').replace(/\\n/g, ' ');
        } else if (line.startsWith('DESCRIPTION:')) {
          current.description = line.substring(12).replace(/\\,/g, ',').replace(/\\n/g, '\n');
        } else if (line.startsWith('LOCATION:')) {
          current.address = line.substring(9).replace(/\\,/g, ',').replace(/\\n/g, ' ');
        } else if (line.startsWith('DTSTART')) {
          const valPart = line.includes(':') ? line.substring(line.indexOf(':') + 1).trim() : '';
          if (valPart.length >= 8) {
            const y = valPart.substring(0, 4);
            const m = valPart.substring(4, 6);
            const d = valPart.substring(6, 8);
            current.date = `${y}-${m}-${d}`;
            if (valPart.includes('T')) {
              const tIdx = valPart.indexOf('T');
              current.time = `${valPart.substring(tIdx + 1, tIdx + 3)}:${valPart.substring(tIdx + 3, tIdx + 5)}`;
            } else {
              current.time = 'Todo el día';
            }
          }
        }
      }
    }
    return parsed;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const renderDaysGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 sm:h-12 border border-slate-50 bg-slate-50/40 rounded-xl" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      const dayEvents = events.filter((ev) => {
        const matchCategory = activeCategory === 'todos' ? true : ev.category === activeCategory;
        return ev.date === dateStr && matchCategory && !ev.is_visada;
      });
      const hasEvents = dayEvents.length > 0;
      const isSharedGoogle = dayEvents.some((ev) => !!ev.calendar_key || !!ev.google_uid);

      days.push(
        <button
          key={dateStr}
          onClick={() => setSelectedDate(dateStr)}
          className={`h-10 sm:h-12 border rounded-xl flex flex-col items-center justify-between p-1 transition relative ${
            isSelected
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black shadow-sm'
              : isToday
              ? 'border-emerald-500 bg-emerald-50/30 text-emerald-800 font-bold'
              : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs leading-none">{d}</span>
          {hasEvents && (
            <div className="flex gap-0.5 justify-center items-center">
              <span className={`w-2 h-2 rounded-full ${isSharedGoogle ? 'bg-amber-500' : 'bg-indigo-600'}`} />
              {dayEvents.length > 1 && <span className="text-[8px] font-bold text-slate-400">+{dayEvents.length}</span>}
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const handleToggleVisada = async (ev: any) => {
    const newState = !ev.is_visada;
    setEvents(prev => prev.map(item => item.id === ev.id ? { ...item, is_visada: newState } : item));
    try {
      await supabase.from('calendar_events').update({ is_visada: newState }).eq('id', ev.id);
    } catch (err) {}
  };

  const handleTripleClickDelete = async (evId: string) => {
    const currentCount = deleteClickCount[evId] || 0;
    
    if (currentCount === 0) {
      setDeleteClickCount(prev => ({ ...prev, [evId]: 1 }));
      setTimeout(() => setDeleteClickCount(prev => ({ ...prev, [evId]: 0 })), 3000);
    } else if (currentCount === 1) {
      setDeleteClickCount(prev => ({ ...prev, [evId]: 2 }));
      setTimeout(() => setDeleteClickCount(prev => ({ ...prev, [evId]: 0 })), 3000);
    } else if (currentCount === 2) {
      try {
        await supabase.from('calendar_events').delete().eq('id', evId);
        setEvents(prev => prev.filter(e => e.id !== evId));
        const newCounts = { ...deleteClickCount };
        delete newCounts[evId];
        setDeleteClickCount(newCounts);
      } catch (err: any) {
        alert('Error eliminando: ' + err.message);
      }
    }
  };

  const getDeleteButtonText = (evId: string) => {
    const count = deleteClickCount[evId] || 0;
    if (count === 0) return '🗑️ Borrar Cita';
    if (count === 1) return '⚠️ ¿Estás seguro?';
    if (count === 2) return '🔥 ¡Pulsa para confirmar!';
  };

  const getDeleteButtonColor = (evId: string) => {
    const count = deleteClickCount[evId] || 0;
    if (count === 0) return 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100';
    if (count === 1) return 'bg-orange-500 text-white border-orange-600';
    if (count === 2) return 'bg-red-600 text-white border-red-700 animate-pulse';
  };

  const triggerQuickMediaUpload = (eventId: string) => {
    setActiveUploadTargetId(eventId);
    quickMediaInputRef.current?.click();
  };

  const handleQuickMediaCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeUploadTargetId) return;

    try {
      const uploadedAttachments: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        const fileExt = file.name.split('.').pop();
        const fileName = `agenda_${isVideo ? 'video' : 'photo'}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `agenda_adjuntos/${fileName}`;

        const { error } = await supabase.storage.from('chat_attachments').upload(filePath, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);
          uploadedAttachments.push({
            name: file.name,
            url: urlData.publicUrl,
            type: isVideo ? 'video' : 'image'
          });
        }
      }

      if (uploadedAttachments.length > 0) {
        const targetEv = events.find(item => item.id === activeUploadTargetId);
        if (targetEv) {
          const updatedAttachments = [...(targetEv.attachments || []), ...uploadedAttachments];
          setEvents(prev => prev.map(item => item.id === activeUploadTargetId ? { ...item, attachments: updatedAttachments } : item));
          await supabase.from('calendar_events').update({ attachments: updatedAttachments }).eq('id', activeUploadTargetId);
        }
      }
    } catch (err: any) {
      alert('Error al subir: ' + err.message);
    } finally {
      e.target.value = '';
      setActiveUploadTargetId(null);
    }
  };

  const handleDeleteAttachmentDirect = async (eventId: string, attIndex: number) => {
    if (!confirm('¿Eliminar este archivo? Desaparecerá para ambas cuentas.')) return;
    const targetEv = events.find(item => item.id === eventId);
    if (!targetEv) return;

    const currentAttachments = [...(targetEv.attachments || [])];
    const removedItem = currentAttachments.splice(attIndex, 1)[0];

    setEvents(prev => prev.map(item => item.id === eventId ? { ...item, attachments: currentAttachments } : item));
    try {
      await supabase.from('calendar_events').update({ attachments: currentAttachments }).eq('id', eventId);
      if (removedItem?.url) {
        const fileName = removedItem.url.split('/').pop();
        if (fileName) await supabase.storage.from('chat_attachments').remove([`agenda_adjuntos/${fileName}`]);
      }
    } catch (err: any) {
      alert('Error al borrar: ' + err.message);
    }
  };

  const handleDeleteVoiceNoteDirect = async (eventId: string, vnIndex: number) => {
    if (!confirm('¿Eliminar nota de voz? Desaparecerá para ambos.')) return;
    const targetEv = events.find(item => item.id === eventId);
    if (!targetEv) return;

    const currentNotes = [...(targetEv.voice_notes || [])];
    const removedNote = currentNotes.splice(vnIndex, 1)[0];

    setEvents(prev => prev.map(item => item.id === eventId ? { ...item, voice_notes: currentNotes } : item));
    try {
      await supabase.from('calendar_events').update({ voice_notes: currentNotes }).eq('id', eventId);
      if (removedNote?.url) {
        const fileName = removedNote.url.split('/').pop();
        if (fileName) await supabase.storage.from('chat_attachments').remove([`agenda_adjuntos/${fileName}`]);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRemoveAttachmentFromForm = (index: number) => {
    setEventForm(prev => {
      const updated = [...(prev.attachments || [])];
      updated.splice(index, 1);
      return { ...prev, attachments: updated };
    });
  };

  const handleRemoveVoiceNoteFromForm = (index: number) => {
    setEventForm(prev => {
      const updated = [...(prev.voice_notes || [])];
      updated.splice(index, 1);
      return { ...prev, voice_notes: updated };
    });
  };

  const startRecordingForEvent = async (targetId: string | 'form') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTargetId(targetId);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fileName = `voice_${Date.now()}.webm`;
        const filePath = `agenda_adjuntos/${fileName}`;

        const { error } = await supabase.storage.from('chat_attachments').upload(filePath, audioBlob, { contentType: 'audio/webm' });
        if (!error) {
          const { data: urlData } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);
          const newVoiceNote = {
            url: urlData.publicUrl,
            duration: recordingSeconds,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          if (targetId === 'form') {
            setEventForm(prev => ({ ...prev, voice_notes: [...(prev.voice_notes || []), newVoiceNote] }));
          } else {
            const targetEv = events.find(e => e.id === targetId);
            if (targetEv) {
              const updatedNotes = [...(targetEv.voice_notes || []), newVoiceNote];
              setEvents(prev => prev.map(item => item.id === targetId ? { ...item, voice_notes: updatedNotes } : item));
              await supabase.from('calendar_events').update({ voice_notes: updatedNotes }).eq('id', targetId);
            }
          }
        }
        setRecordingSeconds(0);
        setRecordingTargetId(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch (err) {
      alert('Activa los permisos del micrófono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const fileExt = file.name.split('.').pop();
      const fileName = `agenda_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `agenda_adjuntos/${fileName}`;

      const { error } = await supabase.storage.from('chat_attachments').upload(filePath, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);
        setEventForm((prev: any) => ({
          ...prev,
          attachments: [
            ...(prev.attachments || []),
            { 
              name: file.name, 
              url: urlData.publicUrl, 
              type: isVideo ? 'video' : file.type.startsWith('image/') ? 'image' : 'file' 
            }
          ]
        }));
      }
    }
  };

  const handleOpenEditEvent = (ev: any) => {
    setIsSinFecha(!ev.date);
    setEventForm({
      id: ev.id,
      title: ev.title || '',
      description: ev.description || '',
      client_name: ev.client_name || '',
      phone: ev.phone || '',
      address: ev.address || '',
      date: ev.date || selectedDate,
      time: ev.time === 'Flexible' ? '10:00' : (ev.time || '10:00'),
      category: ev.category || 'General',
      calendar_key: ev.calendar_key || '',
      attachments: ev.attachments || [],
      voice_notes: ev.voice_notes || []
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    const matchedExtCal = externalCalendars.find(c => c.name === eventForm.category);
    const resolvedMirrorKey = matchedExtCal 
      ? normalizeCalKey(matchedExtCal.url) 
      : (eventForm.calendar_key || (externalCalendars[0] ? normalizeCalKey(externalCalendars[0].url) : ''));

    const payload = {
      title: eventForm.title,
      description: eventForm.description,
      client_name: eventForm.client_name,
      phone: eventForm.phone || '',
      address: eventForm.address || '',
      date: isSinFecha ? null : eventForm.date,
      time: isSinFecha ? 'Flexible' : eventForm.time,
      category: eventForm.category,
      calendar_key: resolvedMirrorKey,
      attachments: eventForm.attachments,
      voice_notes: eventForm.voice_notes,
      is_visada: false,
      user_id: user.id
    };

    try {
      if (eventForm.id) {
        const { data, error } = await supabase.from('calendar_events').update(payload).eq('id', eventForm.id).select();
        if (error) throw error;
        setEvents(prev => prev.map(item => item.id === eventForm.id ? data[0] : item));
      } else {
        const { data, error } = await supabase.from('calendar_events').insert([payload]).select();
        if (error) throw error;
        if (data) setEvents(prev => [data[0], ...prev]);
      }
      setShowEventModal(false);
      resetEventForm();
    } catch (err: any) {
      alert('Error guardando en el espejo: ' + err.message);
    }
  };

  const handleSyncToGoogle = (ev: any) => {
    const title = encodeURIComponent(ev.title || 'Cita R1Plus');
    const details = encodeURIComponent(`${ev.description || ''}\n\nCliente: ${ev.client_name || 'N/A'}\nTeléfono: ${ev.phone || 'N/A'}`);
    const location = encodeURIComponent(ev.address || '');
    let datesParam = '';
    
    if (ev.date) {
      const cleanDate = ev.date.replace(/-/g, '');
      if (ev.time && ev.time !== 'Flexible' && ev.time !== 'Todo el día') {
        const cleanTime = ev.time.replace(':', '') + '00';
        datesParam = `&dates=${cleanDate}T${cleanTime}/${cleanDate}T${cleanTime}`;
      } else {
        datesParam = `&dates=${cleanDate}/${cleanDate}`;
      }
    }
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}${datesParam}`, '_blank');
  };

  const resetEventForm = () => {
    setIsSinFecha(false);
    setEventForm({
      id: null, 
      title: '', 
      description: '', 
      client_name: '', 
      phone: '', 
      address: '',
      date: selectedDate, 
      time: '10:00', 
      category: categoryList[0]?.name || (externalCalendars[0]?.name || 'General'),
      calendar_key: '', 
      attachments: [], 
      voice_notes: []
    });
  };

  const handleClientNameChange = (val: string) => {
    setEventForm({ ...eventForm, client_name: val });
    if (val.trim().length > 0) {
      setCrmSuggestions(crmClients.filter(c => 
        (c.name && c.name.toLowerCase().includes(val.toLowerCase())) || 
        (c.company && c.company.toLowerCase().includes(val.toLowerCase()))
      ));
      setShowCrmSuggestions(true);
    } else {
      setShowCrmSuggestions(false);
    }
  };

  const selectCrmClient = (cli: any) => {
    setEventForm({ 
      ...eventForm, 
      client_name: cli.company ? `${cli.name} (${cli.company})` : cli.name, 
      phone: cli.phone || cli.company_phone || '', 
      address: cli.address || '' 
    });
    setShowCrmSuggestions(false);
  };

  const handleSaveQuickCrm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCrm.name.trim()) return;
    try {
      const { data, error } = await supabase.from('clients').insert([{ ...quickCrm, user_id: user.id }]).select();
      if (error) throw error;
      if (data) { 
        setCrmClients(prev => [...prev, data[0]]); 
        selectCrmClient(data[0]); 
      }
      setQuickCrm({ name: '', phone: '', address: '' });
      setShowQuickNewCrm(false);
    } catch (err: any) { 
      alert('Error guardando cliente: ' + err.message); 
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const { data, error } = await supabase.from('calendar_categories').insert([{ user_id: String(user.id), name: newCategoryName.trim() }]).select();
      if (error) throw error;
      if (data) { 
        setCategoryList(prev => [...prev, data[0]]); 
        setActiveCategory(data[0].name); 
        setEventForm(prev => ({ ...prev, category: data[0].name })); 
      }
      setNewCategoryName('');
    } catch (err: any) { 
      alert('Error creando responsable: ' + err.message); 
    }
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editCatName.trim()) return;
    try {
      const { data, error } = await supabase.from('calendar_categories').update({ name: editCatName.trim() }).eq('id', catId).select();
      if (error) throw error;
      if (data) { 
        setCategoryList(prev => prev.map(c => c.id === catId ? data[0] : c)); 
        setEditingCatId(null); 
        setEditCatName(''); 
      }
    } catch (err: any) { 
      alert('Error actualizando responsable: ' + err.message); 
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    if (!confirm(`¿Eliminar al responsable "${name}"?`)) return;
    try {
      await supabase.from('calendar_categories').delete().eq('id', catId);
      setCategoryList(prev => prev.filter(c => c.id !== catId));
      if (activeCategory === name) setActiveCategory('todos');
    } catch (err: any) { 
      alert('Error eliminando responsable: ' + err.message); 
    }
  };

  const handleAddExternalCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalUrl.trim()) return;
    try {
      const payload = { 
        user_id: String(user.id), 
        name: newCalName || 'Google Calendar Espejo', 
        url: newCalUrl.trim() 
      };
      const { data, error } = await supabase.from('external_calendars').insert([payload]).select();
      if (error) throw error;
      if (data) setExternalCalendars(prev => [...prev, data[0]]);
      
      setNewCalName(''); 
      setNewCalUrl(''); 
      setShowExternalCalModal(false);
      alert('¡Cuenta vinculada al espejo con éxito!');
    } catch (err: any) { 
      alert('Error guardando enlace: ' + err.message); 
    }
  };

  const handleDeleteExternalCalendar = async (calId: string, calName: string) => {
    if (!confirm(`¿Desvincular el calendario "${calName}"?`)) return;
    try {
      await supabase.from('external_calendars').delete().eq('id', calId);
      setExternalCalendars(prev => prev.filter(c => c.id !== calId));
      if (activeCategory === calName) setActiveCategory('todos');
    } catch (err: any) { 
      alert('Error eliminando: ' + err.message); 
    }
  };

  // LÓGICA DE BÚSQUEDA Y FILTRADO
  const matchingCategoryEvents = events.filter(ev => {
    const matchCat = activeCategory === 'todos' ? true : ev.category === activeCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = searchTerm === '' ? true : (
      (ev.title || '').toLowerCase().includes(searchLower) ||
      (ev.description || '').toLowerCase().includes(searchLower) ||
      (ev.client_name || '').toLowerCase().includes(searchLower) ||
      (ev.address || '').toLowerCase().includes(searchLower)
    );
    return matchCat && matchSearch;
  });
  
  const pendientes = matchingCategoryEvents.filter(ev => !ev.is_visada).sort((a, b) => {
    if (!a.date && b.date) return -1;
    if (a.date && !b.date) return 1;
    if (!a.date && !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  const visadas = matchingCategoryEvents.filter(ev => ev.is_visada);

  // FUNCIÓN PARA RENDERIZAR CUALQUIER TARJETA (Pendiente o Visada)
  const renderEventCard = (ev: any, idx: number) => {
    const cardKey = ev.id || `ev-${idx}`;
    const isExpanded = !!expandedCardIds[cardKey];
    const sinFechaTag = !ev.date;
    const isShared = !!ev.calendar_key || !!ev.google_uid;

    return (
      <div 
        key={cardKey} 
        onClick={() => toggleExpandCard(cardKey)} 
        className={`p-4 bg-white border rounded-2xl shadow-sm space-y-3 transition hover:border-indigo-400 hover:shadow-md cursor-pointer select-none ${ev.is_visada ? 'opacity-80 grayscale-[20%]' : ''} ${sinFechaTag ? 'border-purple-300 bg-purple-50/20' : isShared ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {ev.is_visada && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ REALIZADA
                </span>
              )}
              {sinFechaTag && !ev.is_visada && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                  ⏳ Sin fecha
                </span>
              )}
              {!sinFechaTag && (
                <>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isShared ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                    {isShared ? `🗓️ ${ev.category}` : `👤 ${ev.category || 'General'}`}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    📅 {ev.date} · {ev.time}
                  </span>
                </>
              )}
              {isShared && (
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                  🔗 Espejo
                </span>
              )}
            </div>
            <h4 className={`font-black text-slate-800 text-base mt-1 truncate ${ev.is_visada ? 'line-through text-slate-500' : ''}`}>{ev.title}</h4>
            {ev.client_name && <p className="text-xs font-bold text-indigo-600 mt-0.5">👤 {ev.client_name}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold">{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* BOTONERA DE ACCIÓN INMEDIATA */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => handleToggleVisada(ev)} 
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border flex items-center gap-1 ${ev.is_visada ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
          >
            {ev.is_visada ? '↩️ Reabrir' : '✓ Visar'}
          </button>
          
          {isRecording && recordingTargetId === ev.id ? (
            <button 
              onClick={stopRecording} 
              className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold animate-pulse transition shadow-sm flex items-center gap-1"
            >
              ⏹️ ({recordingSeconds}s)
            </button>
          ) : (
            <button 
              onClick={() => startRecordingForEvent(ev.id)} 
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              🎙️ Audio
            </button>
          )}
          <button 
            onClick={() => triggerQuickMediaUpload(ev.id)} 
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            📸 Foto / Vídeo
          </button>
          {ev.phone && (
            <a 
              href={`tel:${ev.phone}`} 
              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              📞 Llamar
            </a>
          )}
          {ev.address && (
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(ev.address)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              🗺️ Ir
            </a>
          )}
        </div>

        {/* CUERPO DESPLEGABLE */}
        {isExpanded && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in-50" onClick={(e) => e.stopPropagation()}>
            {ev.address && <p className="text-xs text-slate-600 font-medium">📍 <strong>Dirección:</strong> {ev.address}</p>}
            {ev.phone && <p className="text-xs text-slate-600 font-medium">📞 <strong>Teléfono:</strong> {ev.phone}</p>}
            {ev.description && <p className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-200">{ev.description}</p>}

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button 
                onClick={() => handleSyncToGoogle(ev)} 
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                🗓️ A Google
              </button>
              <button 
                onClick={() => handleOpenEditEvent(ev)} 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1"
              >
                ✏️ Editar Ficha
              </button>
              
              {/* BOTON TRIPLE CLIC PARA BORRAR */}
              {ev.id && (
                <button 
                  onClick={() => handleTripleClickDelete(ev.id)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border ${getDeleteButtonColor(ev.id)}`}
                >
                  {getDeleteButtonText(ev.id)}
                </button>
              )}
            </div>

            {/* ARCHIVOS ADJUNTOS */}
            {ev.attachments && ev.attachments.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fotos, Vídeos y Documentos</span>
                <div className="flex flex-wrap gap-2">
                  {ev.attachments.map((att: any, aIdx: number) => (
                    <div key={aIdx} className="flex items-center bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                      <a 
                        href={att.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-2.5 py-1 text-slate-700 text-[10px] font-bold flex items-center gap-1 truncate max-w-[180px]"
                      >
                        {att.type === 'image' ? '📷 Foto' : att.type === 'video' ? '🎥 Vídeo' : '📄 Doc'}: {att.name}
                      </a>
                      <button 
                        onClick={() => handleDeleteAttachmentDirect(ev.id, aIdx)} 
                        className="px-2 py-1 text-rose-600 hover:bg-rose-100 border-l border-slate-200 font-black text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTAS DE VOZ */}
            {ev.voice_notes && ev.voice_notes.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Notas de voz</span>
                {ev.voice_notes.map((vn: any, vIdx: number) => (
                  <div key={vIdx} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <audio src={vn.url} controls className="flex-1 h-8" />
                    <button 
                      onClick={() => handleDeleteVoiceNoteDirect(ev.id, vIdx)} 
                      className="w-7 h-7 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-black text-xs border border-rose-200 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-full flex flex-col overflow-y-auto relative no-scrollbar">
      
      <input 
        type="file" 
        multiple 
        accept="image/*,video/*" 
        ref={quickMediaInputRef} 
        onChange={handleQuickMediaCaptured} 
        className="hidden" 
      />

      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl font-black text-slate-800">📅 Agenda Compartida</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block bg-slate-50 border border-slate-200">
            {syncStatus}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={activeCategory} 
            onChange={(e) => setActiveCategory(e.target.value)} 
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="todos">🌐 Ver Todo el Espejo</option>
            {categoryList.length > 0 && (
              <optgroup label="Tus Responsables">
                {categoryList.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    👤 {cat.name}
                  </option>
                ))}
              </optgroup>
            )}
            {externalCalendars.length > 0 && (
              <optgroup label="Google Calendars Espejo">
                {externalCalendars.map(cal => (
                  <option key={cal.id} value={cal.name}>
                    🗓️ {cal.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <button 
            onClick={() => setShowManageCatsModal(true)} 
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            ⚙️ Responsables
          </button>

          <button 
            onClick={() => setShowExternalCalModal(true)} 
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            🔗 Conectar Google
          </button>

          <button 
            onClick={() => { resetEventForm(); setShowEventModal(true); }} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            + Añadir Visita / Nota
          </button>
        </div>
      </div>

      {/* CALENDARIO MENSUAL VISUAL */}
      <div className="pt-3 pb-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-slate-800 capitalize">
            {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={prevMonth} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold"
            >
              ‹
            </button>
            <button 
              onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]); }} 
              className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
            >
              Hoy
            </button>
            <button 
              onClick={nextMonth} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
          <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {renderDaysGrid()}
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="pt-3 pb-1 shrink-0">
        <input 
          type="text" 
          placeholder="🔍 Buscar cita, cliente, dirección o notas..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* ENCABEZADO DE AVISOS */}
      <div className="py-3 flex items-center justify-between shrink-0 border-b border-slate-100 mb-2">
        <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
          📋 Avisos espejados ({pendientes.length} pendientes)
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          (Sin fecha primero)
        </span>
      </div>

      {/* LISTADO DE CITAS Y NOTAS */}
      <div className="space-y-3 pb-8">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400 text-sm font-medium">Sincronizando espejo en vivo...</div>
        ) : pendientes.length === 0 && visadas.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No hay resultados.
          </div>
        ) : (
          <>
            {/* RENDER PENDIENTES */}
            {pendientes.map((ev, idx) => renderEventCard(ev, idx))}

            {/* SECCIÓN VISADAS (AHORA MUESTRA LAS FICHAS COMPLETAS) */}
            {visadas.length > 0 && (
              <div className="pt-6 mt-4">
                <button 
                  onClick={() => setShowVisadas(!showVisadas)} 
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <span>{showVisadas ? '▲ Ocultar' : '▼ Mostrar'} Visadas / Realizadas ({visadas.length})</span>
                </button>
                {showVisadas && (
                  <div className="space-y-3 mt-4">
                    {visadas.map((ev, idx) => renderEventCard(ev, idx))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL CREAR / EDITAR CITA */}
      {showEventModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-800">
                {eventForm.id ? '✏️ Editar Cita del Espejo' : '📝 Nueva Cita en el Espejo'}
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Título / Motivo *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Medición carpintería aluminio" 
                  value={eventForm.title} 
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-indigo-500" 
                />
              </div>

              {/* CRM */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-600">Cliente CRM</label>
                  <button 
                    type="button" 
                    onClick={() => setShowQuickNewCrm(!showQuickNewCrm)} 
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    {showQuickNewCrm ? '✕ Cancelar' : '+ Nuevo CRM'}
                  </button>
                </div>
                {!showQuickNewCrm ? (
                  <>
                    <input 
                      type="text" 
                      placeholder="Escribe para buscar cliente de CRM..." 
                      value={eventForm.client_name} 
                      onChange={(e) => handleClientNameChange(e.target.value)} 
                      onFocus={() => eventForm.client_name.trim() && setShowCrmSuggestions(true)} 
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-indigo-500" 
                    />
                    {showCrmSuggestions && crmSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {crmSuggestions.map((cli) => (
                          <div 
                            key={cli.id} 
                            onClick={() => selectCrmClient(cli)} 
                            className="p-2.5 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 font-bold flex justify-between"
                          >
                            <span>{cli.name} {cli.company ? `(${cli.company})` : ''}</span>
                            <span className="text-slate-400 font-normal">{cli.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-700 block">Alta rápida en CRM:</span>
                    <input 
                      type="text" 
                      placeholder="Nombre completo *" 
                      value={quickCrm.name} 
                      onChange={(e) => setQuickCrm({ ...quickCrm, name: e.target.value })} 
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" 
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="tel" 
                        placeholder="Teléfono" 
                        value={quickCrm.phone} 
                        onChange={(e) => setQuickCrm({ ...quickCrm, phone: e.target.value })} 
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" 
                      />
                      <input 
                        type="text" 
                        placeholder="Dirección" 
                        value={quickCrm.address} 
                        onChange={(e) => setQuickCrm({ ...quickCrm, address: e.target.value })} 
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSaveQuickCrm} 
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-indigo-700"
                    >
                      Guardar en CRM y Seleccionar
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Teléfono (Llamar)</label>
                  <input 
                    type="tel" 
                    placeholder="600123456" 
                    value={eventForm.phone} 
                    onChange={(e) => setEventForm({ ...eventForm, phone: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Dirección / Obra (Ir)</label>
                  <input 
                    type="text" 
                    placeholder="Calle Mayor 10, Madrid" 
                    value={eventForm.address} 
                    onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={isSinFecha} 
                    onChange={(e) => setIsSinFecha(e.target.checked)} 
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600" 
                  />
                  <span>Dejar sin fecha (Nota arriba para ir cuando pueda)</span>
                </label>
                {!isSinFecha && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Fecha</label>
                      <input 
                        type="date" 
                        value={eventForm.date} 
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} 
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-indigo-500 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Hora</label>
                      <input 
                        type="time" 
                        value={eventForm.time} 
                        onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} 
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-indigo-500 bg-white" 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Responsable / Calendario</label>
                <select 
                  value={eventForm.category} 
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <optgroup label="Tus Responsables">
                    {categoryList.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {categoryList.length === 0 && <option value="General">General</option>}
                  </optgroup>
                  {externalCalendars.length > 0 && (
                    <optgroup label="Google Calendars Compartidos">
                      {externalCalendars.map(cal => (
                        <option key={cal.id} value={cal.name}>🗓️ {cal.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Descripción / Notas</label>
                <textarea 
                  rows={2} 
                  placeholder="Detalles de la cita o visita..." 
                  value={eventForm.description} 
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-indigo-500" 
                />
              </div>

              {/* GRABAR NOTA DE VOZ */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">🎙️ Nota de Voz</span>
                  <span className="text-[10px] text-slate-400">{eventForm.voice_notes?.length || 0} grabada(s)</span>
                </div>
                {!isRecording ? (
                  <button 
                    type="button" 
                    onClick={() => startRecordingForEvent('form')} 
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition"
                  >
                    ⏺️ Grabar
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={stopRecording} 
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold animate-pulse transition"
                  >
                    ⏹️ Parar ({recordingSeconds}s)
                  </button>
                )}
              </div>

              {eventForm.voice_notes && eventForm.voice_notes.length > 0 && (
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {eventForm.voice_notes.map((vn: any, vIdx: number) => (
                    <div key={vIdx} className="flex items-center justify-between bg-white p-1 rounded-lg border border-slate-200 gap-2">
                      <audio src={vn.url} controls className="flex-1 h-7" />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVoiceNoteFromForm(vIdx)} 
                        className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded font-black text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBIR MULTIMEDIA */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">📎 Fotos, Vídeos o Galería</span>
                  <span className="text-[10px] text-slate-400">{eventForm.attachments?.length || 0} adjunto(s)</span>
                </div>
                <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold cursor-pointer transition">
                  + Seleccionar
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*,.pdf,.doc,.docx" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              {eventForm.attachments && eventForm.attachments.length > 0 && (
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {eventForm.attachments.map((att: any, aIdx: number) => (
                    <div key={aIdx} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-200 text-[10px]">
                      <span className="truncate max-w-[240px] font-bold text-slate-700">
                        {att.type === 'image' ? '📷' : '📄'} {att.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAttachmentFromForm(aIdx)} 
                        className="text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded font-black text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEventModal(false)} 
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition"
                >
                  {eventForm.id ? 'Guardar Cambios' : 'Guardar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTIONAR RESPONSABLES */}
      {showManageCatsModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-800">👤 Gestión de Responsables</h3>
              <button 
                onClick={() => setShowManageCatsModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-2">
              <label className="block font-bold text-slate-700">Añadir Nuevo Responsable</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Pepe, José, Reformas..." 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  className="flex-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-indigo-500" 
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700"
                >
                  + Añadir
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700">Responsables Actuales:</label>
              {categoryList.length === 0 ? (
                <p className="text-slate-400 italic">No hay responsables personalizados aún.</p>
              ) : (
                categoryList.map((cat) => (
                  <div key={cat.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    {editingCatId === cat.id ? (
                      <div className="flex gap-2 flex-1">
                        <input 
                          type="text" 
                          value={editCatName} 
                          onChange={(e) => setEditCatName(e.target.value)} 
                          className="flex-1 p-1.5 rounded-lg border border-indigo-400 bg-white font-bold" 
                        />
                        <button 
                          onClick={() => handleUpdateCategory(cat.id)} 
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700"
                        >
                          Guardar
                        </button>
                        <button 
                          onClick={() => { setEditingCatId(null); setEditCatName(''); }} 
                          className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg font-bold text-[10px] hover:bg-slate-300"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-800 text-sm">👤 {cat.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }} 
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded-lg text-[10px] font-bold"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id, cat.name)} 
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-bold"
                          >
                            🗑️ Borrar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowManageCatsModal(false)} 
                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIONAR GOOGLE CALENDAR */}
      {showExternalCalModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-800">🗓️ Calendarios de Google (Espejo)</h3>
              <button 
                onClick={() => setShowExternalCalModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {externalCalendars.length > 0 && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block">Calendarios Enlazados al Espejo:</span>
                {externalCalendars.map((cal) => (
                  <div key={cal.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">🗓️ {cal.name}</span>
                      <span className="text-[10px] text-slate-400 truncate block max-w-[200px]">{cal.url}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteExternalCalendar(cal.id, cal.name)} 
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-bold transition"
                    >
                      Desvincular
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-slate-600 font-medium leading-relaxed">
              Pega aquí la <strong>Dirección secreta en formato iCal (.ics)</strong> de Google Calendar. Todas las cuentas que vinculen esta dirección verán <strong>un espejo exacto</strong> de los eventos, fotos, vídeos, audios y visados en tiempo real.
            </p>

            <form onSubmit={handleAddExternalCalendar} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nombre para este Calendario</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Obras Empresa o Agenda Común" 
                  value={newCalName} 
                  onChange={(e) => setNewCalName(e.target.value)} 
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Dirección iCal (.ics) de Google</label>
                <input 
                  type="url" 
                  required 
                  placeholder="https://calendar.google.com/calendar/ical/.../basic.ics" 
                  value={newCalUrl} 
                  onChange={(e) => setNewCalUrl(e.target.value)} 
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowExternalCalModal(false)} 
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition"
                >
                  Conectar al Espejo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}