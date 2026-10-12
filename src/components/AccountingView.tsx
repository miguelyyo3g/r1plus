// @ts-nocheck
import React, { useState } from 'react';

export default function AccountingView() {
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseType, setExpenseType] = useState('general'); // general, vehicle, employee

  // MOCK DATA (Aquí conectarías con Supabase)
  const financialData = {
    incomes: { base: 12500, vat: 2625, total: 15125 }, 
    expenses: { 
      base: 3200, 
      vat: 672, 
      total: 3872,
      byType: {
        general: 1000,
        vehicle: 800,
        employee: 1400
      }
    }     
  };

  const ivaAPagar = financialData.incomes.vat - financialData.expenses.vat;
  const beneficioBruto = financialData.incomes.base - financialData.expenses.base;
  const irpfEstimado = beneficioBruto * 0.20; 
  const beneficioNetoReal = beneficioBruto - irpfEstimado;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contabilidad Analítica</h1>
          <p className="text-sm text-slate-500">Control real de tus ingresos y centros de coste</p>
        </div>
        <button 
          onClick={() => setExpenseModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <span>➕</span>
          Anotar Gasto
        </button>
      </div>

      {/* DASHBOARD - TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <span>📈</span>
            <span className="text-sm font-semibold">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{financialData.incomes.base.toFixed(2)} €</p>
          <p className="text-xs text-slate-400 mt-1">Facturación Base</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <span>📉</span>
            <span className="text-sm font-semibold">Gastos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{financialData.expenses.base.toFixed(2)} €</p>
          <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
            <span>🚗 {financialData.expenses.byType.vehicle}€</span>
            <span>👥 {financialData.expenses.byType.employee}€</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <span>🏛️</span>
            <span className="text-sm font-semibold">Impuestos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{(ivaAPagar + irpfEstimado).toFixed(2)} €</p>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>IVA: {ivaAPagar.toFixed(2)}€</span>
            <span>IRPF: {irpfEstimado.toFixed(2)}€</span>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 mb-2">
            <span>👛</span>
            <span className="text-sm font-semibold">Beneficio Real</span>
          </div>
          <p className="text-2xl font-black text-indigo-700">{beneficioNetoReal.toFixed(2)} €</p>
          <p className="text-xs text-indigo-500 mt-1">Líquido en caja</p>
        </div>
      </div>

      {/* LISTADOS */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Desglose de Gastos */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span>🧾</span> Últimos Gastos Imputados
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Gasto de Vehículo */}
            <div className="p-4 flex justify-between items-center hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-lg">🚗</div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Gasolina - Repsol</p>
                  <p className="text-xs text-slate-500">Vehículo: 1234-LBC • IVA 21%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">85.00 €</p>
              </div>
            </div>

            {/* Gasto de Personal */}
            <div className="p-4 flex justify-between items-center hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">👥</div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Seguros Sociales (TC1)</p>
                  <p className="text-xs text-slate-500">Empleado: Juan Pérez • Exento IVA</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">450.00 €</p>
              </div>
            </div>
            
            {/* Gasto General */}
            <div className="p-4 flex justify-between items-center hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg">🏢</div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Material de Oficina</p>
                  <p className="text-xs text-slate-500">Suministros • IVA 21%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">120.50 €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Facturación */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span>📈</span> Cobros y Facturas Emitidas
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-4 flex justify-between items-center hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-800">Instalación Cliente A</p>
                <p className="text-xs text-slate-500">Transferencia • Factura #001</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">+ 1,500.00 €</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL NUEVO GASTO - DINÁMICO */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-800">Imputar Nuevo Gasto</h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* TIPO DE GASTO TABS */}
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button onClick={() => setExpenseType('general')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'general' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>🏢 General</button>
                <button onClick={() => setExpenseType('vehicle')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'vehicle' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>🚗 Flota</button>
                <button onClick={() => setExpenseType('employee')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${expenseType === 'employee' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>👥 Personal</button>
              </div>

              {/* CAMPOS ESPECÍFICOS SEGÚN TIPO */}
              {expenseType === 'vehicle' && (
                <div className="bg-orange-50 p-3 rounded-lg space-y-3 border border-orange-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Seleccionar Vehículo</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                      <option>Furgoneta 1234-LBC</option>
                      <option>Coche Comercial 9988-JJK</option>
                      <option>+ Añadir Nuevo Vehículo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Gasto (Vehículo)</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                      <option>Combustible (Gasolina/Gasoil)</option>
                      <option>Mantenimiento y Taller</option>
                      <option>Seguro del Vehículo</option>
                      <option>Cuota Renting / Letra</option>
                      <option>ITV / Tasas</option>
                      <option>Peajes y Parking</option>
                    </select>
                  </div>
                </div>
              )}

              {expenseType === 'employee' && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-3 border border-blue-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Seleccionar Empleado</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                      <option>Juan Pérez (Comercial)</option>
                      <option>María López (Instaladora)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Concepto de Nómina/Personal</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                      <option>Sueldo Neto (Pago a empleado)</option>
                      <option>Seguros Sociales (Pago a Tesorería)</option>
                      <option>Retenciones IRPF (Modelo 111)</option>
                      <option>Dietas y Desplazamientos</option>
                      <option>Mutua / Prevención Riesgos</option>
                    </select>
                  </div>
                </div>
              )}

              {expenseType === 'general' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Categoría General</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                    <option>Compras y Materiales (Stock)</option>
                    <option>Servicios (Alquiler, Luz, Internet)</option>
                    <option>Publicidad y Marketing</option>
                    <option>Gestoría y Profesionales</option>
                    <option>Impuestos y Tasas (No IVA)</option>
                    <option>Herramientas y Software</option>
                  </select>
                </div>
              )}

              {/* CAMPOS COMUNES (Base, IVA, Pago) */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Concepto (Opcional)</label>
                <input type="text" placeholder="Ej. Repostaje viaje Madrid..." className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
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
                    <option value="4">4% (Superreducido)</option>
                    <option value="0">0% (Exento / Nóminas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Forma de Pago</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                  <option>Cargo en Cuenta (Transferencia / Domiciliado)</option>
                  <option>Tarjeta Empresa</option>
                  <option>Efectivo / Caja</option>
                </select>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg text-sm font-bold mt-4 shadow-md transition-all active:scale-95">
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}