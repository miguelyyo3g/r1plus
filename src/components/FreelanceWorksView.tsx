'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function FreelanceWorksView({ user }: { user: any }) {
  const [works, setWorks] = useState<any[]>([]);
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [savedConcepts, setSavedConcepts] = useState<any[]>([]);
  const [freelancePastClients, setFreelancePastClients] = useState<any[]>([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null); // <-- Para saber si estamos editando
  const [profile, setProfile] = useState<any>(null);

  // Estados de Estadísticas (Multiselección de meses)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([-1]); // -1 significa "Todos"

  // Estados del Formulario
  const [clientMode, setClientMode] = useState<'crm' | 'new'>('crm');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  // Dirección desglosada
  const [clientStreet, setClientStreet] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [clientPortal, setClientPortal] = useState('');
  const [clientFloor, setClientFloor] = useState('');
  const [clientCity, setClientCity] = useState('');

  const [description, setDescription] = useState('');
  const [expenses, setExpenses] = useState('');
  const [items, setItems] = useState([{ concept: '', quantity: 1, price: 0 }]);
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

      if (!isAdmin) setClientMode('new');

      let orgId = user.id;
      if (!isAdmin) {
        const { data: adminData } = await supabase.from('profiles').select('id').eq('company', myProfile?.company).eq('role', 'admin').single();
        orgId = adminData?.id || user.id;
      }

      let query = supabase.from('freelance_works').select('*, worker:profiles!worker_id(name)').order('created_at', { ascending: false });
      query = isAdmin ? query.eq('organization_id', user.id) : query.eq('worker_id', user.id);
      const { data: worksData } = await query;
      
      if (worksData) {
        setWorks(worksData);
        const past = worksData.filter(w => w.client_name).map(w => ({ 
          name: w.client_name, phone: w.client_phone, 
          street: w.client_street, city: w.client_city, num: w.client_number, portal: w.client_portal, floor: w.client_floor 
        }));
        const uniquePast = Array.from(new Map(past.map(item => [item.name, item])).values());
        setFreelancePastClients(uniquePast);
      }

      if (isAdmin) {
        const { data: clientsData } = await supabase.from('clients').select('*').eq('organization_id', orgId);
        if (clientsData) setCrmClients(clientsData);
      }

      const { data: conceptsData } = await supabase.from('work_concepts').select('*').eq('organization_id', orgId);
      if (conceptsData) setSavedConcepts(conceptsData);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Autocompletar historial
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    const found = freelancePastClients.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (found) {
      if (found.phone) setClientPhone(found.phone);
      if (found.street) setClientStreet(found.street);
      if (found.num) setClientNumber(found.num);
      if (found.portal) setClientPortal(found.portal);
      if (found.floor) setClientFloor(found.floor);
      if (found.city) setClientCity(found.city);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'concept') {
      const found = savedConcepts.find(c => c.name === value);
      if (found) newItems[index].price = found.default_price;
    }
    setItems(newItems);
  };
  const addItem = () => setItems([...items, { concept: '', quantity: 1, price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const calculateTotal = () => items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

  // Prepara el formulario para editar
  const startEditing = (work: any) => {
    setEditingId(work.id);
    if (work.client_id) {
      setClientMode('crm');
      setSelectedClientId(work.client_id);
    } else {
      setClientMode('new');
      setClientName(work.client_name || '');
      setClientPhone(work.client_phone || '');
      setClientStreet(work.client_street || '');
      setClientNumber(work.client_number || '');
      setClientPortal(work.client_portal || '');
      setClientFloor(work.client_floor || '');
      setClientCity(work.client_city || '');
    }
    setItems(work.items?.length > 0 ? work.items : [{ concept: '', quantity: 1, price: 0 }]);
    setDescription(work.description || '');
    setExpenses(work.expenses ? work.expenses.toString() : '');
    setFiles([]); // No editamos archivos subidos previamente por ahora, los dejamos tal cual.
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
    const total = calculateTotal();
    const totalExpenses = parseFloat(expenses || '0');

    if (items.some(i => !i.concept)) return alert('Rellena el nombre de todos los conceptos.');
    if (clientMode === 'crm' && !selectedClientId) return alert('Selecciona un cliente del CRM.');
    if (clientMode === 'new' && !clientName) return alert('El nombre del cliente es obligatorio.');
    
    setIsSubmitting(true);
    try {
      let organizationId = user.id;
      if (!isAdmin) {
        const { data: adminData } = await supabase.from('profiles').select('id').eq('company', profile?.company).eq('role', 'admin').single();
        organizationId = adminData?.id || user.id;
      }

      // Guardar conceptos nuevos
      for (const item of items) {
        if (!savedConcepts.find(c => c.name === item.concept)) {
          await supabase.from('work_concepts').insert({ organization_id: organizationId, name: item.concept, default_price: item.price });
        }
      }

      let finalClientName = clientName;
      let finalClientPhone = clientPhone;
      let finalStreet = clientStreet, finalCity = clientCity, finalNum = clientNumber, finalPortal = clientPortal, finalFloor = clientFloor;
      
      if (clientMode === 'crm' && isAdmin) {
        const crmC = crmClients.find(c => c.id === selectedClientId);
        finalClientName = crmC?.name || '';
        finalClientPhone = crmC?.phone || '';
      }

      const payload = {
        organization_id: organizationId,
        client_id: clientMode === 'crm' && isAdmin ? selectedClientId : null,
        client_name: finalClientName,
        client_phone: finalClientPhone,
        client_street: finalStreet,
        client_city: finalCity,
        client_number: finalNum,
        client_portal: finalPortal,
        client_floor: finalFloor,
        title: `Parte - ${finalClientName}`,
        description,
        price: total,
        expenses: totalExpenses,
        items
      };

      let currentWorkId = editingId;

      if (editingId) {
        // ACTUALIZAR PARTE EXISTENTE
        const { error } = await supabase.from('freelance_works').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        // CREAR NUEVO PARTE
        const { data: newWork, error } = await supabase.from('freelance_works').insert({
          ...payload, worker_id: user.id, status: 'pendiente_revision'
        }).select().single();
        if (error) throw error;
        currentWorkId = newWork.id;
      }

      // Subir archivos nuevos si hay
      if (files.length > 0 && currentWorkId) {
        const uploadedUrls = [];
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${currentWorkId}_${Date.now()}.${fileExt}`;
          const { data } = await supabase.storage.from('work_attachments').upload(fileName, file);
          if (data) {
            const { data: urlData } = supabase.storage.from('work_attachments').getPublicUrl(fileName);
            uploadedUrls.push(urlData.publicUrl);
          }
        }
        
        // Obtener adjuntos antiguos y sumar los nuevos
        if (editingId) {
          const existing = works.find(w => w.id === editingId)?.attachments || [];
          await supabase.from('freelance_works').update({ attachments: [...existing, ...uploadedUrls] }).eq('id', currentWorkId);
        } else {
          await supabase.from('freelance_works').update({ attachments: uploadedUrls }).eq('id', currentWorkId);
        }
      }
      
      alert(editingId ? 'Parte actualizado con éxito' : 'Parte registrado con éxito');
      resetForm();
      loadData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setView('list'); setEditingId(null);
    setItems([{ concept: '', quantity: 1, price: 0 }]); setFiles([]);
    setClientName(''); setClientPhone(''); setClientStreet(''); setClientCity(''); setClientNumber(''); setClientPortal(''); setClientFloor('');
    setSelectedClientId(''); setDescription(''); setExpenses('');
  };

  const updateStatus = async (workId: string, newStatus: string) => {
    await supabase.from('freelance_works').update({ status: newStatus }).eq('id', workId);
    loadData();
  };

  const toggleMonth = (m: number) => {
    if (m === -1) setSelectedMonths([-1]); // Seleccionar todos
    else {
      let newM = selectedMonths.filter(x => x !== -1);
      if (newM.includes(m)) newM = newM.filter(x => x !== m);
      else newM.push(m);
      if (newM.length === 0) newM = [-1]; // Si desmarca todo, vuelve a "Todos"
      setSelectedMonths(newM);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  if (isLoading) return <div className="p-8 text-center font-bold">Cargando...</div>;

  const getWaPhone = (phone: string) => {
    const p = phone?.replace(/[^0-9]/g, '') || '';
    return p.length === 9 ? `34${p}` : p; 
  };

  // ================= ESTADÍSTICAS MULTIMES =================
  const worksThisYear = works.filter(w => new Date(w.created_at).getFullYear() === selectedYear);
  const worksFiltered = worksThisYear.filter(w => selectedMonths.includes(-1) || selectedMonths.includes(new Date(w.created_at).getMonth()));

  const totalPartes = worksFiltered.length;
  const totalImporte = worksFiltered.reduce((sum, w) => sum + Number(w.price || 0), 0);
  const totalTerminado = worksFiltered.filter(w => w.status === 'aprobado' || w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);
  const totalCobrado = worksFiltered.filter(w => w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);
  
  const monthsNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto space-y-6">
      
      {/* Cabecera Principal */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">🏗️ Partes de Trabajo</h2>
          <p className="text-sm text-slate-500">Gestión y control de obras.</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {resetForm(); setView('form');}} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">+ Nuevo Parte</button>
        ) : (
          <button onClick={resetForm} className="px-4 py-2 bg-slate-100 font-bold rounded-xl">Volver</button>
        )}
      </div>

      {view === 'list' && (
        <>
          {/* PANEL DE ESTADÍSTICAS */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
              <h3 className="font-black text-slate-800">📊 Estadísticas</h3>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="text-xs font-bold p-2 rounded-lg border outline-none bg-white">
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              </select>
            </div>
            
            {/* Selector de meses (Múltiple) */}
            <div className="p-3 bg-white border-b flex gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
              <button onClick={() => toggleMonth(-1)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedMonths.includes(-1) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                Todos
              </button>
              {monthsNames.map((m, i) => (
                <button key={i} onClick={() => toggleMonth(i)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedMonths.includes(i) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {m}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 divide-x divide-y border-b">
              <div className="p-4 text-center bg-blue-50/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Partes e Importe</p>
                <p className="text-xl font-black text-slate-800">{totalImporte.toFixed(2)}€</p>
                <p className="text-xs text-slate-400 mt-1">{totalPartes} partes seleccionados</p>
              </div>
              <div className="p-4 text-center bg-indigo-50/30">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Total Terminado</p>
                <p className="text-xl font-black text-indigo-700">{totalTerminado.toFixed(2)}€</p>
                <p className="text-xs text-indigo-400/70 mt-1">Aprobados + Pagados</p>
              </div>
              <div className="p-4 text-center col-span-2 bg-emerald-50/30">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Total Cobrado (En cuenta)</p>
                <p className="text-2xl font-black text-emerald-700">{totalCobrado.toFixed(2)}€</p>
              </div>
            </div>
          </div>

          {/* LISTADO DE TRABAJOS */}
          <div className="space-y-4">
            {works.map(work => (
              <div key={work.id} className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col gap-3 relative">
                
                {/* BOTÓN EDITAR */}
                <button onClick={() => startEditing(work)} className="absolute top-4 right-4 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">
                  ✏️ Editar
                </button>

                <div className="flex justify-between items-start pr-20">
                  <div>
                    <h4 className="font-black text-slate-800">{work.client_name || 'Cliente sin nombre'}</h4>
                    <p className="text-xs text-slate-500">
                      📍 {work.client_street ? `${work.client_street} ${work.client_number || ''}, ${work.client_city || ''}` : (work.client_address || 'Sin dirección')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(work.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                  <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded-full uppercase">{work.status.replace('_', ' ')}</span>
                  <span className="text-xl font-black">{Number(work.price).toFixed(2)} €</span>
                </div>
                
                {/* BOTONES DE ACCIÓN RÁPIDA */}
                <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3 my-1">
                  <a href={work.client_phone ? `tel:${work.client_phone.replace(/[^0-9+]/g, '')}` : '#'} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${work.client_phone ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                    <span className="text-lg">📞</span> Llamar
                  </a>
                  <a href={work.client_phone ? `https://wa.me/${getWaPhone(work.client_phone)}` : '#'} target="_blank" rel="noreferrer" className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${work.client_phone ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                    <span className="text-lg">💬</span> WhatsApp
                  </a>
                  <a href={work.client_phone ? `https://t.me/+${getWaPhone(work.client_phone)}` : '#'} target="_blank" rel="noreferrer" className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${work.client_phone ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                    <span className="text-lg">✈️</span> Telegram
                  </a>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg text-sm border">
                  <p className="font-bold text-slate-700 mb-1">Partidas:</p>
                  <ul className="list-disc pl-4 text-slate-600">
                    {work.items?.map((item:any, i:number) => (
                      <li key={i}>{item.quantity}x {item.concept} - {item.price}€</li>
                    ))}
                  </ul>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-1">
                    <select className="text-xs font-bold bg-white border border-slate-300 shadow-sm p-2 rounded-lg" value={work.status} onChange={(e) => updateStatus(work.id, e.target.value)}>
                      <option value="pendiente_revision">Pendiente de Revisión</option>
                      <option value="aprobado">Aprobar (Falta pagar)</option>
                      <option value="pagado">💰 Marcar Pagado</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* FORMULARIO DE CREACIÓN / EDICIÓN */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border space-y-6 relative">
          
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2 text-indigo-700">{editingId ? '✏️ Editando Parte' : 'Nuevo Parte de Trabajo'}</h3>
            
            {isAdmin && !editingId && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setClientMode('crm')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${clientMode==='crm'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>De CRM</button>
                <button type="button" onClick={() => setClientMode('new')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${clientMode==='new'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>Nuevo / Manual</button>
              </div>
            )}

            {clientMode === 'crm' && isAdmin ? (
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-50" required>
                <option value="">Seleccionar cliente del CRM...</option>
                {crmClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div className="space-y-3">
                <datalist id="past-clients-list">
                  {freelancePastClients.map((c, i) => <option key={i} value={c.name} />)}
                </datalist>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" list="past-clients-list" placeholder="Nombre completo" value={clientName} onChange={e=>handleClientNameChange(e.target.value)} className="p-3 border rounded-xl" required />
                  <input type="tel" placeholder="Teléfono" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} className="p-3 border rounded-xl" />
                </div>
                
                {/* DIRECCIÓN DESGLOSADA */}
                <p className="text-xs font-bold text-slate-500 uppercase mt-2">Dirección del trabajo</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input type="text" placeholder="Calle / Avda" value={clientStreet} onChange={e=>setClientStreet(e.target.value)} className="p-3 border rounded-xl col-span-2" />
                  <input type="text" placeholder="Número" value={clientNumber} onChange={e=>setClientNumber(e.target.value)} className="p-3 border rounded-xl" />
                  <input type="text" placeholder="Portal" value={clientPortal} onChange={e=>setClientPortal(e.target.value)} className="p-3 border rounded-xl" />
                  <input type="text" placeholder="Piso / Puerta" value={clientFloor} onChange={e=>setClientFloor(e.target.value)} className="p-3 border rounded-xl" />
                  <input type="text" placeholder="Población" value={clientCity} onChange={e=>setClientCity(e.target.value)} className="p-3 border rounded-xl col-span-2 md:col-span-3" />
                </div>
              </div>
            )}
          </div>

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
                <input list="saved-concepts" placeholder="Concepto" value={item.concept} onChange={e=>handleItemChange(index, 'concept', e.target.value)} className="flex-1 p-2 border rounded-lg w-full" required />
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="number" min="1" placeholder="Cant." value={item.quantity} onChange={e=>handleItemChange(index, 'quantity', e.target.value)} className="w-20 p-2 border rounded-lg" required />
                  <input type="number" step="0.01" placeholder="Precio" value={item.price} onChange={e=>handleItemChange(index, 'price', e.target.value)} className="w-24 p-2 border rounded-lg" required />
                  {items.length > 1 && <button type="button" onClick={()=>removeItem(index)} className="p-2 text-red-500 bg-red-50 rounded-lg font-bold">X</button>}
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm font-bold text-indigo-600">+ Añadir otra partida</button>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2 text-rose-600">Gastos del Trabajo (Opcional)</h3>
            <input type="number" step="0.01" placeholder="Importe total gastado (Ej: Materiales)" value={expenses} onChange={e=>setExpenses(e.target.value)} className="w-full p-3 border border-rose-200 bg-rose-50 rounded-xl" />
          </div>

          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2">Notas y Archivos</h3>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Observaciones generales..." className="w-full p-3 border rounded-xl min-h-[80px]" />
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
              <input type="file" multiple accept="image/*,video/*,audio/*,.pdf" onChange={e => { if(e.target.files) setFiles(Array.from(e.target.files)) }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg shadow-md hover:bg-indigo-700 transition">
            {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Parte de Trabajo'}
          </button>
        </form>
      )}
    </div>
  );
}