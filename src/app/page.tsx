// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import LoginPage, { AuthUser } from '@/components/LoginPage';
import ChatView from '@/components/ChatView';
import CalendarView from '@/components/CalendarView';
import TrackingView from '@/components/TrackingView';
import DocumentsView from '@/components/DocumentsView';
import ProfileView from '@/components/ProfileView';
import AdminDashboardView from '@/components/AdminDashboardView';
import ModulesView from '@/components/ModulesView'; 
import FreelanceWorksView from '@/components/FreelanceWorksView'; // <-- Añadimos FreelanceWorksView

// Importamos los módulos de Layout
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';

interface MainAppViewProps {
  user: AuthUser;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

function MainAppView({ user, isAdmin, onLogout, onOpenAdmin }: MainAppViewProps) {
  const getDefaultTab = () => user.role === 'sales_rep' ? 'tracking' : 'chat';
  
  // Añadimos 'works' a los tipos permitidos
  const [activeTab, setActiveTab] = useState<'chat'|'calendar'|'tracking'|'modules'|'documents'|'works'|'tu'>(getDefaultTab());
  const displayRole = isAdmin ? 'supplier_owner' : user.role;
  
  const tabHistoryRef = useRef<string[]>([getDefaultTab()]);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const exitTimerRef = useRef<any>(null);

  useEffect(() => {
    const savedTab = localStorage.getItem('r1plus_tab');
    if (savedTab && savedTab !== 'crm') { 
      setActiveTab(savedTab as any); 
      tabHistoryRef.current = [savedTab]; 
    }
  }, []);

  // Lógica de hardware back-button en Android
  useEffect(() => {
    window.history.pushState({ r1plus: true }, '');
    const handlePopState = () => {
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current.pop(); 
        const prev = tabHistoryRef.current[tabHistoryRef.current.length - 1];
        setActiveTab(prev as any);
        localStorage.setItem('r1plus_tab', prev);
        window.history.pushState({ r1plus: true }, '');
      } else {
        if (exitTimerRef.current) window.history.go(-1);
        else {
          setShowExitWarning(true);
          window.history.pushState({ r1plus: true }, '');
          exitTimerRef.current = setTimeout(() => { setShowExitWarning(false); exitTimerRef.current = null; }, 2000); 
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: any) => {
    if (tab === activeTab) return;
    setActiveTab(tab); 
    localStorage.setItem('r1plus_tab', tab);
    tabHistoryRef.current.push(tab);
    if (tabHistoryRef.current.length > 6) tabHistoryRef.current.shift();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 font-sans select-none overflow-hidden relative">
      {showExitWarning && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-800/95 text-white px-4 py-2 rounded-full shadow-2xl z-[99999] text-sm font-medium">
          Presiona ATRÁS de nuevo para salir
        </div>
      )}

      {/* 1. COMPONENTE MODULAR CABECERA */}
      <Header 
        isAdmin={isAdmin} 
        displayRole={displayRole} 
        onLogout={onLogout} 
        onOpenAdmin={onOpenAdmin} 
      />

      {/* 2. ZONA DE VISTAS (RENDERIZADO DINÁMICO) */}
      <main className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden relative">
        <div className="h-full w-full flex flex-col bg-white">
          {activeTab === 'chat' && <ChatView user={user} />}
          {activeTab === 'calendar' && <CalendarView user={user} />}
          {activeTab === 'tracking' && <TrackingView user={user} />}
          
          {/* Aquí están las rutas del Centro de Módulos y sus sub-herramientas */}
          {activeTab === 'modules' && <ModulesView onOpenModule={handleTabChange} />} 
          {activeTab === 'documents' && <DocumentsView user={user} />}
          {activeTab === 'works' && <FreelanceWorksView user={user} />}
          
          {activeTab === 'tu' && <ProfileView user={user} />}
        </div>
      </main>

      {/* 3. COMPONENTE MODULAR NAVEGACIÓN INFERIOR */}
      <BottomNav 
        // Mantiene iluminado el icono de módulos si estás en alguna de sus sub-herramientas
        activeTab={['documents', 'works'].includes(activeTab) ? 'modules' : activeTab} 
        displayRole={displayRole} 
        onTabChange={handleTabChange} 
      />
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('r1plus_user');
    if (savedUser) { try { setCurrentUser(JSON.parse(savedUser)); } catch(e){} }
    setIsLoaded(true);
  }, []);

  const MY_ADMIN_PHONE = '+34600000000'; // <-- Tu número de administrador
  const isAdmin = currentUser?.role === 'admin' || currentUser?.phone === MY_ADMIN_PHONE;

  const handleLoginSuccess = (u: AuthUser) => { localStorage.setItem('r1plus_user', JSON.stringify(u)); setCurrentUser(u); };
  const handleLogout = () => { localStorage.removeItem('r1plus_user'); localStorage.removeItem('r1plus_tab'); setCurrentUser(null); setShowAdminDashboard(false); };

  if (!isLoaded) return <div className="h-screen w-full flex justify-center items-center bg-slate-50"><div className="animate-spin text-xl">⏳</div></div>;
  if (!currentUser) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  if (showAdminDashboard && isAdmin) return <AdminDashboardView onBackToApp={() => setShowAdminDashboard(false)} onLogout={handleLogout} />;
  
  return <MainAppView user={currentUser} isAdmin={isAdmin} onLogout={handleLogout} onOpenAdmin={() => setShowAdminDashboard(true)} />;
}