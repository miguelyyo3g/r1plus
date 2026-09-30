'use client';

import React, { useState } from 'react';
import { SupplierTechnicalSheet } from '@/data/supplierTemplates';

interface TechnicalSheetModalProps {
  sheet: SupplierTechnicalSheet;
  onClose: () => void;
  onSubmit: (data: Record<string, string | number>) => void;
}

export default function TechnicalSheetModal({ sheet, onClose, onSubmit }: TechnicalSheetModalProps) {
  const [formData, setFormData] = useState<Record<string, string | number>>({});

  const handleChange = (fieldId: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
              {sheet.supplierName}
            </span>
            <h3 className="text-sm font-bold text-white">{sheet.title}</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario Dinámico */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1">
          <p className="text-xs text-slate-500">{sheet.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sheet.fields.map(field => {
              const isFullWidth = field.type === 'text' || field.type === 'select';
              return (
                <div key={field.id} className={isFullWidth ? 'sm:col-span-2' : ''}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {field.label} {field.unit && <span className="text-slate-400 font-normal">({field.unit})</span>}
                    {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formData[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    >
                      <option value="">Selecciona una opción...</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder || ''}
                      value={formData[field.id] || ''}
                      onChange={e => handleChange(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
            >
              Adjuntar Ficha al Chat
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}