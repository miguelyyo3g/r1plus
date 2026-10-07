'use client';

import React, { useState } from 'react';
import { AuthUser } from './LoginPage';

interface TrackingViewProps {
  user: AuthUser;
}

export default function TrackingView({ user }: TrackingViewProps) {
  const [selectedRep, setSelectedRep] = useState('all');

  const [trackingVisits, setTrackingVisits] = useState<Array<{
    id: string;
    repName: string;
    client: string;
    checkIn: string | null;
    checkOut: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    coords: string;
    notes?: string;
  }>>([
    { id: 'trk-1', repName: 'Marta Rodríguez', client: 'Instalaciones Gómez S.L.', checkIn: '09:30', checkOut: '10:15', status: 'completed', coords: '40.4168, -3.7038', notes: 'Presupuesto enviado. Muy interesados en la gama industrial.' },
    { id: 'trk-2', repName: 'Marta Rodríguez', client: 'Reformas y Cerramientos Rivas', checkIn: null, checkOut: null, status: 'pending', coords: 'Pendiente de llegada', notes: '' },
    { id: 'trk-3', repName: 'Pablo Herrero', client: 'Climatizaciones Centro S.L.', checkIn: null, checkOut: null, status: 'pending', coords: 'Pendiente de llegada', notes: '' }
  ]);

  // Estado para el asistente inteligente de notas al hacer check-out
  const [activeVisitForNote, setActiveVisitForNote] = useState<any | null>(null);
  const [visitNoteInput, setVisitNoteInput] = useState('');
  const [nextVisitDateInput, setNextVisitDateInput] = useState('');
  const [assistantNotice, setAssistantNotice] = useState('');

  const handleStartVisit = (visitId: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTrackingVisits(prev => prev.map(v => v.id === visitId ? { ...v, checkIn: timeNow, status: 'in_progress', coords: '40.4172, -3.7040 (GPS Verificado)' } : v));
  };

  const handleTriggerCheckOut = (visit: any) => {
    // Abrimos el asistente inteligente en lugar de cerrar en seco
    setActiveVisitForNote(visit);
    setVisitNoteInput('');
    setNextVisitDateInput('');
  };

  const handleSaveVisitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisitForNote) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setTrackingVisits(prev => prev.map(v => {
      if (v.id === activeVisitForNote.id) {
        return {
          ...v,
          checkOut: timeNow,
          status: 'completed',
          notes: visitNoteInput ? `Nota: ${visitNoteInput} ${nextVisitDateInput ? `(Próxima visita: ${nextVisitDateInput})` : ''}` : 'Visita finalizada sin notas.'
        };
      }
      return v;
    }));

    setAssistantNotice(`🤖 Asistente IA: ¡Perfecto! Notas guardadas y recordatorio programado para ${activeVisitForNote.client}. Buen trabajo.`);
    setTimeout(() => setAssistantNotice(''), 5000);
    setActiveVisitForNote(null);
  };

  const displayedVisits = trackingVisits.filter(v => selectedRep === 'all' ? true : v.repName === selectedRep);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">🤖 Asistente IA de Visitas Comerciales</h2>
          <p className="text-xs text-slate-500">Tu copiloto en ruta para no olvidar ningún detalle ni seguimiento.</p>
        </div>
        <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
          Copiloto Activo
        </span>
      </div>

      {assistantNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium shadow-2xs">
          {assistantNotice}
        </div>
      )}

      {/* SELECTOR EXCLUSIVO PARA EL GERENTE PROVEEDOR */}
      {user.role === 'supplier_owner' && (
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Supervisar ruta de:</span>
          <select 
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="w-full p-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 font-semibold focus:outline-none"
          >
            <option value="all">Equipo Completo (Todos)</option>
            <option value="Marta Rodríguez">Marta Rodríguez</option>
            <option value="Pablo Herrero">Pablo Herrero</option>
          </select>
        </div>
      )}

      <div className="space-y-3 pt-1">
        {displayedVisits.map(visit => (
          <div key={visit.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-sm">{visit.client}</span>
                <div className="text-slate-500 text-[11px]">Comercial: <strong>{visit.repName}</strong></div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                visit.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {visit.status === 'completed' ? '✓ Visita Realizada' : visit.status === 'in_progress' ? '⏳ En Visita Activa' : 'Programada'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <div>Llegada: <strong>{visit.checkIn || '--:--'}</strong></div>
              <div>Salida: <strong>{visit.checkOut || '--:--'}</strong></div>
              {visit.notes && <div className="col-span-2 text-[11px] text-indigo-700 font-medium pt-1 border-t border-slate-100">💬 {visit.notes}</div>}
            </div>

            {/* BOTONES DE ACCIÓN */}
            {user.role !== 'supplier_owner' && (
              <div>
                {visit.status === 'pending' && (
                  <button type="button" onClick={() => handleStartVisit(visit.id)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer">
                    📍 Registrar Llegada (Check-in)
                  </button>
                )}
                {visit.status === 'in_progress' && (
                  <button type="button" onClick={() => handleTriggerCheckOut(visit)} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer animate-pulse">
                    🏁 Finalizar Visita (Asistente IA)
                  </button>
                )}
                {visit.status === 'completed' && (
                  <div className="text-center text-[11px] text-emerald-600 font-bold py-1">
                    ✓ Visita archivada con éxito en el historial
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL INTELIGENTE DEL ASISTENTE AL SALIR DE LA VISITA */}
      {activeVisitForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 text-slate-900 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-base font-bold text-slate-800">Asistente IA: Cierre de Visita</h3>
                <p className="text-[11px] text-slate-500">¿Qué tal ha ido en {activeVisitForNote.client}?</p>
              </div>
            </div>

            <form onSubmit={handleSaveVisitFeedback} className="space-y-3 text-xs pt-1">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notas de la visita / Acuerdos clave *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Ej. Le gustó el catálogo, nos pidió presupuesto para la semana que viene..."
                  value={visitNoteInput}
                  onChange={e => setVisitNoteInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Programar próxima visita / Seguimiento (Opcional)</label>
                <input 
                  type="date"
                  value={nextVisitDateInput}
                  onChange={e => setNextVisitDateInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setActiveVisitForNote(null)} className="flex-1 py-2 rounded-xl bg-slate-100 font-semibold cursor-pointer">Omitir</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer">Guardar con IA</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}