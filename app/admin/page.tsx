// app/admin/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Match } from '@/types/match';

interface EditState {
  id: string | null;
  date: string;
  venue: string;
  home_score: string;
  away_score: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMatches() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/matches');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error cargando partidos');
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
    let dateLocal = '';
    if (match.date) {
      const d = new Date(match.date);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      dateLocal = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    }

    setEdit({
      id: match.id,
      date: dateLocal,
      venue: match.venue ?? '',
      home_score: match.home_score?.toString() ?? '',
      away_score: match.away_score?.toString() ?? ''
    });
  }

  async function saveEdit() {
    if (!edit?.id) return;
    setSavingId(edit.id);
    setError(null);

    try {
      const body: any = {};

      if (edit.date) {
        body.date = new Date(edit.date).toISOString();
      }

      body.venue = edit.venue || null;
      body.home_score = edit.home_score === '' ? null : Number(edit.home_score);
      body.away_score = edit.away_score === '' ? null : Number(edit.away_score);

      const res = await fetch(`/api/matches/${edit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error guardando');

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

  function logout() {
    document.cookie = 'auth=false; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-lg">
            CATOIRA S.D. — Calendario Tercera Futgal
          </h1>

          <div className="flex gap-2">
            <a
              href="webcal://localhost:3000/api/calendar.ics"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              📅 Calendario oficial
            </a>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading && <p>Cargando partidos...</p>}
        {error && <p className="text-red-600 mb-3">Error: {error}</p>}

        <div className="space-y-3">
          {matches.map(match => (
            <article key={match.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{match.home_team}</span>
                        <span className="font-semibold text-sm">{match.away_team}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg">{match.home_score ?? '-'}</span>
                        <span className="font-bold text-lg">{match.away_score ?? '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Jornada {match.jornada}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {match.date
                      ? new Date(match.date).toLocaleString('es-ES')
                      : 'Sin fecha/hora'}
                  </div>
                  <div className="text-xs text-slate-600">
                    {match.venue ? `Campo: ${match.venue}` : 'Campo no definido'}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(match)}
                  className="text-xs px-2 py-1 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Editar
                </button>
              </div>
            </article>
          ))}
        </div>

        {edit && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
              <h2 className="font-semibold mb-3 text-sm">Editar partido</h2>
              {/* Inputs */}
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs">Fecha y hora</label>
                  <input
                    type="datetime-local"
                    value={edit.date}
                    onChange={e => setEdit(prev => prev ? { ...prev, date: e.target.value } : prev)}
                    className="w-full border rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs">Campo</label>
                  <input
                    type="text"
                    value={edit.venue}
                    onChange={e => setEdit(prev => prev ? { ...prev, venue: e.target.value } : prev)}
                    className="w-full border rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs">Goles Catoira</label>
                    <input
                      type="number"
                      value={edit.home_score}
                      onChange={e => setEdit(prev => prev ? { ...prev, home_score: e.target.value } : prev)}
                      className="w-full border rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs">Goles rival</label>
                    <input
                      type="number"
                      value={edit.away_score}
                      onChange={e => setEdit(prev => prev ? { ...prev, away_score: e.target.value } : prev)}
                      className="w-full border rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={cancelEdit} className="px-3 py-1 text-xs border rounded-md">Cancelar</button>
                <button onClick={saveEdit} disabled={!!savingId} className="px-3 py-1 text-xs bg-slate-900 text-white rounded-md">
                  {savingId ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}