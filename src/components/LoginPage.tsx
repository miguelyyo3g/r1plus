'use client';

import React from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'sales_rep' | 'buyer' | 'admin';
  company: string;
  companyType: 'supplier' | 'client';
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const loginAsMarta = () => {
    onLoginSuccess({
      id: 'user-rep-2',
      name: 'Marta Rodríguez',
      email: 'marta.rodriguez@valvulasdelnorte.com',
      role: 'sales_rep',
      company: 'Válvulas del Norte S.L.',
      companyType: 'supplier'
    });
  };

  const loginAsCarlos = () => {
    onLoginSuccess({
      id: 'user-buyer-1',
      name: 'Carlos Gómez',
      email: 'carlos.gomez@instalacionesgomez.es',
      role: 'buyer',
      company: 'Instalaciones Gómez S.L.',
      companyType: 'client'
    });
  };

  const loginAsAdmin = () => {
    onLoginSuccess({
      id: 'user-admin-root',
      name: 'Super Admin',
      email: 'admin@r1plus.com',
      role: 'admin',
      company: 'r1plus Platform Central',
      companyType: 'supplier'
    });
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-800">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        
        <div className="text-center mb-6">
          <span className="text-3xl font-black text-indigo-600">
            r1<span className="text-slate-900">plus</span>
          </span>
          <p className="text-xs text-slate-500 mt-1">Acceso a la plataforma B2B</p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
            Selecciona perfil de acceso
          </p>

          <button
            type="button"
            onClick={loginAsMarta}
            className="w-full py-3.5 px-4 bg-indigo-600 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-between cursor-pointer"
          >
            <span>Marta Rodríguez (Comercial)</span>
            <span>Entrar →</span>
          </button>

          <button
            type="button"
            onClick={loginAsCarlos}
            className="w-full py-3.5 px-4 bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-between cursor-pointer"
          >
            <span>Carlos Gómez (Instalador)</span>
            <span>Entrar →</span>
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={loginAsAdmin}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-black text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
            >
              <span>⚙️ Panel Master Administrador</span>
              <span>Gestionar →</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}