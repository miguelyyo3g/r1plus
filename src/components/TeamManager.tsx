'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface TeamManagerProps {
  user: any; // El usuario logueado actualmente (el gerente)
}

export default function TeamManager({ user }: TeamManagerProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [managerProfile, setManagerProfile] = useState<any>(null);

  useEffect(() => {
    loadTeamData();
  }, [user.id]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      // 1. Obtener el perfil del gerente para saber su Empresa (organization_id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setManagerProfile(profile);

        // Si tiene empresa, cargamos a su equipo y las invitaciones pendientes
        if (profile.organization_id) {
          const [teamRes, invRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('organization_id', profile.organization_id),
            supabase.from('invitations').select('*').eq('organization_id', profile.organization_id).eq('status', 'pending')
          ]);

          if (teamRes.data) setTeamMembers(teamRes.data.filter(m => m.id !== user.id)); // Excluimos al propio gerente de la lista
          if (invRes.data) setInvitations(invRes.data);
        }
      }
    } catch (error) {
      console.error('Error cargando equipo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPhone.trim();
    if (!cleanPhone || !managerProfile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert([{
          organization_id: managerProfile.organization_id,
          phone_number: cleanPhone,
          invited_by: user.id,
          status: 'pending'
        }])
        .select();

      if (error) throw error;

      if (data) {
        setInvitations([...invitations, data[0]]);
        setNewPhone('');
        alert(`¡Invitación preparada para ${cleanPhone}! Cuando inicie sesión se unirá a la empresa.`);
      }
    } catch (err: any) {
      alert('Error al invitar (¿Quizás ya está invitado?): ' + err.message);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm('¿Cancelar esta invitación?')) return;
    try {
      await supabase.from('invitations').delete().eq('id', id);
      setInvitations(invitations.filter(inv => inv.id !== id));
    } catch (err: any) {
      alert('Error al cancelar: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`¿Estás seguro de expulsar a ${name || 'este comercial'} de la empresa?`)) return;
    try {
      // Para expulsarlo, le quitamos la organización y le devolvemos el rol 'free'
      await supabase
        .from('profiles')
        .update({ organization_id: null, role: 'free' })
        .eq('id', memberId);
        
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    } catch (err: any) {
      alert('Error al expulsar: ' + err.message);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">Cargando equipo...</div>;

  // Si el usuario no tiene rol PRO o no tiene empresa asignada aún
  if (!managerProfile?.organization_id || !['pro', 'pro_plus'].includes(managerProfile?.role)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-slate-800 mb-2">🔒 Función Exclusiva Pro</h2>
        <p className="text-slate-500 font-medium mb-4">
          Para añadir comerciales y compartir el CRM de tu empresa, necesitas una suscripción Pro o Pro Plus.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-black text-slate-800">👥 Gestión de Equipo (Comerciales)</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Invita a tus técnicos o comerciales con su número de teléfono.</p>
      </div>

      {/* FORMULARIO DE INVITACIÓN */}
      <form onSubmit={handleInvite} className="flex gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Teléfono del Comercial</label>
          <input
            type="tel"
            placeholder="+34 600 000 000"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-sm focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div className="flex items-end">
          <button 
            type="submit" 
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-sm transition"
          >
            + Enviar Invitación
          </button>
        </div>
      </form>

      {/* INVITACIONES PENDIENTES */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-black text-amber-600 uppercase tracking-wider">⏳ Invitaciones Pendientes</h3>
          <div className="grid gap-2">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <div>
                  <span className="font-mono font-bold text-amber-800 text-sm">📞 {inv.phone_number}</span>
                  <p className="text-[10px] text-amber-600 mt-0.5 font-medium">Esperando a que inicie sesión...</p>
                </div>
                <button 
                  onClick={() => handleCancelInvite(inv.id)} 
                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMERCIALES ACTIVOS */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wider">✅ Comerciales Activos ({teamMembers.length})</h3>
        
        {teamMembers.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Aún no tienes comerciales en tu equipo.</p>
        ) : (
          <div className="grid gap-2">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <div>
                  <span className="font-bold text-slate-800 text-sm">👤 {member.full_name || 'Usuario sin nombre'}</span>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{member.phone}</p>
                </div>
                <button 
                  onClick={() => handleRemoveMember(member.id, member.full_name)} 
                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition"
                >
                  Expulsar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}