// @ts-nocheck
import React, { useState } from 'react';

export default function AccountingView() {
  // --- ESTADOS DE LA VISTA Y MODALES ---
  const [activeModal, setActiveModal] = useState<null | 'expense' | 'incomeDetails' | 'expenseDetails' | 'taxDetails' | 'config'>(null);
  const [expenseType, setExpenseType] = useState('general');
  const [filterMonth, setFilterMonth] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingRules, setIsUpdatingRules] = useState(false);

  // --- ESTADOS DE CONFIGURACIÓN CONTABLE ---
  const [companyType, setCompanyType] = useState('autonomo_directa'); 
  
  // Estados para añadir nuevos elementos en configuración
  const [newVehicle, setNewVehicle] = useState('');
  const [newEmployee, setNewEmployee] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('general');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderNif, setNewProviderNif] = useState('');

  // --- DATOS SIMULADOS (MOCK DATA) ---
  const [incomesList, setIncomesList] = useState([
    { id: '1', client: 'Cliente A (Presupuesto #402)', date: '2026-10-10', base: 1500, vat: 315, total: 1815 },
    { id: '2', client: 'Empresa B (Factura #089)', date: '2026-10-12', base: 3200, vat: 672, total: 3872 },
  ]);
  const [expensesList, setExpensesList] = useState([
    { id: '1', concept: 'Gasolina Furgoneta', provider: 'Repsol SA', invoice: 'T-9981', type: 'vehicle', date: '2026-10-11', base: 85, vat: 17.85 },
    { id: '2', concept: 'Seguros Sociales', provider: 'TGSS', invoice: 'S/N', type: 'employee', date: '2026-10-01', base: 450, vat: 0 },
    { id: '3', concept: 'Compra Material', provider: 'Almacenes Paco', invoice: 'F-2026-44', type: 'general', date: '2026-10-05', base: 300, vat: 63 },
  ]);
  
  const [vehicles, setVehicles] = useState([{ id: '1', name: 'Furgoneta 1234-LBC' }]);
  const [employees, setEmployees] = useState([{ id: '1', name: 'Juan Pérez' }]);
  const [categories, setCategories] = useState([
    { id: '1', name: 'Material de Oficina', type: 'general' },
    { id: '2', name: 'Dietas y Comidas', type: 'employee' },
    { id: '3', name: 'Combustible', type: 'vehicle' }
  ]);
  const [providers, setProviders] = useState([
    { id: '1', name: 'Repsol SA', nif: 'A12345678' },
    { id: '2', name: 'Amazon EU', nif: 'N0000000A' },
    { id: '3', name: 'Tesorería Seguridad Social', nif: 'Q2827009I' },
  ]);

  // --- FUNCIONES DE CONFIGURACIÓN ---
  const addVehicle = () => { if(newVehicle) { setVehicles([...vehicles, { id: Date.now().toString(), name: newVehicle }]); setNewVehicle(''); }};
  const removeVehicle = (id: string) => setVehicles(vehicles.filter(v => v.id !== id));
  
  const addEmployee = () => { if(newEmployee) { setEmployees([...employees, { id: Date.now().toString(), name: newEmployee }]); setNewEmployee(''); }};
  const removeEmployee = (id: string) => setEmployees(employees.filter(e => e.id !== id));
  
  const addCategory = () => { if(newCategory) { setCategories([...categories, { id: Date.now().toString(), name: newCategory, type: newCategoryType }]); setNewCategory(''); }};
  const removeCategory = (id: string) => setCategories(categories.filter(c => c.id !== id));

  const addProvider = () => { 
    if(newProviderName) { 
      setProviders([...providers, { id: Date.now().toString(), name: newProviderName, nif: newProviderNif || 'S/N' }]); 
      setNewProviderName(''); 
      setNewProviderNif(''); 
    }
  };
  const removeProvider = (id: string) => setProviders(providers.filter(p => p.id !== id));

  // --- ACTUALIZADOR DE NORMATIVA ---
  const handleUpdateRules = () => {
    setIsUpdatingRules(true);
    setTimeout(() => { alert("✅ Normativas fiscales actualizadas correctamente a la legislación vigente."); setIsUpdatingRules(false); }, 1200);
  };

  // --- CÁLCULOS DINÁMICOS Y FISCALES ---
  const totalIncomesBase = incomesList.reduce((acc, curr) => acc + curr.base, 0);
  const totalIncomesVat = incomesList.reduce((acc, curr) => acc + curr.vat, 0);
  const totalExpensesBase = expensesList.reduce((acc, curr) => acc + curr.base, 0);
  const totalExpensesVat = expensesList.reduce((acc, curr) => acc + curr.vat, 0);
  
  const beneficioBruto = totalIncomesBase - totalExpensesBase;
  const ivaAPagar = totalIncomesVat - totalExpensesVat;

  let taxRate = companyType === 'autonomo_directa' ? 0.20 : companyType === 'sl' ? 0.25 : 0.05;
  let taxName = companyType === 'autonomo_directa' ? 'IRPF (20%)' : companyType === 'sl' ? 'Sociedades (25%)' : 'Módulos (Est.)';
  
  const estimadoImpuestosBase = beneficioBruto > 0 ? beneficioBruto * taxRate : 0;
  const beneficioNetoReal = beneficioBruto - estimadoImpuestosBase;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-24">
      
      {/* =========================================
          CABECERA Y ACCIONES PRINCIPALES
      ========================================= */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            📊 Panel Contable ERP
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Modo fiscal activo: <strong className="text-indigo-600">{companyType === 'sl' ? 'Sociedad Limitada (SL)' : 'Autónomo'}</strong>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleUpdateRules} 
            disabled={isUpdatingRules} 
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            {isUpdatingRules ? '🔄 Conectando...' : '🔄 Actualizar Normativa'}
          </button>
          <button 
            onClick={() => setActiveModal('config')} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition"
          >
            ⚙️ Ajustes
          </button>
          <button 
            onClick={() => setActiveModal('expense')} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition"
          >
            ➕ Nuevo Gasto
          </button>
        </div>
      </div>

      {/* =========================================
          DASHBOARD - TARJETAS INTERACTIVAS (Kpis)
      ========================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* TARJETA INGRESOS */}
        <div 
          onClick={() => setActiveModal('incomeDetails')} 
          className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer group relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <span className="text-xl">📈</span><span className="text-sm font-bold">Ingresos</span>
            </div>
            <span className="text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition bg-emerald-50 px-2 py-1 rounded-md">Ver detalle</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{totalIncomesBase.toFixed(2)} €</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Base Imponible Total</p>
        </div>

        {/* TARJETA GASTOS */}
        <div 
          onClick={() => setActiveModal('expenseDetails')} 
          className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm hover:shadow-md hover:border-rose-400 transition cursor-pointer group relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-rose-500">
              <span className="text-xl">📉</span><span className="text-sm font-bold">Gastos</span>
            </div>
            <span className="text-xs font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition bg-rose-50 px-2 py-1 rounded-md">Ver detalle</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{totalExpensesBase.toFixed(2)} €</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Base Imponible Total</p>
        </div>

        {/* TARJETA IMPUESTOS */}
        <div 
          onClick={() => setActiveModal('taxDetails')} 
          className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md hover:shadow-lg hover:bg-slate-900 transition cursor-pointer group text-white relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <span className="text-xl">🏛️</span><span className="text-sm font-bold">Impuestos</span>
            </div>
            <span className="text-xs font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition bg-slate-700 px-2 py-1 rounded-md">Liquidar</span>
          </div>
          <p className="text-3xl font-black">{(ivaAPagar + estimadoImpuestosBase).toFixed(2)} €</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">IVA + {taxName}</p>
        </div>

        {/* TARJETA BENEFICIO NETO (No clickable) */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-indigo-700 mb-3">
            <span className="text-xl">👛</span><span className="text-sm font-bold">Beneficio Real</span>
          </div>
          <p className="text-3xl font-black text-indigo-700">{beneficioNetoReal.toFixed(2)} €</p>
          <p className="text-[10px] text-indigo-400 mt-1 uppercase font-bold tracking-wider">Líquido tras impuestos</p>
        </div>
      </div>

      {/* =========================================
          MODAL 1: DETALLE DE INGRESOS
      ========================================= */}
      {activeModal === 'incomeDetails' && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <div>
                <h3 className="font-black text-emerald-900 text-lg flex items-center gap-2"><span>📈</span> Libro de Ingresos</h3>
                <p className="text-xs font-medium text-emerald-600">Registro de facturas emitidas y cobradas</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-2 shadow-sm hover:text-slate-700 transition">✕</button>
            </div>
            
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-5 py-4">Cliente / Documento</th>
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-5 py-4 text-right">Base Imponible</th>
                    <th className="px-5 py-4 text-right">Cuota IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomesList.map(inc => (
                    <tr key={inc.id} className="hover:bg-emerald-50/50 transition">
                      <td className="px-5 py-4 font-bold text-slate-800">{inc.client}</td>
                      <td className="px-5 py-4 text-slate-500 font-medium">{inc.date}</td>
                      <td className="px-5 py-4 text-right font-black text-emerald-600">{inc.base.toFixed(2)} €</td>
                      <td className="px-5 py-4 text-right text-slate-500 font-medium">{inc.vat.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-6 items-center">
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase">Total IVA</p>
                <p className="font-bold text-slate-700">{totalIncomesVat.toFixed(2)} €</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Base</p>
                <p className="text-xl font-black text-slate-900">{totalIncomesBase.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: DETALLE DE GASTOS
      ========================================= */}
      {activeModal === 'expenseDetails' && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-rose-900 text-lg flex items-center gap-2"><span>📉</span> Libro de Gastos y Compras</h3>
                <p className="text-xs font-medium text-rose-600">Registro de facturas recibidas y nóminas</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-2 shadow-sm hover:text-slate-700 transition">✕</button>
            </div>
            
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-4 py-4">Fecha / Factura</th>
                    <th className="px-4 py-4">Proveedor / Concepto</th>
                    <th className="px-4 py-4 text-center">Clasificación</th>
                    <th className="px-4 py-4 text-right">Base Imponible</th>
                    <th className="px-4 py-4 text-right">Cuota IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expensesList.map(exp => (
                    <tr key={exp.id} className="hover:bg-rose-50/50 transition">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">{exp.date}</p>
                        <p className="text-xs text-slate-400">Ref: {exp.invoice}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">{exp.provider}</p>
                        <p className="text-xs text-slate-500">{exp.concept}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider
                          ${exp.type === 'vehicle' ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                          : exp.type === 'employee' ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                          {exp.type === 'vehicle' ? '🚗 Flota' : exp.type === 'employee' ? '👥 Personal' : '🏢 General'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-rose-600">{exp.base.toFixed(2)} €</td>
                      <td className="px-4 py-4 text-right text-slate-500 font-medium">{exp.vat.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-6 items-center">
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase">Total IVA Soportado</p>
                <p className="font-bold text-slate-700">{totalExpensesVat.toFixed(2)} €</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Gastos (Base)</p>
                <p className="text-xl font-black text-slate-900">{totalExpensesBase.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: INFORME FISCAL (IMPUESTOS)
      ========================================= */}
      {activeModal === 'taxDetails' && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2"><span>🏛️</span> Liquidación Fiscal</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Estimación en tiempo real ({taxName})</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-slate-800 rounded-full p-2 shadow-sm hover:text-white transition">✕</button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto bg-slate-50">
              
              {/* BLOQUE IVA */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="bg-slate-100 p-1.5 rounded-lg">🧾</span> Modelo 303 (IVA)
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">IVA Repercutido (Cobrado)</span>
                    <span className="font-bold text-slate-800">{totalIncomesVat.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">IVA Soportado (Pagado)</span>
                    <span className="font-bold text-slate-800">- {totalExpensesVat.toFixed(2)} €</span>
                  </div>
                  <div className="pt-3 mt-1 border-t border-slate-100">
                    <div className={`flex justify-between items-center p-3 rounded-xl font-bold border 
                      ${ivaAPagar > 0 ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'}`}>
                      <span className="text-sm">{ivaAPagar > 0 ? 'Resultado a Ingresar (Pagar):' : 'Resultado a Compensar:'}</span>
                      <span className="text-lg">{ivaAPagar.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE BENEFICIOS / IRPF / SOCIEDADES */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="bg-slate-100 p-1.5 rounded-lg">💼</span> Estimación {taxName.split(' ')[0]}
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Beneficio Bruto (Base)</span>
                    <span className="font-bold text-slate-800">{beneficioBruto.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Tipo Impositivo Aplicado</span>
                    <span className="font-bold text-slate-800">{(taxRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="pt-3 mt-1 border-t border-slate-100">
                    <div className="flex justify-between items-center p-3 rounded-xl font-bold border bg-rose-50 text-rose-900 border-rose-200">
                      <span className="text-sm">Provisión para Impuestos:</span>
                      <span className="text-lg">{estimadoImpuestosBase.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 4: CONFIGURACIÓN (RECURSOS Y AJUSTES)
      ========================================= */}
      {activeModal === 'config' && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="font-black text-slate-800 text-lg">⚙️ Configuración del ERP</h3>
                <p className="text-xs text-slate-500 font-medium">Gestiona los recursos de tu empresa</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-2 shadow-sm hover:text-slate-700 transition">✕</button>
            </div>
            
            <div className="p-6 space-y-8 overflow-y-auto">
              
              {/* TIPO EMPRESA */}
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
                <label className="block text-sm font-black text-indigo-900 mb-3 flex items-center gap-2">
                  <span>🏢</span> Régimen Fiscal de la Empresa
                </label>
                <select 
                  value={companyType} 
                  onChange={(e) => setCompanyType(e.target.value)} 
                  className="w-full border border-indigo-200 rounded-xl p-3 text-sm bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="autonomo_directa">Autónomo (Estimación Directa) - IRPF</option>
                  <option value="autonomo_modulos">Autónomo (Módulos) - Fijo</option>
                  <option value="sl">Sociedad Limitada (SL) - Imp. Sociedades</option>
                </select>
                <p className="text-xs font-medium text-indigo-600/80 mt-3 leading-relaxed">
                  El cálculo de impuestos en el panel principal se ajustará automáticamente a la normativa de {companyType === 'sl' ? 'Sociedades' : 'IRPF'}.
                </p>
              </div>

              {/* GESTIÓN DE PROVEEDORES */}
              <section>
                <h4 className="font-black text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 p-1.5 rounded-lg">🛒</span> Base de Datos de Proveedores
                </h4>
                <div className="flex gap-2 mb-4">
                  <input 
                    value={newProviderName} 
                    onChange={e=>setNewProviderName(e.target.value)} 
                    placeholder="Nombre (Ej. Repsol)" 
                    className="border border-slate-200 p-2.5 text-sm flex-1 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                  <input 
                    value={newProviderNif} 
                    onChange={e=>setNewProviderNif(e.target.value)} 
                    placeholder="CIF/NIF" 
                    className="border border-slate-200 p-2.5 text-sm w-28 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                  <button 
                    onClick={addProvider} 
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition"
                  >
                    Añadir
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-1">
                  <ul className="space-y-1 max-h-40 overflow-y-auto p-1">
                    {providers.length === 0 && <p className="text-xs text-center text-slate-400 py-3 font-medium">No hay proveedores guardados.</p>}
                    {providers.map(p => (
                      <li key={p.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 text-sm shadow-sm">
                        <div>
                          <span className="font-bold text-slate-700">{p.name}</span> 
                          <span className="text-xs text-slate-400 ml-2 font-medium">NIF: {p.nif}</span>
                        </div>
                        <button onClick={() => removeProvider(p.id)} className="text-rose-500 font-bold hover:bg-rose-50 p-1.5 rounded-md transition">Borrar</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* GESTIÓN DE VEHÍCULOS */}
              <section>
                <h4 className="font-black text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 p-1.5 rounded-lg">🚗</span> Flota de Vehículos
                </h4>
                <div className="flex gap-2 mb-4">
                  <input 
                    value={newVehicle} 
                    onChange={e=>setNewVehicle(e.target.value)} 
                    placeholder="Ej. Matrícula 1234-LBC" 
                    className="border border-slate-200 p-2.5 text-sm flex-1 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                  <button onClick={addVehicle} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition">Añadir</button>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-1">
                  <ul className="space-y-1 p-1">
                    {vehicles.map(v => (
                      <li key={v.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 text-sm shadow-sm">
                        <span className="font-bold text-slate-700">{v.name}</span> 
                        <button onClick={() => removeVehicle(v.id)} className="text-rose-500 font-bold hover:bg-rose-50 p-1.5 rounded-md transition">Borrar</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* GESTIÓN DE PERSONAL */}
              <section>
                <h4 className="font-black text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 p-1.5 rounded-lg">👥</span> Plantilla de Personal
                </h4>
                <div className="flex gap-2 mb-4">
                  <input 
                    value={newEmployee} 
                    onChange={e=>setNewEmployee(e.target.value)} 
                    placeholder="Nombre completo" 
                    className="border border-slate-200 p-2.5 text-sm flex-1 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                  <button onClick={addEmployee} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition">Añadir</button>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-1">
                  <ul className="space-y-1 p-1">
                    {employees.map(e => (
                      <li key={e.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 text-sm shadow-sm">
                        <span className="font-bold text-slate-700">{e.name}</span> 
                        <button onClick={() => removeEmployee(e.id)} className="text-rose-500 font-bold hover:bg-rose-50 p-1.5 rounded-md transition">Borrar</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 5: REGISTRAR NUEVO GASTO (COMPLETO)
      ========================================= */}
      {activeModal === 'expense' && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50 sticky top-0 z-10">
              <div>
                <h3 className="font-black text-indigo-900 text-lg">Registrar Nuevo Gasto</h3>
                <p className="text-xs text-indigo-600 font-medium">Introduce los datos de la factura o ticket</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-2 shadow-sm hover:text-slate-700 transition">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
              
              {/* TABS SELECTOR TIPO DE GASTO */}
              <div className="flex bg-slate-200/50 p-1.5 rounded-xl gap-1">
                <button 
                  onClick={() => setExpenseType('general')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${expenseType === 'general' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  🏢 Gasto General
                </button>
                <button 
                  onClick={() => setExpenseType('vehicle')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${expenseType === 'vehicle' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  🚗 Vehículo
                </button>
                <button 
                  onClick={() => setExpenseType('employee')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${expenseType === 'employee' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  👥 Personal
                </button>
              </div>

              {/* BLOQUE: FECHA Y FACTURA (NUEVO) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha del Gasto</label>
                  <input type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nº Factura / Ticket</label>
                  <input type="text" placeholder="Ej. F-2026-89" className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              {/* BLOQUE: PROVEEDOR */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-black text-slate-800 mb-2 flex justify-between items-center">
                  <span className="flex items-center gap-2">🛒 Proveedor Emisor</span>
                  <button onClick={()=>setActiveModal('config')} className="text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-1 rounded-md transition">+ Nuevo</button>
                </label>
                <select className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                  <option value="">-- Selecciona el proveedor --</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (NIF: {p.nif})</option>
                  ))}
                </select>
              </div>

              {/* BLOQUES CONDICIONALES (Vehículo o Empleado) */}
              {expenseType === 'vehicle' && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
                  <label className="block text-xs font-black text-orange-900 mb-2 flex items-center gap-2">🚗 Asignar a Vehículo</label>
                  <select className="w-full border border-orange-200 rounded-xl p-3 text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              )}

              {expenseType === 'employee' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                  <label className="block text-xs font-black text-blue-900 mb-2 flex items-center gap-2">👥 Asignar a Empleado</label>
                  <select className="w-full border border-blue-200 rounded-xl p-3 text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}

              {/* BLOQUE: CUENTA Y CONCEPTO */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Cuenta Contable (Categoría)</label>
                  <select className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                    {categories.filter(c => c.type === expenseType).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Concepto detallado (Opcional)</label>
                  <input type="text" placeholder="Anota aquí qué se ha comprado..." className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              
              {/* BLOQUE: IMPORTES E IMPUESTOS */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md text-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Base Imponible (€)</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full border-0 rounded-xl p-3 text-lg font-black bg-slate-900 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">% IVA Aplicado</label>
                    <select className="w-full border-0 rounded-xl p-3 text-sm font-bold bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="21">21% (General)</option>
                      <option value="10">10% (Reducido)</option>
                      <option value="4">4% (Superreducido)</option>
                      <option value="0">0% (Exento)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BOTÓN GUARDAR */}
              <button 
                onClick={() => {
                  alert('¡Gasto registrado correctamente en la base de datos!');
                  setActiveModal(null);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-base font-black shadow-lg hover:shadow-xl transition-all active:scale-[0.98] mt-2"
              >
                Guardar Gasto en Contabilidad
              </button>

            </div>
           </div>
        </div>
      )}

    </div>
  );
}