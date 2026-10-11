// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CompanyDataForm from './CompanyDataForm';

interface ProfileViewProps {
  user: any;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'datos' | 'planes' | 'equipo'>('datos');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [team, setTeam] = useState<any[]>([]);
  
  const [showCompanyForm, setShowCompanyForm] = useState(false); 

  useEffect(() => {
    if (user && user.id) loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;

      let currentProfile = profileData;
      
      // Si el usuario es gerente y no tiene organization_id ni company_code, se lo autogeneramos/asociamos
      if ((currentProfile.plan === 'empresa_pro' || currentProfile.plan === 'empresa' || currentProfile.role === 'admin' || currentProfile.role === 'gerente') && !currentProfile.company_code) {
        const newCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
        await supabase.from('profiles').update({ company_code: newCode }).eq('id', user.id);
        currentProfile.company_code = newCode;
      }

      setProfile(currentProfile);

      if (currentProfile.plan === 'empresa_pro' || currentProfile.role === 'admin' || currentProfile.role === 'supplier_owner' || currentProfile.role === 'gerente') {
        const { data: teamData } = await supabase
          .from('profiles')
          .select('id, name, phone, email, active_modules')
          .eq('organization_id', user.id);
        
        if (teamData) {
          const formattedTeam = teamData.map(emp => ({
            ...emp,
            active_modules: emp.active_modules || { crm: false, rutas: false, presupuestos_facturas: false }
          }));
          setTeam(formattedTeam);
        }
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: priceId,
          userEmail: profile.email,
          userId: user.id
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al procesar el pago: " + data.error);
      }
    } catch (err) {
      alert("Error conectando con la pasarela de pago de Stripe.");
    }
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    if (joinCode.length < 5) {
      setJoinError("El código debe tener al menos 5 caracteres (Ej. EMP-1234)");
      return;
    }

    try {
      const { data: managerData, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_code', joinCode.toUpperCase())
        .single();

      if (searchError || !managerData) {
        setJoinError("No se ha encontrado ninguna empresa con ese código.");
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: managerData.id, 
          role: 'sales_rep' 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert("¡Vinculación completada! Ahora formas parte de la empresa.");
      loadProfileData(); 

    } catch (err: any) {
      setJoinError("Hubo un error al intentar vincularte: " + err.message);
    }
  };

  const toggleEmployeeModule = async (empId: string, moduleName: string) => {
    const updatedTeam = team.map(emp => {
      if (emp.id === empId) {
        return { 
          ...emp, 
          active_modules: { ...emp.active_modules, [moduleName]: !emp.active_modules[moduleName] } 
        };
      }
      return emp;
    });
    setTeam(updatedTeam);

    const employeeToUpdate = updatedTeam.find(e => e.id === empId);
    if (employeeToUpdate) {
      try {
        await supabase
          .from('profiles')
          .update({ active_modules: employeeToUpdate.active_modules })
          .eq('id', empId);
      } catch (err) {
        console.error("Error guardando permisos", err);
        loadProfileData();
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await supabase.from('profiles').update({
        name: profile.name,
        email: profile.email
      }).eq('id', user.id);
      alert("Datos personales guardados correctamente.");
    } catch (e) {
      alert("Error guardando datos.");
    }
  };

  if (isLoading || !profile) {
    return <div className="p-10 text-center font-bold text-slate-500">Cargando perfil...</div>;
  }

  const isPro = profile.plan === 'empresa_pro' || profile.role === 'admin' || profile.role === 'supplier_owner' || profile.role === 'gerente';

  return (
    <div className="bg-slate-50 min-h-full pb-24">
      {/* CABECERA DE PERFIL */}
      <div className="bg-indigo-600 px-6 pt-10 pb-20 rounded-b-[40px] shadow-lg relative">
        <div className="flex justify-between items-start text-white mb-6">
          <div>
            <h2 className="text-3xl font-black">{profile.name}</h2>
            <p className="text-indigo-200 font-medium text-sm mt-1">{profile.phone}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30 text-center">
            <span className="block text-[9px] uppercase font-black tracking-widest text-indigo-100">Plan Actual</span>
            <span className="block text-lg font-black uppercase">
              {profile.plan === 'free' ? 'FREE' : profile.plan === 'empresa' ? 'EMPRESA' : 'PRO'}
            </span>
          </div>
        </div>
      </div>

      {/* MENÚ DE PESTAÑAS */}
      <div className="px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-md p-1.5 flex border border-slate-200">
          <button onClick={() => setActiveTab('datos')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'datos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>👤 Datos</button>
          <button onClick={() => setActiveTab('planes')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'planes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>💳 Planes</button>
          <button onClick={() => setActiveTab('equipo')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'equipo' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>🏢 Equipo</button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 mt-2">
        {/* PESTAÑA: MIS DATOS */}
        {activeTab === 'datos' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            
            {/* BOTÓN DE ACCESO DIRECTO AL GESTOR DE EMPRESA Y LOGOS */}
            <button 
              onClick={() => setShowCompanyForm(true)}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition cursor-pointer text-base"
            >
              <span className="text-2xl">🏢</span> Gestionar Datos de Empresa, Logo y Bancos
            </button>

            {/* FORMULARIO DE DATOS PERSONALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 border-b border-slate-100 pb-2">Información Personal</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono</label>
                <input type="text" readOnly value={profile.phone} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                <input type="email" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="tu@email.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 text-slate-700" />
              </div>
              <button onClick={handleSaveProfile} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black shadow-md hover:bg-indigo-700 transition cursor-pointer">Guardar Datos Personales</button>
            </div>
            
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-100 mt-6 cursor-pointer">
              Cerrar Sesión Completa
            </button>
          </div>
        )}

        {/* PESTAÑA: PLANES (PRECIOS) */}
        {activeTab === 'planes' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Mejora tu cuenta</h3>
              <p className="text-sm text-slate-500 mt-1">Desbloquea todo el potencial de la plataforma.</p>
            </div>

            <div className={`bg-white p-5 rounded-3xl border-2 transition-all ${profile.plan === 'free' ? 'border-slate-800 shadow-md relative' : 'border-slate-200 opacity-70'}`}>
              {profile.plan === 'free' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-slate-800">Básico (Free)</h4>
              <p className="text-3xl font-black text-slate-800 my-2">0€ <span className="text-sm text-slate-400 font-medium">/mes</span></p>
              <ul className="space-y-2 mt-4 text-sm font-medium text-slate-600">
                <li className="flex items-center gap-2">✅ Chat y Calendario ilimitado</li>
                <li className="flex items-center gap-2">✅ Módulo de Juegos Recreativos</li>
              </ul>
            </div>

            <div className={`bg-indigo-50 p-5 rounded-3xl border-2 transition-all ${profile.plan === 'empresa' ? 'border-indigo-600 shadow-md relative' : 'border-indigo-200'}`}>
              {profile.plan === 'empresa' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-indigo-900">Empresa (Individual)</h4>
              <p className="text-3xl font-black text-indigo-700 my-2">29€ <span className="text-sm text-indigo-400 font-medium">/mes</span></p>
              <ul className="space-y-2 text-sm font-medium text-indigo-800">
                <li className="flex items-center gap-2">✅ Desbloqueo de todos los Módulos</li>
                <li className="flex items-center gap-2">✅ Presupuestos y CRM ilimitados</li>
              </ul>
              {profile.plan !== 'empresa' && (
                <button onClick={() => handleCheckout('price_1UMVl8AT2HWOK4TeXKB7WisC')} className="w-full mt-5 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-md cursor-pointer hover:bg-indigo-700 transition">Mejorar a Empresa</button>
              )}
            </div>

            <div className={`bg-slate-900 p-5 rounded-3xl border-2 transition-all ${isPro ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] relative' : 'border-slate-800'}`}>
              {isPro && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-white">Empresa PRO</h4>
              <p className="text-3xl font-black text-white my-2">79€ <span className="text-sm text-slate-400 font-medium">/mes</span></p>
              <ul className="space-y-2 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2 text-amber-400 font-bold">🔗 Vincular Empleados Comerciales</li>
              </ul>
              {!isPro && (
                <button onClick={() => handleCheckout('price_1UMVokAT2HWOK4TepVgZJ6gZ')} className="w-full mt-5 py-3 bg-amber-400 text-slate-900 font-black rounded-xl shadow-md cursor-pointer hover:bg-amber-500 transition">Contratar PRO</button>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: EQUIPO */}
        {activeTab === 'equipo' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {!isPro ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
                {profile.organization_id ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
                    <h3 className="font-black text-xl text-slate-800 mb-2">Cuenta Vinculada</h3>
                    <p className="text-sm text-slate-500 font-medium">Tu cuenta está vinculada a una Agencia.</p>
                  </>
                ) : (
                  <>
                    <h3 className="font-black text-xl text-slate-800 mb-2">Únete a tu Empresa</h3>
                    <form onSubmit={handleJoinCompany}>
                      <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="EMP-XXXX" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-2xl tracking-[0.2em] uppercase mb-4" />
                      <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl font-black shadow-md hover:bg-slate-900 transition cursor-pointer">Solicitar Vinculación</button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-md text-white text-center">
                  <h3 className="font-bold text-indigo-200 text-sm uppercase tracking-widest mb-2">Código de tu Agencia</h3>
                  <div className="bg-white/20 p-4 rounded-xl border border-white/30 backdrop-blur-sm">
                    <span className="font-black text-4xl tracking-widest select-all">{profile.company_code}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL FLOTANTE DE CONFIGURACIÓN DE EMPRESA */}
      {showCompanyForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm overflow-y-auto pt-10 pb-24 px-4 animate-in fade-in">
          <div className="max-w-2xl mx-auto flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-white">Configuración Corporativa</h2>
            <button onClick={() => setShowCompanyForm(false)} className="px-4 py-2 bg-white text-slate-800 rounded-xl font-bold hover:bg-slate-100 transition cursor-pointer shadow-lg">✕ Cerrar Ficha</button>
          </div>
          <CompanyDataForm />
        </div>
      )}

    </div>
  );
}