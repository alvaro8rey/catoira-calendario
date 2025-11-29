// components/CalendarModal.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

const categories = [
  { id: "6622245b-5159-4ac4-9a82-ca92d7aa8027", name: "Senior Masculino", emoji: "⚽" },
  { id: "d0e13dbd-34c9-4179-aba8-1a71a443ffcc", name: "Senior Femenino", emoji: "♀️" },
  { id: "fa18d79b-b7eb-43d1-ba7f-8f255e2a5269", name: "Juvenil", emoji: "🧑" },
  { id: "9b8a3cde-8967-4fea-ae77-7bb5f359468e", name: "Cadete", emoji: "🧒" },
  { id: "4b919798-4e83-4bb1-a35d-2fa9be36b2f0", name: "Infantil A", emoji: "👧" },
  { id: "fb660b16-91d3-4807-8c40-1f9e93357688", name: "Infantil B", emoji: "👧" },
  { id: "0b2f71f4-b1b4-41ac-96ef-bc540143c359", name: "Alevín", emoji: "👦" },
  { id: "75c520d0-d18f-476f-bee9-75822c7e03ac", name: "Benjamín", emoji: "👶" },
  { id: "abc5196e-63b6-4cf3-b5b2-c52fea11a30c", name: "Prebenjamín", emoji: "👶" },
];

export default function CalendarModal() {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<string[]>([]);

  function subscribe() {
    if (cats.length === 0) return;
    const query = cats.join(",");
    window.location.href = `webcal://catoira-calendario.vercel.app/api/calendar.ics?cat=${query}`;
  }

  return (
    <>

        {/* Botón Calendario */}
        <button
        onClick={() => setOpen(true)}
        className="w-full max-w-sm mx-auto bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
        <Image src="/icons/calendarplus.svg" alt="Calendario" width={20} height={20} />
        <span>Suscribirse a un calendario</span>
        </button>


      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">

            <h2 className="text-lg font-semibold text-black text-center mb-4">
              Selecciona categorías
            </h2>

            <select
              multiple
              className="w-full border rounded-md p-2 mb-4 text-black font-semibold"
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                setCats(selected);
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>

            {/* BOTÓN SUSCRIBIR */}
            <button
              disabled={cats.length === 0}
              onClick={subscribe}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md disabled:bg-gray-300"
            >
              📅 Suscribirse
            </button>

            {/* CERRAR */}
            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full bg-gray-200 hover:bg-gray-300 text-black py-2 rounded-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
