// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate de que esta ruta es correcta en tu proyecto

export default function AccountingView() {
  // --- ESTADOS DE LA VISTA ---
  const [activeModal, setActiveModal] = useState<null | 'expense' | 'incomeDetails' | 'config'>(null);
  const [expenseType, setExpenseType] = useState('general');
  const [filterMonth, setFilterMonth] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS DE DATOS REALES ---
  const [incomesList, setIncomesList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);
  const [vehicles, setVehicles] = useState([{ id: '1', name: 'Furgoneta 1234-LBC' }]); // Simulado inicial
  const [employees, setEmployees] = useState([{ id: '1', name: 'Juan Pérez' }]); // Simulado inicial
  const [categories, setCategories] = useState([
    { id: '1', name: 'Material de Oficina', type: 'general' },
    { id: '2', name: 'Dietas y Comidas', type: 'employee' }
  ]);

  // --- LÓGICA DE CARGA DE DATOS (SUPABASE) ---
  useEffect(() => {
    loadRealData();
  }, [filterMonth]);

  const loadRealData = async () => {
    setIsLoading(true);
    try {
      /* 
       * AQUÍ VA LA CONEXIÓN REAL A SUPABASE. 
       * Descomenta y ajusta los nombres de tus tablas.
       */
      
      // 1. Cargar Empleados (Profiles)
      // const { data: emps } = await supabase.from('profiles').select('*').in('role', ['empleado', 'sales_rep']);
      // if (emps) setEmployees(emps);

      // 2. Cargar Vehículos y Categorías
      // const { data: vehs } = await supabase.from('vehicles').select('*');
      // const { data: cats } = await supabase.from('expense_categories').select('*');
      
      // 3. Cargar Facturas (Ingresos)
      // let incomeQuery = supabase.from('invoices').select('*').eq('status', 'paid');
      // if (filterMonth !== 'all') { /* Lógica para filtrar por fecha */ }
      // const { data: incs } = await incomeQuery;
      
      // 4. Cargar Gastos
      // let expQuery = supabase.from('expenses').select('*');
      // if (filterMonth !== 'all') { /* Lógica para filtrar por fecha */ }
      // const { data: exps } = await expQuery;

      // MOCK TEMPORAL MIENTRAS CONECTAS:
      setIncomesList([
        { id: '1', client: 'Cliente A (Presupuesto #402)', date: '2026-10-10', base: 1500, vat: 315, total: 1815 },
        { id: '2', client: 'Empresa B (Factura #089)', date: '2026-10-12', base: 3200, vat: 672, total: 3872 },
      ]);
      setExpensesList([
        { id: '1', concept: 'Gasolina Repsol', type: 'vehicle', date: '2026-10-11', base: 85, vat: 17.85 },
        { id: '2', concept: 'Seguros Sociales', type: 'employee', date: '2026-10-01', base: 450, vat: 0 },
      ]);

    } catch (error) {
      console.error("Error cargando contabilidad:", error);
    }
    setIsLoading(false);
  };

  // --- CÁLCULOS DINÁMICOS ---
  const totalIncomesBase = incomesList.reduce((acc, curr) => acc + curr.base, 0);
  const totalIncomesVat = incomesList.reduce((acc, curr) => acc + curr.vat, 0);
  
  const totalExpensesBase = expensesList.reduce((acc, curr) => acc + curr.base, 0);
  const totalExpensesVat = expensesList.reduce((acc, curr) => acc + curr.vat, 0);

  const ivaAPagar = totalIncomesVat - totalExpensesVat;
  const beneficioBruto = totalIncomesBase - totalExpensesBase;
  const irpfEstimado = beneficioBruto > 0 ? beneficioBruto * 0.20 : 0; 
  const beneficioNetoReal = beneficioBruto - irpfEstimado;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* CABECERA Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contabilidad Analítica</h1>
          <p className="text-sm text-slate-500">Datos reales vinculados a tus presupuestos</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-slate-200 rounded-lg p-2 text-sm bg-white font-medium text-slate-700"
          >
            <option value="all">📅 Todo el año</option>
            <option value="10">Octubre 2026</option>
            <option value="09">Septiembre 2026</option>
          </select>
          
          <button 
            onClick={() => setActiveModal('config')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 whitespace-nowrap"
          >
            <span>⚙️</span> Ajustes
          </button>

          <button 
            onClick={() => setActiveModal('expense')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2 whitespace-nowrap"
          >
            <span>➕</span> Gasto
          </button>
        </div>
      </div>

      {/* DASHBOARD - TARJETAS INTERACTIVAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TARJETA INGRESOS (Clickable) */}
        <div 
          onClick={() => setActiveModal('incomeDetails')}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <span>📈</span>
              <span className="text-sm font-semibold">Ingresos</span>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-emerald-500 transition">Ver 🔍</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {isLoading ? '...' : `${totalIncomesBase.toFixed(2)} €`}
          </p>
          <p className="text-xs text-slate-400 mt-1">Facturación Base</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <span>📉</span>
            <span className="text-sm font-semibold">Gastos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {isLoading ? '...' : `${totalExpensesBase.toFixed(2)} €`}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Gastos Base</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <span>🏛️</span>
            <span className="text-sm font-semibold">Impuestos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{(ivaAPagar + irpfEstimado).toFixed(2)} €</p>
          <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
            <span className={ivaAPagar > 0 ? 'text-amber-600' : 'text-emerald-600'}>
              IVA: {ivaAPagar > 0 ? ivaAPagar.toFixed(2) : 'A devolver'}
            </span>
            <span>IRPF: {irpfEstimado.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 mb-2">
            <span>👛</span>
            <span className="text-sm font-semibold">Beneficio Real</span>
          </div>
          <p className="text-2xl font-black text-indigo-700">{beneficioNetoReal.toFixed(2)} €</p>
          <p className="text-xs text-indigo-500 mt-1">Líquido tras impuestos</p>
        </div>
      </div>

      {/* ESTADÍSTICAS BÁSICAS Y LISTADOS */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span>🧾</span> Últimos Gastos (Filtro: {filterMonth === 'all' ? 'Todos' : 'Mes'})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {expensesList.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">No hay gastos registrados en este periodo.</p>
            ) : (
              expensesList.map(exp => (
                <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${exp.type === 'vehicle' ? 'bg-orange-50' : exp.type === 'employee' ? 'bg-blue-50' : 'bg-slate-100'}`}>
                      {exp.type === 'vehicle' ? '🚗' : exp.type === 'employee' ? '👥' : '🏢'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{exp.concept}</p>
                      <p className="text-xs text-slate-500">{exp.date} • IVA {exp.vat > 0 ? 'Aplicado' : 'Exento'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{exp.base.toFixed(2)} €</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* =========================================
          MODAL 1: DRILL-DOWN DE INGRESOS 
      ========================================= */}
      {activeModal === 'incomeDetails' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <div>
                <h3 className="font-black text-emerald-800 text-lg flex items-center gap-2"><span>📈</span> Origen de los Ingresos</h3>
                <p className="text-xs text-emerald-600 font-medium">Desglose de presupuestos y facturas cobradas</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="bg-white rounded-full p-2 text-slate-400 hover:text-slate-700 shadow-sm">✕</button>
            </div>
            
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Cliente / Ref</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Base (€)</th>
                    <th className="px-4 py-3 text-right">Total (+IVA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomesList.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">{inc.client}</td>
                      <td className="px-4 py-3 text-xs">{inc.date}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{inc.base.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right text-slate-500">{inc.total.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <p className="font-bold text-slate-800">Total Base: {totalIncomesBase.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: CONFIGURACIÓN (VEHÍCULOS Y CUENTAS) 
      ========================================= */}
      {activeModal === 'config' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-black text-slate-800 text-lg">⚙️ Configuración Contable</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-2">✕</button>
            </div>
            
            <div className="p-5 space-y-8">
              {/* Vehículos */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2"><span>🚗</span> Flota de Vehículos</h4>
                  <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">+ Añadir</button>
                </div>
                <ul className="space-y-2">
                  {vehicles.map(v => (
                    <li key={v.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                      <span>{v.name}</span>
                      <button className="text-rose-500 text-xs font-bold hover:underline">Quitar</button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Personal */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2"><span>👥</span> Personal Activo</h4>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Auto-sincronizado</span>
                </div>
                <ul className="space-y-2">
                  {employees.map(e => (
                    <li key={e.id} className="flex items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      {e.name}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Categorías (Cuentas) */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2"><span>🏷️</span> Cuentas de Gasto</h4>
                  <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">+ Añadir Cuenta</button>
                </div>
                <ul className="space-y-2">
                  {categories.map(c => (
                    <li key={c.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold uppercase">{c.type}</span>
                        <span>{c.name}</span>
                      </div>
                      <button className="text-rose-500 text-xs font-bold hover:underline">Quitar</button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: IMPUTAR NUEVO GASTO (ACTUALIZADO)
      ========================================= */}
      {activeModal === 'expense' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-black text-slate-800 text-lg">Imputar Nuevo Gasto</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-2">✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button onClick={() => setExpenseType('general')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'general' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>🏢 General</button>
                <button onClick={() => setExpenseType('vehicle')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'vehicle' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>🚗 Flota</button>
                <button onClick={() => setExpenseType('employee')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'employee' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>👥 Personal</button>
              </div>

              {expenseType === 'vehicle' && (
                <div className="bg-orange-50 p-3 rounded-lg space-y-3 border border-orange-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Seleccionar Vehículo</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {expenseType === 'employee' && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-3 border border-blue-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Seleccionar Empleado</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cuenta de Gasto (Categoría)</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                  {categories.filter(c => c.type === expenseType || expenseType === 'general').map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Concepto o Referencia</label>
                <input type="text" placeholder="Ej. Repostaje, Factura F-234..." className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Base Imponible (€)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">% IVA</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white" defaultValue={expenseType === 'employee' ? '0' : '21'}>
                    <option value="21">21% (General)</option>
                    <option value="10">10% (Reducido)</option>
                    <option value="0">0% (Exento)</option>
                  </select>
                </div>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold mt-4 shadow-md transition-all active:scale-95">
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}