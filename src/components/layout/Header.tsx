import React from 'react';

interface HeaderProps {
  isAdmin: boolean;
  displayRole: string;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export default function Header({ isAdmin, displayRole, onLogout, onOpenAdmin }: HeaderProps) {
  // Verificamos si es el superadmin global
  const isSuperAdmin = displayRole === 'superadmin';

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-sm z-10 w-full">
      <div className="flex items-center gap-1.5">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">r1</span>
        <span className="text-xl font-bold text-slate-800 tracking-tight -ml-1">plus</span>
        
        {/* Etiqueta de Rol Actualizada */}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 ${
          isSuperAdmin ? 'bg-slate-900 text-amber-400' : 
          isAdmin ? 'bg-purple-100 text-purple-700' : 
          'bg-emerald-100 text-emerald-700'
        }`}>
          {isSuperAdmin ? 'Super Admin' : 
           displayRole === 'supplier_owner' ? 'Gerente' : 
           displayRole === 'sales_rep' ? 'IA' : 
           displayRole === 'buyer' ? 'Instalador' : 
           'Usuario'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Botón Exclusivo SuperAdmin */}
        {isSuperAdmin && (
          <button 
            onClick={() => window.location.href = '/admin'} 
            className="text-xs bg-slate-900 hover:bg-black text-amber-400 px-3 py-1.5 rounded-md font-black shadow-sm flex items-center gap-1.5 transition"
          >
            👑 Panel Central
          </button>
        )}

        {/* Botón Admin de Empresa (Oculto para el SuperAdmin para no duplicar botones) */}
        {isAdmin && !isSuperAdmin && (
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