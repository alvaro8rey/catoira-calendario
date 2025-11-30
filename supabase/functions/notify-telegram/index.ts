// supabase/functions/notify-telegram/index.ts

import { serve } from "https://deno.land/std@0.219.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";

// =========================
//  ENV & CLIENT INIT
// =========================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_GROUP_ID = Deno.env.get("TELEGRAM_GROUP_ID"); // ID del grupo/foro

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BOT_TOKEN || !TELEGRAM_GROUP_ID) {
  console.error("❌ Missing env vars");
  throw new Error("Missing environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// =========================
//  SEND MESSAGE TO TELEGRAM
// =========================
async function sendTelegramMessage(msg: string, topicId: number) {
  const payload = {
    chat_id: TELEGRAM_GROUP_ID, // GRUPO / FORO
    message_thread_id: topicId, // TOPIC ID
    text: msg,
    parse_mode: "Markdown",
  };

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("❌ Error enviando Telegram:", await res.text());
  }
}

// =========================
//  FORMATEAR MENSAJE
// =========================
function formatearMatchMensaje(newMatch: any, oldMatch: any, categoriaName: string): string {
  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  let texto = `*📌 ${categoriaName}*\n\n`;
  texto += `*${newMatch.home_team} vs ${newMatch.away_team}*\n\n`;

  // 🕒 FECHA / HORARIO
  if (newMatch.date) {
    const fechaStr = new Date(newMatch.date).toLocaleDateString("es-ES");
    const horaStr = formatHora(newMatch.date);
    if (oldMatch.date !== newMatch.date) {
      texto += `🕒 *Nuevo horario:* ${fechaStr} a las *${horaStr}*\n`;
    } else {
      texto += `🕒 Partido: ${fechaStr} a las *${horaStr}*\n`;
    }
  }

  // 📍 CAMPO
  if (newMatch.venue) {
    if (oldMatch.venue !== newMatch.venue) {
      texto += `📍 *Nuevo campo:* ${newMatch.venue}\n`;
    } else {
      texto += `📍 Campo: ${newMatch.venue}\n`;
    }
  } else {
    texto += `📍 Campo: _Por definir_\n`;
  }

  // ⚽ RESULTADO (solo si se juega el partido)
  const oldScore = `${oldMatch.home_score ?? ""}-${oldMatch.away_score ?? ""}`;
  const newScore = `${newMatch.home_score ?? ""}-${newMatch.away_score ?? ""}`;

  if (newMatch.home_score !== null && newMatch.away_score !== null) {
    if (oldScore !== newScore) {
      texto += `\n⚽ *Resultado final:* ${newScore}`;
    }
  }

  return texto;
}

// =========================
//  SERVIDOR PRINCIPAL
// =========================
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    const newMatch = payload?.new;
    const oldMatch = payload?.old;

    if (!newMatch || !newMatch.id) {
      return new Response("No new data", { status: 200 });
    }

    // 📌 Obtener topic_id desde categories
    const { data: categoryRow, error } = await supabase
      .from("categories")
      .select("telegram_topic_id, name")
      .eq("id", newMatch.category_id)
      .single();

    if (error || !categoryRow?.telegram_topic_id) {
      console.error("❌ No topic_id found for category:", newMatch.category_id, error);
      return new Response("No topic_id found", { status: 200 });
    }

    const threadId = categoryRow.telegram_topic_id;
    const categoriaName = categoryRow.name;

    // 📌 Formatear mensaje
    const msg = formatearMatchMensaje(newMatch, oldMatch, categoriaName);

    // 📢 Enviar mensaje a su topic correspondiente
    await sendTelegramMessage(msg, threadId);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ ERROR:", err);
    return new Response("Internal Error", { status: 500 });
  }
});
