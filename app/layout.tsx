// app/layout.tsx
import "./globals.css";
import { Metadata } from "next";
import Header from "@/components/Header"; // 👈 Importamos el header

export const metadata: Metadata = {
  title: "Calendario Catoira SD",
  description: "Gestión de partidos",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-100">
        {/* 🔴 HEADER GLOBAL */}
        <Header />

        {/* 🔹 CONTENIDO DE LA PÁGINA */}
        {children}
      </body>
    </html>
  );
}
