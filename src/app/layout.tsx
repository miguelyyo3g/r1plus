import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'r1plus',
  description: 'Plataforma B2B para Proveedores e Instaladores',
  manifest: '/manifest.json', // <-- Esto le dice al móvil que es una App
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'r1plus',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // <-- Evita que el móvil haga zoom al tocar inputs
  viewportFit: 'cover',
  themeColor: '#0f172a', // <-- Color slate-900 para la barra superior del móvil
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-900 select-none overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}