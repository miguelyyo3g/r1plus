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
          fetchAdminUsers(); // Solo cargamos los datos si pasó la barrera
        } else {
          // Expulsa a cualquier usuario que no tenga el rol correcto
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
        // Simulamos la inyección del consumo de Storage por usuario para la vista UI
        const dataWithStorage = data.map(u => ({
          ...u,
          storage_used_mb: Math.floor(Math.random() * 850) + 10 // Simula entre 10MB y 850MB consumidos
        }));

        setUsers(dataWithStorage);
        
        const total = data.length;
        const suspended = data.filter(u => u.status === 'suspended').length;
        const paying = data.filter(u => (u.plan === 'pro' || u.plan === 'pro_plus') && u.billing_cycle !== 'free').length;
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
        role: editRole, plan: editPlan, billing_cycle: editCycle
      }).eq('id', editingUser.id);

      if (error) throw error;
      alert(`Datos de ${editingUser.name} actualizados con éxito.`);
      setEditingUser(null);
      fetchAdminUsers();
    } catch (err: any) { alert('Error al modificar suscripción: ' + err.message); }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.company && u.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phone && u.phone.includes(searchTerm))
  );

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'superadmin': return 'Super Administrador';
      case 'supplier_owner': return 'Gerencia Proveedor';
      case 'sales_rep': return 'Comercial';
      case 'buyer': return 'Cliente / Instalador';
      case 'client_employee': return 'Técnico Cliente';
      case 'admin': return 'Administrador';
      default: return 'Usuario Particular';
    }
  };

  const storagePercentage = (stats.totalStorageGB / stats.storageLimitGB) * 100;

  // 2. Pantalla de carga mientras verifica credenciales
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center font-bold text-slate-500 animate-pulse">
          Verificando credenciales de seguridad...
        </div>
      </div>
    );
  }

  // 3. Muro final: Si no es superadmin, no renderiza nada (la redirección ya lo está echando)
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

      {/* TABLA DE USUARIOS */}
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
          <div><h3 className="text-sm font-bold text-slate-800">📋 Base de Datos de Clientes y Consumo</h3></div>
          <input type="text" placeholder="🔍 Buscar por nombre, teléfono o empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-80 p-3 rounded-xl bg-white border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-4 px-5 font-bold">Cliente / Empresa</th>
                <th className="py-4 px-5 font-bold">Rol y Nivel</th>
                <th className="py-4 px-5 font-bold">Estado del Pago</th>
                <th className="py-4 px-5 font-bold">Consumo Datos</th>
                <th className="py-4 px-5 font-bold text-right">Control de Cuenta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-base font-medium">Cargando base de datos...</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className={`transition ${u.status === 'suspended' ? 'bg-rose-50/30' : 'hover:bg-slate-50/80'}`}>
                  <td className="py-4 px-5">
                    <div className="font-black text-slate-800 text-base">{u.name || 'Sin Nombre'}</div>
                    <div className="text-xs font-bold text-indigo-600 truncate max-w-[200px] mt-0.5">{u.company || 'Sin Empresa'}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">📞 {u.phone || 'Sin teléfono'}</div>
                  </td>
                  
                  <td className="py-4 px-5 space-y-2">
                    <span className="block font-bold text-slate-700">{getRoleLabel(u.role)}</span>
                    <span className={`inline-block px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                      u.plan === 'pro_plus' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      u.plan === 'pro' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      Plan {u.plan?.replace('_', ' ') || 'Free'}
                    </span>
                  </td>

                  <td className="py-4 px-5">
                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                      u.billing_cycle === 'free' ? 'bg-amber-100 text-amber-700' :
                      u.billing_cycle === 'annual' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {u.billing_cycle === 'free' ? '🎁 Promo / Gratis' : u.billing_cycle === 'annual' ? '✅ Pago Anual' : '🔄 Pago Mensual'}
                    </span>
                  </td>

                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-1">
                      <span className={`font-black font-mono text-sm ${u.storage_used_mb > 500 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {u.storage_used_mb > 1024 ? (u.storage_used_mb / 1024).toFixed(2) + ' GB' : u.storage_used_mb + ' MB'}
                      </span>
                      {u.storage_used_mb > 500 && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Alto Consumo</span>}
                    </div>
                  </td>

                  <td className="py-4 px-5 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setEditingUser(u); setEditRole(u.role || 'user_particular'); setEditPlan(u.plan || 'free'); setEditCycle(u.billing_cycle || 'monthly');
                      }}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition"
                    >
                      📇 Ver Ficha
                    </button>
                    {u.role !== 'superadmin' && (
                      <button 
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition ${u.status === 'suspended' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                      >
                        {u.status === 'suspended' ? 'Reanudar' : 'Bloquear'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GIGANTE DE FICHA DE CLIENTE Y EDICIÓN */}
      {editingUser && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">📇 Ficha Completa y Permisos</h3>
                <p className="text-sm text-slate-500 mt-1">Gestionando a: <strong>{editingUser.name}</strong></p>
              </div>
              <button onClick={() => setEditingUser(null)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xl cursor-pointer">✕</button>
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
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full p-4 rounded-xl bg-white border-2 border-slate-300 font-bold text-base focus:outline-none focus:border-indigo-500 shadow-sm">
                      <option value="user_particular">Usuario Particular</option>
                      <option value="buyer">Cliente / Instalador</option>
                      <option value="client_employee">Técnico Cliente</option>
                      <option value="sales_rep">Comercial</option>
                      <option value="supplier_owner">Gerencia Proveedor</option>
                      <option value="admin">Administrador Global</option>
                      <option value="superadmin">👑 Super Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-2">Nivel de Plan (Facturación)</label>
                    <select value={editPlan} onChange={e => setEditPlan(e.target.value)} className="w-full p-4 rounded-xl bg-white border-2 border-slate-300 font-bold text-base focus:outline-none focus:border-indigo-500 shadow-sm">
                      <option value="free">🟢 Plan Free (Limitado)</option>
                      <option value="pro">🔵 Plan PRO (Avanzado)</option>
                      <option value="pro_plus">🟣 Plan PRO Plus (Ilimitado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-2">Estado de Pago / Ciclo</label>
                    <select value={editCycle} onChange={e => setEditCycle(e.target.value)} className="w-full p-4 rounded-xl bg-white border-2 border-slate-300 font-bold text-base focus:outline-none focus:border-indigo-500 shadow-sm">
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