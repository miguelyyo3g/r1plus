import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'r1plus',
  description: 'Plataforma B2B para Proveedores e Instaladores',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // <-- Obligatorio para que CSS conozca los márgenes del notch y gestos
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