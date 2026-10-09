'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ModulesViewProps {
  onOpenModule: (view: string) => void;
  userPlan?: string; // NUEVO: Para saber qué plan tiene
}

export default function ModulesView({ onOpenModule, userPlan = 'free' }: ModulesViewProps) {
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

  // Lógica de permisos de negocio
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin' || profile.role === 'gerente';
  const isPremium = isAdmin || userPlan !== 'free' || profile.plan !== 'free'; // Si paga o es admin, lo ve todo
  const mods = profile.active_modules || {};

  // Función interceptora: Si el módulo es de pago y es Free, no entra.
  const handleProtectedClick = (moduleName: string) => {
    if (isPremium) {
      onOpenModule(moduleName);
    } else {
      alert("🔒 Este módulo es exclusivo para usuarios Premium.\n\nVe a la pestaña 'Tú' para mejorar tu plan y desbloquear todas las herramientas.");
      // Opcional: onOpenModule('tu'); // Para mandarlo directo a pagar
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800">🎛️ Centro de Módulos</h2>
        <p className="text-sm text-slate-500 mt-1">Herramientas y aplicaciones disponibles.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        
        {/* MÓDULOS PROTEGIDOS (PAGO) */}
        <ModuleCard 
          title="Presup. y Facturas" 
          icon="💶" 
          isLocked={!isPremium}
          onClick={() => handleProtectedClick('documents')} 
        />
        
        <ModuleCard 
          title="Partes de Trabajo" 
          icon="🏗️" 
          isLocked={!isPremium}
          onClick={() => handleProtectedClick('works')} 
        />
        
        <ModuleCard 
          title="CRM y Clientes" 
          icon="👥" 
          isLocked={!isPremium}
          onClick={() => handleProtectedClick('crm')} 
        />

        <ModuleCard 
          title="Control de Rutas" 
          icon="📍" 
          isLocked={!isPremium}
          onClick={() => handleProtectedClick('rutas')} 
        />

        <ModuleCard 
          title="Mediciones" 
          icon="📏" 
          isLocked={!isPremium}
          onClick={() => handleProtectedClick('mediciones')} 
        />

        {/* MÓDULOS FREE (Siempre abiertos) */}
        <ModuleCard 
          title="Sala de Juegos" 
          icon="🎮" 
          isLocked={false} // Siempre abierto
          onClick={() => onOpenModule('juegos')} 
          customClass="bg-rose-50 border-rose-200 hover:border-rose-400 hover:bg-rose-100"
        />

      </div>
    </div>
  );
}

// Subcomponente de la tarjeta actualizado para soportar el "modo bloqueado"
function ModuleCard({ title, icon, onClick, customClass = '', isLocked = false }: { title: string, icon: string, onClick: () => void, customClass?: string, isLocked?: boolean }) {
  if (isLocked) {
    return (
      <button onClick={onClick} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 cursor-pointer opacity-75 hover:bg-slate-100 transition">
        <div className="relative">
          <span className="text-4xl filter grayscale">{icon}</span>
          <span className="absolute -bottom-2 -right-2 text-xl bg-white rounded-full shadow-sm">🔒</span>
        </div>
        <span className="text-xs font-bold text-slate-500 text-center leading-tight">{title}</span>
      </button>
    );
  }

  const baseClass = customClass ? customClass : "bg-white border-slate-200 hover:border-indigo-300";
  return (
    <button onClick={onClick} className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 active:scale-95 cursor-pointer ${baseClass}`}>
      <span className="text-4xl">{icon}</span>
      <span className="text-xs font-bold text-slate-700 text-center leading-tight">{title}</span>
    </button>
  );
}