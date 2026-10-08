'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function FreelanceWorksView({ user }: { user: any }) {
  const [works, setWorks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]); // Lista de comerciales para el gerente
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new'>('list');
  const [profile, setProfile] = useState<any>(null);

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(''); // Para que el gerente elija
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

      let query = supabase.from('freelance_works').select('*, worker:profiles!worker_id(name)').order('created_at', { ascending: false });
      
      if (!isAdmin) {
        // El autónomo solo ve los suyos
        query = query.eq('worker_id', user.id);
      } else {
        // El gerente ve los de su organización
        query = query.eq('organization_id', user.id);
        
        // Cargamos los operarios de la empresa para que el gerente pueda seleccionarlos al crear un parte
        const { data: teamData } = await supabase.from('profiles')
          .select('id, name')
          .eq('company', myProfile?.company)
          .eq('role', 'sales_rep');
        
        if (teamData) setTeam(teamData);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setWorks(data);

    } catch (error) {
      console.error('Error cargando partes de trabajo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

    if (!title || !price) return alert('El título y el precio son obligatorios');
    if (isAdmin && !selectedWorker) return alert('Debes seleccionar a qué operario pertenece este parte');
    
    setIsSubmitting(true);

    try {
      let organizationId = user.id;
      let workerId = user.id;

      if (isAdmin) {
        // Si lo crea el gerente, asigna el ID del operario seleccionado
        organizationId = user.id; 
        workerId = selectedWorker; 
      } else {
        // Si lo crea el autónomo, busca el ID de su jefe
        workerId = user.id;
        const { data: adminData } = await supabase.from('profiles')
          .select('id')
          .eq('company', profile?.company)
          .eq('role', 'admin')
          .single();
        organizationId = adminData?.id || user.id;
      }

      const { error } = await supabase.from('freelance_works').insert({
        organization_id: organizationId,
        worker_id: workerId,
        title,
        description,
        price: parseFloat(price),
        status: 'pendiente_revision'
      });

      if (error) throw error;
      
      alert('Parte de trabajo registrado con éxito');
      setTitle(''); setDescription(''); setPrice(''); setSelectedWorker('');
      setView('list');
      loadData();
    } catch (error: any) {
      alert('Error al enviar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (workId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('freelance_works').update({ status: newStatus }).eq('id', workId);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const totalPagado = works.filter(w => w.status === 'pagado').reduce((acc, curr) => acc + Number(curr.price), 0);
  const totalPendiente = works.filter(w => w.status !== 'pagado').reduce((acc, curr) => acc + Number(curr.price), 0);

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">Cargando partes de obra...</div>;

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">🏗️ Partes de Trabajo</h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de obras, instalaciones y facturación.</p>
        </div>
        {view === 'list' && (
          <button onClick={() => setView('new')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700">
            + Nuevo Parte
          </button>
        )}
        {view === 'new' && (
          <button onClick={() => setView('list')} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">
            Volver
          </button>
        )}
      </div>

      {view === 'new' ? (
        /* FORMULARIO DE NUEVO PARTE */
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <h3 className="font-bold text-slate-700 border-b pb-2">Registrar trabajo realizado</h3>
          
          {/* Si es gerente, le mostramos el desplegable para elegir operario */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asignar a Operario / Autónomo</label>
              <select 
                value={selectedWorker} 
                onChange={e => setSelectedWorker(e.target.value)} 
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-medium bg-slate-50" 
                required
              >
                <option value="">-- Selecciona quién hizo el trabajo --</option>
                {team.map(t => (
                  <option key={t.id} value={t.id}>{t.name || 'Sin nombre'}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título / Concepto</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Instalación de Pérgola" className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-medium" required />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Pactado (€)</label>
            <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ej: 350.00" className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-black text-lg text-indigo-700" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción / Detalles</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Materiales usados, horas, incidencias..." className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-medium min-h-[100px]" />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
            {isSubmitting ? 'Guardando...' : isAdmin ? 'Guardar Parte de Trabajo' : 'Enviar Parte para Revisión'}
          </button>
        </form>
      ) : (
        /* LISTADO DE TRABAJOS */
        <div className="space-y-4">
          
          {/* Tarjetas de totales para el Gerente */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase">Pendiente de Pago</p>
                <p className="text-2xl font-black text-amber-900">{totalPendiente.toFixed(2)} €</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase">Total Pagado</p>
                <p className="text-2xl font-black text-emerald-900">{totalPagado.toFixed(2)} €</p>
              </div>
            </div>
          )}

          {works.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold">
              No hay partes de trabajo registrados aún.
            </div>
          ) : (
            works.map(work => (
              <div key={work.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-slate-800 text-lg">{work.title}</h4>
                  {isAdmin && <p className="text-xs font-bold text-indigo-600 mt-0.5">👤 Operario: {work.worker?.name || 'Desconocido'}</p>}
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{work.description}</p>
                  <p className="text-xs text-slate-400 mt-2 font-mono">📅 {new Date(work.created_at).toLocaleDateString()}</p>
                </div>
                
                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-2xl font-black text-slate-800">{Number(work.price).toFixed(2)} €</span>
                  
                  <div className="flex gap-2 items-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      work.status === 'pagado' ? 'bg-emerald-100 text-emerald-700' :
                      work.status === 'aprobado' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {work.status.replace('_', ' ')}
                    </span>
                    
                    {/* Botones de acción para el Gerente */}
                    {isAdmin && work.status !== 'pagado' && (
                      <select 
                        className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 outline-none"
                        value={work.status}
                        onChange={(e) => updateStatus(work.id, e.target.value)}
                      >
                        <option value="pendiente_revision">Pendiente</option>
                        <option value="aprobado">Aprobar</option>
                        <option value="pagado">Marcar Pagado</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}