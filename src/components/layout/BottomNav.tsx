// @ts-nocheck
/* eslint-disable */
import React from 'react';

interface BottomNavProps {
  activeTab: string;
  displayRole: string;
  onTabChange: (tab: any) => void;
  onOpenCompanyModal?: () => void;
}

export default function BottomNav({ activeTab, displayRole, onTabChange, onOpenCompanyModal }: BottomNavProps) {
  const navItems = [
    { id: 'chat', icon: '💬', label: 'Chats', always: true },
    { id: 'calendar', icon: '📅', label: 'Agenda', always: true },
    { id: 'modules', icon: '🎛️', label: 'Módulos', always: true },
    { id: 'tu', icon: '👤', label: 'Tú', always: true },
  ];

  return (
    <nav className="bg-white w-full border-t border-slate-200 pb-[env(safe-area-inset-bottom)] flex justify-around items-center shrink-0 z-10 shadow-sm h-14 relative">
      {navItems.map((item) => {
        if (!item.always && displayRole === item.hideFor) return null;
        
        const isActive = activeTab === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id)} 
            className={`flex flex-col items-center justify-center w-14 h-full transition ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'}`}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}

      {/* BOTÓN RÁPIDO DE EMPRESA Y LOGO */}
      <button 
        onClick={onOpenCompanyModal}
        title="Gestionar Datos de Empresa y Logo"
        className="flex flex-col items-center justify-center w-14 h-full text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 transition border-l border-slate-100 cursor-pointer"
      >
        <span className="text-xl mb-0.5">🏢</span>
        <span className="text-[10px] font-black">Empresa</span>
      </button>
    </nav>
  );
}