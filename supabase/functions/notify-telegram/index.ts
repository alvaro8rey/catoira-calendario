// supabase/functions/notify-telegram/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("📩 Payload recibido:", payload);

    const match = payload.record.new;
    const chatId = payload.chat_id;
    const mode = payload.mode; // "result", "schedule" o "all"

    // Mensaje FINAL según modo
    let message = `⚽ *${match.home_team} - ${match.away_team}* (${match.category})`;

    if (mode === "result" || mode === "all") {
      message += `\n📊 Resultado: ${match.home_score ?? "-"} - ${match.away_score ?? "-"}`;
    }

    if (mode === "schedule" || mode === "all") {
      message += `\n🕒 Partido: ${new Date(match.date).toLocaleString("es-ES")}\n📍 ${match.venue ?? "Sin campo"}`;
    }

    // Enviar a Telegram
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("ERROR", { status: 500 });
  }
});
