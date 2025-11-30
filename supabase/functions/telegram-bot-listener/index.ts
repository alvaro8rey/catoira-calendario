// supabase/functions/telegram-bot-listener/index.ts
import { serve } from "https://deno.land/std@0.219.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";
import { Bot, InlineKeyboard } from "https://esm.sh/grammy@v1.24.0";
// =========================
//  ENV & CLIENTES
// =========================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BOT_TOKEN) {
  console.error("[BOT] Missing env variables");
  throw new Error("Missing env variables");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Info mínima del bot para evitar que grammy intente hacer una request extra
const BOT_ID = Number(BOT_TOKEN.split(":")[0]);
const BOT_INFO = {
  id: BOT_ID,
  is_bot: true,
  first_name: "Resultados Catoira",
  username: "ResultadosCatoiraBot"
};
const bot = new Bot(BOT_TOKEN, {
  botInfo: BOT_INFO
});
// =========================
//  REGISTRO DE COMANDOS / MENÚ
// =========================
try {
  // Comandos que salen al escribir "/"
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      commands: [
        {
          command: "start",
          description: "Iniciar y gestionar suscripciones"
        },
        {
          command: "menu",
          description: "Gestionar suscripciones"
        }
      ]
    })
  });
  // Botón de menú (icono junto al campo de texto)
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      menu_button: {
        type: "commands"
      }
    })
  });
  console.log("✔️ Comandos y menú registrados correctamente.");
} catch (err) {
  console.error("⚠️ Error registrando comandos/menú:", err);
}
// =========================
//  HELPERS BD
// =========================
async function getCategories() {
  const { data, error } = await supabase.from("categories").select("id, name").order("order", {
    ascending: true
  }); // 👈 orden por campo 'order'
  if (error) {
    console.error("[BOT] Error cargando categorías:", error);
    return [];
  }
  return data ?? [];
}
async function getUserSubscriptions(chatId) {
  const { data, error } = await supabase.from("subscriptions").select("category_id").eq("telegram_chat_id", chatId);
  if (error) {
    console.error("[BOT] Error cargando suscripciones:", error);
    return [];
  }
  return data ?? [];
}
async function toggleSubscription(chatId, categoryId) {
  const { data: existing, error } = await supabase.from("subscriptions").select("id").eq("telegram_chat_id", chatId).eq("category_id", categoryId).maybeSingle();
  if (error) {
    console.error("[BOT] Error buscando suscripción:", error);
  }
  if (existing) {
    const { error: delError } = await supabase.from("subscriptions").delete().eq("id", existing.id);
    if (delError) {
      console.error("[BOT] Error borrando suscripción:", delError);
    }
  } else {
    const { error: insError } = await supabase.from("subscriptions").insert({
      telegram_chat_id: chatId,
      category_id: categoryId
    });
    if (insError) {
      console.error("[BOT] Error creando suscripción:", insError);
    }
  }
}
// =========================
//  HELPERS UI (MENSAJES)
// =========================
async function editOrReply(ctx, text, keyboard) {
  const options = {
    parse_mode: "Markdown"
  };
  if (keyboard) options.reply_markup = keyboard;
  const msg = ctx.callbackQuery?.message;
  if (msg) {
    try {
      await ctx.editMessageText(text, options);
      return;
    } catch (_e) {
    // Si falla el edit (mensaje muy viejo editado, etc.), hacemos reply
    }
  }
  await ctx.reply(text, options);
}
// Menú principal: solo muestra texto + botón "Gestionar suscripciones"
async function showMainMenu(ctx) {
  const keyboard = new InlineKeyboard().text("⚙️ Gestionar suscripciones", "manage_subs");
  const text = [
    "*Bienvenido al bot de resultados del Catoira S.D.*",
    "",
    "Puedes suscribirte a una o varias categorías y recibirás notificaciones",
    "cada vez que cambie el resultado o el horario de sus partidos.",
    "",
    "Pulsa en *\"⚙️ Gestionar suscripciones\"* para elegir tus equipos."
  ].join("\n");
  await editOrReply(ctx, text, keyboard);
}
// Pantalla de gestión de suscripciones
async function showManageSubscriptions(ctx: any, chatId: string) {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, telegram_link")
    .order("order", { ascending: true });

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("category_id")
    .eq("telegram_chat_id", chatId);

  const subscribedIds = new Set(subs?.map((s) => s.category_id));
  const kb = new InlineKeyboard();

  for (const cat of categories ?? []) {
    const isOn = subscribedIds.has(cat.id);
    kb.text(`${isOn ? "✅" : "⬜️"} ${cat.name}`, `toggle_cat:${cat.id}`);

    if (cat.telegram_link) {
      kb.url("📢 Unirme al canal", cat.telegram_link);
    }
    kb.row();
  }

  kb.text("⬅️ Volver al menú", "back_main");

  await editOrReply(ctx, "*Gestiona tus suscripciones*\nPulsa para activar/desactivar y únete a los canales:", kb);
}
// =========================
//  HANDLERS DEL BOT
// =========================
// /start → muestra menú principal
bot.command("start", async (ctx)=>{
  await showMainMenu(ctx);
});
//  🔍 Obtener el ID del grupo donde está el bot
bot.command("get_group_id", async (ctx) => {
  const chatId = ctx.chat.id;
  await ctx.reply(`🆔 *ID DEL GRUPO:* \`${chatId}\``, { parse_mode: "Markdown" });
});
// 📌  NUEVO COMANDO /debug_topics
bot.command("debug_topics", async (ctx) => {
  if (!ctx.message?.is_topic_message) {
    return ctx.reply("ℹ️ Este grupo **no tiene temas activados**, o no estás dentro de uno.\nActívalos desde la configuración del grupo.");
  }

  const threadId = ctx.message.message_thread_id;
  await ctx.reply(`🧪 Estás ahora mismo en el topic con ID:\n\`${threadId}\``);
});
// /menu → muestra menú principal (atajo rápido)
bot.command("menu", async (ctx)=>{
  await showMainMenu(ctx);
});
// Pulsar "⚙️ Gestionar suscripciones"
bot.callbackQuery("manage_subs", async (ctx)=>{
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat.id.toString();
  await showManageSubscriptions(ctx, chatId);
});
// Botón "⬅️ Volver al menú"
bot.callbackQuery("back_main", async (ctx)=>{
  await ctx.answerCallbackQuery();
  await showMainMenu(ctx);
});
// Toggle de una categoría (suscribir / desuscribir)
bot.callbackQuery(/^toggle_cat:(.*)$/, async (ctx)=>{
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat.id.toString();
  const categoryId = ctx.match[1];
  await toggleSubscription(chatId, categoryId);
  await showManageSubscriptions(ctx, chatId);
});
// =========================
//  SERVE EDGE FUNCTION
// =========================
serve(async (req)=>{
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405
    });
  }
  try {
    const update = await req.json();
    await bot.handleUpdate(update);
    return new Response("OK");
  } catch (err) {
    console.error("[BOT] Error procesando update:", err);
    return new Response(JSON.stringify({
      error: "Internal error"
    }), {
      status: 500
    });
  }
});
