// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  user: any;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'datos' | 'planes' | 'equipo'>('datos');
  
  // Datos del usuario simulados (Se cargarían de Supabase)
  const [profile, setProfile] = useState({
    name: user?.name || 'Usuario',
    phone: user?.phone || '',
    email: user?.email || '',
    plan: user?.plan || 'free', // 'free', 'empresa', 'empresa_pro'
    role: user?.role || 'user_particular', // 'gerente', 'comercial', 'user_particular'
    companyCode: 'EMP-7392' // Código que da el gerente a sus empleados
  });

  // Estado para el Free que quiere unirse a una empresa
  const [joinCode, setJoinCode] = useState('');

  // Estado del gerente (Sus comerciales vinculados)
  const [team, setTeam] = useState([
    { id: 1, name: 'Carlos (Comercial Centro)', phone: '+34 600 111 222', modules: { crm: true, rutas: true, presupuestos: false } },
    { id: 2, name: 'Marta (Comercial Norte)', phone: '+34 600 333 444', modules: { crm: true, rutas: true, presupuestos: true } }
  ]);

  // Manejar cambio de permisos por parte del Gerente
  const toggleEmployeeModule = (empId: number, module: string) => {
    setTeam(prev => prev.map(emp => {
      if (emp.id === empId) {
        return { ...emp, modules: { ...emp.modules, [module]: !emp.modules[module as keyof typeof emp.modules] } };
      }
      return emp;
    }));
  };

  const handleJoinCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length < 5) {
      alert("Código no válido. Pídeselo a tu gerente.");
      return;
    }
    alert(`¡Solicitud enviada a la empresa con código ${joinCode}!\n\nEn cuanto el gerente acepte, tu cuenta pasará a ser Comercial y él podrá desbloquearte los módulos de trabajo.`);
    setJoinCode('');
  };

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
            <span className="block text-lg font-black">{profile.plan === 'free' ? 'FREE' : profile.plan === 'empresa' ? 'EMPRESA' : 'PRO'}</span>
          </div>
        </div>
      </div>

      {/* MENÚ DE PESTAÑAS (Sobresale por encima del fondo azul) */}
      <div className="px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-md p-1.5 flex border border-slate-200">
          <button onClick={() => setActiveTab('datos')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'datos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>👤 Datos</button>
          <button onClick={() => setActiveTab('planes')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'planes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>💳 Planes</button>
          <button onClick={() => setActiveTab('equipo')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${activeTab === 'equipo' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>🏢 Equipo</button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 mt-2">
        
        {/* ========================================================= */}
        {/* PESTAÑA: MIS DATOS */}
        {/* ========================================================= */}
        {activeTab === 'datos' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 border-b border-slate-100 pb-2">Información Personal</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                <input type="text" defaultValue={profile.name} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono</label>
                <input type="text" readOnly defaultValue={profile.phone} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                <input type="email" defaultValue={profile.email} placeholder="tu@email.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 text-slate-700" />
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black shadow-md hover:bg-indigo-700 transition">Guardar Cambios</button>
            </div>
            
            <button className="w-full py-4 text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-100 mt-6">
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA: PLANES (PRECIOS) */}
        {/* ========================================================= */}
        {activeTab === 'planes' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Mejora tu cuenta</h3>
              <p className="text-sm text-slate-500 mt-1">Desbloquea todo el potencial de la plataforma.</p>
            </div>

            {/* Tarjeta Plan Free */}
            <div className={`bg-white p-5 rounded-3xl border-2 transition-all ${profile.plan === 'free' ? 'border-slate-800 shadow-md relative' : 'border-slate-200 opacity-70'}`}>
              {profile.plan === 'free' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-slate-800">Básico (Free)</h4>
              <p className="text-3xl font-black text-slate-800 my-2">0€ <span className="text-sm text-slate-400 font-medium">/mes</span></p>
              <ul className="space-y-2 mt-4 text-sm font-medium text-slate-600">
                <li className="flex items-center gap-2">✅ Chat y Calendario ilimitado</li>
                <li className="flex items-center gap-2">✅ Módulo de Juegos Recreativos</li>
                <li className="flex items-center gap-2 opacity-50">❌ Módulos de Gestión bloqueados</li>
                <li className="flex items-center gap-2 opacity-50">❌ Límites en Presupuestos y CRM</li>
              </ul>
            </div>

            {/* Tarjeta Plan Empresa */}
            <div className={`bg-indigo-50 p-5 rounded-3xl border-2 transition-all ${profile.plan === 'empresa' ? 'border-indigo-600 shadow-md relative' : 'border-indigo-200'}`}>
              {profile.plan === 'empresa' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <h4 className="font-black text-xl text-indigo-900">Empresa (Individual)</h4>
              <p className="text-3xl font-black text-indigo-700 my-2">29€ <span className="text-sm text-indigo-400 font-medium">/mes</span></p>
              <p className="text-xs text-indigo-600 font-bold mb-4 bg-white/50 inline-block px-2 py-1 rounded">Ideal para 1 autónomo o gerente</p>
              <ul className="space-y-2 text-sm font-medium text-indigo-800">
                <li className="flex items-center gap-2">✅ Todo lo de Free ilimitado</li>
                <li className="flex items-center gap-2 font-bold text-indigo-900">🔓 Desbloqueo de todos los Módulos</li>
                <li className="flex items-center gap-2">✅ Presupuestos y CRM ilimitados</li>
                <li className="flex items-center gap-2 opacity-50">❌ Sin vinculación de comerciales</li>
              </ul>
              {profile.plan !== 'empresa' && <button className="w-full mt-5 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-md">Mejorar a Empresa</button>}
            </div>

            {/* Tarjeta Plan Empresa PRO */}
            <div className={`bg-slate-900 p-5 rounded-3xl border-2 transition-all ${profile.plan === 'empresa_pro' ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] relative' : 'border-slate-800'}`}>
              {profile.plan === 'empresa_pro' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Plan Actual</span>}
              <div className="flex justify-between items-start">
                <h4 className="font-black text-xl text-white">Empresa PRO</h4>
                <span className="text-2xl">🚀</span>
              </div>
              <p className="text-3xl font-black text-white my-2">79€ <span className="text-sm text-slate-400 font-medium">/mes</span></p>
              <p className="text-xs text-amber-400 font-bold mb-4">La solución total para agencias</p>
              <ul className="space-y-2 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2">✅ Todo lo del Plan Empresa</li>
                <li className="flex items-center gap-2 text-amber-400 font-bold">🔗 Vincular Empleados Comerciales</li>
                <li className="flex items-center gap-2">🕹️ Gestor de Permisos de Módulos</li>
                <li className="flex items-center gap-2 text-xs italic">+15€/mes por cada licencia extra de comercial</li>
              </ul>
              {profile.plan !== 'empresa_pro' && <button className="w-full mt-5 py-3 bg-amber-400 text-slate-900 font-black rounded-xl shadow-md">Contratar PRO</button>}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA: MI AGENCIA / EQUIPO (VINCULACIÓN) */}
        {/* ========================================================= */}
        {activeTab === 'equipo' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            
            {/* VISTA 1: Usuario FREE (Añadir código de jefe) */}
            {profile.plan !== 'empresa_pro' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔗</div>
                <h3 className="font-black text-xl text-slate-800 mb-2">Únete a tu Empresa</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Si trabajas para una agencia, pídele a tu gerente su <strong>Código de Equipo</strong> e introdúcelo aquí. Tus módulos se desbloquearán automáticamente según los permisos que te asigne.</p>
                
                <form onSubmit={handleJoinCompany}>
                  <input 
                    type="text" 
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="EMP-XXXX" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-2xl tracking-[0.2em] focus:outline-none focus:border-indigo-500 uppercase mb-4" 
                  />
                  <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl font-black shadow-md hover:bg-slate-900 transition">Solicitar Vinculación</button>
                </form>
              </div>
            )}

            {/* VISTA 2: Gerente (Plan Empresa Pro) */}
            {profile.plan === 'empresa_pro' && (
              <div className="space-y-4">
                
                {/* Caja de Código de Invitación */}
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-md text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 text-7xl opacity-10">🏢</div>
                  <h3 className="font-bold text-indigo-200 text-sm uppercase tracking-widest mb-2">Código de tu Agencia</h3>
                  <div className="bg-white/20 p-4 rounded-xl border border-white/30 backdrop-blur-sm">
                    <span className="font-black text-4xl tracking-widest">{profile.companyCode}</span>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium mt-3">Dale este código a tus comerciales para que vinculen su app gratuita a tu cuenta corporativa.</p>
                </div>

                {/* Lista de Empleados y Gestión de Módulos */}
                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-black text-slate-800">Mi Equipo ({team.length})</h3>
                    <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">+ Comprar Licencia</button>
                  </div>

                  <div className="space-y-3">
                    {team.map(emp => (
                      <div key={emp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500">{emp.name.charAt(0)}</div>
                          <div>
                            <div className="font-black text-slate-800 text-sm">{emp.name}</div>
                            <div className="text-xs font-mono text-slate-500">{emp.phone}</div>
                          </div>
                        </div>

                        {/* Gestión de Permisos por Comercial */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Permisos (Interruptores de Módulos)</p>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Interruptor CRM */}
                            <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                              <span className="text-xs font-bold text-slate-700">👥 CRM</span>
                              <input type="checkbox" checked={emp.modules.crm} onChange={() => toggleEmployeeModule(emp.id, 'crm')} className="w-4 h-4 accent-indigo-600" />
                            </label>
                            
                            {/* Interruptor RUTAS */}
                            <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                              <span className="text-xs font-bold text-slate-700">📍 Rutas</span>
                              <input type="checkbox" checked={emp.modules.rutas} onChange={() => toggleEmployeeModule(emp.id, 'rutas')} className="w-4 h-4 accent-indigo-600" />
                            </label>

                            {/* Interruptor PRESUPUESTOS */}
                            <label className="col-span-2 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                              <span className="text-xs font-bold text-slate-700">💶 Presupuestos (Full Access)</span>
                              <input type="checkbox" checked={emp.modules.presupuestos} onChange={() => toggleEmployeeModule(emp.id, 'presupuestos')} className="w-4 h-4 accent-indigo-600" />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
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