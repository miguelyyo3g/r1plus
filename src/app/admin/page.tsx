'use client';

import AdminDashboardView from '@/components/AdminDashboardView';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AdminDashboardView 
        onBackToApp={() => window.location.href = '/'}
        onLogout={() => {
          localStorage.removeItem('r1plus_last_active');
          window.location.href = '/';
        }}
      />
    </main>
  );
}