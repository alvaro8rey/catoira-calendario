// app/layout.tsx
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendario Catoira SD',
  description: 'Gestión de partidos',
  icons: {
    icon: '/favicon.png',  // 👈 AQUÍ VA TU PNG
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
