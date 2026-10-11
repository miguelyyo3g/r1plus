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
  const [isMounted, setIsMounted] = useState(false);
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState<'datos' | 'planes' | 'equipo'>('datos');
=======
  const [activeTab, setActiveTab] = useState<'datos' | 'empresa' | 'planes' | 'equipo'>('datos');
>>>>>>> deploy-v2
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
<<<<<<< HEAD
    if (user && user.id) loadProfileData();
=======
    if (user && user.id) {
      loadProfileData();
    } else {
      setIsLoading(false);
    }
>>>>>>> deploy-v2
  }, [user]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      let currentProfile = profileData;
<<<<<<< HEAD
=======

      // BLINDAJE: Si el perfil no existe en la base de datos, creamos uno por defecto en memoria para no bloquear la app
      if (error || !currentProfile) {
        console.warn("Perfil no encontrado, usando fallback en memoria", error);
        currentProfile = {
          id: user.id,
          name: user.email?.split('@')[0] || 'Usuario',
          email: user.email,
          phone: '',
          plan: 'free',
          role: 'sales_rep',
          organization_id: null
        };
      }

      // Autogenerar código de empresa si es gerente/admin y no tiene
>>>>>>> deploy-v2
      if ((currentProfile.plan === 'empresa_pro' || currentProfile.role === 'admin' || currentProfile.role === 'supplier_owner' || currentProfile.role === 'gerente') && !currentProfile.company_code) {
        const newCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
        // Intentamos guardarlo, pero si falla no bloqueamos
        await supabase.from('profiles').update({ company_code: newCode }).eq('id', user.id).catch(() => {});
        currentProfile.company_code = newCode;
      }

      setProfile(currentProfile);

<<<<<<< HEAD
=======
      // Cargar equipo si tiene permisos
>>>>>>> deploy-v2
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
      console.error("Error crítico cargando perfil:", err);
      // Última red de seguridad
      setProfile({
        id: user?.id,
        name: user?.email?.split('@')[0] || 'Usuario',
        email: user?.email,
        plan: 'free',
        role: 'sales_rep'
      });
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
          userEmail: profile?.email,
          userId: user?.id
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
      alert("Datos guardados correctamente.");
    } catch (e) {
      alert("Error guardando datos.");
    }
  };

<<<<<<< HEAD
  if (!isMounted || isLoading || !profile) {
    return <div className="p-10 text-center font-bold text-slate-500">Cargando perfil...</div>;
  }

=======
  if (!isMounted || isLoading) {
    return <div className="p-10 text-center font-bold text-slate-500">Cargando perfil...</div>;
  }

  // Prevención de cuelgue si profile sigue siendo nulo
  if (!profile) {
    return <div className="p-10 text-center font-bold text-red-500">Error cargando perfil. Por favor, recarga la página.</div>;
  }

>>>>>>> deploy-v2
  const isPro = profile.plan === 'empresa_pro' || profile.role === 'admin' || profile.role === 'supplier_owner' || profile.role === 'gerente';

  return (
    <div className="bg-slate-50 min-h-full pb-24">
      {/* CABECERA DE PERFIL */}
      <div className="bg-indigo-600 px-6 pt-10 pb-20 rounded-b-[40px] shadow-lg relative">
        <div className="flex justify-between items-start text-white mb-6">
          <div>
            <h2 className="text-3xl font-black">{profile.name || 'Usuario'}</h2>
            <p className="text-indigo-200 font-medium text-sm mt-1">{profile.phone || profile.email}</p>
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
<<<<<<< HEAD
        <div className="bg-white rounded-2xl shadow-md p-1.5 flex border border-slate-200">
          <button onClick={() => setActiveTab('datos')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'datos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>👤 Datos y Empresa</button>
          <button onClick={() => setActiveTab('planes')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'planes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>💳 Planes</button>
          <button onClick={() => setActiveTab('equipo')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'equipo' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>👥 Equipo</button>
=======
        <div className="bg-white rounded-2xl shadow-md p-1.5 flex border border-slate-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('datos')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap ${activeTab === 'datos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>👤 Datos</button>
          <button onClick={() => setActiveTab('empresa')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap ${activeTab === 'empresa' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>🏢 Empresa</button>
          <button onClick={() => setActiveTab('planes')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap ${activeTab === 'planes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>💳 Planes</button>
          <button onClick={() => setActiveTab('equipo')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap ${activeTab === 'equipo' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>👥 Equipo</button>
>>>>>>> deploy-v2
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 mt-2">
<<<<<<< HEAD
        {/* PESTAÑA: DATOS Y EMPRESA */}
=======
        {/* PESTAÑA: MIS DATOS PERSONALES */}
>>>>>>> deploy-v2
        {activeTab === 'datos' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🏢</span>
                <div>
                  <h3 className="font-black text-xl">Gestión de Empresa y Logotipo</h3>
                  <p className="text-xs text-indigo-200">Configura tus datos fiscales, logo, cuentas bancarias y Bizum para los presupuestos y facturas en PDF.</p>
                </div>
              </div>
            </div>

            <CompanyDataForm />

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 border-b border-slate-100 pb-2">Información Personal</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                <input type="text" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono</label>
                <input type="text" readOnly value={profile.phone || ''} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                <input type="email" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="tu@email.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 text-slate-700" />
              </div>
              <button onClick={handleSaveProfile} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black shadow-md hover:bg-indigo-700 transition cursor-pointer">Guardar Cambios Personales</button>
            </div>
            
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-100 mt-6 cursor-pointer">
              Cerrar Sesión Completa
            </button>
          </div>
        )}

<<<<<<< HEAD
        {/* PESTAÑA: PLANES */}
=======
        {/* PESTAÑA: EMPRESA Y FACTURACIÓN */}
        {activeTab === 'empresa' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-2 px-1">
              <h3 className="font-black text-slate-800 text-lg">Configuración de Empresa</h3>
              <p className="text-xs text-slate-500">Administra el logotipo, CIF, dirección, cuentas bancarias y Bizum que saldrán impresos en tus presupuestos y facturas en PDF.</p>
            </div>
            {/* AQUÍ SE RENDERIZA EL FORMULARIO DE EMPRESA PERFECTAMENTE AISLADO */}
            <CompanyDataForm />
          </div>
        )}

        {/* PESTAÑA: PLANES (PRECIOS Y DESCRIPCIONES DETALLADAS) */}
>>>>>>> deploy-v2
        {activeTab === 'planes' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Mejora tu cuenta</h3>
              <p className="text-sm text-slate-500 mt-1">Desbloquea todo el potencial de la plataforma.</p>
            </div>

            {/* PLAN FREE */}
            <div className={`bg-white p-5 rounded-3xl border-2 transition-all ${profile.plan === 'free' ? 'border-slate-800 shadow-md relative' : 'border-slate-200 opacity-70'}`}>
              {profile.plan === 'free' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-slate-800">Básico (Free)</h4>
              <p className="text-3xl font-black text-slate-800 my-2">0€ <span className="text-sm text-slate-400 font-medium">/mes</span></p>
              <ul className="space-y-2 mt-4 text-sm font-medium text-slate-600">
<<<<<<< HEAD
                <li className="flex items-center gap-2">✅ Chat y Calendario ilimitado</li>
                <li className="flex items-center gap-2">✅ Módulo de Juegos Recreativos</li>
=======
                <li className="flex items-center gap-2">✅ Acceso al Chat y Agenda</li>
                <li className="flex items-center gap-2">✅ Unirse a una empresa existente (Comerciales)</li>
                <li className="flex items-center gap-2 opacity-50">❌ Módulos de Gestión (CRM, Rutas) bloqueados</li>
                <li className="flex items-center gap-2 opacity-50">❌ Creación de Presupuestos bloqueada</li>
>>>>>>> deploy-v2
              </ul>
            </div>

            {/* PLAN EMPRESA */}
            <div className={`bg-indigo-50 p-5 rounded-3xl border-2 transition-all ${profile.plan === 'empresa' ? 'border-indigo-600 shadow-md relative' : 'border-indigo-200'}`}>
              {profile.plan === 'empresa' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-indigo-900">Empresa (Individual)</h4>
              <p className="text-3xl font-black text-indigo-700 my-2">29€ <span className="text-sm text-indigo-400 font-medium">/mes</span></p>
<<<<<<< HEAD
              <button onClick={() => handleCheckout('price_1UMVl8AT2HWOK4TeXKB7WisC')} className="w-full mt-5 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-md cursor-pointer hover:bg-indigo-700 transition">Mejorar a Empresa</button>
=======
              <p className="text-xs text-indigo-600 font-bold mb-4 bg-white/50 inline-block px-2 py-1 rounded">Ideal para 1 autónomo o gerente</p>
              <ul className="space-y-2 text-sm font-medium text-indigo-800">
                <li className="flex items-center gap-2 font-bold text-indigo-900">🔓 Desbloqueo de todos los Módulos</li>
                <li className="flex items-center gap-2">✅ Gestor de Presupuestos y Facturas ilimitado</li>
                <li className="flex items-center gap-2">✅ CRM, Clientes y Rutas activos</li>
                <li className="flex items-center gap-2 opacity-50">❌ Sin posibilidad de vincular equipo comercial</li>
              </ul>
              {profile.plan !== 'empresa' && (
                <button 
                  onClick={() => handleCheckout('price_1UMVl8AT2HWOK4TeXKB7WisC')} 
                  className="w-full mt-5 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-md cursor-pointer hover:bg-indigo-700 transition"
                >
                  Mejorar a Empresa (29€/mes)
                </button>
              )}
>>>>>>> deploy-v2
            </div>

            {/* PLAN PRO */}
            <div className={`bg-slate-900 p-5 rounded-3xl border-2 transition-all ${isPro ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] relative' : 'border-slate-800'}`}>
              {isPro && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-white">Empresa PRO</h4>
              <p className="text-3xl font-black text-white my-2">79€ <span className="text-sm text-slate-400 font-medium">/mes</span></p>
<<<<<<< HEAD
              <button onClick={() => handleCheckout('price_1UMVokAT2HWOK4TepVgZJ6gZ')} className="w-full mt-5 py-3 bg-amber-400 text-slate-900 font-black rounded-xl shadow-md cursor-pointer hover:bg-amber-500 transition">Contratar PRO</button>
=======
              <p className="text-xs text-amber-400 font-bold mb-4">La solución total para agencias y equipos</p>
              <ul className="space-y-2 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2">✅ Todo lo incluido en el Plan Empresa</li>
                <li className="flex items-center gap-2 text-amber-400 font-bold">🔗 Código para vincular Empleados Comerciales</li>
                <li className="flex items-center gap-2">🕹️ Panel de Gestión de Permisos por empleado</li>
                <li className="flex items-center gap-2 text-xs italic">+15€/mes por cada licencia extra de comercial activo</li>
              </ul>
              {!isPro && (
                <button 
                  onClick={() => handleCheckout('price_1UMVokAT2HWOK4TepVgZJ6gZ')} 
                  className="w-full mt-5 py-3 bg-amber-400 text-slate-900 font-black rounded-xl shadow-md cursor-pointer hover:bg-amber-500 transition"
                >
                  Contratar Empresa PRO (79€/mes)
                </button>
              )}
>>>>>>> deploy-v2
            </div>
          </div>
        )}

<<<<<<< HEAD
        {/* PESTAÑA: EQUIPO (CON GESTIÓN COMPLETA Y PERMISOS) */}
=======
        {/* PESTAÑA: EQUIPO Y PERMISOS */}
>>>>>>> deploy-v2
        {activeTab === 'equipo' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {!isPro ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                <h3 className="font-black text-xl text-slate-800 mb-2">Únete a tu Empresa</h3>
                {joinError && <div className="text-rose-500 text-xs font-bold mb-4 bg-rose-50 p-2 rounded">{joinError}</div>}
                <form onSubmit={handleJoinCompany}>
                  <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="EMP-XXXX" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-2xl tracking-[0.2em] uppercase mb-4" />
                  <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl font-black shadow-md hover:bg-slate-900 transition cursor-pointer">Solicitar Vinculación</button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-md text-white text-center">
                  <h3 className="font-bold text-indigo-200 text-sm uppercase tracking-widest mb-2">Código de tu Agencia</h3>
                  <div className="bg-white/20 p-4 rounded-xl border border-white/30 backdrop-blur-sm">
                    <span className="font-black text-4xl tracking-widest select-all">{profile.company_code}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3 px-1 mt-6">
                    <h3 className="font-black text-slate-800">Mi Equipo ({team.length})</h3>
                  </div>

                  <div className="space-y-3">
                    {team.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500 font-medium text-sm">
                        Todavía no tienes comerciales vinculados. Dales tu código <strong>{profile.company_code}</strong>.
                      </div>
                    ) : (
                      team.map(emp => (
                        <div key={emp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black">{emp.name?.charAt(0) || 'U'}</div>
                            <div>
                              <div className="font-black text-slate-800 text-sm">{emp.name || 'Usuario'}</div>
                              <div className="text-xs font-mono text-slate-500">{emp.email}</div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Permisos (Interruptores de Módulos)</p>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <span className="text-xs font-bold text-slate-700">👥 CRM</span>
                                <input type="checkbox" checked={emp.active_modules?.crm || false} onChange={() => toggleEmployeeModule(emp.id, 'crm')} className="w-4 h-4 accent-indigo-600" />
                              </label>
                              <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <span className="text-xs font-bold text-slate-700">📍 Rutas</span>
                                <input type="checkbox" checked={emp.active_modules?.rutas || false} onChange={() => toggleEmployeeModule(emp.id, 'rutas')} className="w-4 h-4 accent-indigo-600" />
                              </label>
                              <label className="col-span-2 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <span className="text-xs font-bold text-slate-700">💶 Presupuestos (Full Access)</span>
                                <input type="checkbox" checked={emp.active_modules?.presupuestos_facturas || false} onChange={() => toggleEmployeeModule(emp.id, 'presupuestos_facturas')} className="w-4 h-4 accent-indigo-600" />
                              </label>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}