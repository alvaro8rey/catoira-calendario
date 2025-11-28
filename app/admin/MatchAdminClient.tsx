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

const CATEGORIES = [
  { id: "6622245b-5159-4ac4-9a82-ca92d7aa8027", name: "Senior Masculino" },
  { id: "d0e13dbd-34c9-4179-aba8-1a71a443ffcc", name: "Senior Femenino" },
  { id: "fa18d79b-b7eb-43d1-ba7f-8f255e2a5269", name: "Juvenil" },
  { id: "9b8a3cde-8967-4fea-ae77-7bb5f359468e", name: "Cadete" },
  { id: "4b919798-4e83-4bb1-a35d-2fa9be36b2f0", name: "Infantil A" },
  { id: "fb660b16-91d3-4807-8c40-1f9e93357688", name: "Infantil B" },
  { id: "0b2f71f4-b1b4-41ac-96ef-bc540143c359", name: "Alevín" },
  { id: "75c520d0-d18f-476f-bee9-75822c7e03ac", name: "Benjamín" },
  { id: "abc5196e-63b6-4cf3-b5b2-c52fea11a30c", name: "Prebenjamín" },
];

export default function MatchAdminClient() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [showMenu, setShowMenu] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState(CATEGORIES[0].id);

  async function loadMatches() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${currentCategory}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMatches(json);
    } catch (e: any) {
      setError("❌ Error al cargar partidos: " + e.message);
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

    const updateFields: any = {
      id: edit.id,
      date: edit.date ? new Date(edit.date).toISOString() : null,
      venue: edit.venue || null,
    };

    if (edit.home_score.trim() !== "") updateFields.home_score = Number(edit.home_score);
    if (edit.away_score.trim() !== "") updateFields.away_score = Number(edit.away_score);

    try {
      const res = await fetch(`/api/matches/${currentCategory}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateFields),
      });

      if (!res.ok) throw new Error("Error guardando");
      await loadMatches();
      setEdit(null);
    } catch (e: any) {
      setError(`❌ Error al guardar: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function cancelEdit() {
    setEdit(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row">
      {/* 🧭 MENÚ LATERAL (responsive) */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="lg:hidden bg-slate-900 text-white px-4 py-2 m-3 rounded-md"
      >
        Categorías ☰
      </button>

      <aside
        className={`${
          showMenu ? "block" : "hidden"
        } lg:block w-full lg:w-56 bg-white shadow-md border-r min-h-screen p-3`}
      >
        <h2 className="text-sm font-semibold text-slate-600 uppercase mb-2">Categorías</h2>
        <div className="space-y-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCurrentCategory(c.id);
                setShowMenu(false);   // 👈 CIERRA MENÚ AUTOMÁTICAMENTE
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                currentCategory === c.id
                  ? "bg-slate-900 text-white font-bold"
                  : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* 📋 CONTENIDO PRINCIPAL */}
      <section className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">
          Partidos — {CATEGORIES.find((c) => c.id === currentCategory)?.name}
        </h1>

        {loading && <p className="text-blue-600">Cargando partidos...</p>}
        {error && <p className="text-red-600 p-2 bg-red-100 rounded-md">{error}</p>}

        <div className="space-y-4">
          {matches.map((match) => (
            <article
              key={match.id}
              className="
                bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition
                flex justify-between items-center
                lg:grid lg:grid-cols-12 lg:gap-2
              "
            >
              {/* 🟩 Columna 1 - Info partido */}
              <div className="lg:col-span-7">
                <p className="font-semibold">{match.home_team} vs {match.away_team}</p>
                <p className="text-xs text-slate-500">Jornada {match.jornada}</p>
                <p className="text-xs">
                  {match.date ? new Date(match.date).toLocaleString("es-ES") : "Sin fecha"}
                </p>
              </div>

              {/* 🟨 Columna 2 - Resultado Fijo */}
              <div className="
                font-bold text-lg text-center
                w-24 flex-shrink-0
                lg:col-span-3 lg:justify-self-center
              ">
                {match.home_score ?? "-"} — {match.away_score ?? "-"}
              </div>

              {/* 🟥 Columna 3 - Botón */}
              <div className="lg:col-span-2 flex justify-end mt-3 lg:mt-0">
                <button
                  onClick={() => openEdit(match)}
                  className="px-3 py-1 text-sm border rounded hover:bg-slate-50"
                >
                  Editar
                </button>
              </div>
            </article>

          ))}
        </div>
      </section>

      {/* ✏️ MODAL */}
      {edit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm sm:max-w-lg">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Editar partido</h2>

            <label className="text-xs block mb-1">Fecha</label>
            <input
              type="datetime-local"
              value={edit.date}
              onChange={(e) => setEdit({ ...edit, date: e.target.value })}
              className="w-full border rounded-md p-2 mb-4"
            />

            <label className="text-xs block mb-1">Campo</label>
            <input
              value={edit.venue}
              onChange={(e) => setEdit({ ...edit, venue: e.target.value })}
              className="w-full border rounded-md p-2 mb-4"
            />

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="number"
                placeholder="Goles Catoira"
                value={edit.home_score}
                onChange={(e) => setEdit({ ...edit, home_score: e.target.value })}
                className="flex-1 border rounded-md p-2 text-center"
              />
              <input
                type="number"
                placeholder="Goles rival"
                value={edit.away_score}
                onChange={(e) => setEdit({ ...edit, away_score: e.target.value })}
                className="flex-1 border rounded-md p-2 text-center"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border rounded-md hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={!!savingId}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700"
              >
                {savingId ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
