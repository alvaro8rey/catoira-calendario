// app/api/calendar.ics/route.ts

// 👇 Muy importante: evita cualquier caché (para que siempre haya cambios)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import type { Match } from '@/types/match';

const TIMEZONE = 'Europe/Madrid';

// Formato ICS: YYYYMMDDTHHmmss
function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}T${hour}${minute}${second}`;
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('matches')
      .select('*')
      .or(`home_team.eq.CATOIRA S.D.,away_team.eq.CATOIRA S.D.`)
      .order('jornada', { ascending: true })
      .order('date', { ascending: true });

    if (error) throw error;

    const matches = (data ?? []) as Match[];

    let ics = '';
    ics += 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//Catoira SD//Calendario Oficial//ES\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += `X-WR-TIMEZONE:${TIMEZONE}\r\n`;
    ics += 'METHOD:PUBLISH\r\n'; // 👈 Importante para webcal suscrito

    for (const m of matches) {
      if (!m.date) continue;

      let startDate = new Date(m.date);

      // Si no tiene hora, usar 17:00 por defecto
      if (
        startDate.getHours() === 0 &&
        startDate.getMinutes() === 0 &&
        startDate.getSeconds() === 0
      ) {
        startDate.setHours(17, 0, 0, 0);
      }

      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      const dtStart = formatDateTimeLocal(startDate);
      const dtEnd = formatDateTimeLocal(endDate);

      const summary = `${m.home_team} - ${m.away_team}`;
      const uid = `match-${m.id}@catoira-sd`;
      const location = m.venue ?? '';
      const jornada = m.jornada ? `Jornada ${m.jornada}` : '';
      const competition = m.competition ?? '';

      let result = '';
      if (m.home_score !== null && m.away_score !== null) {
        result = ` Resultado: ${m.home_score} - ${m.away_score}`;
      }

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${uid}\r\n`;
      ics += `DTSTAMP:${dtStart}\r\n`;
      ics += `DTSTART;TZID=${TIMEZONE}:${dtStart}\r\n`;
      ics += `DTEND;TZID=${TIMEZONE}:${dtEnd}\r\n`;
      ics += `SUMMARY:${summary}\r\n`;
      if (location) ics += `LOCATION:${location}\r\n`;
      const descriptionLines = [
        `🏆 ${competition}`,
        `📅 ${jornada}`,
        result ? `⚽ ${result}` : '',
      ]
        .filter(Boolean)
        .join('\\n');

      ics += `DESCRIPTION:${descriptionLines}\r\n`;
      ics += 'END:VEVENT\r\n';
    }

    ics += 'END:VCALENDAR\r\n';

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        // 👇 IMPORTANTE: que el dispositivo lo trate como calendario SUSCRITO (no descargado)
        'Content-Disposition': 'inline; filename="catoira-suscripcion.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generando ICS', error);
    return new NextResponse('Error generando calendario', { status: 500 });
  }
}
