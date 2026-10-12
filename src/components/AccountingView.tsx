// @ts-nocheck
import React, { useState, useEffect } from 'react';

export default function AccountingView() {
  // --- ESTADOS DE LA VISTA Y MODALES ---
  const [activeModal, setActiveModal] = useState<null | 'expense' | 'incomeDetails' | 'expenseDetails' | 'taxDetails' | 'config'>(null);
  const [expenseType, setExpenseType] = useState('general');
  const [filterMonth, setFilterMonth] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingRules, setIsUpdatingRules] = useState(false);

  // --- ESTADOS DE CONFIGURACIÓN CONTABLE ---
  const [companyType, setCompanyType] = useState('autonomo_directa'); // autonomo_directa, autonomo_modulos, sl
  
  // Estados para añadir nuevos elementos en configuración
  const [newVehicle, setNewVehicle] = useState('');
  const [newEmployee, setNewEmployee] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('general');

  // --- DATOS SIMULADOS (AQUÍ CONECTARÍAS SUPABASE) ---
  const [incomesList, setIncomesList] = useState([
    { id: '1', client: 'Cliente A (Presupuesto #402)', date: '2026-10-10', base: 1500, vat: 315, total: 1815 },
    { id: '2', client: 'Empresa B (Factura #089)', date: '2026-10-12', base: 3200, vat: 672, total: 3872 },
  ]);
  const [expensesList, setExpensesList] = useState([
    { id: '1', concept: 'Gasolina Repsol', type: 'vehicle', date: '2026-10-11', base: 85, vat: 17.85 },
    { id: '2', concept: 'Seguros Sociales', type: 'employee', date: '2026-10-01', base: 450, vat: 0 },
    { id: '3', concept: 'Compra Material', type: 'general', date: '2026-10-05', base: 300, vat: 63 },
  ]);
  const [vehicles, setVehicles] = useState([{ id: '1', name: 'Furgoneta 1234-LBC' }]);
  const [employees, setEmployees] = useState([{ id: '1', name: 'Juan Pérez' }]);
  const [categories, setCategories] = useState([
    { id: '1', name: 'Material de Oficina', type: 'general' },
    { id: '2', name: 'Dietas y Comidas', type: 'employee' },
    { id: '3', name: 'Combustible', type: 'vehicle' }
  ]);

  // --- FUNCIONES DE CONFIGURACIÓN (AÑADIR Y QUITAR) ---
  const addVehicle = () => { if(newVehicle) { setVehicles([...vehicles, { id: Date.now().toString(), name: newVehicle }]); setNewVehicle(''); }};
  const removeVehicle = (id: string) => setVehicles(vehicles.filter(v => v.id !== id));
  
  const addEmployee = () => { if(newEmployee) { setEmployees([...employees, { id: Date.now().toString(), name: newEmployee }]); setNewEmployee(''); }};
  const removeEmployee = (id: string) => setEmployees(employees.filter(e => e.id !== id));
  
  const addCategory = () => { if(newCategory) { setCategories([...categories, { id: Date.now().toString(), name: newCategory, type: newCategoryType }]); setNewCategory(''); }};
  const removeCategory = (id: string) => setCategories(categories.filter(c => c.id !== id));

  // --- SIMULADOR DE ACTUALIZACIÓN DE NORMATIVA ---
  const handleUpdateRules = () => {
    setIsUpdatingRules(true);
    setTimeout(() => {
      alert("✅ Normativas fiscales actualizadas correctamente a los tipos vigentes (2026).");
      setIsUpdatingRules(false);
    }, 1500);
  };

  // --- CÁLCULOS DINÁMICOS Y LEGALES ---
  const totalIncomesBase = incomesList.reduce((acc, curr) => acc + curr.base, 0);
  const totalIncomesVat = incomesList.reduce((acc, curr) => acc + curr.vat, 0);
  
  const totalExpensesBase = expensesList.reduce((acc, curr) => acc + curr.base, 0);
  const totalExpensesVat = expensesList.reduce((acc, curr) => acc + curr.vat, 0);
  
  const beneficioBruto = totalIncomesBase - totalExpensesBase;
  const ivaAPagar = totalIncomesVat - totalExpensesVat;

  // Lógica Fiscal según el Tipo de Empresa
  let taxRate = 0;
  let taxName = '';
  if (companyType === 'autonomo_directa') {
    taxRate = 0.20; // 20% retención IRPF general
    taxName = 'IRPF (20%)';
  } else if (companyType === 'sl') {
    taxRate = 0.25; // 25% Impuesto Sociedades
    taxName = 'Imp. Sociedades (25%)';
  } else if (companyType === 'autonomo_modulos') {
    taxRate = 0.05; // Estimación simplificada de módulo (simulado)
    taxName = 'Cuota Módulos (Est.)';
  }

  const estimadoImpuestosBase = beneficioBruto > 0 ? beneficioBruto * taxRate : 0;
  const beneficioNetoReal = beneficioBruto - estimadoImpuestosBase;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* CABECERA Y ACTUALIZADOR DE NORMATIVAS */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            📊 Panel Contable
          </h1>
          <p className="text-sm text-slate-500 mt-1">Modo: <strong className="text-indigo-600">{companyType === 'sl' ? 'Sociedad Limitada' : 'Autónomo'}</strong></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleUpdateRules}
            disabled={isUpdatingRules}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            {isUpdatingRules ? '🔄 Conectando AEAT...' : '🔄 Actualizar Normativa'}
          </button>

          <button 
            onClick={() => setActiveModal('config')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
          >
            ⚙️ Ajustes
          </button>

          <button 
            onClick={() => setActiveModal('expense')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2"
          >
            ➕ Gasto
          </button>
        </div>
      </div>

      {/* DASHBOARD - TARJETAS INTERACTIVAS (DRILL-DOWN) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* INGRESOS */}
        <div 
          onClick={() => setActiveModal('incomeDetails')}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <span>📈</span><span className="text-sm font-semibold">Ingresos</span>
            </div>
            <span className="text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition">Ver 🔍</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalIncomesBase.toFixed(2)} €</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Base Imponible</p>
        </div>

        {/* GASTOS */}
        <div 
          onClick={() => setActiveModal('expenseDetails')}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm hover:shadow-md hover:border-rose-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-rose-500">
              <span>📉</span><span className="text-sm font-semibold">Gastos</span>
            </div>
            <span className="text-xs text-rose-500 opacity-0 group-hover:opacity-100 transition">Ver 🔍</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalExpensesBase.toFixed(2)} €</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Base Imponible</p>
        </div>

        {/* IMPUESTOS */}
        <div 
          onClick={() => setActiveModal('taxDetails')}
          className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm hover:shadow-md hover:bg-slate-900 transition cursor-pointer group text-white"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-amber-400">
              <span>🏛️</span><span className="text-sm font-semibold">Impuestos</span>
            </div>
            <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition">Ver 🔍</span>
          </div>
          <p className="text-2xl font-bold">{(ivaAPagar + estimadoImpuestosBase).toFixed(2)} €</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">IVA + {taxName}</p>
        </div>

        {/* BENEFICIO NETO (No clickable) */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 mb-2">
            <span>👛</span><span className="text-sm font-semibold">Beneficio Real</span>
          </div>
          <p className="text-2xl font-black text-indigo-700">{beneficioNetoReal.toFixed(2)} €</p>
          <p className="text-[10px] text-indigo-400 mt-1 uppercase font-bold">Líquido tras impuestos</p>
        </div>
      </div>

      {/* =========================================
          MODALES DE DRILL-DOWN (VER DETALLES)
      ========================================= */}
      
      {/* 1. DETALLE DE INGRESOS */}
      {activeModal === 'incomeDetails' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="font-black text-emerald-800 flex items-center gap-2"><span>📈</span> Origen de Ingresos</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-1.5 shadow-sm">✕</button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 border-b">
                  <tr><th className="p-3">Cliente</th><th className="p-3">Fecha</th><th className="p-3 text-right">Base</th><th className="p-3 text-right">IVA</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomesList.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{inc.client}</td>
                      <td className="p-3 text-slate-500">{inc.date}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{inc.base.toFixed(2)}€</td>
                      <td className="p-3 text-right text-slate-500">{inc.vat.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 text-right font-bold text-slate-800 border-t">Total Base: {totalIncomesBase.toFixed(2)} €</div>
          </div>
        </div>
      )}

      {/* 2. DETALLE DE GASTOS */}
      {activeModal === 'expenseDetails' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-black text-rose-800 flex items-center gap-2"><span>📉</span> Desglose de Gastos</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-1.5 shadow-sm">✕</button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 border-b">
                  <tr><th className="p-3">Concepto</th><th className="p-3">Tipo</th><th className="p-3 text-right">Base</th><th className="p-3 text-right">IVA</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expensesList.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{exp.concept}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${exp.type === 'vehicle' ? 'bg-orange-100 text-orange-700' : exp.type === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600">{exp.base.toFixed(2)}€</td>
                      <td className="p-3 text-right text-slate-500">{exp.vat.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 text-right font-bold text-slate-800 border-t">Total Base: {totalExpensesBase.toFixed(2)} €</div>
          </div>
        </div>
      )}

      {/* 3. DETALLE DE IMPUESTOS (FISCAL) */}
      {activeModal === 'taxDetails' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 text-white">
              <h3 className="font-black flex items-center gap-2"><span>🏛️</span> Informe Fiscal ({taxName})</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-slate-700 rounded-full p-1.5 shadow-sm hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* BLOQUE IVA */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Liquidación de IVA (Mod 303)</h4>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">IVA Repercutido (Cobrado)</span>
                  <span className="font-bold text-slate-800">{totalIncomesVat.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-600">IVA Soportado (Pagado)</span>
                  <span className="font-bold text-slate-800">- {totalExpensesVat.toFixed(2)} €</span>
                </div>
                <div className={`flex justify-between text-sm p-2 rounded-lg font-bold ${ivaAPagar > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  <span>{ivaAPagar > 0 ? 'A Ingresar a Hacienda:' : 'A Compensar/Devolver:'}</span>
                  <span>{ivaAPagar.toFixed(2)} €</span>
                </div>
              </div>

              {/* BLOQUE IRPF/SOCIEDADES */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Estimación {taxName}</h4>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Beneficio Bruto (Base)</span>
                  <span className="font-bold text-slate-800">{beneficioBruto.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-600">Tipo Impositivo</span>
                  <span className="font-bold text-slate-800">{(taxRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded-lg font-bold bg-amber-100 text-amber-800">
                  <span>Provisión Impuesto:</span>
                  <span>{estimadoImpuestosBase.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 4: CONFIGURACIÓN (TIPO EMPRESA Y LISTAS)
      ========================================= */}
      {activeModal === 'config' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">⚙️ Ajustes Contables</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-1.5 shadow-sm">✕</button>
            </div>
            
            <div className="p-5 space-y-6 overflow-y-auto">
              
              {/* TIPO DE EMPRESA FISCAL */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <label className="block text-sm font-bold text-indigo-900 mb-2">🏢 Régimen Fiscal de tu Empresa</label>
                <select 
                  value={companyType} 
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="w-full border border-indigo-200 rounded-lg p-2 text-sm bg-white font-medium text-slate-700"
                >
                  <option value="autonomo_directa">Autónomo (Estimación Directa) - IRPF</option>
                  <option value="autonomo_modulos">Autónomo (Módulos) - Fijo</option>
                  <option value="sl">Sociedad Limitada (SL) - Imp. Sociedades</option>
                </select>
                <p className="text-[10px] text-indigo-600 mt-2">El cálculo del panel central cambiará automáticamente según la normativa de {companyType === 'sl' ? 'Sociedades' : 'IRPF'}.</p>
              </div>

              {/* LISTA VEHÍCULOS */}
              <section>
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2"><span>🚗</span> Flota de Vehículos</h4>
                <div className="flex gap-2 mb-2">
                  <input value={newVehicle} onChange={e=>setNewVehicle(e.target.value)} placeholder="Ej. Matrícula 1234-LBC" className="border border-slate-300 p-2 text-sm flex-1 rounded-md" />
                  <button onClick={addVehicle} className="bg-slate-800 text-white px-3 py-1 rounded-md text-sm font-bold">Añadir</button>
                </div>
                <ul className="space-y-1">
                  {vehicles.map(v => (
                    <li key={v.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                      {v.name} <button onClick={() => removeVehicle(v.id)} className="text-rose-500 font-bold hover:underline">X</button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* LISTA PERSONAL */}
              <section>
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2"><span>👥</span> Personal Activo</h4>
                <div className="flex gap-2 mb-2">
                  <input value={newEmployee} onChange={e=>setNewEmployee(e.target.value)} placeholder="Ej. Nombre del empleado" className="border border-slate-300 p-2 text-sm flex-1 rounded-md" />
                  <button onClick={addEmployee} className="bg-slate-800 text-white px-3 py-1 rounded-md text-sm font-bold">Añadir</button>
                </div>
                <ul className="space-y-1">
                  {employees.map(e => (
                    <li key={e.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                      {e.name} <button onClick={() => removeEmployee(e.id)} className="text-rose-500 font-bold hover:underline">X</button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* LISTA CATEGORÍAS/CUENTAS */}
              <section>
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2"><span>🏷️</span> Cuentas de Gasto</h4>
                <div className="flex gap-2 mb-2">
                  <select value={newCategoryType} onChange={e=>setNewCategoryType(e.target.value)} className="border border-slate-300 p-2 text-sm rounded-md bg-white">
                    <option value="general">🏢</option>
                    <option value="vehicle">🚗</option>
                    <option value="employee">👥</option>
                  </select>
                  <input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Ej. Publicidad" className="border border-slate-300 p-2 text-sm flex-1 rounded-md" />
                  <button onClick={addCategory} className="bg-slate-800 text-white px-3 py-1 rounded-md text-sm font-bold">Añadir</button>
                </div>
                <ul className="space-y-1">
                  {categories.map(c => (
                    <li key={c.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{c.type}</span> {c.name}
                      </div>
                      <button onClick={() => removeCategory(c.id)} className="text-rose-500 font-bold hover:underline">X</button>
                    </li>
                  ))}
                </ul>
              </section>

            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 5: IMPUTAR NUEVO GASTO (ESTÁNDAR)
      ========================================= */}
      {activeModal === 'expense' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           {/* ... Mismo código del modal de "Imputar Gasto" que tenías antes ... */}
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">Imputar Gasto</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 bg-white rounded-full p-1.5 shadow-sm">✕</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button onClick={() => setExpenseType('general')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'general' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>🏢 General</button>
                <button onClick={() => setExpenseType('vehicle')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'vehicle' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>🚗 Flota</button>
                <button onClick={() => setExpenseType('employee')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'employee' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>👥 Personal</button>
              </div>

              {expenseType === 'vehicle' && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehículo</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              )}

              {expenseType === 'employee' && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Empleado</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cuenta Contable</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                  {categories.filter(c => c.type === expenseType).map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Base Imponible (€)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">% IVA</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                    <option value="21">21%</option><option value="10">10%</option><option value="0">0%</option>
                  </select>
                </div>
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95">Guardar Gasto</button>
            </div>
           </div>
        </div>
      )}

    </div>
  );
}