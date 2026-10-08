'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function FreelanceWorksView({ user }: { user: any }) {
  const [works, setWorks] = useState<any[]>([]);
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [savedConcepts, setSavedConcepts] = useState<any[]>([]);
  const [freelancePastClients, setFreelancePastClients] = useState<any[]>([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new'>('list');
  const [profile, setProfile] = useState<any>(null);

  // Estados de Estadísticas
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Estados del Formulario Avanzado
  const [clientMode, setClientMode] = useState<'crm' | 'new'>('crm');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [description, setDescription] = useState('');
  const [expenses, setExpenses] = useState(''); // <-- NUEVO: Gastos
  
  // Partidas y Archivos
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
        const past = worksData.filter(w => w.client_name).map(w => ({ name: w.client_name, phone: w.client_phone, address: w.client_address }));
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
      if (found.address) setClientAddress(found.address);
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

  const uploadFiles = async (workId: string) => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${workId}_${Date.now()}.${fileExt}`;
      const { data } = await supabase.storage.from('work_attachments').upload(fileName, file);
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
      let finalClientAddress = clientAddress;
      
      if (clientMode === 'crm' && isAdmin) {
        const crmC = crmClients.find(c => c.id === selectedClientId);
        finalClientName = crmC?.name || '';
        finalClientPhone = crmC?.phone || '';
        finalClientAddress = crmC?.address || '';
      }

      const { data: newWork, error } = await supabase.from('freelance_works').insert({
        organization_id: organizationId,
        worker_id: user.id,
        client_id: clientMode === 'crm' && isAdmin ? selectedClientId : null,
        client_name: finalClientName,
        client_phone: finalClientPhone,
        client_address: finalClientAddress,
        title: `Parte - ${finalClientName}`,
        description,
        price: total,
        expenses: totalExpenses, // <-- Guardamos los gastos
        items,
        status: 'pendiente_revision'
      }).select().single();

      if (error) throw error;

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
    setClientName(''); setClientPhone(''); setClientAddress(''); setSelectedClientId(''); setDescription(''); setExpenses('');
  };

  const updateStatus = async (workId: string, newStatus: string) => {
    await supabase.from('freelance_works').update({ status: newStatus }).eq('id', workId);
    loadData();
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  if (isLoading) return <div className="p-8 text-center font-bold">Cargando...</div>;

  const getCleanPhone = (phone: string) => phone ? phone.replace(/[^0-9+]/g, '') : '';
  const getWaPhone = (phone: string) => {
    const p = phone.replace(/[^0-9]/g, '');
    return p.length === 9 ? `34${p}` : p; 
  };

  // ================= CÁLCULO DE ESTADÍSTICAS =================
  const worksThisYear = works.filter(w => new Date(w.created_at).getFullYear() === selectedYear);
  const worksThisMonth = worksThisYear.filter(w => new Date(w.created_at).getMonth() === selectedMonth);

  const calculateStats = (data: any[]) => {
    const totalPartes = data.length;
    const totalImporte = data.reduce((sum, w) => sum + Number(w.price || 0), 0);
    const totalGastos = data.reduce((sum, w) => sum + Number(w.expenses || 0), 0);
    const totalTerminado = data.filter(w => w.status === 'aprobado' || w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);
    const totalCobrado = data.filter(w => w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);
    const beneficio = totalImporte - totalGastos;
    return { totalPartes, totalImporte, totalGastos, totalTerminado, totalCobrado, beneficio };
  };

  const statsYear = calculateStats(worksThisYear);
  const statsMonth = calculateStats(worksThisMonth);
  const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto space-y-6">
      
      {/* Cabecera Principal */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">🏗️ Partes de Trabajo</h2>
          <p className="text-sm text-slate-500">Gestión y control de obras.</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => setView('new')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">+ Nuevo Parte</button>
        ) : (
          <button onClick={() => setView('list')} className="px-4 py-2 bg-slate-100 font-bold rounded-xl">Volver</button>
        )}
      </div>

      {view === 'list' && (
        <>
          {/* PANEL DE ESTADÍSTICAS */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
              <h3 className="font-black text-slate-800">📊 Estadísticas</h3>
              <div className="flex gap-2">
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="text-xs font-bold p-2 rounded-lg border outline-none bg-white">
                  {monthsNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="text-xs font-bold p-2 rounded-lg border outline-none bg-white">
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-b">
              {/* Bloque Mes */}
              <div className="p-4 text-center bg-blue-50/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Mes: Importe Total</p>
                <p className="text-xl font-black text-slate-800">{statsMonth.totalImporte.toFixed(2)}€</p>
                <p className="text-xs text-slate-400 mt-1">{statsMonth.totalPartes} partes</p>
              </div>
              <div className="p-4 text-center bg-blue-50/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Mes: Gastos</p>
                <p className="text-xl font-black text-rose-600">-{statsMonth.totalGastos.toFixed(2)}€</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">Limpio: {statsMonth.beneficio.toFixed(2)}€</p>
              </div>
              
              {/* Bloque Año */}
              <div className="p-4 text-center bg-indigo-50/30">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Año: Terminado</p>
                <p className="text-xl font-black text-indigo-700">{statsYear.totalTerminado.toFixed(2)}€</p>
                <p className="text-xs text-slate-400 mt-1">Aprobados y Pagados</p>
              </div>
              <div className="p-4 text-center bg-emerald-50/30">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Año: Cobrado</p>
                <p className="text-xl font-black text-emerald-700">{statsYear.totalCobrado.toFixed(2)}€</p>
                <p className="text-xs text-emerald-600/70 mt-1">Dinero en cuenta</p>
              </div>
            </div>
          </div>

          {/* LISTADO DE TRABAJOS */}
          <div className="space-y-4">
            {works.map(work => (
              <div key={work.id} className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-800">{work.client_name || 'Cliente sin nombre'}</h4>
                    {work.client_address && <p className="text-xs text-slate-500">📍 {work.client_address}</p>}
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(work.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black">{Number(work.price).toFixed(2)} €</span>
                    <div className="mt-1">
                      <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded-full uppercase">{work.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                {/* BOTONES DE ACCIÓN RÁPIDA */}
                <div className="grid grid-cols-4 gap-2 border-y border-slate-100 py-3 my-1">
                  <a href={work.client_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(work.client_address)}` : '#'} target="_blank" rel="noreferrer" className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${work.client_address ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                    <span className="text-lg">🗺️</span> Ir
                  </a>
                  <a href={work.client_phone ? `tel:${getCleanPhone(work.client_phone)}` : '#'} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${work.client_phone ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                    <span className="text-lg">📞</span> Llamar
                  </a>
                  <a href={work.client_phone ? `https://wa.me/${getWaPhone(work.client_phone)}` : '#'} target="_blank" rel="noreferrer" className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${work.client_phone ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                    <span className="text-lg">💬</span> WhatsApp
                  </a>
                  <a href={work.client_phone ? `https://t.me/+${getWaPhone(work.client_phone)}` : '#'} target="_blank" rel="noreferrer" className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${work.client_phone ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                    <span className="text-lg">✈️</span> Telegram
                  </a>
                </div>
                
                {/* Resumen de Partidas y Gastos */}
                <div className="bg-slate-50 p-3 rounded-lg text-sm border">
                  <p className="font-bold text-slate-700 mb-1">Partidas:</p>
                  <ul className="list-disc pl-4 text-slate-600">
                    {work.items?.map((item:any, i:number) => (
                      <li key={i}>{item.quantity}x {item.concept} - {item.price}€</li>
                    ))}
                  </ul>
                  {work.expenses > 0 && (
                    <p className="mt-2 text-xs font-bold text-rose-600 border-t border-slate-200 pt-2">Gastos reportados: -{Number(work.expenses).toFixed(2)}€</p>
                  )}
                  {work.description && (
                    <p className="mt-2 text-xs text-slate-500 italic border-t border-slate-200 pt-2">"{work.description}"</p>
                  )}
                </div>

                {work.attachments?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {work.attachments.map((url:string, i:number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold border border-indigo-100">📎 Ver Archivo {i+1}</a>
                    ))}
                  </div>
                )}

                {isAdmin && work.status !== 'pagado' && (
                  <div className="flex justify-end border-t pt-3 mt-1">
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

      {/* FORMULARIO DE CREACIÓN */}
      {view === 'new' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
          
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2">Datos del Cliente</h3>
            {isAdmin && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setClientMode('crm')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${clientMode==='crm'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>De CRM</button>
                <button type="button" onClick={() => setClientMode('new')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${clientMode==='new'?'bg-indigo-100 text-indigo-700':'bg-slate-100'}`}>Nuevo / Manual</button>
              </div>
            )}
            {clientMode === 'crm' && isAdmin ? (
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-50" required>
                <option value="">Seleccionar cliente del CRM...</option>
                {crmClients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.address}</option>)}
              </select>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <datalist id="past-clients-list">
                  {freelancePastClients.map((c, i) => <option key={i} value={c.name} />)}
                </datalist>
                <input type="text" list="past-clients-list" placeholder="Nombre completo" value={clientName} onChange={e=>handleClientNameChange(e.target.value)} className="p-3 border rounded-xl" required />
                <input type="tel" placeholder="Teléfono" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} className="p-3 border rounded-xl" />
                <input type="text" placeholder="Dirección completa (Para el mapa)" value={clientAddress} onChange={e=>setClientAddress(e.target.value)} className="p-3 border rounded-xl md:col-span-2" />
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

          {/* NUEVA SECCIÓN: GASTOS */}
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2 text-rose-600">Gastos del Trabajo (Opcional)</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Importe total gastado (€)</label>
              <input type="number" step="0.01" placeholder="Ej: Materiales, gasolina, peajes..." value={expenses} onChange={e=>setExpenses(e.target.value)} className="w-full p-3 border border-rose-200 bg-rose-50 rounded-xl outline-none focus:border-rose-400" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2">Notas y Archivos</h3>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Observaciones generales..." className="w-full p-3 border rounded-xl min-h-[80px]" />
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
              <input type="file" multiple accept="image/*,video/*,audio/*,.pdf" onChange={e => { if(e.target.files) setFiles(Array.from(e.target.files)) }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg">
            {isSubmitting ? 'Guardando...' : 'Guardar Parte de Trabajo'}
          </button>
        </form>
      )}
    </div>
  );
}