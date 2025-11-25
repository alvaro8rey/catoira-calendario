"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Match } from "@/types/match";
import { useEffect, useState } from "react";

interface EditState {
  id: string | null;
  date: string;
  venue: string;
  home_score: string;
  away_score: string;
}

export default function MatchAdminClient() {
  const router = useRouter();
  const supabase = createClientComponentClient(); // 🔑 ESTO ES LO IMPORTANTE

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 📥 Cargar partidos desde Supabase
  async function loadMatches() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/matches");
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
  }, []);

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

    try {
      const body: any = {
        date: edit.date ? new Date(edit.date).toISOString() : null,
        venue: edit.venue || null,
        home_score: edit.home_score === "" ? null : Number(edit.home_score),
        away_score: edit.away_score === "" ? null : Number(edit.away_score),
      };

      const res = await fetch(`/api/matches/${edit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error guardando");

      await loadMatches();
      setEdit(null); // Cerrar ventana
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  function cancelEdit() {
    setEdit(null);
  }

  // 🔐 CERRAR SESIÓN REAL con SUPABASE
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-lg">CATOIRA S.D. — Panel admin</h1>

          <div className="flex gap-2">
            <a
              href="webcal://catoira-calendario.vercel.app/api/calendar.ics"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              📅 Calendario oficial
            </a>

            {/* 🔥 AHORA FUNCIONA */}
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* 📝 LISTA DE PARTIDOS */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading && <p>Cargando partidos...</p>}
        {error && <p className="text-red-600 mb-3">Error: {error}</p>}

        <div className="space-y-3">
          {matches.map((match) => (
            <article key={match.id} className="bg-white rounded-lg shadow-sm border p-3">
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

        {/* 💾 MODAL EDICIÓN */}
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
