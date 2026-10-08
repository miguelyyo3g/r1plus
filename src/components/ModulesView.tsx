'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ModulesViewProps {
  onOpenModule: (view: string) => void;
}

export default function ModulesView({ onOpenModule }: ModulesViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">Cargando módulos...</div>;
  if (!profile) return null;

  // El Gerente (admin) o Superadmin lo ven todo siempre
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';
  const mods = profile.active_modules || {};

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800">🎛️ Centro de Módulos</h2>
        <p className="text-sm text-slate-500 mt-1">Herramientas y aplicaciones activas en tu cuenta.</p>
      </div>

      {/* CUADRÍCULA DE BOTONES */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        
        {(isAdmin || mods.presupuestos_facturas) && (
          <ModuleCard 
            title="Presupuestos y Facturas" 
            icon="💶" 
            onClick={() => onOpenModule('documents')} 
          />
        )}
        
        {(isAdmin || mods.crm_visitas) && (
          <ModuleCard 
            title="CRM y Visitas" 
            icon="🤝" 
            onClick={() => alert('Abrir CRM (En desarrollo)')} 
          />
        )}

        {(isAdmin || mods.control_rutas) && (
          <ModuleCard 
            title="Control de Rutas" 
            icon="📍" 
            onClick={() => alert('Abrir Rutas (En desarrollo)')} 
          />
        )}

        {(isAdmin || mods.obras_autonomos) && (
          <ModuleCard 
            title="Partes de Trabajo" 
            icon="🏗️" 
            onClick={() => alert('Abrir Partes de Obras (Próximo paso)')} 
          />
        )}

        {(isAdmin || mods.mediciones_proyectos) && (
          <ModuleCard 
            title="Mediciones" 
            icon="📏" 
            onClick={() => alert('Abrir Mediciones (En desarrollo)')} 
          />
        )}

      </div>
    </div>
  );
}

// Componente de diseño para cada botón cuadrado
function ModuleCard({ title, icon, onClick }: { title: string, icon: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 cursor-pointer">
      <span className="text-4xl">{icon}</span>
      <span className="text-xs font-bold text-slate-700 text-center leading-tight">{title}</span>
    </button>
  );
}