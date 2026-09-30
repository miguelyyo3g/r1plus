'use client';

import React, { useState } from 'react';
import { SUPPLIER_TEMPLATES, SupplierTechnicalSheet } from '@/data/supplierTemplates';

interface AdminDashboardProps {
  onBackToApp?: () => void;
  onLogout?: () => void;
}

export default function AdminDashboard({ onBackToApp, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'templates' | 'clients'>('overview');
  const [templates] = useState<SupplierTechnicalSheet[]>(SUPPLIER_TEMPLATES);

  const [suppliers] = useState([
    {
      id: 'prov-ventanas',
      name: 'Válvulas & Ventanas del Norte S.L.',
      cif: 'B-84920194',
      category: 'Carpintería PVC / Aluminio',
      email: 'contacto@valvulasdelnorte.com',
      sheetsCount: 1,
      status: 'Activo'
    },
    {
      id: 'prov-cierres',
      name: 'Cierres & Cerramientos Industriales S.L.',
      cif: 'B-28941029',
      category: 'Cierres y Persianas Metálicas',
      email: 'pedidos@cierresindustriales.es',
      sheetsCount: 1,
      status: 'Activo'
    },
    {
      id: 'prov-cristal',
      name: 'Cristalería Central Madrid S.A.',
      cif: 'A-78392018',
      category: 'Vidrio y Acristalamientos',
      email: 'info@cristaleriacentral.es',
      sheetsCount: 0,
      status: 'Pendiente'
    }
  ]);

  const [clients] = useState([
    {
      id: 'cli-1',
      name: 'Carlos Gómez',
      company: 'Instalaciones Gómez S.L.',
      email: 'carlos.gomez@instalacionesgomez.es',
      cif: 'B-92837461',
      orders: 14,
      totalVolume: '38.450 €'
    },
    {
      id: 'cli-2',
      name: 'Manuel Rivas',
      company: 'Reformas y Cerramientos Rivas',
      email: 'm.rivas@reformasrivas.com',
      cif: 'B-12849102',
      orders: 6,
      totalVolume: '14.200 €'
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-2xl font-black text-indigo-500">r1</span>
            <span className="text-2xl font-black text-white">plus</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
            Panel Master Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              ← Ir a la App / Chat
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3.5 py-1.5 rounded-lg border border-rose-500/30 transition cursor-pointer"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-slate-950/50 border-r border-slate-800 p-4 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>📊</span>
            <span>Visión General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🏭</span>
            <span>Proveedores & Fabricantes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>📋</span>
            <span>Fichas Técnicas Activas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>👷</span>
            <span>Clientes & Instaladores</span>
          </button>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Panel de Control Global</h2>
                <p className="text-xs text-slate-400">Resumen operativo de la red B2B r1plus</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-xs font-medium">Volumen Facturado</span>
                  <div className="text-2xl font-black text-white mt-1">128.450 €</div>
                  <span className="text-[11px] text-emerald-400 font-semibold">+18.2% este mes</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-xs font-medium">Proveedores Homologados</span>
                  <div className="text-2xl font-black text-white mt-1">12</div>
                  <span className="text-[11px] text-indigo-400 font-semibold">2 pendientes de alta</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-xs font-medium">Fichas Técnicas en Uso</span>
                  <div className="text-2xl font-black text-white mt-1">{templates.length}</div>
                  <span className="text-[11px] text-slate-400">Ventanas, Cierres, etc.</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-xs font-medium">Presupuestos A4 Emitidos</span>
                  <div className="text-2xl font-black text-white mt-1">84</div>
                  <span className="text-[11px] text-emerald-400 font-semibold">92% confirmados</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Proveedores & Fabricantes</h2>
                  <p className="text-xs text-slate-400">Gestión de empresas industriales en r1plus</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  + Alta Nuevo Fabricante
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/50 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">CIF</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4 text-center">Fichas</th>
                      <th className="py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {suppliers.map(prov => (
                      <tr key={prov.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-bold text-white">{prov.name}</td>
                        <td className="py-3.5 px-4 text-slate-400">{prov.cif}</td>
                        <td className="py-3.5 px-4">{prov.category}</td>
                        <td className="py-3.5 px-4 text-slate-400">{prov.email}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-400">{prov.sheetsCount}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {prov.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Catálogo de Fichas de Medidas</h2>
                <p className="text-xs text-slate-400">Plantillas dinámicas asignadas a cada fabricante</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(tpl => (
                  <div key={tpl.id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {tpl.supplierName}
                    </span>
                    <h3 className="text-sm font-bold text-white">{tpl.title}</h3>
                    <p className="text-xs text-slate-400">{tpl.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Clientes & Instaladores</h2>
                <p className="text-xs text-slate-400">Empresas compradoras y profesionales</p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/50 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Responsable</th>
                      <th className="py-3 px-4">Razón Social</th>
                      <th className="py-3 px-4">CIF</th>
                      <th className="py-3 px-4 text-center">Pedidos</th>
                      <th className="py-3 px-4 text-right">Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {clients.map(cli => (
                      <tr key={cli.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-bold text-white">{cli.name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{cli.company}</td>
                        <td className="py-3.5 px-4 text-slate-400">{cli.cif}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-400">{cli.orders}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-400">{cli.totalVolume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}