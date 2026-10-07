import React from 'react';

interface HeaderProps {
  isAdmin: boolean;
  displayRole: string;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export default function Header({ isAdmin, displayRole, onLogout, onOpenAdmin }: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-sm z-10 w-full">
      <div className="flex items-center gap-1.5">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">r1</span>
        <span className="text-xl font-bold text-slate-800 tracking-tight -ml-1">plus</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {displayRole === 'supplier_owner' ? 'Gerente' : displayRole === 'sales_rep' ? 'IA' : displayRole === 'buyer' ? 'Instalador' : 'Usuario'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button onClick={onOpenAdmin} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md font-medium shadow-sm">
            Admin
          </button>
        )}
        <button onClick={onLogout} className="text-xs text-rose-600 px-2 py-1.5 font-medium">
          Salir
        </button>
      </div>
    </header>
  );
}