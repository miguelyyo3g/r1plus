'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AuthUser } from './LoginPage';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface CRMViewProps { user: AuthUser; }

export default function CRMView({ user }: CRMViewProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({ name: '', company: '', cif: '', address: '', phone: '', email: '' });

  useEffect(() => { fetchClients(); }, []);
  
  const fetchClients = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('crm_clients').select('*').eq('owner_id', user.id).order('name', { ascending: true });
    setClients(data || []);
    setIsLoading(false);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, owner_id: user.id };
    if (selectedClient?.id) await supabase.from('crm_clients').update(payload).eq('id', selectedClient.id);
    else await supabase.from('crm_clients').insert([payload]);
    setIsEditing(false); 
    fetchClients();
  };

  const filtered = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white w-full relative">
      
      {/* CABECERA CRM */}
      <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-10">
        <h2 className="text-lg font-bold text-slate-900">Directorio CRM</h2>
        <button onClick={() => { setSelectedClient(null); setFormData({name:'', company:'', cif:'', address:'', phone:'', email:''}); setIsEditing(true); }} className="text-indigo-600 font-semibold text-sm bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition">
          + Añadir
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="px-4 py-2 border-b border-slate-100 shrink-0 bg-slate-50">
        <div className="bg-white rounded-lg px-3 py-2 flex items-center border border-slate-200 shadow-sm">
          <span className="text-slate-400 mr-2 text-sm">🔍</span>
          <input type="text" placeholder="Buscar cliente o empresa..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-transparent text-sm text-slate-800 focus:outline-none" />
        </div>
      </div>

      {/* LISTA DE CLIENTES NATIVA */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
           <div className="p-8 text-center text-sm font-medium text-slate-400">Cargando base de datos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center mt-10">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🏢</div>
             <p className="text-base font-bold text-slate-700">Tu CRM está vacío</p>
             <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Añade clientes aquí para generarles presupuestos y facturas automáticamente.</p>
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} onClick={() => setSelectedClient(c)} className="flex items-center px-4 py-3 cursor-pointer hover:bg-slate-50 transition border-b border-slate-50">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0 mr-4 shadow-inner">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 border-b border-slate-100 pb-3 -mb-3 h-14 flex flex-col justify-center">
                <div className="font-semibold text-base text-slate-900 truncate">{c.name}</div>
                <div className="text-sm text-slate-500 truncate">{c.company || c.phone || 'Sin datos extra'}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PANTALLA: AÑADIR/EDITAR CLIENTE */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-in slide-in-from-bottom-2">
          <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0">
            <button onClick={() => setIsEditing(false)} className="text-slate-600 font-medium text-base hover:text-slate-800 transition">Cancelar</button>
            <h3 className="font-bold text-lg text-slate-900">{selectedClient ? 'Editar Ficha' : 'Nuevo Cliente'}</h3>
            <button onClick={handleSaveClient} disabled={!formData.name} className="text-indigo-600 font-bold text-base disabled:opacity-50">Guardar</button>
          </div>
          
          <form className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-800 font-medium shadow-sm">
              Estos datos se usarán para autocompletar documentos oficiales.
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Razón Social / Nombre *</label>
                 <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-base font-semibold border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-500 text-slate-900" required />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Empresa / Comercial</label>
                 <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full text-base border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-500 text-slate-900" />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Teléfono</label>
                 <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full text-base border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-500 text-slate-900" />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                 <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full text-base border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-500 text-slate-900" />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">CIF / NIF</label>
                 <input type="text" value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="w-full text-base font-mono border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-500 text-slate-900" />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Dirección Completa</label>
                 <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} className="w-full text-base border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-500 text-slate-900 resize-none"></textarea>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* PANTALLA: DETALLE DEL CLIENTE */}
      {selectedClient && !isEditing && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-50 animate-in slide-in-from-right-2">
          <div className="h-14 px-2 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0">
            <button onClick={() => setSelectedClient(null)} className="p-2 text-slate-600 flex items-center gap-1 hover:bg-slate-100 rounded-lg transition">
               <span className="text-2xl leading-none -mt-1">←</span> <span className="text-base font-medium">Atrás</span>
            </button>
            <button onClick={() => { setFormData(selectedClient); setIsEditing(true); }} className="px-4 text-indigo-600 font-bold text-base hover:text-indigo-800 transition">Editar</button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             <div className="flex flex-col items-center py-8 bg-white border-b border-slate-200 shadow-sm px-4 text-center">
               <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-4xl font-black mb-4 shadow-inner">
                  {selectedClient.name.charAt(0).toUpperCase()}
               </div>
               <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedClient.name}</h2>
               {selectedClient.company && <p className="text-base font-medium text-slate-500 mt-1">{selectedClient.company}</p>}
             </div>

             <div className="p-4 space-y-4">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                 <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Móvil</span>
                    <span className="text-base font-medium text-slate-900">{selectedClient.phone || 'No añadido'}</span>
                 </div>
                 <div className="border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Oficial</span>
                    <span className="text-base font-medium text-slate-900">{selectedClient.email || 'No añadido'}</span>
                 </div>
                 <div className="border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Dirección de Facturación</span>
                    <span className="text-base font-medium text-slate-900 leading-snug block">{selectedClient.address || 'No añadida'}</span>
                 </div>
                 <div className="border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">CIF / NIF</span>
                    <span className="text-base font-medium font-mono text-slate-900">{selectedClient.cif || 'No añadido'}</span>
                 </div>
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">📋 Historial de Obras</h4>
                  <p className="text-sm text-slate-500">Los eventos y mediciones vinculados a este cliente en el Calendario aparecerán aquí próximamente.</p>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}