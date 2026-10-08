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

  const [expenseWorkId, setExpenseWorkId] = useState<string | null>(null);
  const [expenseCategory, setExpenseCategory] = useState('material');
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseValue, setExpenseValue] = useState('');

  const [clientMode, setClientMode] = useState<'crm' | 'new'>('new');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  const [clientStreet, setClientStreet] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [clientPortal, setClientPortal] = useState('');
  const [clientFloor, setClientFloor] = useState('');
  const [clientCity, setClientCity] = useState('');

  const [description, setDescription] = useState('');
  const [items, setItems] = useState([{ concept: '', quantity: 1, price: 0 }]);
  const [expenseItems, setExpenseItems] = useState<any[]>([]); 
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

      let orgId = user.id;
      if (!isAdmin) {
        const { data: adminData } = await supabase.from('profiles').select('id').eq('company', myProfile?.company).eq('role', 'admin').single();
        orgId = adminData?.id || user.id;
      }

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

  const handleCrmSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const crmC = crmClients.find(c => c.id === clientId);
    if (crmC) {
      setClientName(crmC.name || '');
      setClientPhone(crmC.phone || '');
      setClientStreet(crmC.address || '');
      setClientCity('');
      setClientNumber('');
      setClientPortal('');
      setClientFloor('');
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

  const handleExpenseChange = (index: number, field: string, value: any) => {
    const newExps = [...expenseItems];
    newExps[index] = { ...newExps[index], [field]: value };
    setExpenseItems(newExps);
  };
  const addExpense = () => setExpenseItems([...expenseItems, { category: 'material', concept: '', amount: '' }]);
  const removeExpense = (index: number) => setExpenseItems(expenseItems.filter((_, i) => i !== index));
  const calculateExpensesTotal = () => expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const startEditing = async (work: any) => {
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
    setEditingId(work.id);
    
    setClientMode('new');
    if (work.client_id) {
      setSelectedClientId(work.client_id);
    }
    setClientName(work.client_name || '');
    setClientPhone(work.client_phone || '');
    setClientStreet(work.client_street || '');
    setClientNumber(work.client_number || '');
    setClientPortal(work.client_portal || '');
    setClientFloor(work.client_floor || '');
    setClientCity(work.client_city || '');
    
    setItems(work.items?.length > 0 ? work.items : [{ concept: '', quantity: 1, price: 0 }]);
    setExpenseItems(work.expenses_details || []);
    setDescription(work.description || '');
    setFiles([]); 
    setView('form');

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
    const totalExpenses = calculateExpensesTotal();

    if (items.some(i => !i.concept)) return alert('Rellena el nombre de todas las partidas.');
    if (expenseItems.some(i => !i.concept || !i.amount)) return alert('Rellena los datos de los gastos o elimínalos.');
    if (!clientName) return alert('El nombre del cliente es obligatorio.');
    
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

      const payload = {
        organization_id: organizationId,
        client_id: selectedClientId || null,
        client_name: clientName,
        client_phone: clientPhone,
        client_street: clientStreet,
        client_city: clientCity,
        client_number: clientNumber,
        client_portal: clientPortal,
        client_floor: clientFloor,
        title: `Parte - ${clientName}`,
        description,
        price: total,
        expenses: totalExpenses,
        expenses_details: expenseItems,
        items,
        unread_admin: !isAdmin,
        unread_worker: isAdmin
      };

      let currentWorkId = editingId;

      if (editingId) {
        const { error } = await supabase.from('freelance_works').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data: newWork, error } = await supabase.from('freelance_works').insert({
          ...payload, worker_id: user.id, status: 'ejecutando', sort_order: works.length
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

  const saveExpenseInline = async (work: any) => {
    if (!expenseConcept || !expenseValue) return alert('Debes poner el concepto y el importe del gasto.');
    const amount = parseFloat(expenseValue);
    if (isNaN(amount) || amount <= 0) return alert('Importe no válido.');

    const newExpenseDetail = { category: expenseCategory, concept: expenseConcept, amount: amount.toFixed(2), date: new Date().toISOString() };
    const currentDetails = work.expenses_details || [];
    const updatedDetails = [...currentDetails, newExpenseDetail];
    
    const currentTotal = parseFloat(work.expenses || '0');
    const newTotal = (currentTotal + amount).toFixed(2);

    try {
      await supabase.from('freelance_works').update({ 
        expenses: newTotal,
        expenses_details: updatedDetails
      }).eq('id', work.id);
      
      setExpenseWorkId(null);
      setExpenseConcept('');
      setExpenseValue('');
      setExpenseCategory('material');
      loadData();
    } catch (error: any) {
      alert('Error guardando gasto: ' + error.message);
    }
  };

  // NUEVA FUNCIÓN: Eliminar Parte
  const deleteWork = async (workId: string) => {
    const isConfirmed = window.confirm("⚠️ ¿Estás completamente seguro de que quieres eliminar este parte de trabajo? Esta acción no se puede deshacer y se borrarán todos los datos, partidas y gastos asociados.");
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from('freelance_works').delete().eq('id', workId);
      if (error) throw error;
      
      alert('Parte eliminado correctamente.');
      resetForm();
      loadData();
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const resetForm = () => {
    setView('list'); setEditingId(null);
    setItems([{ concept: '', quantity: 1, price: 0 }]); 
    setExpenseItems([]); 
    setFiles([]);
    setClientName(''); setClientPhone(''); setClientStreet(''); setClientCity(''); setClientNumber(''); setClientPortal(''); setClientFloor('');
    setSelectedClientId(''); setDescription('');
  };

  const updateStatus = async (workId: string, newStatus: string) => {
    await supabase.from('freelance_works').update({ 
      status: newStatus,
      unread_worker: true 
    }).eq('id', workId);
    loadData();
  };

  const moveWork = async (index: number, direction: 'up' | 'down', list: any[]) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const newList = [...list];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newList[index];
    newList[index] = newList[swapIndex];
    newList[swapIndex] = temp;

    const updates = newList.map((item, i) => ({ ...item, sort_order: i }));

    setWorks(works.map(w => {
      const updated = updates.find(u => u.id === w.id);
      return updated ? updated : w;
    }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

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
  if (isLoading) return <div className="p-8 text-center font-bold text-lg">Cargando...</div>;

  const getWaPhone = (phone: string) => {
    const p = phone?.replace(/[^0-9]/g, '') || '';
    return p.length === 9 ? `34${p}` : p; 
  };

  const activosList = works.filter(w => w.status !== 'pagado');
  const terminadosListFull = works.filter(w => w.status === 'pagado');
  
  const worksThisYear = works.filter(w => new Date(w.created_at).getFullYear() === selectedYear);
  const worksFiltered = worksThisYear.filter(w => selectedMonths.includes(-1) || selectedMonths.includes(new Date(w.created_at).getMonth()));

  const terminadosListFiltered = terminadosListFull.filter(w => 
    new Date(w.created_at).getFullYear() === selectedYear && 
    (selectedMonths.includes(-1) || selectedMonths.includes(new Date(w.created_at).getMonth()))
  );

  const totalImporte = worksFiltered.reduce((sum, w) => sum + Number(w.price || 0), 0);
  const totalGastos = worksFiltered.reduce((sum, w) => sum + Number(w.expenses || 0), 0);
  const totalTerminado = worksFiltered.filter(w => w.status === 'aprobado' || w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);
  const totalCobrado = worksFiltered.filter(w => w.status === 'pagado').reduce((sum, w) => sum + Number(w.price || 0), 0);

  let gastosGasolina = 0;
  let gastosComida = 0;
  let gastosMaterial = 0;

  worksFiltered.forEach(w => {
    if (w.expenses_details) {
      w.expenses_details.forEach((exp: any) => {
        const amt = Number(exp.amount) || 0;
        if (exp.category === 'gasolina') gastosGasolina += amt;
        else if (exp.category === 'comida') gastosComida += amt;
        else if (exp.category === 'material') gastosMaterial += amt;
        else gastosMaterial += amt; 
      });
    }
  });
  
  const monthsNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <div className="p-2 sm:p-4 pb-28 w-full max-w-4xl mx-auto space-y-4 overflow-x-hidden">
      
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800">🏗️ Partes</h2>
        </div>
        {view === 'list' ? (
          <button onClick={() => {resetForm(); setView('form');}} className="px-5 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-sm text-sm">+ Nuevo Parte</button>
        ) : (
          <button onClick={resetForm} className="px-5 py-3 bg-slate-100 font-bold rounded-xl text-sm">Volver</button>
        )}
      </div>

      {view === 'list' && (
        <>
          <button onClick={() => setShowStats(!showStats)} className="w-full bg-white p-4 rounded-2xl shadow-sm border font-black text-slate-700 flex justify-between items-center text-base">
            <span>📊 Estadísticas y Filtros</span>
            <span>{showStats ? '🔼' : '🔽'}</span>
          </button>

          {showStats && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden w-full text-base transition-all">
              <div className="bg-slate-50 border-b p-3 flex justify-between items-center">
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="text-sm font-bold p-2 rounded-lg border outline-none bg-white">
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>
              
              <div className="p-3 bg-white border-b flex gap-2 overflow-x-auto w-full scrollbar-hide">
                <button onClick={() => toggleMonth(-1)} className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-colors ${selectedMonths.includes(-1) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>Todos</button>
                {monthsNames.map((m, i) => (
                  <button key={i} onClick={() => toggleMonth(i)} className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-colors ${selectedMonths.includes(i) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>{m}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 divide-x divide-y border-b w-full">
                <div className="p-4 text-center bg-blue-50/30">
                  <p className="text-xs font-bold text-slate-500 uppercase">Partes</p>
                  <p className="text-lg font-black text-slate-800">{totalImporte.toFixed(2)}€</p>
                </div>
                <div className="p-4 text-center bg-rose-50/30">
                  <p className="text-xs font-bold text-rose-400 uppercase">Gastos Extra</p>
                  <p className="text-lg font-black text-rose-600">-{totalGastos.toFixed(2)}€</p>
                </div>
                <div className="p-4 text-center bg-indigo-50/30">
                  <p className="text-xs font-bold text-indigo-400 uppercase">Terminado</p>
                  <p className="text-lg font-black text-indigo-700">{totalTerminado.toFixed(2)}€</p>
                </div>
                <div className="p-4 text-center col-span-2 bg-emerald-50/30 rounded-b-2xl">
                  <p className="text-xs font-bold text-emerald-500 uppercase">Total Cobrado</p>
                  <p className="text-2xl font-black text-emerald-700">{totalCobrado.toFixed(2)}€</p>
                </div>
              </div>

              <div className="bg-rose-50/40 p-4 border-t w-full">
                <p className="text-xs font-bold text-rose-500 uppercase mb-2 text-center">Desglose de Gastos (-{totalGastos.toFixed(2)}€)</p>
                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-rose-200">
                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase">⛽ Gasolina</p>
                    <p className="text-sm font-black text-rose-700">{gastosGasolina.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase">🍔 Comida</p>
                    <p className="text-sm font-black text-rose-700">{gastosComida.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase">📦 Material</p>
                    <p className="text-sm font-black text-rose-700">{gastosMaterial.toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 bg-slate-200/50 p-2 rounded-xl">
            <button onClick={() => setListTab('activos')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${listTab === 'activos' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}>
              En Marcha ({activosList.length})
            </button>
            <button onClick={() => setListTab('terminados')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${listTab === 'terminados' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}>
              Terminados ({terminadosListFiltered.length})
            </button>
          </div>

          <div className="space-y-4 w-full">
            {(listTab === 'activos' ? activosList : terminadosListFiltered).length === 0 && (
              <p className="text-center text-slate-500 font-medium text-base py-6">No hay partes en esta carpeta.</p>
            )}

            {(listTab === 'activos' ? activosList : terminadosListFiltered).map((work, index, array) => {
              const isUnread = (isAdmin && work.unread_admin) || (!isAdmin && work.unread_worker);
              
              let mapUrl = '#';
              if (work.client_street) {
                const queryStr = work.client_street + ' ' + (work.client_number || '') + ', ' + (work.client_city || '');
                mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(queryStr);
              } else if (work.client_address) {
                mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(work.client_address);
              }
              
              return (
                <div key={work.id} className={`p-4 rounded-2xl shadow-sm border flex flex-col gap-3 relative w-full overflow-hidden transition-all ${isUnread ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}>
                  
                  <div className="flex justify-between items-start w-full gap-3">
                    {listTab === 'activos' && (
                      <div className="flex flex-col justify-center gap-1">
                        <button onClick={() => moveWork(index, 'up', array)} disabled={index === 0} className={`w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-sm ${index === 0 ? 'opacity-30' : 'active:bg-slate-200'}`}>🔼</button>
                        <button onClick={() => moveWork(index, 'down', array)} disabled={index === array.length - 1} className={`w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-sm ${index === array.length - 1 ? 'opacity-30' : 'active:bg-slate-200'}`}>🔽</button>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-slate-800 text-base sm:text-lg leading-tight flex-1">{work.client_name || 'Sin nombre'}</h4>
                        {isUnread && <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse ml-2 flex-shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        📍 {work.client_street ? `${work.client_street} ${work.client_number || ''}` : (work.client_address || 'Sin dirección')}
                      </p>
                    </div>
                  </div>

                  {work.description && (
                    <p className="text-sm text-slate-700 mt-1 line-clamp-3 italic border-l-4 border-indigo-200 pl-3 bg-indigo-50/50 py-1">
                      {work.description}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 pt-3 border-t border-slate-100 gap-3">
                    
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl uppercase self-start ${isUnread ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {work.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                      <a href={mapUrl} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-base shadow-sm">🗺️</a>
                      {work.client_phone && (
                        <>
                          <a href={`tel:${work.client_phone.replace(/[^0-9+]/g, '')}`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-base shadow-sm">📞</a>
                          <a href={`https://wa.me/${getWaPhone(work.client_phone)}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-50 text-green-600 text-base shadow-sm">💬</a>
                        </>
                      )}
                      
                      <button onClick={() => { setExpenseWorkId(work.id); setExpenseConcept(''); setExpenseValue(''); setExpenseCategory('material'); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-100 text-rose-600 text-sm font-black shadow-sm">
                        +🔴
                      </button>
                      <button onClick={() => startEditing(work)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-black shadow-sm flex-1 sm:flex-none">
                        Abrir {isUnread ? '🔴' : ''}
                      </button>
                    </div>
                  </div>

                  {expenseWorkId === work.id && (
                    <div className="mt-3 p-4 bg-rose-50 border border-rose-200 rounded-xl w-full flex flex-col gap-3">
                      <p className="text-sm font-black text-rose-700">Añadir Gasto Rápido</p>
                      <div className="flex gap-2">
                        <select value={expenseCategory} onChange={e=>setExpenseCategory(e.target.value)} className="p-3 text-sm font-bold rounded-lg border border-rose-200 outline-none bg-white w-1/3">
                          <option value="material">📦 Material</option>
                          <option value="gasolina">⛽ Gasolina</option>
                          <option value="comida">🍔 Comida</option>
                        </select>
                        <input type="text" value={expenseConcept} onChange={e => setExpenseConcept(e.target.value)} placeholder="Concepto" className="w-2/3 p-3 text-sm font-medium rounded-lg border border-rose-200 outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <input type="number" step="0.01" value={expenseValue} onChange={e => setExpenseValue(e.target.value)} placeholder="Importe (€)" className="w-1/2 p-3 text-base font-black rounded-lg border border-rose-200 outline-none text-rose-700" />
                        <button onClick={() => saveExpenseInline(work)} className="w-1/4 bg-rose-600 text-white font-black rounded-lg text-sm shadow-sm hover:bg-rose-700">OK</button>
                        <button onClick={() => setExpenseWorkId(null)} className="w-1/4 bg-slate-200 text-slate-700 font-black rounded-lg text-sm hover:bg-slate-300">X</button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FORMULARIO DE EDICIÓN / CREACIÓN */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border space-y-6 relative w-full">
          <h3 className="font-black text-lg border-b pb-3 text-indigo-700">{editingId ? '✏️ Editando Parte' : 'Nuevo Parte'}</h3>
          
          <div className="space-y-4">
            {isAdmin && !editingId && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setClientMode('crm')} className={`flex-1 py-3 rounded-xl font-black text-sm ${clientMode==='crm'?'bg-indigo-100 text-indigo-700 shadow-sm':'bg-slate-100 text-slate-600'}`}>De CRM</button>
                <button type="button" onClick={() => setClientMode('new')} className={`flex-1 py-3 rounded-xl font-black text-sm ${clientMode==='new'?'bg-indigo-100 text-indigo-700 shadow-sm':'bg-slate-100 text-slate-600'}`}>Manual</button>
              </div>
            )}

            {clientMode === 'crm' && isAdmin ? (
              <select value={selectedClientId} onChange={e => handleCrmSelect(e.target.value)} className="w-full p-3 text-base rounded-xl border bg-slate-50 font-medium" required>
                <option value="">Seleccionar del CRM...</option>
                {crmClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : null}

            <div className="space-y-3">
              <datalist id="past-clients-list">
                {freelancePastClients.map((c, i) => <option key={i} value={c.name} />)}
              </datalist>
              
              <input type="text" list="past-clients-list" placeholder="Nombre completo" value={clientName} onChange={e=>handleClientNameChange(e.target.value)} className="w-full p-3 text-base border rounded-xl font-bold" required />
              <input type="tel" placeholder="Teléfono" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} className="w-full p-3 text-base border rounded-xl font-medium" />
              
              <p className="text-xs font-bold text-slate-500 uppercase mt-3">Dirección del Trabajo</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input type="text" placeholder="Calle / Avda" value={clientStreet} onChange={e=>setClientStreet(e.target.value)} className="w-full p-3 text-sm border rounded-xl col-span-2 font-medium" />
                <input type="text" placeholder="Núm" value={clientNumber} onChange={e=>setClientNumber(e.target.value)} className="w-full p-3 text-sm border rounded-xl font-medium" />
                <input type="text" placeholder="Piso" value={clientFloor} onChange={e=>setClientFloor(e.target.value)} className="w-full p-3 text-sm border rounded-xl font-medium" />
                <input type="text" placeholder="Población" value={clientCity} onChange={e=>setClientCity(e.target.value)} className="w-full p-3 text-sm border rounded-xl col-span-2 font-medium" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2 text-base flex justify-between items-center text-emerald-700">
              Partidas a Cobrar
              <span className="text-xl text-emerald-600 font-black">+{calculateTotal().toFixed(2)} €</span>
            </h3>
            <datalist id="saved-concepts">
              {savedConcepts.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100 w-full">
                <input list="saved-concepts" placeholder="Concepto del trabajo" value={item.concept} onChange={e=>handleItemChange(index, 'concept', e.target.value)} className="flex-1 p-3 text-sm border border-emerald-200 rounded-lg w-full font-bold" required />
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="number" min="1" placeholder="Uds" value={item.quantity} onChange={e=>handleItemChange(index, 'quantity', e.target.value)} className="w-20 p-3 text-base font-black border border-emerald-200 rounded-lg text-center" required />
                  <input type="number" step="0.01" placeholder="Precio" value={item.price} onChange={e=>handleItemChange(index, 'price', e.target.value)} className="w-24 p-3 text-base font-black border border-emerald-200 rounded-lg text-center" required />
                  {items.length > 1 && <button type="button" onClick={()=>removeItem(index)} className="w-12 bg-red-100 text-red-600 rounded-lg text-lg font-black flex items-center justify-center">X</button>}
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm font-black text-emerald-700 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg inline-block mt-2">+ Añadir otra partida</button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-3 mt-4">
            <h3 className="font-bold text-base">Notas e Imágenes</h3>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Observaciones generales para la empresa..." className="w-full p-3 text-base font-medium border rounded-xl min-h-[100px]" />
            <input type="file" multiple accept="image/*,video/*,audio/*,.pdf" onChange={e => { if(e.target.files) setFiles(Array.from(e.target.files)) }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-bold" />
            
            {(editingId && (works.find(w => w.id === editingId)?.attachments?.length || 0) > 0) && (
              <div className="flex gap-2 flex-wrap pt-3 border-t">
                {works.find(w => w.id === editingId)?.attachments.map((url:string, i:number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold border border-slate-300">📎 Archivo Subido {i+1}</a>
                ))}
              </div>
            )}
          </div>

          {isAdmin && editingId && (
            <div className="pt-4 border-t border-slate-200">
              <label className="text-sm font-bold text-slate-600 uppercase mb-2 block">Estado Oficial del Trabajo</label>
              <select className="w-full p-4 text-base border-2 border-indigo-200 rounded-xl bg-indigo-50 font-black text-indigo-800 outline-none" value={works.find(w=>w.id===editingId)?.status || 'ejecutando'} onChange={(e) => updateStatus(editingId as string, e.target.value)}>
                <option value="ejecutando">🏗️ Ejecutando (En Marcha)</option>
                <option value="aprobado">✅ Aprobar (Falta pagar)</option>
                <option value="pagado">💰 Marcar Pagado (Mover a Terminados)</option>
              </select>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-slate-200 mt-6">
            <h3 className="font-bold text-base flex justify-between items-center text-rose-600">
              Gastos Registrados
              <span className="text-xl text-rose-600 font-black">-{calculateExpensesTotal().toFixed(2)} €</span>
            </h3>
            {expenseItems.length === 0 && (
              <p className="text-sm text-slate-400 italic">No hay gastos reportados.</p>
            )}
            {expenseItems.map((exp, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100 w-full">
                <select value={exp.category || 'material'} onChange={e=>handleExpenseChange(index, 'category', e.target.value)} className="w-full sm:w-1/3 p-3 text-sm font-bold border border-rose-200 rounded-lg bg-white">
                  <option value="material">📦 Material</option>
                  <option value="gasolina">⛽ Gasolina</option>
                  <option value="comida">🍔 Comida</option>
                </select>
                <input placeholder="Concepto (Ej: Repuestos, Menú...)" value={exp.concept} onChange={e=>handleExpenseChange(index, 'concept', e.target.value)} className="flex-1 p-3 text-sm border border-rose-200 rounded-lg w-full font-bold" required />
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="number" step="0.01" placeholder="Importe" value={exp.amount} onChange={e=>handleExpenseChange(index, 'amount', e.target.value)} className="w-24 p-3 text-base font-black border border-rose-200 rounded-lg text-center text-rose-700" required />
                  <button type="button" onClick={()=>removeExpense(index)} className="w-12 bg-red-100 text-red-600 rounded-lg text-lg font-black flex items-center justify-center">X</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addExpense} className="text-sm font-black text-rose-600 px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg inline-block mt-2">+ Añadir gasto desde ficha</button>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-6 bg-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
            {isSubmitting ? 'Guardando información...' : 'Guardar y Cerrar Parte'}
          </button>

          {/* BOTÓN DE ELIMINAR PARTE (SOLO ADMINS EN MODO EDICIÓN) */}
          {isAdmin && editingId && (
            <button type="button" onClick={() => deleteWork(editingId)} className="w-full py-3 mt-2 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition-all">
              🗑️ Eliminar Parte de Trabajo Definitivamente
            </button>
          )}

        </form>
      )}
    </div>
  );
}