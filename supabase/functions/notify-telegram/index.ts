// supabase/functions/notify-telegram/index.ts

import { serve } from "https://deno.land/std@0.219.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";

// ======================================================
// 🔐 VARIABLES DE ENTORNO (IMPORTANTE)
// ======================================================
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR FATAL: Faltan variables de entorno críticas");
  serve((_req) => new Response("Missing ENV vars", { status: 500 }));
  throw new Error("Missing ENV vars in notify-telegram");
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ======================================================
// 📤 FUNCIÓN PARA ENVIAR MENSAJE A TELEGRAM
// ======================================================
async function sendTelegramMessage(chatId: string, text: string) {
  return await fetch(TELEGRAM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

// ======================================================
// 🧠 GENERADOR INTELIGENTE DE MENSAJE
// ======================================================
function generateMessage(newMatch: any, oldMatch: any, categoryName: string) {
  const scoreWasNullBefore =
    oldMatch.home_score === null && oldMatch.away_score === null;
  const scoreIsNullNow =
    newMatch.home_score === null && newMatch.away_score === null;

  const scoreChanged =
    (!scoreWasNullBefore && !scoreIsNullNow &&
      (newMatch.home_score !== oldMatch.home_score ||
        newMatch.away_score !== oldMatch.away_score)) ||
    (scoreWasNullBefore && !scoreIsNullNow);

  const dateChanged =
    newMatch.date !== oldMatch.date || newMatch.venue !== oldMatch.venue;

  if (!scoreChanged && !dateChanged) {
    return null; // No hay cambios importantes → no enviar
  }

  let msg = `*📢 ${categoryName}*\n\n`;
  msg += `*${newMatch.home_team}* vs *${newMatch.away_team}*\n\n`;

  if (scoreChanged) {
    msg += `🔴 *Resultado Final:* ${newMatch.home_score} - ${newMatch.away_score}\n\n`;
  }

  if (dateChanged) {
    msg += `🗓️ *Cambio de Horario*\n`;
    msg += `📅 Nueva fecha: *\n${new Date(newMatch.date).toLocaleString(
      "es-ES"
    )}*\n`;
    msg += `📍 Campo: *${newMatch.venue ?? "Sin campo"}*\n\n`;
  }

  msg += `⚽️ ¡Vamos Catoira S.D.!`;
  return msg;
}

// ======================================================
// 🧠 HANDLER PRINCIPAL
// ======================================================
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    console.log("🟢 JSON recibido:", body);

    const oldMatch = body.old;
    const matchId = oldMatch?.id;
    if (!matchId) return new Response("NO_MATCH_ID", { status: 200 });

    // Obtener datos NUEVOS de la DB
    const { data: newMatch } = await supabaseClient
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    // Obtener nombre de categoría
    const { data: categoryData } = await supabaseClient
      .from("categories")
      .select("name")
      .eq("id", newMatch.category_id)
      .single();

    const categoryName = categoryData?.name ?? "Categoría Desconocida";

    // 📌 Generar mensaje inteligente
    const message = generateMessage(newMatch, oldMatch, categoryName);
    if (!message) {
      console.log("⚠️ No hubo cambios relevantes, no se envía nada.");
      return new Response("NO_CHANGES", { status: 200 });
    }

    // 📌 Buscar TODOS los que estén suscritos a esta categoría
    const { data: subscribers } = await supabaseClient
      .from("subscriptions")
      .select("telegram_chat_id")
      .eq("category_id", newMatch.category_id);

    if (!subscribers || subscribers.length === 0) {
      console.log("⚠️ Nadie suscrito. No se envía mensaje.");
      return new Response("NO_SUBSCRIBERS", { status: 200 });
    }

    // 📤 Enviar a los suscriptores
    for (const sub of subscribers) {
      await sendTelegramMessage(sub.telegram_chat_id, message);
    }

    console.log("📨 Notificación enviada correctamente.");
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ ERROR EN notify-telegram:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
