'use client';

import React, { useState, useEffect } from 'react';
import B2BChatRoom from '@/components/B2BChatRoom';

export interface CommercialAgent {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  activeChats: number;
}

export interface SupplierEntity {
  id: string;
  name: string;
  cif: string;
  category: string;
  adminEmail: string;
  adminPassword: string;
  status: 'active' | 'suspended';
  paymentStatus: string;
  commercials: CommercialAgent[];
}

export interface TechnicalSheet {
  id: string;
  title: string;
  supplierName: string;
  category: string;
  refCode: string;
  fileSize: string;
  uploadDate: string;
}

export interface PlatformPricing {
  supplierBasePrice: number;
  supplierIncludedSeats: number;
  supplierExtraSeatPrice: number;
  clientProBasePrice: number;
  clientExtraSeatPrice: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'supplier_owner' | 'sales_rep' | 'buyer' | 'client_employee' | 'admin';
  company: string;
  companyType: 'supplier' | 'client';
}

// 1. PROVEEDOR MATRIZ
const PROVE_DATA: AuthUser = {
  id: 'user-prov-root',
  name: 'Antonio Morales (Gerente)',
  email: 'gerencia@valvulasdelnorte.com',
  role: 'supplier_owner',
  company: 'Válvulas & Ventanas del Norte S.L.',
  companyType: 'supplier'
};

// 2. COMERCIAL PROVEEDOR
const COMER_DATA: AuthUser = {
  id: 'user-rep-2',
  name: 'Marta Rodríguez (Comercial)',
  email: 'marta.rodriguez@valvulasdelnorte.com',
  role: 'sales_rep',
  company: 'Válvulas & Ventanas del Norte S.L.',
  companyType: 'supplier'
};

// 3. CLIENTE INSTALADOR MATRIZ
const CLIEN_DATA: AuthUser = {
  id: 'user-buyer-1',
  name: 'Carlos Gómez (Instalador)',
  email: 'carlos.gomez@instalacionesgomez.es',
  role: 'buyer',
  company: 'Instalaciones Gómez S.L.',
  companyType: 'client'
};

// 4. COMERCIAL / DEPARTAMENTO DEL CLIENTE
const CLICOR_DATA: AuthUser = {
  id: 'user-client-rep-1',
  name: 'David Ortiz (Técnico / Comercial)',
  email: 'david.ortiz@instalacionesgomez.es',
  role: 'client_employee',
  company: 'Instalaciones Gómez S.L.',
  companyType: 'client'
};

// 5. SUPER ADMIN
const ADMIN_DATA: AuthUser = {
  id: 'user-admin-root',
  name: 'Super Admin r1plus',
  email: 'admin@r1plus.com',
  role: 'admin',
  company: 'r1plus Platform Central',
  companyType: 'supplier'
};

function AdminDashboardView({ onBackToApp, onLogout }: { onBackToApp: () => void; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'clients' | 'sheets' | 'pricing'>('overview');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddSheetModal, setShowAddSheetModal] = useState(false);
  const [activeSupplierForAgent, setActiveSupplierForAgent] = useState<SupplierEntity | null>(null);

  const [showSupplierPass, setShowSupplierPass] = useState(false);
  const [showClientPass, setShowClientPass] = useState(false);
  const [showAgentPass, setShowAgentPass] = useState(false);

  const [pricing, setPricing] = useState<PlatformPricing>({
    supplierBasePrice: 60,
    supplierIncludedSeats: 2,
    supplierExtraSeatPrice: 10,
    clientProBasePrice: 20,
    clientExtraSeatPrice: 10
  });

  const [pricingForm, setPricingForm] = useState<PlatformPricing>({ ...pricing });
  const [pricingSavedBanner, setPricingSavedBanner] = useState(false);

  const [newSupplier, setNewSupplier] = useState({ name: '', cif: '', category: '', email: '', password: '' });
  const [newAgent, setNewAgent] = useState({ name: '', email: '', phone: '', password: '' });
  const [newClient, setNewClient] = useState({ name: '', company: '', cif: '', email: '', password: '', plan: 'PRO' as 'Free' | 'PRO', seats: 1 });
  const [newSheet, setNewSheet] = useState({ title: '', supplierName: 'Válvulas & Ventanas del Norte S.L.', category: 'Valvulería', refCode: '' });

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
  };

  const [suppliers, setSuppliers] = useState<SupplierEntity[]>([
    {
      id: 'prov-1',
      name: 'Válvulas & Ventanas del Norte S.L.',
      cif: 'B-84920194',
      category: 'Carpintería PVC / Aluminio / Valvulería',
      adminEmail: 'contacto@valvulasdelnorte.com',
      adminPassword: 'NorteAdmin2026*',
      status: 'active',
      paymentStatus: 'Al día',
      commercials: [
        { id: 'agent-1', name: 'Marta Rodríguez', email: 'marta.rodriguez@valvulasdelnorte.com', password: '123', phone: '+34 600 11 22 33', activeChats: 8 },
        { id: 'agent-2', name: 'Pablo Herrero (Zona Centro)', email: 'pablo.herrero@valvulasdelnorte.com', password: '123', phone: '+34 600 44 55 66', activeChats: 4 },
        { id: 'agent-extra', name: 'Lucía Santos (Comercial Extra)', email: 'lucia.santos@valvulasdelnorte.com', password: '123', phone: '+34 600 77 88 99', activeChats: 2 }
      ]
    },
    {
      id: 'prov-2',
      name: 'Cierres & Cerramientos Industriales S.L.',
      cif: 'B-28941029',
      category: 'Cierres Metálicos y Automatismos',
      adminEmail: 'pedidos@cierresindustriales.es',
      adminPassword: '123',
      status: 'active',
      paymentStatus: 'Al día',
      commercials: [
        { id: 'agent-3', name: 'Raúl Santana', email: 'raul.santana@cierresindustriales.es', password: '123', phone: '+34 611 77 88 99', activeChats: 5 }
      ]
    }
  ]);

  const [clients, setClients] = useState([
    { id: 'cli-1', name: 'Carlos Gómez', company: 'Instalaciones Gómez S.L.', cif: 'B-92837461', email: 'carlos.gomez@instalacionesgomez.es', password: '123', plan: 'PRO' as 'Free' | 'PRO', seats: 2, status: 'active' as 'active' | 'suspended', paymentStatus: 'Al día', warningCount: 0 },
    { id: 'cli-2', name: 'Manuel Rivas', company: 'Reformas y Cerramientos Rivas', cif: 'B-12849102', email: 'm.rivas@reformasrivas.com', password: '123', plan: 'PRO' as 'Free' | 'PRO', seats: 1, status: 'active' as 'active' | 'suspended', paymentStatus: 'Aviso 2 enviado', warningCount: 2 },
    { id: 'cli-3', name: 'Javier Méndez', company: 'Carpintería JM', cif: '48392019K', email: 'info@carpinteriajm.com', password: '123', plan: 'Free' as 'Free' | 'PRO', seats: 1, status: 'active' as 'active' | 'suspended', paymentStatus: 'Sin cuota', warningCount: 0 }
  ]);

  const [sheets, setSheets] = useState<TechnicalSheet[]>([
    {
      id: 'sheet-1',
      title: 'Ficha Técnica Oficial Válvula Inox 316 DN50',
      supplierName: 'Válvulas & Ventanas del Norte S.L.',
      category: 'Valvulería Industrial',
      refCode: 'VALV-INOX-DN50',
      fileSize: '1.4 MB',
      uploadDate: '24/09/2026'
    }
  ]);

  const calculateSupplierCost = (commercialsCount: number) => {
    const extraSeats = Math.max(0, commercialsCount - pricing.supplierIncludedSeats);
    return pricing.supplierBasePrice + (extraSeats * pricing.supplierExtraSeatPrice);
  };

  const calculateClientCost = (plan: 'Free' | 'PRO', seats: number) => {
    if (plan === 'Free') return 0;
    const extraSeats = Math.max(0, seats - 1);
    return pricing.clientProBasePrice + (extraSeats * pricing.clientExtraSeatPrice);
  };

  const totalSupplierRevenue = suppliers.reduce((acc, s) => s.status === 'active' ? acc + calculateSupplierCost(s.commercials.length) : acc, 0);
  const totalClientRevenue = clients.reduce((acc, c) => c.status === 'active' ? acc + calculateClientCost(c.plan, c.seats) : acc, 0);

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    setPricing({ ...pricingForm });
    setPricingSavedBanner(true);
    setTimeout(() => setPricingSavedBanner(false), 3000);
  };

  const handleToggleSupplierStatus = (id: string) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'suspended' : 'active' } : s));
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.email || !newSupplier.password) return;
    setSuppliers(prev => [...prev, {
      id: `prov-${Date.now()}`,
      name: newSupplier.name,
      cif: newSupplier.cif || 'Pendiente',
      category: newSupplier.category || 'Suministros',
      adminEmail: newSupplier.email,
      adminPassword: newSupplier.password,
      status: 'active',
      paymentStatus: 'Al día',
      commercials: []
    }]);
    setNewSupplier({ name: '', cif: '', category: '', email: '', password: '' });
    setShowAddSupplierModal(false);
  };

  const handleAddCommercial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplierForAgent || !newAgent.name || !newAgent.email || !newAgent.password) return;
    const createdAgent: CommercialAgent = {
      id: `agent-${Date.now()}`,
      name: newAgent.name,
      email: newAgent.email,
      phone: newAgent.phone || 'No indicado',
      password: newAgent.password,
      activeChats: 0
    };
    setSuppliers(prev => prev.map(s => s.id === activeSupplierForAgent.id ? { ...s, commercials: [...s.commercials, createdAgent] } : s));
    setNewAgent({ name: '', email: '', phone: '', password: '' });
    setActiveSupplierForAgent(null);
  };

  const handleToggleClientStatus = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c));
  };

  const handleSendClientWarning = (id: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = c.warningCount + 1;
      return { 
        ...c, 
        warningCount: next, 
        paymentStatus: next >= 3 ? 'Aviso 3 (Corte inminente)' : `Aviso ${next} enviado`,
        status: next >= 3 ? 'suspended' : c.status
      };
    }));
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email || !newClient.password) return;
    setClients(prev => [...prev, {
      id: `cli-${Date.now()}`,
      name: newClient.name,
      company: newClient.company || newClient.name,
      cif: newClient.cif || 'Pendiente',
      email: newClient.email,
      password: newClient.password,
      plan: newClient.plan,
      seats: newClient.seats,
      status: 'active',
      paymentStatus: newClient.plan === 'PRO' ? 'Al día' : 'Sin cuota',
      warningCount: 0
    }]);
    setNewClient({ name: '', company: '', cif: '', email: '', password: '', plan: 'PRO', seats: 1 });
    setShowAddClientModal(false);
  };

  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheet.title || !newSheet.refCode) return;
    setSheets(prev => [...prev, {
      id: `sheet-${Date.now()}`,
      title: newSheet.title,
      supplierName: newSheet.supplierName,
      category: newSheet.category,
      refCode: newSheet.refCode.toUpperCase(),
      fileSize: '2.1 MB',
      uploadDate: new Date().toLocaleDateString('es-ES')
    }]);
    setNewSheet({ title: '', supplierName: 'Válvulas & Ventanas del Norte S.L.', category: 'Valvulería', refCode: '' });
    setShowAddSheetModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      <header className="border-b border-slate-800 bg-slate-950 px-3.5 pt-2 pb-2 sticky top-0 z-30 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-indigo-500">r1</span>
            <span className="text-xl font-black text-white">plus</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full ml-1">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onBackToApp} 
              className="text-xs bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
            >
              ← Ir a la App
            </button>
            <button 
              type="button" 
              onClick={onLogout} 
              className="text-xs bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button 
            type="button" 
            onClick={() => setActiveTab('overview')} 
            className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            📊 Resumen & Facturación
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('pricing')} 
            className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            ⚙️ Tarifas y Cuotas
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('suppliers')} 
            className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'suppliers' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🏭 Proveedores ({suppliers.length})
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('clients')} 
            className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            👷 Clientes ({clients.length})
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('sheets')} 
            className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'sheets' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            📋 Fichas ({sheets.length})
          </button>
        </div>
      </header>

      <main className="flex-1 px-3.5 pt-2 pb-4 overflow-y-auto space-y-3 max-w-2xl mx-auto w-full">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Facturación Mensual Recurrente (MRR)</h2>
              <p className="text-xs text-slate-400">Total Proyectado: <strong className="text-emerald-400 text-sm">{totalSupplierRevenue + totalClientRevenue} €/mes</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                <span className="text-slate-400 text-[11px] block font-medium">Cuotas Proveedores</span>
                <div className="text-xl font-black text-white mt-0.5">{totalSupplierRevenue} €/mes</div>
                <span className="text-[10px] text-indigo-400 font-semibold">{suppliers.length} matrices + extras</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                <span className="text-slate-400 text-[11px] block font-medium">Comerciales Proveedor</span>
                <div className="text-xl font-black text-indigo-400 mt-0.5">{suppliers.reduce((a, s) => a + s.commercials.length, 0)}</div>
                <span className="text-[10px] text-slate-400">({pricing.supplierIncludedSeats} incluidos/empresa)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                <span className="text-slate-400 text-[11px] block font-medium">Ingresos Clientes</span>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{totalClientRevenue} €/mes</div>
                <span className="text-[10px] text-slate-400">{clients.filter(c => c.plan === 'PRO').length} clientes PRO activos</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                <span className="text-slate-400 text-[11px] block font-medium">Avisos de Cobro</span>
                <div className="text-xl font-black text-amber-400 mt-0.5">{clients.filter(c => c.warningCount > 0).length}</div>
                <span className="text-[10px] text-amber-300">Pendientes</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Configuración de Tarifas de la Plataforma</h2>
              <p className="text-xs text-slate-400">Modifica los precios y asientos incluidos en las suscripciones</p>
            </div>

            {pricingSavedBanner && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                ✓ Tarifas actualizadas correctamente en toda la plataforma
              </div>
            )}

            <form onSubmit={handleSavePricing} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block border-b border-slate-800 pb-1">
                  1. Modelo Proveedor
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Cuota Base (€/mes)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={pricingForm.supplierBasePrice} 
                      onChange={e => setPricingForm({ ...pricingForm, supplierBasePrice: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Comerciales Incluidos</label>
                    <input 
                      type="number" 
                      min="0"
                      value={pricingForm.supplierIncludedSeats} 
                      onChange={e => setPricingForm({ ...pricingForm, supplierIncludedSeats: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Precio por Comercial Adicional (€/mes)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={pricingForm.supplierExtraSeatPrice} 
                    onChange={e => setPricingForm({ ...pricingForm, supplierExtraSeatPrice: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Se aplica a partir del comercial {pricingForm.supplierIncludedSeats + 1}.</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1">
                  2. Modelo Cliente / Instalador
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Cuota Plan PRO (€/mes)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={pricingForm.clientProBasePrice} 
                      onChange={e => setPricingForm({ ...pricingForm, clientProBasePrice: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Cuenta Extra Cliente (€/mes)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={pricingForm.clientExtraSeatPrice} 
                      onChange={e => setPricingForm({ ...pricingForm, clientExtraSeatPrice: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Guardar Nuevas Tarifas
              </button>
            </form>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white">Empresas Proveedoras</h2>
                <p className="text-[11px] text-slate-400">Base {pricing.supplierBasePrice} €/m ({pricing.supplierIncludedSeats} comerciales) + {pricing.supplierExtraSeatPrice} € extra</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setNewSupplier(prev => ({ ...prev, password: generatePassword() })); setShowAddSupplierModal(true); }} 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                + Alta
              </button>
            </div>

            <div className="space-y-3">
              {suppliers.map(prov => {
                const totalCost = calculateSupplierCost(prov.commercials.length);
                const extraSeats = Math.max(0, prov.commercials.length - pricing.supplierIncludedSeats);

                return (
                  <div key={prov.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{prov.name}</h3>
                        <div className="text-[11px] text-slate-400 mt-0.5">{prov.category} · CIF: {prov.cif}</div>
                        <div className="text-[11px] text-indigo-300 mt-0.5">{prov.adminEmail}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap block ${
                          prov.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {prov.status === 'active' ? 'Activo' : 'Pausado'}
                        </span>
                        <span className="text-xs font-black text-white mt-1 block">
                          {totalCost} €/mes
                        </span>
                        {extraSeats > 0 && (
                          <span className="text-[9px] text-indigo-400">+{extraSeats} extra ({extraSeats * pricing.supplierExtraSeatPrice} €)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button 
                        type="button" 
                        onClick={() => { setActiveSupplierForAgent(prov); setNewAgent(prev => ({ ...prev, password: generatePassword() })); }} 
                        className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        + Asignar Comercial
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleToggleSupplierStatus(prov.id)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          prov.status === 'active' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {prov.status === 'active' ? 'Pausar' : 'Activar'}
                      </button>
                    </div>

                    {prov.commercials.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Comerciales ({prov.commercials.length}) {extraSeats > 0 ? `· ${extraSeats} de pago extra` : '· dentro de cuota'}
                        </span>
                        {prov.commercials.map((agent, idx) => (
                          <div key={agent.id} className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <span className="font-semibold text-white block">
                                {agent.name} {idx >= pricing.supplierIncludedSeats && <span className="text-[9px] text-amber-400">(+{pricing.supplierExtraSeatPrice} €/m)</span>}
                              </span>
                              <span className="text-[10px] text-slate-400">{agent.email} · {agent.phone}</span>
                            </div>
                            <code className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">{agent.password}</code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white">Clientes & Instaladores</h2>
                <p className="text-[11px] text-slate-400">PRO: {pricing.clientProBasePrice} €/m · Extra: {pricing.clientExtraSeatPrice} €/m</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setNewClient(prev => ({ ...prev, password: generatePassword() })); setShowAddClientModal(true); }} 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                + Alta
              </button>
            </div>

            <div className="space-y-3">
              {clients.map(c => {
                const cost = calculateClientCost(c.plan, c.seats);

                return (
                  <div key={c.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.company} · {c.email}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.plan === 'PRO' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {c.plan} ({cost} €/mes)
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{c.seats} cuenta(s)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Clave: <code className="text-indigo-300 font-mono">{c.password}</code></span>
                      <span className="text-slate-400">Avisos: <strong className="text-amber-400">{c.plan === 'PRO' ? `${c.warningCount}/3` : 'N/A'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      {c.plan === 'PRO' && (
                        <button 
                          type="button" 
                          onClick={() => handleSendClientWarning(c.id)} 
                          disabled={c.warningCount >= 3} 
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 disabled:opacity-40 cursor-pointer"
                        >
                          📧 Enviar Aviso
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={() => handleToggleClientStatus(c.id)} 
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          c.status === 'active' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {c.status === 'active' ? 'Bloquear' : 'Activar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'sheets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white">Fichas Técnicas Activas</h2>
                <p className="text-[11px] text-slate-400">Catálogos y certificados PDF homologados</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddSheetModal(true)} 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                + Subir Ficha
              </button>
            </div>

            <div className="space-y-2.5">
              {sheets.map(sh => (
                <div key={sh.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate">{sh.title}</h4>
                      <div className="text-[10px] text-slate-400">{sh.supplierName} · {sh.category}</div>
                      <div className="text-[10px] text-indigo-400 font-mono mt-0.5">Ref: {sh.refCode} ({sh.fileSize})</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold shrink-0">{sh.uploadDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALES ADMIN */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Alta Proveedor (Base {pricing.supplierBasePrice} €/mes)</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-2.5 text-xs">
              <div><input type="text" required placeholder="Razón Social *" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="text" placeholder="CIF" value={newSupplier.cif} onChange={e => setNewSupplier({ ...newSupplier, cif: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="text" placeholder="Sector (ej: Ventanas, Climatización)" value={newSupplier.category} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="email" required placeholder="Email Empresa *" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 font-semibold">Contraseña Matriz *</span>
                  <button type="button" onClick={() => setNewSupplier({ ...newSupplier, password: generatePassword() })} className="text-[10px] text-indigo-400 underline cursor-pointer">Generar</button>
                </div>
                <input type={showSupplierPass ? 'text' : 'password'} required placeholder="Contraseña" value={newSupplier.password} onChange={e => setNewSupplier({ ...newSupplier, password: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddSupplierModal(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSupplierForAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Añadir Comercial</h3>
            <p className="text-xs text-indigo-400 mb-3">{activeSupplierForAgent.name}</p>
            <form onSubmit={handleAddCommercial} className="space-y-2.5 text-xs">
              <div><input type="text" required placeholder="Nombre Comercial *" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="email" required placeholder="Email Comercial *" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="text" placeholder="Teléfono" value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 font-semibold">Contraseña *</span>
                  <button type="button" onClick={() => setNewAgent({ ...newAgent, password: generatePassword() })} className="text-[10px] text-indigo-400 underline cursor-pointer">Generar</button>
                </div>
                <input type={showAgentPass ? 'text' : 'password'} required placeholder="Contraseña" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setActiveSupplierForAgent(null)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Alta de Cliente</h3>
            <form onSubmit={handleCreateClient} className="space-y-2.5 text-xs">
              <div><input type="text" required placeholder="Nombre *" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="text" placeholder="Empresa / CIF" value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="email" required placeholder="Email *" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 font-semibold">Contraseña *</span>
                  <button type="button" onClick={() => setNewClient({ ...newClient, password: generatePassword() })} className="text-[10px] text-indigo-400 underline cursor-pointer">Generar</button>
                </div>
                <input type={showClientPass ? 'text' : 'password'} required placeholder="Contraseña" value={newClient.password} onChange={e => setNewClient({ ...newClient, password: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Plan</label>
                  <select value={newClient.plan} onChange={e => setNewClient({ ...newClient, plan: e.target.value as 'Free' | 'PRO' })} className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                    <option value="PRO">Plan PRO ({pricing.clientProBasePrice} €/m)</option>
                    <option value="Free">Plan Free (0 €/m)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Subcuentas</label>
                  <input type="number" min="1" value={newClient.seats} onChange={e => setNewClient({ ...newClient, seats: Number(e.target.value) })} className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold" />
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Nueva Ficha Técnica Homologada</h3>
            <form onSubmit={handleCreateSheet} className="space-y-2.5 text-xs">
              <div><input type="text" required placeholder="Título del Documento *" value={newSheet.title} onChange={e => setNewSheet({ ...newSheet, title: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div><input type="text" required placeholder="Código Ref (ej: VALV-INOX-DN50) *" value={newSheet.refCode} onChange={e => setNewSheet({ ...newSheet, refCode: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white uppercase" /></div>
              <div>
                <select value={newSheet.supplierName} onChange={e => setNewSheet({ ...newSheet, supplierName: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white">
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div><input type="text" placeholder="Categoría (ej: Válvulas, Cierres)" value={newSheet.category} onChange={e => setNewSheet({ ...newSheet, category: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" /></div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddSheetModal(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer">Registrar Ficha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('r1plus_session');
        if (saved) setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleLogin = (user: AuthUser) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('r1plus_session', JSON.stringify(user));
      }
    } catch (e) {}
    setCurrentUser({ ...user });
    setLoginError('');
  };

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('r1plus_session');
      }
    } catch (e) {}
    setCurrentUser(null);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (cleanEmail === 'admin@r1plus.com' && cleanPassword === 'admin') {
      handleLogin(ADMIN_DATA);
      return;
    }
    if (cleanEmail === 'gerencia@valvulasdelnorte.com' && (cleanPassword === '123' || cleanPassword === 'prove')) {
      handleLogin(PROVE_DATA);
      return;
    }
    if (cleanEmail === 'marta.rodriguez@valvulasdelnorte.com' && (cleanPassword === '123' || cleanPassword === 'comer')) {
      handleLogin(COMER_DATA);
      return;
    }
    if (cleanEmail === 'carlos.gomez@instalacionesgomez.es' && (cleanPassword === '123' || cleanPassword === 'clien')) {
      handleLogin(CLIEN_DATA);
      return;
    }
    if (cleanEmail === 'david.ortiz@instalacionesgomez.es' && (cleanPassword === '123' || cleanPassword === 'clicor')) {
      handleLogin(CLICOR_DATA);
      return;
    }
    if (cleanEmail.length > 3 && cleanPassword.length >= 3) {
      handleLogin({
        id: `user-${Date.now()}`,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'buyer',
        company: 'Empresa Registrada',
        companyType: 'client'
      });
      return;
    }
    setLoginError('Credenciales incorrectas');
  };

  const handleGoogleLogin = () => {
    setIsLoadingGoogle(true);
    setTimeout(() => {
      handleLogin(CLIEN_DATA);
      setIsLoadingGoogle(false);
    }, 500);
  };

  // VISTA 1: LOGIN CON LOS 5 BOTONES SOLICITADOS
  if (!currentUser) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 font-sans text-slate-100 select-none"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 24px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)'
        }}
      >
        <div className="w-full max-w-sm bg-slate-950 p-6 rounded-3xl shadow-2xl border border-slate-800">
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-black text-indigo-500">r1</span>
              <span className="text-3xl font-black text-white">plus</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Plataforma B2B para Proveedores e Instaladores</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoadingGoogle}
            className="w-full py-2.5 px-4 bg-white active:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2.5 border border-slate-300 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.26 21.36 7.35 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.39-1.49-.39-2.24 0-.75.14-1.52.39-2.24V6.61H1.25C.45 8.22 0 10.05 0 12s.45 3.78 1.25 5.39l4.02-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
            <span>{isLoadingGoogle ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>

          <div className="flex items-center my-3.5">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-[10px] text-slate-500 font-semibold uppercase">o con correo</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleFormLogin} className="space-y-3 text-xs">
            {loginError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="ejemplo@empresa.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">Contraseña</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-indigo-400 cursor-pointer"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition mt-1 cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* BOTONES DE ACCESO DE LOS 5 ROLES */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <span className="block text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
              Accesos directos de prueba
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => handleLogin(PROVE_DATA)}
                className="py-1.5 px-1 bg-slate-900 active:bg-slate-800 text-indigo-300 rounded-lg text-[10px] font-bold border border-slate-800 text-center cursor-pointer hover:border-indigo-500"
              >
                prove
              </button>
              <button
                type="button"
                onClick={() => handleLogin(COMER_DATA)}
                className="py-1.5 px-1 bg-slate-900 active:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-800 text-center cursor-pointer hover:border-slate-700"
              >
                comer
              </button>
              <button
                type="button"
                onClick={() => handleLogin(CLIEN_DATA)}
                className="py-1.5 px-1 bg-slate-900 active:bg-slate-800 text-emerald-300 rounded-lg text-[10px] font-bold border border-slate-800 text-center cursor-pointer hover:border-emerald-500"
              >
                clien
              </button>
              <button
                type="button"
                onClick={() => handleLogin(CLICOR_DATA)}
                className="py-1.5 px-1 bg-slate-900 active:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-800 text-center cursor-pointer hover:border-slate-700"
              >
                clicor
              </button>
              <button
                type="button"
                onClick={() => handleLogin(ADMIN_DATA)}
                className="py-1.5 px-1 bg-indigo-950/50 active:bg-indigo-900/60 text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-700/50 text-center cursor-pointer hover:border-indigo-500"
              >
                admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: PANEL ADMIN
  if (currentUser.role === 'admin') {
    return <AdminDashboardView onBackToApp={() => handleLogin(PROVE_DATA)} onLogout={handleLogout} />;
  }

  // VISTA 3: APLICACIÓN (PROVE, COMER, CLIEN, CLICOR)
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-slate-100">
      <B2BChatRoom currentUser={currentUser as any} onLogout={handleLogout} />
    </div>
  );
}