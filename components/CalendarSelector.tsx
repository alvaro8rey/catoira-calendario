// components/CalendarSelector.tsx
"use client";

import { useState } from "react";

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

export default function CalendarSelector() {
  const [cats, setCats] = useState<string[]>([]);

  function subscribe() {
    if (cats.length === 0) return;
    const query = cats.join(",");
    window.location.href = `webcal://catoira-calendario.vercel.app/api/calendar.ics?cat=${query}`;
  }

  return (
    <div className="bg-white p-4 rounded-md shadow-md max-w-md mx-auto">
      <h2 className="font-semibold mb-2">Selecciona categorías</h2>

      <select
        multiple
        className="w-full border rounded-md p-2"
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

      <button
        disabled={cats.length === 0}
        onClick={subscribe}
        className="mt-4 w-full bg-red-600 text-white py-2 rounded-md 
                   hover:bg-red-700 disabled:bg-gray-300"
      >
        📅 Suscribirse
      </button>
    </div>
  );
}
