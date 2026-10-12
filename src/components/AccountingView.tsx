// @ts-nocheck
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Landmark, Wallet, Plus, Receipt } from 'lucide-react';

export default function AccountingView() {
  // Estados para el modal de nuevo gasto
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);

  // MOCK DATA: Aquí conectarías con tu Supabase (Presupuestos facturados y Gastos)
  const financialData = {
    incomes: { base: 12500, vat: 2625, total: 15125 }, // Viene de Presupuestos aceptados/facturados
    expenses: { base: 3200, vat: 672, total: 3872 }     // Viene de la tabla expenses
  };

  // Cálculos Automáticos de Impuestos y Beneficios
  const ivaAPagar = financialData.incomes.vat - financialData.expenses.vat;
  const beneficioBruto = financialData.incomes.base - financialData.expenses.base;
  // Estimación de IRPF / Impuesto Sociedades (Ejemplo: 20% sobre el beneficio bruto)
  const irpfEstimado = beneficioBruto * 0.20; 
  const beneficioNetoReal = beneficioBruto - irpfEstimado;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contabilidad</h1>
          <p className="text-sm text-slate-500">Control de ingresos, gastos e impuestos</p>
        </div>
        <button 
          onClick={() => setExpenseModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          Anotar Gasto
        </button>
      </div>

      {/* DASHBOARD - TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-semibold">Ingresos (Base)</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{financialData.incomes.base.toFixed(2)} €</p>
          <p className="text-xs text-slate-400 mt-1">De presupuestos facturados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <TrendingDown size={18} />
            <span className="text-sm font-semibold">Gastos (Base)</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{financialData.expenses.base.toFixed(2)} €</p>
          <p className="text-xs text-slate-400 mt-1">Suministros y compras</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Landmark size={18} />
            <span className="text-sm font-semibold">Impuestos (IVA + IRPF)</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{(ivaAPagar + irpfEstimado).toFixed(2)} €</p>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>IVA: {ivaAPagar.toFixed(2)}€</span>
            <span>IRPF: {irpfEstimado.toFixed(2)}€</span>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 mb-2">
            <Wallet size={18} />
            <span className="text-sm font-semibold">Beneficio Real</span>
          </div>
          <p className="text-2xl font-black text-indigo-700">{beneficioNetoReal.toFixed(2)} €</p>
          <p className="text-xs text-indigo-500 mt-1">Líquido tras impuestos</p>
        </div>
      </div>

      {/* LISTADOS: GASTOS RECIENTES Y FACTURAS */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Desglose de Gastos */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Receipt size={18} /> Últimos Gastos
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Ejemplo estático de una fila de gasto */}
            <div className="p-4 flex justify-between items-center hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-800">Gasolina Furgoneta</p>
                <p className="text-xs text-slate-500">Tarjeta Repsol • IVA 21%</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">85.00 €</p>
                <p className="text-xs text-slate-500">Base: 70.25 €</p>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-800">Material Oficina</p>
                <p className="text-xs text-slate-500">Transferencia • IVA 21%</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">120.50 €</p>
                <p className="text-xs text-slate-500">Base: 99.59 €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desglose de Pagos */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp size={18} /> Últimos Cobros (Presupuestos)
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

      {/* MODAL NUEVO GASTO */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Anotar Nuevo Gasto</h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Concepto</label>
                <input type="text" placeholder="Ej. Gasolina, Materiales..." className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Base Imponible (€)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">% IVA</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                    <option value="21">21% (General)</option>
                    <option value="10">10% (Reducido)</option>
                    <option value="4">4% (Superreducido)</option>
                    <option value="0">0% (Exento)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Forma de Pago</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white">
                  <option>Tarjeta Empresa</option>
                  <option>Transferencia</option>
                  <option>Domiciliación</option>
                  <option>Efectivo</option>
                </select>
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium mt-2">
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}