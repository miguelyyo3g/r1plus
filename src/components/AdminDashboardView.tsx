// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminDashboardViewProps {
  onBackToApp: () => void;
  onLogout: () => void;
}

export default function AdminDashboardView({ onBackToApp, onLogout }: AdminDashboardViewProps) {
  // Estado de autorización
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Estados de datos
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editCycle, setEditCycle] = useState('');
  const [editExtraLicenses, setEditExtraLicenses] = useState(0);

  // Estadísticas generales incluyendo almacenamiento
  const [stats, setStats] = useState({ 
    total: 0, paying: 0, free: 0, suspended: 0, 
    totalStorageGB: 12.4, // Simulado: 12.4 GB
    storageLimitGB: 50.0  // Límite del plan de Supabase
  });

  // 1. Verificación de Seguridad al montar el componente
  useEffect(() => {
    const verifySuperAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/';
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'superadmin') {
          setIsSuperAdmin(true);
          fetchAdminUsers(); 
        } else {
          window.location.href = '/'; 
        }
      } catch (error) {
        console.error('Error verificando rol:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    verifySuperAdmin();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const dataWithStorage = data.map(u => ({
          ...u,
          storage_used_mb: Math.floor(Math.random() * 850) + 10 
        }));

        setUsers(dataWithStorage);
        
        const total = data.length;
        const suspended = data.filter(u => u.status === 'suspended').length;
        const paying = data.filter(u => (u.plan === 'empresa' || u.plan === 'empresa_pro') && u.billing_cycle !== 'free').length;
        const free = data.filter(u => u.plan === 'free' || u.billing_cycle === 'free').length;
        
        setStats(prev => ({ ...prev, total, paying, free, suspended }));
      }
    } catch (err) {
      console.error('Error al cargar perfiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      fetchAdminUsers();
    } catch (err: any) { alert('Error al actualizar estado: ' + err.message); }
  };

  const handleSavePlanChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const { error } = await supabase.from('profiles').update({ 
        role: editRole, 
        plan: editPlan, 
        billing_cycle: editCycle,
        extra_commercial_licenses: editExtraLicenses
      }).eq('id', editingUser.id);

      if (error) throw error;
      alert(`Datos de ${editingUser.name} actualizados con éxito.`);
      setEditingUser(null);
      fetchAdminUsers();
    } catch (err: any) { alert('Error al modificar suscripción: ' + err.message); }
  };

  // ==========================================
  // NUEVA LÓGICA: REGALAR TIEMPO RÁPIDO
  // ==========================================
  const handleAddFreeTime = async (user: any, monthsToAdd: number) => {
    const text = monthsToAdd === 12 ? '1 Año' : `${monthsToAdd} Mes(es)`;
    if (!confirm(`¿Activar ${text} de acceso PRO a ${user.name}?`)) return;

    try {
      let baseDate = user.plan_expires_at ? new Date(user.plan_expires_at) : new Date();
      // Si ya estaba caducado, el nuevo mes empieza a contar desde hoy
      if (baseDate < new Date()) {
        baseDate = new Date();
      }
      
      baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
      const newExpiryDate = baseDate.toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan_expires_at: newExpiryDate,
          // Si era free, lo pasamos a Pro automáticamente para que lo disfrute
          plan: user.plan === 'free' ? 'empresa_pro' : user.plan,
          billing_cycle: 'free' // Marcamos que este periodo es regalado/manual
        })
        .eq('id', user.id);

      if (error) throw error;
      fetchAdminUsers();
    } catch (err: any) {
      alert("Error añadiendo tiempo: " + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.company && u.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phone && u.phone.includes(searchTerm)) ||
    (u.company_code && u.company_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'superadmin': return '👑 Super Administrador';
      case 'admin': return '🏢 Gerencia / Autónomo';
      case 'supplier_owner': return '🏢 Gerencia / Autónomo';
      case 'sales_rep': return '🚗 Comercial';
      default: return 'Usuario Básico';
    }
  };

  const storagePercentage = (stats.totalStorageGB / stats.storageLimitGB) * 100;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center font-bold text-slate-500 animate-pulse">
          Verificando credenciales de seguridad...
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 sm:p-6 space-y-5">
      
      {/* CABECERA */}
      <div className="max-w-7xl mx-auto bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-indigo-400">r1plus</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full">Control Maestro</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Gestión absoluta de cuentas, facturación y almacenamiento del servidor.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={onBackToApp} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700">← Volver a la App</button>
          <button onClick={onLogout} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md">Cerrar Sesión</button>
        </div>
      </div>

      {/* MÉTRICAS SUPERIORES */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Cuentas</span>
          <span className="text-3xl font-black text-slate-800">{stats.total}</span>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-500 uppercase">Pro (Pagan)</span>
          <span className="text-3xl font-black text-indigo-700">{stats.paying}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Gratis</span>
          <span className="text-3xl font-black text-emerald-700">{stats.free}</span>
        </div>
        
        {/* TARJETA DE CONSUMO DE SERVIDOR */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between col-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Espacio Servidor (Supabase)</span>
              <span className="text-[10px] font-bold text-slate-400">{stats.storageLimitGB} GB Max</span>
            </div>
            <div className="text-3xl font-black text-white">{stats.totalStorageGB} <span className="text-base text-slate-400 font-medium">GB usados</span></div>
            
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div className={`h-2 rounded-full ${storagePercentage > 85 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-400' : 'bg-sky-500'}`} style={{ width: `${storagePercentage}%` }}></div>
            </div>
          </div>
          <span className="absolute -right-4 -bottom-4 text-7xl opacity-5">💾</span>
        </div>
      </div>

      {/* BUSCADOR Y LISTADO DE TARJETAS DE USUARIOS */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="🔍 Buscar cliente por nombre, teléfono, empresa o código (EMP-XXX)..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full p-4 pl-12 rounded-2xl bg-white border border-slate-300 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 shadow-sm transition" 
          />
          <span className="absolute left-4 top-4 text-xl">🔍</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 font-bold">Cargando base de datos...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-bold bg-white rounded-2xl border border-dashed border-slate-300">
            No se encontraron usuarios.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredUsers.map(u => {
              const cleanPhone = u.phone ? u.phone.replace(/\D/g, '') : '';
              const isExpired = u.plan_expires_at && new Date(u.plan_expires_at) < new Date();
              
              return (
                <div key={u.id} className={`bg-white border ${u.status === 'suspended' ? 'border-rose-300 bg-rose-50' : 'border-slate-200'} rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row gap-5 transition hover:shadow-md`}>
                  
                  {/* SECCIÓN 1: DATOS Y CONTACTO */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                          u.plan === 'empresa_pro' ? 'bg-purple-100 text-purple-700' :
                          u.plan === 'empresa' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {u.plan === 'empresa_pro' ? 'PRO' : u.plan === 'empresa' ? 'EMPRESA' : 'FREE'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{getRoleLabel(u.role)}</span>
                        {u.company_code && <span className="text-[10px] font-mono text-slate-500 border border-slate-300 px-1.5 rounded">{u.company_code}</span>}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{u.name || 'Sin Nombre'}</h3>
                      <p className="text-lg font-mono text-indigo-600 font-bold mt-1">{u.phone || 'Sin Teléfono'}</p>
                      <p className="text-sm text-slate-500 truncate">{u.company || u.email || 'Sin datos extra'}</p>
                    </div>

                    <div className="flex gap-2">
                      <a href={`tel:${cleanPhone}`} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-center transition flex items-center justify-center gap-2 shadow-sm border border-slate-200">
                        📞 Llamar
                      </a>
                      <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl font-black text-center transition flex items-center justify-center gap-2 shadow-md">
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* SECCIÓN 2: CONTROL DE PLAN Y TIEMPO */}
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acceso y Caducidad</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${u.billing_cycle === 'annual' ? 'bg-emerald-100 text-emerald-700' : u.billing_cycle === 'free' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                          {u.billing_cycle}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {u.plan === 'free' ? (
                          <span className="text-slate-500">Plan Básico (Sin caducidad)</span>
                        ) : u.plan_expires_at ? (
                          isExpired ? (
                            <span className="text-rose-500 font-black">⚠️ Caducado ({new Date(u.plan_expires_at).toLocaleDateString()})</span>
                          ) : (
                            <span className="text-emerald-600 font-black">Activo hasta {new Date(u.plan_expires_at).toLocaleDateString()}</span>
                          )
                        ) : (
                          <span className="text-amber-500 font-bold">Suscripción Manual Permanente</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      <button onClick={() => handleAddFreeTime(u, 1)} className="py-2 bg-white hover:bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black transition border border-indigo-200 shadow-sm">+1M</button>
                      <button onClick={() => handleAddFreeTime(u, 2)} className="py-2 bg-white hover:bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black transition border border-indigo-200 shadow-sm">+2M</button>
                      <button onClick={() => handleAddFreeTime(u, 3)} className="py-2 bg-white hover:bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black transition border border-indigo-200 shadow-sm">+3M</button>
                      <button onClick={() => handleAddFreeTime(u, 12)} className="py-2 bg-white hover:bg-amber-50 text-amber-600 rounded-lg text-xs font-black transition border border-amber-200 shadow-sm">+1A</button>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => {
                          setEditingUser(u); 
                          setEditRole(u.role || 'admin'); 
                          setEditPlan(u.plan || 'free'); 
                          setEditCycle(u.billing_cycle || 'monthly');
                          setEditExtraLicenses(u.extra_commercial_licenses || 0);
                        }}
                        className="flex-[2] py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition"
                      >
                        📇 Ver Ficha Completa
                      </button>
                      {u.role !== 'superadmin' && (
                        <button 
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-sm transition ${u.status === 'suspended' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}
                        >
                          {u.status === 'suspended' ? 'Reanudar' : 'Bloquear'}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL GIGANTE DE FICHA DE CLIENTE Y EDICIÓN (INTACTO COMO LO TENÍAS) */}
      {editingUser && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">📇 Ficha Completa y Permisos</h3>
                <p className="text-sm text-slate-500 mt-1">Gestionando a: <strong>{editingUser.name}</strong></p>
              </div>
              <button onClick={() => setEditingUser(null)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xl cursor-pointer transition">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* COLUMNA IZQUIERDA: DATOS FISCALES */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-500 uppercase tracking-widest text-xs border-b border-slate-200 pb-2 mb-4">Información del Usuario</h4>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Empresa</span>
                    <span className="font-black text-slate-800 text-lg block">{editingUser.company || '---'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">CIF / DNI</span>
                      <span className="font-mono font-bold text-slate-800 text-base">{editingUser.cif || '---'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Teléfono</span>
                      <span className="font-mono font-bold text-slate-800 text-base">{editingUser.phone || '---'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Email de Contacto</span>
                    <span className="font-bold text-slate-800 text-base break-all">{editingUser.email_contact || editingUser.email || '---'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Dirección Fiscal / Obra</span>
                    <span className="font-medium text-slate-800 text-base">{editingUser.address || '---'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 mt-2">
                    <div className="col-span-2">
                      <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Cuenta IBAN</span>
                      <span className="font-mono font-bold text-slate-800 text-base">{editingUser.iban || '---'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Tel. Bizum</span>
                      <span className="font-mono font-bold text-emerald-600 text-base">{editingUser.bizum || '---'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: FORMULARIO DE PERMISOS */}
              <form onSubmit={handleSavePlanChanges} className="flex flex-col justify-between">
                <div className="space-y-5">
                  <h4 className="font-bold text-slate-500 uppercase tracking-widest text-xs border-b border-slate-100 pb-2 mb-4">Control de Suscripción</h4>
                  
                  <div>
                    <label className="block text-slate-700 font-bold mb-2">Rol de Acceso en la App</label>
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full p-4 rounded-xl bg-white border border-slate-300 font-bold text-base focus:outline-none focus:border-indigo-500 shadow-sm transition">
                      <option value="supplier_owner">🏢 Gerencia / Autónomo</option>
                      <option value="sales_rep">🚗 Comercial de calle</option>
                      <option value="superadmin">👑 Super Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-2">Nivel de Plan (Facturación)</label>
                    <select value={editPlan} onChange={e => setEditPlan(e.target.value)} className="w-full p-4 rounded-xl bg-white border border-slate-300 font-bold text-base focus:outline-none focus:border-indigo-500 shadow-sm transition">
                      <option value="free">🟢 Plan Free (Uso Limitado)</option>
                      <option value="empresa">🔵 Plan Empresa</option>
                      <option value="empresa_pro">🟣 Plan Empresa PRO (+ Comerciales)</option>
                    </select>
                  </div>

                  {editPlan === 'empresa_pro' && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <label className="block text-purple-900 font-bold mb-2">Licencias Comerciales Extra</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          min="0"
                          value={editExtraLicenses}
                          onChange={e => setEditExtraLicenses(parseInt(e.target.value) || 0)}
                          className="w-24 p-3 rounded-lg bg-white border border-purple-200 font-black text-xl text-center focus:outline-none focus:border-purple-500 shadow-sm transition"
                        />
                        <div className="text-xs font-bold text-purple-600 leading-tight">
                          Comerciales extra a facturar<br/>
                          <span className="text-purple-400 font-medium">(2 licencias ya incluidas gratis en el plan)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-700 font-bold mb-2">Estado de Pago / Ciclo</label>
                    <select value={editCycle} onChange={e => setEditCycle(e.target.value)} className="w-full p-4 rounded-xl bg-white border border-slate-300 font-bold text-base focus:outline-none focus:border-indigo-500 shadow-sm transition">
                      <option value="monthly">🔄 Facturación Mensual</option>
                      <option value="annual">✅ Facturación Anual</option>
                      <option value="free">🎁 Promoción (100% Gratis)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition text-base">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg cursor-pointer transition text-lg">Guardar Cambios</button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}