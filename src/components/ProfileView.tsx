// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseclient';

interface ProfileViewProps {
  user: AuthUser;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [invoiceStart, setInvoiceStart] = useState<number>(1);
  const [profileData, setProfileData] = useState({
    name: user.name,
    company: user.company,
    phone: user.phone || '',
    cif: '',
    address: '',
    email_contact: user.email || '',
    iban: '',
    bizum: '',
    logo_url: '',
    logo_public: true
  });

  const [team, setTeam] = useState([
    { id: '1', name: 'Marta (Comercial)', role: 'sales_rep', canManageDocs: false },
    { id: '2', name: 'Pablo (Técnico)', role: 'client_employee', canManageDocs: true }
  ]);

  const [showCrmModal, setShowCrmModal] = useState(false);
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [crmSearchTerm, setCrmSearchTerm] = useState('');
  const [showCreateClientInCrm, setShowCreateClientInCrm] = useState(false);
  
  const [newCrmClient, setNewCrmClient] = useState({ name: '', company: '', cif: '', phone: '', email: '', address: '', iban: '', bizum: '' });

  useEffect(() => {
    if (!user.id.startsWith('u-')) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setInvoiceStart(data.invoice_start || 1);
          setProfileData({
            name: data.name || user.name,
            company: data.company || user.company,
            phone: data.phone || user.phone || '',
            cif: data.cif || '',
            address: data.address || '',
            email_contact: data.email_contact || user.email || '',
            iban: data.iban || '',
            bizum: data.bizum || '',
            logo_url: data.logo_url || '',
            logo_public: data.logo_public !== false
          });
        }
      });
    }
  }, [user.id]);

  useEffect(() => {
    if (showCrmModal) fetchClientsForCrm();
  }, [showCrmModal]);

  const fetchClientsForCrm = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
      if (error) throw error;
      if (data) setCrmClients(data);
    } catch (err) {}
  };

  const handleSaveNewClientCrm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('clients').insert([{
        ...newCrmClient, user_id: user.id.startsWith('u-') ? null : user.id
      }]).select();

      if (error) throw error;
      if (data) {
        setCrmClients(prev => [...prev, data[0]]);
        setShowCreateClientInCrm(false);
        setNewCrmClient({ name: '', company: '', cif: '', phone: '', email: '', address: '', iban: '', bizum: '' });
      }
    } catch (err: any) { alert('Error al guardar cliente: ' + err.message); }
  };

  const filteredCrmClients = crmClients.filter(c => 
    (c.name && c.name.toLowerCase().includes(crmSearchTerm.toLowerCase())) ||
    (c.cif && c.cif.toLowerCase().includes(crmSearchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(crmSearchTerm))
  );

  const handleSubscribe = async (priceId: string) => {
    try {
      setIsLoadingPayment(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId, userEmail: user.email, userId: user.id }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url; 
      else alert(data.error || 'Error al iniciar pasarela');
    } catch (err) { alert('Error de conexión.'); } finally { setIsLoadingPayment(false); }
  };

  const handleSaveProfile = async () => {
    setIsEditing(false);
    if (!user.id.startsWith('u-')) {
      try {
        const { error } = await supabase.from('profiles').update({
          name: profileData.name,
          company: profileData.company,
          phone: profileData.phone,
          cif: profileData.cif,
          address: profileData.address,
          email_contact: profileData.email_contact,
          iban: profileData.iban,
          bizum: profileData.bizum,
          logo_url: profileData.logo_url,
          logo_public: profileData.logo_public,
          invoice_start: invoiceStart
        }).eq('id', user.id);
        if (error) throw error;
        alert('Guardado correctamente.');
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    } else {
      alert('Modo prueba: Guardado temporal.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTeamPermission = (id: string) => setTeam(team.map(m => m.id === id ? { ...m, canManageDocs: !m.canManageDocs } : m));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-sm w-full h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <h2 className="text-sm font-black text-slate-800">👤 Mi Espacio</h2>
          <p className="text-[9px] text-slate-500">Datos fiscales y facturación.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hidden sm:inline-block">
            Rol: {user.role}
          </span>
          <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} className={`px-2 py-1.5 rounded text-[10px] font-bold transition cursor-pointer ${isEditing ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}>
            {isEditing ? '💾 Guardar' : '✏️ Editar'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Identidad Visual</h3>
          {isEditing && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-600">Logo Público:</span>
              <button onClick={() => setProfileData({...profileData, logo_public: !profileData.logo_public})} className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${profileData.logo_public ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${profileData.logo_public ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
            {profileData.logo_url ? <img src={profileData.logo_url} alt="Logo" className="w-full h-full object-contain p-1" /> : <span className="text-xl text-slate-300">🏢</span>}
          </div>
          <div className="flex-1 space-y-1">
            {!isEditing ? (
              <>
                <p className="text-xs font-black text-slate-800">{profileData.company || 'Sin Nombre'}</p>
                <p className="text-[9px] text-slate-500">{profileData.logo_public ? 'Visible' : 'Privado'}</p>
              </>
            ) : (
              <>
                <label className="block px-2 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-200 cursor-pointer w-fit hover:bg-indigo-100 transition">
                  Subir (Max 2MB)
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                {profileData.logo_url && <button onClick={() => setProfileData({...profileData, logo_url: ''})} className="text-[9px] text-rose-600 font-bold hover:underline">Quitar</button>}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1">🏢 Fiscal y Contacto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">Razón Social</span>
            {isEditing ? <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full mt-1 p-1.5 rounded bg-white border border-slate-300 font-bold text-slate-800 text-[11px] focus:outline-none" /> : <span className="font-black text-slate-800 block mt-1 text-[11px]">{profileData.name}</span>}
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">CIF / NIF</span>
            {isEditing ? <input type="text" value={profileData.cif} onChange={e => setProfileData({...profileData, cif: e.target.value})} className="w-full mt-1 p-1.5 rounded bg-white border border-slate-300 font-bold font-mono text-slate-800 text-[11px] focus:outline-none" /> : <span className="font-bold text-slate-800 font-mono block mt-1 text-[11px]">{profileData.cif || '---'}</span>}
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200 sm:col-span-2">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">Dirección</span>
            {isEditing ? <input type="text" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full mt-1 p-1.5 rounded bg-white border border-slate-300 font-medium text-slate-800 text-[11px] focus:outline-none" /> : <span className="font-medium text-slate-800 block mt-1 text-[11px]">{profileData.address || '---'}</span>}
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">Teléfono</span>
            {isEditing ? <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full mt-1 p-1.5 rounded bg-white border border-slate-300 font-bold font-mono text-slate-800 text-[11px] focus:outline-none" /> : <span className="font-bold text-slate-800 font-mono block mt-1 text-[11px]">{profileData.phone || '---'}</span>}
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">Email</span>
            {isEditing ? <input type="email" value={profileData.email_contact} onChange={e => setProfileData({...profileData, email_contact: e.target.value})} className="w-full mt-1 p-1.5 rounded bg-white border border-slate-300 font-medium text-slate-800 text-[11px] focus:outline-none" /> : <span className="font-medium text-slate-800 block mt-1 text-[11px]">{profileData.email_contact || '---'}</span>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1">💳 Cobro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2 rounded border border-slate-200 sm:col-span-2">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">IBAN</span>
            {isEditing ? <input type="text" placeholder="ESXX..." value={profileData.iban} onChange={e => setProfileData({...profileData, iban: e.target.value})} className="w-full mt-1 p-1.5 rounded bg-white border border-slate-300 font-bold font-mono text-slate-800 text-[11px] focus:outline-none" /> : <span className="font-bold text-slate-800 font-mono block mt-1 text-[11px]">{profileData.iban || '---'}</span>}
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">Bizum</span>
            {isEditing ? <input type="tel" value={profileData.bizum} onChange={e => setProfileData({...profileData, bizum: e.target.value})} className="w-full mt-1 p-1.5 rounded bg-white border border-slate-300 font-bold font-mono text-slate-800 text-[11px] focus:outline-none" /> : <span className="font-bold text-slate-800 font-mono block mt-1 text-[11px]">{profileData.bizum || '---'}</span>}
          </div>
          <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100">
            <span className="text-indigo-600 font-black block text-[9px] uppercase">Núm. Facturas</span>
            {isEditing ? (
              <div className="flex items-center gap-1 mt-1">
                <span className="font-mono text-slate-500 font-bold text-[10px]">FAC-{new Date().getFullYear()}-</span>
                <input type="number" min="1" value={invoiceStart} onChange={e => setInvoiceStart(Number(e.target.value))} className="w-full p-1 rounded bg-white border border-indigo-300 font-bold text-indigo-900 font-mono text-[10px] focus:outline-none" />
              </div>
            ) : (
              <span className="font-black text-indigo-900 font-mono block mt-1 bg-indigo-100 px-1.5 py-0.5 rounded w-fit text-[10px]">FAC-{new Date().getFullYear()}-{String(invoiceStart).padStart(4, '0')}</span>
            )}
          </div>
        </div>
      </div>

      {(user.role === 'supplier_owner' || user.role === 'buyer') && (
        <div className="pt-3 border-t border-slate-200">
          <h3 className="text-xs font-black text-slate-800 mb-1">👥 Equipo</h3>
          <p className="text-[9px] text-slate-500 mb-2">Permisos para crear documentos.</p>
          <div className="space-y-1.5">
            {team.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded">
                <div><span className="text-[10px] font-black text-slate-800 block">{member.name}</span><span className="text-[8px] text-slate-500">Rol: {member.role}</span></div>
                <button onClick={() => toggleTeamPermission(member.id)} className={`px-2 py-1 text-[9px] font-bold rounded transition cursor-pointer border ${member.canManageDocs ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                  {member.canManageDocs ? '✅ Permite' : '❌ Lectura'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCrmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-2">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg p-3 text-slate-900 shadow-2xl flex flex-col h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
              <div><h3 className="text-sm font-black text-slate-900">📇 CRM</h3><p className="text-[9px] text-slate-500">Directorio de clientes.</p></div>
              <button onClick={() => setShowCrmModal(false)} className="w-6 h-6 rounded bg-slate-100 font-bold text-slate-600 text-xs">✕</button>
            </div>
            <div className="py-2 flex gap-1.5 shrink-0">
              <input type="text" placeholder="Buscar..." value={crmSearchTerm} onChange={(e) => setCrmSearchTerm(e.target.value)} className="flex-1 p-1.5 rounded border border-slate-300 text-[10px] focus:outline-none" />
              <button onClick={() => setShowCreateClientInCrm(true)} className="px-2 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold">+ Cliente</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 bg-slate-50 rounded p-1.5">
              {filteredCrmClients.length === 0 ? <div className="text-center py-6 text-slate-400 text-[10px]">Sin resultados.</div> : filteredCrmClients.map(c => (
                <div key={c.id} className="bg-white p-2 rounded border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-black text-indigo-900 text-xs">{c.name} {c.company && <span className="text-slate-500 text-[10px]">({c.company})</span>}</div>
                    <button className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">✏️ Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] bg-slate-50 p-1.5 rounded border border-slate-100">
                    <div><span className="block font-bold text-slate-400 mb-0.5">CIF/DNI</span><span className="font-mono font-bold text-slate-800">{c.cif || '---'}</span></div>
                    <div><span className="block font-bold text-slate-400 mb-0.5">TEL</span><span className="font-mono font-bold text-slate-800">{c.phone || '---'}</span></div>
                    <div className="col-span-2"><span className="block font-bold text-slate-400 mb-0.5">EMAIL</span><span className="font-bold text-slate-800 truncate block">{c.email || '---'}</span></div>
                    <div className="col-span-2 border-t border-slate-200 pt-1 mt-0.5"><span className="block font-bold text-slate-400 mb-0.5">DIRECCIÓN</span><span className="font-bold text-slate-800">{c.address || '---'}</span></div>
                    <div className="col-span-2"><span className="block font-bold text-slate-400 mb-0.5">IBAN</span><span className="font-mono font-bold text-slate-800">{c.iban || '---'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateClientInCrm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-2 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-3 text-slate-900 shadow-2xl space-y-2 my-auto">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-1.5">👤 Alta Cliente</h3>
            <form onSubmit={handleSaveNewClientCrm} className="space-y-1.5 text-[10px] pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div><label className="block text-slate-600 font-bold mb-0.5">Nombre *</label><input type="text" required value={newCrmClient.name} onChange={e => setNewCrmClient({...newCrmClient, name: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 font-black focus:outline-none" /></div>
                <div><label className="block text-slate-600 font-bold mb-0.5">Empresa</label><input type="text" value={newCrmClient.company} onChange={e => setNewCrmClient({...newCrmClient, company: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 font-bold focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <div><label className="block text-slate-600 font-bold mb-0.5">CIF/NIF</label><input type="text" value={newCrmClient.cif} onChange={e => setNewCrmClient({...newCrmClient, cif: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 font-mono focus:outline-none" /></div>
                <div><label className="block text-slate-600 font-bold mb-0.5">Tel</label><input type="tel" value={newCrmClient.phone} onChange={e => setNewCrmClient({...newCrmClient, phone: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 font-mono focus:outline-none" /></div>
                <div><label className="block text-slate-600 font-bold mb-0.5">Email</label><input type="email" value={newCrmClient.email} onChange={e => setNewCrmClient({...newCrmClient, email: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 focus:outline-none" /></div>
              </div>
              <div><label className="block text-slate-600 font-bold mb-0.5">Dirección</label><input type="text" value={newCrmClient.address} onChange={e => setNewCrmClient({...newCrmClient, address: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 focus:outline-none" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded border border-slate-200">
                <div><label className="block text-slate-600 font-bold mb-0.5">IBAN</label><input type="text" placeholder="ESXX..." value={newCrmClient.iban} onChange={e => setNewCrmClient({...newCrmClient, iban: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 font-mono focus:outline-none" /></div>
                <div><label className="block text-slate-600 font-bold mb-0.5">Bizum</label><input type="tel" value={newCrmClient.bizum} onChange={e => setNewCrmClient({...newCrmClient, bizum: e.target.value})} className="w-full p-1.5 rounded border border-slate-300 font-mono focus:outline-none" /></div>
              </div>
              <div className="pt-2 flex gap-1.5 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateClientInCrm(false)} className="flex-1 py-1.5 bg-slate-100 rounded font-bold hover:bg-slate-200">Cancelar</button>
                <button type="submit" className="flex-[2] py-1.5 bg-indigo-600 text-white rounded font-black hover:bg-indigo-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}