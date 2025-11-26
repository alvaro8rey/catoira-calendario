// app/api/matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

async function enviarMensajeTelegram(text: string) {
try {
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
console.warn("⚠️ No hay TOKEN o CHAT_ID en el entorno");
return;
}

await fetch(
`https://api.telegram.org/bot${token}/sendMessage`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
chat_id: chatId,
text,
}),
}
);
} catch (err) {
console.error("❌ Error enviando a Telegram:", err);
}
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
try {
const body = await req.json();

const updateFields: any = {};
if ("date" in body) updateFields.date = body.date;
if ("venue" in body) updateFields.venue = body.venue;
if ("home_score" in body) updateFields.home_score = body.home_score;
if ("away_score" in body) updateFields.away_score = body.away_score;

const { data, error } = await supabaseServer
.from("matches")
.update(updateFields)
.eq("id", params.id)
.select()
.single();

if (error) throw error;

// 🟢 ENVIAR MENSAJE A TELEGRAM
const mensaje = `
📢 *RESULTADO ACTUALIZADO*
${data.home_team} ${data.home_score ?? "-"} - ${data.away_score ?? "-"} ${data.away_team}
📅 ${new Date(data.date).toLocaleString("es-ES")}
🏟️ ${data.venue || "Sin campo definido"}
`;
await enviarMensajeTelegram(mensaje);

return NextResponse.json(data);
} catch (error: any) {
console.error("Error PATCH /api/matches/[id]", error);
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
