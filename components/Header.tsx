// components/Header.tsx

"use client";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-white border-b-4 border-red-600 shadow-md px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
      <Image
        src="/escudo.png"
        width={48}
        height={48}
        alt="Escudo Catoira SD"
        className="object-contain"
      />
      <h1 className="text-2xl font-bold text-red-600">Catoira S.D.</h1>

      {/* BOTÓN DE SUSCRIPCIÓN AL CALENDARIO */}
      <a
        href="webcal://catoira-calendario.vercel.app/api/calendar.ics"
        className="ml-auto bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition"
      >
        📅 Importar calendario
      </a>
    </header>
  );
}
