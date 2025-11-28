// app/api/calendar.ics/route.ts

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import type { Match } from "@/types/match";

const TIMEZONE = "Europe/Madrid";

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export async function GET(req: Request) {
  try {
    // 🔍 Leer ?cat=ID1,ID2,ID3...
    const url = new URL(req.url);
    const catParam = url.searchParams.get("cat");
    const categories = catParam
      ? catParam.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    console.log("Categorias pedidas:", categories);

    // 1️⃣ Coger TODOS los partidos del Catoira (como antes)
    const { data, error } = await supabaseServer
      .from("matches")
      .select("*")
      .or(`home_team.eq.CATOIRA S.D.,away_team.eq.CATOIRA S.D.`)
      .order("jornada", { ascending: true })
      .order("date", { ascending: true });

    if (error) throw error;

    let matches = (data ?? []) as Match[];

    // 2️⃣ Filtrar EN MEMORIA por category_id si han seleccionado alguna
    if (categories.length > 0) {
      matches = matches.filter((m) =>
        m.category_id && categories.includes(m.category_id as any)
      );
    }

    console.log("Partidos tras filtro:", matches.length);

    // 3️⃣ Generar ICS
    let ics = "";
    ics += "BEGIN:VCALENDAR\r\n";
    ics += "VERSION:2.0\r\n";
    ics += "PRODID:-//Catoira SD//Calendario Oficial//ES\r\n";
    ics += "CALSCALE:GREGORIAN\r\n";
    ics += `X-WR-TIMEZONE:${TIMEZONE}\r\n`;
    ics += "METHOD:PUBLISH\r\n";

    for (const m of matches) {
      if (!m.date) continue;

      let startDate = new Date(m.date);

      // Si no tiene hora, por defecto 16:00
      if (
        startDate.getHours() === 0 &&
        startDate.getMinutes() === 0 &&
        startDate.getSeconds() === 0
      ) {
        startDate.setHours(16, 0, 0, 0);
      }

      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      const dtStart = formatDateTimeLocal(startDate);
      const dtEnd = formatDateTimeLocal(endDate);

      const summary = `${m.home_team} - ${m.away_team}`;
      const uid = `match-${m.id}@catoira-sd`;
      const location = m.venue ?? "";

      const descriptionLines = [
        `🏆 ${m.competition ?? ""}`,
        m.jornada ? `📅 Jornada ${m.jornada}` : "",
        m.home_score !== null && m.away_score !== null
          ? `⚽ Resultado: ${m.home_score} - ${m.away_score}`
          : "",
      ]
        .filter(Boolean)
        .join("\\n");

      ics += "BEGIN:VEVENT\r\n";
      ics += `UID:${uid}\r\n`;
      ics += `DTSTAMP:${dtStart}\r\n`;
      ics += `DTSTART;TZID=${TIMEZONE}:${dtStart}\r\n`;
      ics += `DTEND;TZID=${TIMEZONE}:${dtEnd}\r\n`;
      ics += `SUMMARY:${summary}\r\n`;
      if (location) ics += `LOCATION:${location}\r\n`;
      ics += `DESCRIPTION:${descriptionLines}\r\n`;
      ics += "END:VEVENT\r\n";
    }

    ics += "END:VCALENDAR\r\n";

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="catoira.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generando ICS", error);
    return new NextResponse("Error generando calendario", { status: 500 });
  }
}
