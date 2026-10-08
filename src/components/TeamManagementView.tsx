'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TeamManagementView() {
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [managerPlan, setManagerPlan] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Obtenemos el perfil del gerente para saber su plan
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('plan, company')
        .eq('id', user.id)
        .single();

      if (myProfile) {
        setManagerPlan(myProfile.plan);
        
        // 2. Buscamos a los comerciales que pertenecen a la empresa de este gerente
        // NOTA: Asumimos que los comerciales tienen el mismo nombre de 'company' 
        // o un campo que los vincule al gerente.
        const { data: commercials, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'sales_rep')
          .eq('company', myProfile.company); // Vinculación por empresa

        if (error) throw error;
        if (commercials) setTeam(commercials);
      }
    } catch (error) {
      console.error('Error cargando el equipo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función que actualiza el JSON de módulos en Supabase al hacer clic
  const handleToggleModule = async (commercialId: string, currentModules: any, moduleName: string) => {
    // Aseguramos que currentModules sea un objeto válido
    const safeModules = currentModules || {
      crm_visitas: false, control_rutas: false, obras_autonomos: false, mediciones_proyectos: false
    };

    const updatedModules = {
      ...safeModules,
      [moduleName]: !safeModules[moduleName] // Invertimos el valor (true a false o viceversa)
    };

    // 1. Actualizamos la interfaz inmediatamente (Optimistic UI)
    setTeam(prevTeam => prevTeam.map(member => 
      member.id === commercialId ? { ...member, active_modules: updatedModules } : member
    ));

    // 2. Guardamos silenciosamente en Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ active_modules: updatedModules })
      .eq('id', commercialId);

    if (error) {
      alert('Error al guardar el módulo. Revisa tu conexión.');
      fetchTeam(); // Recargamos si falla
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">Cargando equipo...</div>;

  if (managerPlan !== 'empresa_pro' && managerPlan !== 'superadmin') {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-100 m-6">
        <h2 className="text-xl font-black text-rose-800 mb-2">Plan Insuficiente</h2>
        <p className="text-rose-600 font-medium">Necesitas el <strong>Plan Empresa PRO</strong> para gestionar comerciales y activarles módulos a la carta.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800">👥 Gestión de Comerciales y Autónomos</h2>
        <p className="text-sm text-slate-500 mt-1">Activa o desactiva las herramientas a las que tiene acceso tu personal de calle.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold">
            Aún no tienes comerciales vinculados a tu empresa.
          </div>
        ) : (
          team.map(member => {
            const mods = member.active_modules || {};
            
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-black text-lg text-slate-800 truncate">{member.name || 'Sin nombre'}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">📞 {member.phone || 'Sin teléfono'}</p>
                </div>
                
                <div className="p-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Módulos de la App Móvil</h4>
                  
                  {/* Toggles de Módulos */}
                  <ModuleToggle 
                    label="CRM y Visitas" icon="🤝" 
                    isActive={mods.crm_visitas} 
                    onClick={() => handleToggleModule(member.id, mods, 'crm_visitas')} 
                  />
                  <ModuleToggle 
                    label="Control de Rutas" icon="📍" 
                    isActive={mods.control_rutas} 
                    onClick={() => handleToggleModule(member.id, mods, 'control_rutas')} 
                  />
                  <ModuleToggle 
                    label="Obras de Autónomos" icon="🏗️" 
                    isActive={mods.obras_autonomos} 
                    onClick={() => handleToggleModule(member.id, mods, 'obras_autonomos')} 
                  />
                  <ModuleToggle 
                    label="Presupuestos y Facturas" icon="💶" 
                    isActive={mods.presupuestos_facturas} 
                    onClick={() => handleToggleModule(member.id, mods, 'presupuestos_facturas')} 
                  />
                  <ModuleToggle 
                    label="Mediciones (Proyectos)" icon="📏" 
                    isActive={mods.mediciones_proyectos} 
                    onClick={() => handleToggleModule(member.id, mods, 'mediciones_proyectos')} 
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Sub-componente visual para el interruptor (Toggle)
function ModuleToggle({ label, icon, isActive, onClick }: { label: string, icon: string, isActive: boolean, onClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-100" onClick={onClick}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}