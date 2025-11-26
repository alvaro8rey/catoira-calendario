// supabase/functions/notify-telegram/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("📩 Payload recibido:", payload);

    const match = payload.record.new;
    const chatId = payload.chat_id;
    // 🟢 CORRECCIÓN: Leer los booleanos en lugar de 'mode'
    const notifyResults = payload.notify_results; 
    const notifySchedule = payload.notify_schedule; 

    // Mensaje FINAL según modo
    let message = `⚽ *${match.home_team} - ${match.away_team}* (${match.category_id})`; // 👈 Usar category_id

    // 🟢 CORRECCIÓN: Cambiar la lógica condicional
    if (notifyResults) { // Si el usuario se suscribió a resultados
      // Si se actualizan los scores (que indica que el partido terminó)
      if (match.home_score !== null || match.away_score !== null) { 
          message += `\n\n📊 Resultado Final: ${match.home_score ?? "-"} - ${match.away_score ?? "-"}`;
      }
    }

    if (notifySchedule) { // Si el usuario se suscribió a horario/lugar
      // Agregamos la información de horario y lugar (relevante si se actualiza)
      message += `\n🕒 Partido: ${new Date(match.date).toLocaleString("es-ES")}\n📍 ${match.venue ?? "Sin campo"}`;
    }
    
    // Si no hay ninguna suscripción activa, no enviamos.
    if (!notifyResults && !notifySchedule) {
        return new Response("No suscrito a esta actualización", { status: 200 });
    }

    // Enviar a Telegram
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
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