"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Match } from "@/types/match";

interface EditState {
  id: string | null;
  date: string;
  venue: string;
  home_score: string;
  away_score: string;
}

export default function MatchAdminClient() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState("senior");

  const categories = [
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

  async function loadMatches() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/matches/${currentCategory}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando partidos");
      setMatches(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
  }, [currentCategory]);

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
      id: edit.id, // ⬅️ **CORRECCIÓN: Se añade el ID al cuerpo para que el servidor lo reciba**
      date: edit.date ? new Date(edit.date).toISOString() : null,
      venue: edit.venue || null,
      home_score: edit.home_score === "" ? null : Number(edit.home_score),
      away_score: edit.away_score === "" ? null : Number(edit.away_score),
    };

    try {
      // ⬇️ CORRECCIÓN: Se simplifica la URL ya que el PATCH usa el ID del cuerpo, no de la URL.
      // Se usa "senior" como placeholder, ya que la ruta PATCH del servidor no usa [category].
      const res = await fetch(`/api/matches/senior`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error guardando");
      await loadMatches();
      setEdit(null);
    } catch (e: any) {
      setError(e.message);
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
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCurrentCategory(c.id)}
            className={`px-3 py-1 rounded-full border text-sm ${
              currentCategory === c.id
                ? "bg-slate-900 text-white"
                : "bg-white hover:bg-slate-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 📦 LISTA DE PARTIDOS */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-600 mb-2">{error}</p>}

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
                >
                  Editar
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* ✏️ MODAL EDICIÓN */}
        {edit && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="bg-white p-4 rounded-md w-full max-w-md">
              <h2 className="font-semibold mb-3">Editar partido</h2>

              <label className="text-xs">Fecha y hora</label>
              <input
                type="datetime-local"
                value={edit.date}
                onChange={(e) =>
                  setEdit((prev) => (prev ? { ...prev, date: e.target.value } : prev))
                }
                className="w-full border rounded-md p-2 mb-3"
              />

              <label className="text-xs">Campo</label>
              <input
                value={edit.venue}
                onChange={(e) =>
                  setEdit((prev) => (prev ? { ...prev, venue: e.target.value } : prev))
                }
                className="w-full border rounded-md p-2 mb-3"
              />

              <div className="flex gap-3 mb-3">
                <input
                  type="number"
                  placeholder="Goles Catoira"
                  value={edit.home_score}
                  onChange={(e) =>
                    setEdit((prev) =>
                      prev ? { ...prev, home_score: e.target.value } : prev
                    )
                  }
                  className="flex-1 border rounded-md p-2"
                />

                <input
                  type="number"
                  placeholder="Goles rival"
                  value={edit.away_score}
                  onChange={(e) =>
                    setEdit((prev) =>
                      prev ? { ...prev, away_score: e.target.value } : prev
                    )
                  }
                  className="flex-1 border rounded-md p-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={cancelEdit} className="px-3 py-1 border rounded-md">
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!!savingId}
                  className="px-3 py-1 bg-slate-900 text-white rounded-md"
                >
                  {savingId ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}