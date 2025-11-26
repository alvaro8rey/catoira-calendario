"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Match } from "@/types/match"; // Asegúrate de que esta ruta sigue siendo válida

interface EditState {
  id: string | null;
  date: string;
  venue: string;
  home_score: string;
  away_score: string;
}

// Se define la lista de categorías dentro del cliente ya que es donde se usa el estado.
const CATEGORIES = [
  { id: "d0e13dbd-34c9-4179-aba8-1a71a443ffcc", name: "Senior Femenino" },
  { id: "fa18d79b-b7eb-43d1-ba7f-8f255e2a5269", name: "Juvenil" },
  { id: "9b8a3cde-8967-4fea-ae77-7bb5f359468e", name: "Cadete" },
  { id: "4b919798-4e83-4bb1-a35d-2fa9be36b2f0", name: "Infantil A" },
  { id: "fb660b16-91d3-4807-8c40-1f9e93357688", name: "Infantil B" },
  { id: "0b2f71f4-b1b4-41ac-96ef-bc540143c359", name: "Alevín" },
  { id: "75c520d0-d18f-476f-bee9-75822c7e03ac", name: "Benjamín" },
  { id: "abc5196e-63b6-4cf3-b5b2-c52fea11a30c", name: "Prebenjamín" },
  { id: "6622245b-5159-4ac4-9a82-ca92d7aa8027", name: "Senior Masculino" },
];


export default function MatchAdminClient() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Inicialmente selecciona la primera categoría o una por defecto.
  const [currentCategory, setCurrentCategory] = useState(CATEGORIES[0].id); 

  async function loadMatches() {
    setLoading(true);
    setError(null);

    try {
      // 🟢 RUTA GET: /api/matches/[category]
      // Next.js llama a app/api/matches/[category]/route.ts GET
      const res = await fetch(`/api/matches/${currentCategory}`); 
      const json = await res.json();
      
      if (!res.ok) {
         throw new Error(json.error || `Error ${res.status}: Fallo de conexión o API no disponible.`);
      }
      setMatches(json);
    } catch (e: any) {
      setError(`Error al cargar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
  }, [currentCategory]); // 👈 Recarga cuando cambia la categoría

  function openEdit(match: Match) {
    const d = new Date(match.date || "");
    const pad = (n: number) => n.toString().padStart(2, "0");

    setEdit({
      id: match.id,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`,
      venue: match.venue ?? "",
      home_score: match.home_score?.toString() ?? "",
      away_score: match.away_score?.toString() ?? "",
    });
  }

  async function saveEdit() {
    if (!edit?.id) return;
    setSavingId(edit.id);

    const body: any = {
      // Mandamos el ID del partido en el cuerpo
      id: edit.id, 
      date: edit.date ? new Date(edit.date).toISOString() : null,
      venue: edit.venue || null,
      home_score: edit.home_score === "" ? null : Number(edit.home_score),
      away_score: edit.away_score === "" ? null : Number(edit.away_score),
    };

    try {
      // 🟢 RUTA PATCH: /api/matches/[category]
      // Next.js llama a app/api/matches/[category]/route.ts PATCH
      // Pasamos la categoría actual en la URL, aunque el PATCH no la necesita, es buena práctica.
      const res = await fetch(`/api/matches/${currentCategory}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const jsonError = await res.json();
        throw new Error(jsonError.error || "Error guardando");
      }
      await loadMatches(); // Recargar la lista después de editar
      setEdit(null);
    } catch (e: any) {
      setError(`Error al guardar: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  }

  function cancelEdit() {
    setEdit(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">

      {/* 🧭 HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-lg">📋 Panel de Administración</h1>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* 🔘 BOTONES CATEGORÍAS */}
      <div className="max-w-4xl mx-auto mt-4 flex flex-wrap gap-2 px-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCurrentCategory(c.id)}
            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
              currentCategory === c.id
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white hover:bg-slate-200 text-slate-700"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 📦 LISTA DE PARTIDOS */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h2 className="text-xl font-bold mb-4 text-slate-800">
            Partidos: {CATEGORIES.find(c => c.id === currentCategory)?.name || "Cargando..."}
        </h2>

        {loading && <p className="text-blue-600">Cargando partidos...</p>}
        {error && <p className="text-red-600 mb-2 p-2 bg-red-100 rounded-lg">{error}</p>}
        {!loading && !error && matches.length === 0 && (
             <p className="text-slate-500">No se encontraron partidos para esta categoría.</p>
        )}


        <div className="space-y-3">
          {matches.map((match) => (
            <article
              key={match.id}
              className="bg-white rounded-lg shadow-sm border p-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-sm">{match.home_team}</p>
                      <p className="font-semibold text-sm">{match.away_team}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{match.home_score ?? "-"}</p>
                      <p className="font-bold text-lg">{match.away_score ?? "-"}</p>
                    </div>
                  </div>
                  <p className="text-xs mt-2">Jornada {match.jornada}</p>
                  <p className="text-xs">
                    {match.date
                      ? new Date(match.date).toLocaleString("es-ES")
                      : "Sin fecha"}
                  </p>
                  <p className="text-xs">{match.venue || "Campo no definido"}</p>
                </div>

                <button
                  onClick={() => openEdit(match)}
                  className="text-xs px-2 py-1 border rounded-md hover:bg-slate-50"
                  disabled={!!savingId}
                >
                  {savingId === match.id ? "..." : "Editar"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* ✏️ MODAL EDICIÓN */}
        {edit && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="bg-white p-4 rounded-md w-full max-w-md shadow-2xl">
              <h2 className="font-semibold mb-3">Editar partido</h2>

              <label className="text-xs block mb-1">Fecha y hora</label>
              <input
                type="datetime-local"
                value={edit.date}
                onChange={(e) =>
                  setEdit((prev) => (prev ? { ...prev, date: e.target.value } : prev))
                }
                className="w-full border rounded-md p-2 mb-3 focus:ring-slate-500 focus:border-slate-500"
              />

              <label className="text-xs block mb-1">Campo</label>
              <input
                value={edit.venue}
                onChange={(e) =>
                  setEdit((prev) => (prev ? { ...prev, venue: e.target.value } : prev))
                }
                className="w-full border rounded-md p-2 mb-3 focus:ring-slate-500 focus:border-slate-500"
              />

              <div className="flex gap-3 mb-4">
                <input
                  type="number"
                  placeholder="Goles Catoira (Local)"
                  value={edit.home_score}
                  onChange={(e) =>
                    setEdit((prev) =>
                      prev ? { ...prev, home_score: e.target.value } : prev
                    )
                  }
                  className="flex-1 border rounded-md p-2 text-center"
                />

                <input
                  type="number"
                  placeholder="Goles rival (Visitante)"
                  value={edit.away_score}
                  onChange={(e) =>
                    setEdit((prev) =>
                      prev ? { ...prev, away_score: e.target.value } : prev
                    )
                  }
                  className="flex-1 border rounded-md p-2 text-center"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button 
                    onClick={cancelEdit} 
                    className="px-4 py-2 border rounded-md text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!!savingId}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 transition"
                >
                  {savingId ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}