'use client';

import React, { useState } from 'react';
import { AuthUser } from './LoginPage';

interface TrackingViewProps {
  user: AuthUser;
}

export default function TrackingView({ user }: TrackingViewProps) {
  const [selectedRep, setSelectedRep] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [trackingVisits, setTrackingVisits] = useState<Array<{
    id: string;
    repName: string;
    client: string;
    checkIn: string | null;
    checkOut: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    coords: string;
    lat: number;
    lng: number;
    notes?: string;
    date: string;
  }>>([
    { id: 'trk-1', repName: 'Marta Rodríguez', client: 'Instalaciones Gómez S.L.', checkIn: '09:30', checkOut: '10:15', status: 'completed', coords: '40.4168, -3.7038', lat: 40.4168, lng: -3.7038, notes: 'Presupuesto enviado.', date: '2026-10-04' },
    { id: 'trk-2', repName: 'Marta Rodríguez', client: 'Reformas y Cerramientos Rivas', checkIn: null, checkOut: null, status: 'pending', coords: '40.4220, -3.6920', lat: 40.4220, lng: -3.6920, notes: '', date: '2026-10-04' },
    { id: 'trk-3', repName: 'Pablo Herrero', client: 'Climatizaciones Centro S.L.', checkIn: null, checkOut: null, status: 'pending', coords: '40.4500, -3.7000', lat: 40.4500, lng: -3.7000, notes: '', date: '2026-10-05' },
    { id: 'trk-4', repName: 'Marta Rodríguez', client: 'Fontanería Paco', checkIn: null, checkOut: null, status: 'pending', coords: '40.4300, -3.7100', lat: 40.4300, lng: -3.7100, notes: '', date: '2026-10-06' }
  ]);

  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [activeVisitForNote, setActiveVisitForNote] = useState<any | null>(null);
  const [visitNoteInput, setVisitNoteInput] = useState('');
  const [nextVisitDateInput, setNextVisitDateInput] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);

  const displayedVisits = trackingVisits
    .filter(v => {
      const matchRep = selectedRep === 'all' ? true : v.repName === selectedRep;
      const matchDate = dateFilter === 'all' ? true : v.date === dateFilter;
      return matchRep && matchDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date)); 

  const handleToggleVisit = (visitId: string) => {
    setExpandedVisitId(expandedVisitId === visitId ? null : visitId);
  };

  const handleNavigateTo = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleCreateBudget = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Esta acción cargará los datos de este cliente en la pestaña de "Documentos".');
  };

  const handleScheduleNewVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Programando nueva visita en el calendario...');
  };

  const handleStartVisit = (e: React.MouseEvent, visitId: string) => {
    e.stopPropagation();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTrackingVisits(prev => prev.map(v => v.id === visitId ? { ...v, checkIn: timeNow, status: 'in_progress' } : v));
  };

  const handleSmartCheckOut = (e: React.MouseEvent, visit: any) => {
    e.stopPropagation();
    setActiveVisitForNote(visit); 
  };

  const handleSaveVisitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisitForNote) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setTrackingVisits(prev => prev.map(v => {
      if (v.id === activeVisitForNote.id) {
        return {
          ...v, checkOut: timeNow, status: 'completed',
          notes: visitNoteInput ? `Nota: ${visitNoteInput} ${nextVisitDateInput ? `(Próxima: ${nextVisitDateInput})` : ''}` : 'Sin notas.'
        };
      }
      return v;
    }));

    setActiveVisitForNote(null);
    setVisitNoteInput('');
    setNextVisitDateInput('');
    setExpandedVisitId(null);
  };

  const togglePushNotifications = () => {
    if (!pushEnabled) {
      alert('🔔 Solicitando permiso al navegador para enviarte el resumen diario de tus reuniones...');
      setPushEnabled(true);
    } else {
      setPushEnabled(false);
    }
  };

  const activeVisitObj = trackingVisits.find(v => v.id === expandedVisitId) || displayedVisits[0];
  const mapLat = activeVisitObj ? activeVisitObj.lat : 40.4168;
  const mapLng = activeVisitObj ? activeVisitObj.lng : -3.7038;
  const offset = 0.015;
  const bbox = `${mapLng - offset},${mapLat - offset},${mapLng + offset},${mapLat + offset}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapLat},${mapLng}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 pb-12">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">📍 Rutas y Calendario</h2>
          <p className="text-base text-slate-500">Selecciona un evento para ver la ruta y gestionar la visita.</p>
        </div>
        <button onClick={togglePushNotifications} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 border cursor-pointer w-fit ${pushEnabled ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
          {pushEnabled ? '🔔 Resumen Push Activado' : '🔕 Activar Push Diario'}
        </button>
      </div>

      {/* FILTROS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {user.role === 'supplier_owner' && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Comercial:</span>
            <select value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)} className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-base text-slate-800 font-bold focus:outline-none cursor-pointer focus:border-indigo-500">
              <option value="all">Equipo Completo</option>
              <option value="Marta Rodríguez">Marta Rodríguez</option>
              <option value="Pablo Herrero">Pablo Herrero</option>
            </select>
          </div>
        )}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Día:</span>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-base text-slate-800 font-bold focus:outline-none cursor-pointer focus:border-indigo-500">
            <option value="all">Todas las fechas</option>
            <option value="2026-10-04">Hoy</option>
            <option value="2026-10-05">Mañana</option>
          </select>
        </div>
      </div>

      {/* MAPA ARRIBA */}
      <div className="w-full h-64 sm:h-80 bg-slate-100 rounded-3xl border border-slate-300 overflow-hidden relative shadow-inner shrink-0">
        <iframe 
          width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} 
          src={mapUrl} 
          style={{ filter: 'contrast(1.1) brightness(1.02)' }}
          title="Mapa de Rutas"
        ></iframe>
        
        {expandedVisitId && (
          <div className="absolute bottom-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-2xl border border-indigo-700 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <span className="text-xl">🚗</span> Ruta detectada hacia destino
          </div>
        )}
        
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> GPS Activo
        </div>
      </div>

      {/* LISTA DE EVENTOS ABAJO */}
      <div className="flex flex-col space-y-4 pt-2">
        {displayedVisits.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-base font-medium bg-slate-50 border border-dashed border-slate-300 rounded-2xl">No hay visitas programadas.</div>
        ) : (
          displayedVisits.map(visit => {
            const isExpanded = expandedVisitId === visit.id;
            
            return (
              <div 
                key={visit.id} 
                onClick={() => handleToggleVisit(visit.id)}
                className={`bg-slate-50 border rounded-2xl relative overflow-hidden transition-all duration-300 cursor-pointer shadow-sm
                  ${isExpanded ? 'border-indigo-400 ring-4 ring-indigo-400/20' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
              >
                {visit.status === 'in_progress' && <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>}
                {visit.status === 'completed' && <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>}
                
                <div className="p-5 flex items-center justify-between">
                  <div className="pl-3">
                    <span className="font-black text-slate-800 text-xl block mb-1">{visit.client}</span>
                    <span className="text-slate-500 text-sm font-medium">📅 {visit.date} {user.role === 'supplier_owner' ? `· 👤 ${visit.repName}` : ''}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-sm border ${
                    visit.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    visit.status === 'in_progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {visit.status === 'completed' ? '✓ Visitado' : visit.status === 'in_progress' ? '⏳ En Reunión' : 'Pendiente'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-200 bg-white animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-3 gap-3 mt-5 mb-5">
                      <button onClick={(e) => { e.stopPropagation(); handleNavigateTo(visit.lat, visit.lng); }} className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition border border-indigo-100 cursor-pointer">
                        <span className="text-3xl mb-2">📍</span><span className="text-sm font-bold text-indigo-900">Ir (Maps)</span>
                      </button>
                      <button onClick={handleCreateBudget} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition border border-slate-200 cursor-pointer">
                        <span className="text-3xl mb-2">📄</span><span className="text-sm font-bold text-slate-700">Presupuesto</span>
                      </button>
                      <button onClick={handleScheduleNewVisit} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition border border-slate-200 cursor-pointer">
                        <span className="text-3xl mb-2">📅</span><span className="text-sm font-bold text-slate-700">+ Visita</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      {visit.status === 'pending' && (
                        <button onClick={(e) => handleStartVisit(e, visit.id)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 text-base transition cursor-pointer">
                          Registrar Llegada (Check-in)
                        </button>
                      )}
                      {visit.status === 'in_progress' && (
                        <div className="space-y-3 text-center">
                          <p className="text-sm text-slate-600 font-medium">📡 Al salir, comprobaremos el GPS para cerrar la reunión.</p>
                          <button onClick={(e) => handleSmartCheckOut(e, visit)} className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl shadow-md hover:bg-rose-700 text-base animate-pulse transition cursor-pointer">
                            Finalizar y Añadir Notas
                          </button>
                        </div>
                      )}
                      {visit.status === 'completed' && (
                        <div className="text-base text-slate-700">
                          <div className="grid grid-cols-2 gap-3 mb-3 text-center">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm">Llegada: <strong className="text-lg block text-slate-800 mt-1">{visit.checkIn}</strong></div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm">Salida: <strong className="text-lg block text-slate-800 mt-1">{visit.checkOut}</strong></div>
                          </div>
                          <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl border border-emerald-200 text-sm leading-relaxed">
                            <strong className="block mb-1 text-emerald-800">Resumen y Acuerdos:</strong> {visit.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: NOTAS DE SALIDA Y CIERRE */}
      {activeVisitForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-8 text-slate-900 shadow-2xl space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">🤖</div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Cierre de Visita</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">¿De qué habéis hablado en <span className="font-bold text-slate-700">{activeVisitForNote.client}</span>?</p>
              </div>
            </div>

            <form onSubmit={handleSaveVisitFeedback} className="space-y-5 pt-2">
              <div>
                <label className="block text-slate-800 font-bold mb-2 text-base">Resumen y Acuerdos *</label>
                <textarea 
                  required rows={5} placeholder="Ej. Interesados en el catálogo de válvulas..."
                  value={visitNoteInput} onChange={e => setVisitNoteInput(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 text-slate-800 text-base focus:outline-none focus:border-indigo-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-slate-800 font-bold mb-2 text-base">Programar seguimiento (Opcional)</label>
                <input type="date" value={nextVisitDateInput} onChange={e => setNextVisitDateInput(e.target.value)} className="w-full p-4 rounded-xl border border-slate-300 text-slate-800 font-bold text-base focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveVisitForNote(null)} className="w-1/3 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition text-base">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition shadow-lg text-lg">
                  Guardar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}