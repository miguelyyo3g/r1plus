'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function FreelanceWorksView({ user }: { user: any }) {
  const [works, setWorks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [savedConcepts, setSavedConcepts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new'>('list');
  const [profile, setProfile] = useState<any>(null);

  // Estados del Formulario Avanzado
  const [clientMode, setClientMode] = useState<'crm' | 'new'>('crm');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(''); 
  const [description, setDescription] = useState('');
  
  // Partidas (Items)
  const [items, setItems] = useState([{ concept: '', quantity: 1, price: 0 }]);
  
  // Archivos (Fotos, Audios, Docs)
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(myProfile);
      const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'superadmin';

      // Identificar ID de la organización
      let orgId = user.id;
      if (!isAdmin) {
        const { data: adminData } = await supabase.from('profiles').select('id').eq('company', myProfile?.company).eq('role', 'admin').single();
        orgId = adminData?.id || user.id;
      }

      // Cargar partes de trabajo
      let query = supabase.from('freelance_works').select('*, worker:profiles!worker_id(name)').order('created_at', { ascending: false });
      query = isAdmin ? query.eq('organization_id', user.id) : query.eq('worker_id', user.id);
      const { data: worksData } = await query;
      if (worksData) setWorks(worksData);

      // Cargar datos extra para el formulario
      const { data: clientsData } = await supabase.from('clients').select('*').eq('organization_id', orgId);
      if (clientsData) setCrmClients(clientsData);

      const { data: conceptsData } = await supabase.from('work_concepts').select('*').eq('organization_id', orgId);
      if (conceptsData) setSavedConcepts(conceptsData);

      if (isAdmin) {
        const { data: teamData } = await supabase.from('profiles').select('id, name').eq('company', myProfile?.company).eq('role', 'sales_rep');
        if (teamData) setTeam(teamData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestión de Partidas (Añadir, Quitar, Modificar)
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Si elige un concepto guardado, autocompletar precio
    if (field === 'concept') {
      const found = savedConcepts.find(c => c.name === value);
      if (found) newItems[index].price = found.default_price;
    }
    setItems(newItems);
  };
  const addItem = () => setItems([...items, { concept: '', quantity: 1, price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const calculateTotal = () => items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

  // Subir Archivos a Supabase Storage
  const uploadFiles = async (workId: string) => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${workId}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('work_attachments').upload(fileName, file);
      if (data) {
        const { data: urlData } = supabase.storage.from('work_attachments').getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
    const total = calculateTotal();

    if (items.some(i => !i.concept)) return alert('Rellena el nombre de todos los conceptos.');
    if (isAdmin && !selectedWorker) return alert('Selecciona el operario.');
    
    setIsSubmitting(true);
    try {
      let organizationId = user.id;
      let workerId = isAdmin ? selectedWorker : user.id;

      if (!isAdmin) {
        const { data: adminData } = await supabase.from('profiles').select('id').eq('company', profile?.company).eq('role', 'admin').single();
        organizationId = adminData?.id || user.id;
      }

      // 1. Guardar conceptos nuevos para el futuro
      for (const item of items) {
        if (!savedConcepts.find(c => c.name === item.concept)) {
          await supabase.from('work_concepts').insert({ organization_id: organizationId, name: item.concept, default_price: item.price });
        }
      }

      // 2. Crear el Parte
      const { data: newWork, error } = await supabase.from('freelance_works').insert({
        organization_id: organizationId,
        worker_id: workerId,
        client_id: clientMode === 'crm' ? selectedClientId : null,
        client_name: clientMode === 'crm' ? crmClients.find(c=>c.id===selectedClientId)?.name : clientName,
        client_phone: clientMode === 'new' ? clientPhone : null,
        client_address: clientMode === 'new' ? clientAddress : null,
        title: `Parte de Trabajo - ${new Date().toLocaleDateString()}`,
        description,
        price: total,
        items,
        status: 'pendiente_revision'
      }).select().single();

      if (error) throw error;

      // 3. Subir Archivos y actualizar el parte
      if (files.length > 0 && newWork) {
        const urls = await uploadFiles(newWork.id);
        await supabase.from('freelance_works').update({ attachments: urls }).eq('id', newWork.id);
      }
      
      alert('Parte registrado con éxito');
      resetForm();
      loadData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setView('list'); setItems([{ concept: '', quantity: 1, price: 0 }]); setFiles([]);
    setClientName(''); setClientPhone(''); setClientAddress(''); setSelectedClientId(''); setDescription('');
  };

  const updateStatus = async (workId: string, newStatus: string) => {
    await supabase.from('freelance_works').update({ status: newStatus }).eq('id', workId);
    loadData();
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  if (isLoading) return <div className="p-8 text-center font-bold">Cargando...</div>;

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">🏗️ Partes de Trabajo</h2>
          <p className="text-sm text-slate-500">Gestión de obras, partidas y adjuntos.</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => setView('new')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">+ Nuevo Parte</button>
        ) : (
          <button onClick={() => setView('list')} className="px-4 py-2 bg-slate-100 font-bold rounded-xl">Volver</button>
        )}
      </div>

      {view === 'new' ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
          
          {/* SECCIÓN OPERARIO */}
          {isAdmin && (
            <div className="bg-slate-50 p-4 rounded-xl border">
              <label className="block text-xs font-bold uppercase mb-1">Operario asignado</label>
              <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)} className="w-full p-2 rounded-lg border" required>
                <option value="">Selecciona operario...</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* SECCIÓN CLIENTE */}
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2">Datos del Cliente</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setClientMode('crm')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${clientMode==='crm'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>De CRM</button>
              <button type="button" onClick={() => setClientMode('new')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${clientMode==='new'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>Nuevo / Manual</button>
            </div>
            
            {clientMode === 'crm' ? (
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-50" required>
                <option value="">Seleccionar cliente del CRM...</option>
                {crmClients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.address}</option>)}
              </select>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre completo" value={clientName} onChange={e=>setClientName(e.target.value)} className="p-3 border rounded-xl" required />
                <input type="tel" placeholder="Teléfono" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} className="p-3 border rounded-xl" />
                <input type="text" placeholder="Dirección completa" value={clientAddress} onChange={e=>setClientAddress(e.target.value)} className="p-3 border rounded-xl md:col-span-2" />
              </div>
            )}
          </div>

          {/* SECCIÓN PARTIDAS */}
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2 flex justify-between items-center">
              Partidas / Conceptos
              <span className="text-xl text-indigo-600 font-black">{calculateTotal().toFixed(2)} €</span>
            </h3>
            
            <datalist id="saved-concepts">
              {savedConcepts.map(c => <option key={c.id} value={c.name} />)}
            </datalist>

            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-3 rounded-xl border">
                <input list="saved-concepts" placeholder="Concepto (Ej: Instalación puerta)" value={item.concept} onChange={e=>handleItemChange(index, 'concept', e.target.value)} className="flex-1 p-2 border rounded-lg w-full" required />
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="number" min="1" placeholder="Cant." value={item.quantity} onChange={e=>handleItemChange(index, 'quantity', e.target.value)} className="w-20 p-2 border rounded-lg" required />
                  <input type="number" step="0.01" placeholder="Precio" value={item.price} onChange={e=>handleItemChange(index, 'price', e.target.value)} className="w-24 p-2 border rounded-lg" required />
                  {items.length > 1 && <button type="button" onClick={()=>removeItem(index)} className="p-2 text-red-500 bg-red-50 rounded-lg font-bold">X</button>}
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm font-bold text-indigo-600">+ Añadir otra partida</button>
          </div>

          {/* SECCIÓN ADJUNTOS */}
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2">Notas y Archivos (Fotos, Audios...)</h3>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Observaciones generales del trabajo..." className="w-full p-3 border rounded-xl min-h-[80px]" />
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
              <input type="file" multiple accept="image/*,video/*,audio/*,.pdf" onChange={e => { if(e.target.files) setFiles(Array.from(e.target.files)) }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              <p className="text-xs text-slate-400 mt-2">Sube fotos de la obra, audios o documentos PDF.</p>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg">
            {isSubmitting ? 'Guardando y subiendo archivos...' : 'Guardar Parte de Trabajo'}
          </button>
        </form>
      ) : (
        /* LISTADO DE TRABAJOS */
        <div className="space-y-4">
          {works.map(work => (
            <div key={work.id} className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-800">{work.client_name || 'Cliente sin nombre'}</h4>
                  <p className="text-xs text-slate-500">📍 {work.client_address || 'Sin dirección'}</p>
                  {isAdmin && <p className="text-xs font-bold text-indigo-600 mt-1">👤 Operario: {work.worker?.name}</p>}
                </div>
                <div className="text-right">
                  <span className="text-xl font-black">{Number(work.price).toFixed(2)} €</span>
                  <div className="mt-1">
                    <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded-full uppercase">{work.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg text-sm border">
                <p className="font-bold text-slate-700 mb-1">Partidas:</p>
                <ul className="list-disc pl-4 text-slate-600">
                  {work.items?.map((item:any, i:number) => (
                    <li key={i}>{item.quantity}x {item.concept} - {item.price}€</li>
                  ))}
                </ul>
              </div>

              {work.attachments?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {work.attachments.map((url:string, i:number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">Ver Adjunto {i+1}</a>
                  ))}
                </div>
              )}

              {isAdmin && work.status !== 'pagado' && (
                <select className="text-xs font-bold bg-slate-100 border p-2 rounded-lg mt-2" value={work.status} onChange={(e) => updateStatus(work.id, e.target.value)}>
                  <option value="pendiente_revision">Pendiente</option>
                  <option value="aprobado">Aprobar</option>
                  <option value="pagado">Marcar Pagado</option>
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}