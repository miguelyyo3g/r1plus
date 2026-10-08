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
  const [listTab, setListTab] = useState<'activos' | 'terminados'>('activos');
  const [showStats, setShowStats] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([-1]);

  const [clientMode, setClientMode] = useState<'crm' | 'new'>('crm');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
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

      // Ordenar por orden manual (sort_order) y luego por fecha
      let query = supabase.from('freelance_works').select('*, worker:profiles!worker_id(name)').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
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

  const startEditing = async (work: any) => {
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
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
    setFiles([]); 
    setView('form');

    // Marcar como leído al entrar
    try {
      if (isAdmin && work.unread_admin) {
        await supabase.from('freelance_works').update({ unread_admin: false }).eq('id', work.id);
        setWorks(works.map(w => w.id === work.id ? { ...w, unread_admin: false } : w));
      } else if (!isAdmin && work.unread_worker) {
        await supabase.from('freelance_works').update({ unread_worker: false }).eq('id', work.id);
        setWorks(works.map(w => w.id === work.id ? { ...w, unread_worker: false } : w));
      }
    } catch (e) {}
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

      for (const item of items) {
        if (!savedConcepts.find(c => c.name === item.concept)) {
          await supabase.from('work_concepts').insert({ organization_id: organizationId, name: item.concept, default_price: item.price });
        }
      }

      let finalClientName = clientName;
      let finalClientPhone = clientPhone;
      
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
        client_street: clientStreet,
        client_city: clientCity,
        client_number: clientNumber,
        client_portal: clientPortal,
        client_floor: clientFloor,
        title: `Parte - ${finalClientName}`,
        description,
        price: total,
        expenses: totalExpenses,
        items,
        // Si edita el admin, pita al trabajador. Si edita el trabajador, pita al admin.
        unread_admin: !isAdmin,
        unread_worker: isAdmin
      };

      let currentWorkId = editingId;

      if (editingId) {
        const { error } = await supabase.from('freelance_works').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data: newWork, error } = await supabase.from('freelance_works').insert({
          ...payload, worker_id: user.id, status: 'pendiente_revision', sort_order: works.length
        }).select().single();
        if (error) throw error;
        currentWorkId = newWork.id;
      }

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
        
        if (editingId) {
          const existing = works.find(w => w.id === editingId)?.attachments || [];
          await supabase.from('freelance_works').update({ attachments: [...existing, ...uploadedUrls] }).eq('id', currentWorkId);
        } else {
          await supabase.from('freelance_works').update({ attachments: uploadedUrls }).eq('id', currentWorkId);
        }
      }
      
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
    await supabase.from('freelance_works').update({ 
      status: newStatus,
      unread_worker: true // Avisa al trabajador del cambio de estado
    }).eq('id', workId);
    loadData();
  };

  // Función para reordenar
  const moveWork = async (index: number, direction: 'up' | 'down', list: any[]) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const newList = [...list];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Intercambiar posiciones en local
    const temp = newList[index];
    newList[index] = newList[swapIndex];
    newList[swapIndex] = temp;

    // Asignar el nuevo sort_order
    const updates = newList.map((item, i) => ({
      ...item,
      sort_order: i
    }));

    // Actualizar pantalla al instante
    setWorks(works.map(w => {
      const updated = updates.find(u => u.id === w.id);
      return updated ? updated : w;
    }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

    // Guardar en Supabase en segundo plano
    for (const update of updates) {
      await supabase.from('freelance_works').update({ sort_order: update.sort_order }).eq('id', update.id);
    }
  };

  const toggleMonth = (m: number) => {
    if (m === -1) setSelectedMonths([-1]); 
    else {
      let newM = selectedMonths.filter(x => x !== -1);
      if (newM.includes(m)) newM = newM.filter(x => x !== m);
      else newM.push(m);
      if (newM.length === 0) newM = [-1]; 
      setSelectedMonths(newM);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  if (isLoading) return <div className="p-8 text-center font-bold">Cargando...</div>;

  const getWaPhone = (phone: string) => {
    const p = phone?.replace(/[^0-9]/g, '') || '';
    return p.length === 9 ? `34${p}` : p; 
  };

  // Filtrado de listas
  const activosList = works.filter(w => w.status !== 'pagado');
  const terminadosListFull = works.filter(w => w.status === 'pagado');
  
  // Las estadísticas se calculan sobre los terminados o los del año
  const worksThisYear = works.filter(w => new Date(w.created_at).getFullYear() === selectedYear);
  const worksFiltered = worksThisYear.filter(w => selectedMonths.includes(-1) || selectedMonths.includes(new Date(w.created_at).getMonth()));

  // Lista visible en la pestaña "Terminados" (filtrada por mes y año)
  const terminadosListFiltered = terminadosListFull.filter(w => 
    new Date(w.created_at).getFullYear() === selectedYear && 
    (selectedMonths.includes(-1) || selectedMonths.includes(new Date(w.created_at).getMonth()))
  );

  const totalPartes = worksFiltered.length;
  const totalImporte = worksFiltered.reduce((sum, w) => sum + Number(w.price || 0), 0);
  const totalTerminado = worksFiltered.filter(w => w.status === 'aprobado' || w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);
  const totalCobrado = worksFiltered.filter(w => w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);
  
  const monthsNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <div className="p-2 sm:p-4 pb-28 w-full max-w-4xl mx-auto space-y-4 overflow-x-hidden">
      
      {/* Cabecera Principal */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black">🏗️ Partes</h2>
        </div>
        {view === 'list' ? (
          <button onClick={() => {resetForm(); setView('form');}} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm text-sm">+ Nuevo</button>
        ) : (
          <button onClick={resetForm} className="px-4 py-2 bg-slate-100 font-bold rounded-xl text-sm">Volver</button>
        )}
      </div>

      {view === 'list' && (
        <>
          {/* BOTÓN DESPLEGABLE DE ESTADÍSTICAS */}
          <button 
            onClick={() => setShowStats(!showStats)} 
            className="w-full bg-white p-3 rounded-2xl shadow-sm border font-bold text-slate-700 flex justify-between items-center"
          >
            <span>📊 Estadísticas y Filtros</span>
            <span>{showStats ? '🔼' : '🔽'}</span>
          </button>

          {/* PANEL DE ESTADÍSTICAS (Ocultable) */}
          {showStats && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden w-full text-sm transition-all">
              <div className="bg-slate-50 border-b p-3 flex justify-between items-center">
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="text-xs font-bold p-1.5 rounded-lg border outline-none bg-white">
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>
              
              <div className="p-2 bg-white border-b flex gap-1 overflow-x-auto w-full scrollbar-hide">
                <button onClick={() => toggleMonth(-1)} className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${selectedMonths.includes(-1) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>Todos</button>
                {monthsNames.map((m, i) => (
                  <button key={i} onClick={() => toggleMonth(i)} className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${selectedMonths.includes(i) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>{m}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 divide-x divide-y border-b w-full">
                <div className="p-3 text-center bg-blue-50/30">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Partes</p>
                  <p className="text-sm font-black text-slate-800">{totalImporte.toFixed(2)}€</p>
                </div>
                <div className="p-3 text-center bg-indigo-50/30">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Terminado</p>
                  <p className="text-sm font-black text-indigo-700">{totalTerminado.toFixed(2)}€</p>
                </div>
                <div className="p-3 text-center col-span-2 bg-emerald-50/30 rounded-b-2xl">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Total Cobrado</p>
                  <p className="text-lg font-black text-emerald-700">{totalCobrado.toFixed(2)}€</p>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑAS: EN MARCHA / TERMINADOS */}
          <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl">
            <button onClick={() => setListTab('activos')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${listTab === 'activos' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}>
              En Marcha ({activosList.length})
            </button>
            <button onClick={() => setListTab('terminados')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${listTab === 'terminados' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}>
              Terminados ({terminadosListFiltered.length})
            </button>
          </div>

          {/* LISTADO DE TRABAJOS (COMPACTO Y SIN PRECIO EXTERNO) */}
          <div className="space-y-3 w-full">
            {(listTab === 'activos' ? activosList : terminadosListFiltered).length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">No hay partes en esta carpeta.</p>
            )}

            {(listTab === 'activos' ? activosList : terminadosListFiltered).map((work, index, array) => {
              const isUnread = (isAdmin && work.unread_admin) || (!isAdmin && work.unread_worker);
              
              return (
                <div key={work.id} className={`p-3 rounded-xl shadow-sm border flex gap-2 relative w-full overflow-hidden transition-all ${isUnread ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}>
                  
                  {/* Flechas de ordenación (solo en activos) */}
                  {listTab === 'activos' && (
                    <div className="flex flex-col justify-center gap-1 border-r border-slate-100 pr-2">
                      <button onClick={() => moveWork(index, 'up', array)} disabled={index === 0} className={`p-1 rounded bg-slate-100 text-xs ${index === 0 ? 'opacity-30' : 'active:bg-slate-200'}`}>🔼</button>
                      <button onClick={() => moveWork(index, 'down', array)} disabled={index === array.length - 1} className={`p-1 rounded bg-slate-100 text-xs ${index === array.length - 1 ? 'opacity-30' : 'active:bg-slate-200'}`}>🔽</button>
                    </div>
                  )}

                  {/* Contenido Compacto */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-slate-800 text-sm truncate flex-1">{work.client_name || 'Sin nombre'}</h4>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2 flex-shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        📍 {work.client_street ? `${work.client_street} ${work.client_number || ''}` : (work.client_address || 'Sin dirección')}
                      </p>
                      
                      {/* Mostrar las Notas en vez del Precio */}
                      {work.description && (
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 italic border-l-2 border-slate-200 pl-2">
                          {work.description}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100/50">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase truncate ${isUnread ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {work.status.replace('_', ' ')}
                      </span>
                      
                      <div className="flex gap-1">
                        {work.client_phone && (
                          <>
                            <a href={`tel:${work.client_phone.replace(/[^0-9+]/g, '')}`} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs">📞</a>
                            <a href={`https://wa.me/${getWaPhone(work.client_phone)}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 text-xs">💬</a>
                          </>
                        )}
                        <button onClick={() => startEditing(work)} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold ml-1">
                          Abrir {isUnread ? '🔴' : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FORMULARIO DE CREACIÓN / EDICIÓN */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-sm border space-y-5 relative w-full">
          <h3 className="font-bold border-b pb-2 text-indigo-700">{editingId ? '✏️ Editando Parte' : 'Nuevo Parte'}</h3>
          
          <div className="space-y-3">
            {isAdmin && !editingId && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setClientMode('crm')} className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${clientMode==='crm'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>De CRM</button>
                <button type="button" onClick={() => setClientMode('new')} className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${clientMode==='new'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>Manual</button>
              </div>
            )}

            {clientMode === 'crm' && isAdmin ? (
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full p-2.5 text-sm rounded-xl border bg-slate-50" required>
                <option value="">Seleccionar del CRM...</option>
                {crmClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div className="space-y-2">
                <datalist id="past-clients-list">
                  {freelancePastClients.map((c, i) => <option key={i} value={c.name} />)}
                </datalist>
                
                <input type="text" list="past-clients-list" placeholder="Nombre completo" value={clientName} onChange={e=>handleClientNameChange(e.target.value)} className="w-full p-2.5 text-sm border rounded-xl" required />
                <input type="tel" placeholder="Teléfono" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} className="w-full p-2.5 text-sm border rounded-xl" />
                
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Dirección</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input type="text" placeholder="Calle / Avda" value={clientStreet} onChange={e=>setClientStreet(e.target.value)} className="w-full p-2.5 text-sm border rounded-xl col-span-2" />
                  <input type="text" placeholder="Núm" value={clientNumber} onChange={e=>setClientNumber(e.target.value)} className="w-full p-2.5 text-sm border rounded-xl" />
                  <input type="text" placeholder="Piso" value={clientFloor} onChange={e=>setClientFloor(e.target.value)} className="w-full p-2.5 text-sm border rounded-xl" />
                  <input type="text" placeholder="Población" value={clientCity} onChange={e=>setClientCity(e.target.value)} className="w-full p-2.5 text-sm border rounded-xl col-span-2" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-bold border-b pb-1 text-sm flex justify-between items-center">
              Partidas
              <span className="text-lg text-indigo-600 font-black">{calculateTotal().toFixed(2)} €</span>
            </h3>
            <datalist id="saved-concepts">
              {savedConcepts.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2.5 rounded-xl border w-full">
                <input list="saved-concepts" placeholder="Concepto" value={item.concept} onChange={e=>handleItemChange(index, 'concept', e.target.value)} className="flex-1 p-2 text-sm border rounded-lg w-full" required />
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="number" min="1" placeholder="Ud" value={item.quantity} onChange={e=>handleItemChange(index, 'quantity', e.target.value)} className="w-16 p-2 text-sm border rounded-lg" required />
                  <input type="number" step="0.01" placeholder="Precio" value={item.price} onChange={e=>handleItemChange(index, 'price', e.target.value)} className="w-20 p-2 text-sm border rounded-lg" required />
                  {items.length > 1 && <button type="button" onClick={()=>removeItem(index)} className="p-2 text-red-500 bg-red-50 rounded-lg text-sm">X</button>}
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600">+ Añadir partida</button>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold border-b pb-1 text-sm text-rose-600">Gastos (Opcional)</h3>
            <input type="number" step="0.01" placeholder="Importe gastado" value={expenses} onChange={e=>setExpenses(e.target.value)} className="w-full p-2.5 text-sm border border-rose-200 bg-rose-50 rounded-xl" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold border-b pb-1 text-sm">Notas e Imágenes</h3>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Observaciones..." className="w-full p-2.5 text-sm border rounded-xl min-h-[60px]" />
            <input type="file" multiple accept="image/*,video/*,audio/*,.pdf" onChange={e => { if(e.target.files) setFiles(Array.from(e.target.files)) }} className="w-full text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700" />
            
            {/* Si estamos editando un parte y tiene archivos viejos, mostramos enlace */}
            {editingId && works.find(w => w.id === editingId)?.attachments?.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-2">
                {works.find(w => w.id === editingId).attachments.map((url:string, i:number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold border">📎 Archivo {i+1}</a>
                ))}
              </div>
            )}
          </div>

          {isAdmin && editingId && (
            <div className="pt-2 border-t">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Estado del trabajo</label>
              <select className="w-full p-2.5 text-sm border rounded-xl bg-slate-50 font-bold" value={works.find(w=>w.id===editingId)?.status || 'pendiente_revision'} onChange={(e) => updateStatus(editingId, e.target.value)}>
                <option value="pendiente_revision">Pendiente de Revisión</option>
                <option value="aprobado">Aprobar (Falta pagar)</option>
                <option value="pagado">💰 Marcar Pagado (Va a Terminados)</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black shadow-md">
            {isSubmitting ? 'Guardando...' : 'Guardar Parte'}
          </button>
        </form>
      )}
    </div>
  );
}