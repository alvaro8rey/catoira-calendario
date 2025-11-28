// supabase/functions/telegram-bot-listener/index.ts

import { serve } from "https://deno.land/std@0.219.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";
import { Bot, InlineKeyboard } from "https://esm.sh/grammy@v1.24.0";

// =============================================
//  CONFIG: variables de entorno
// =============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BOT_TOKEN) {
  console.error("[BOT] Missing env variables");
  throw new Error("Missing env variables");
}

// =============================================
//  Clientes: Supabase + Bot de Telegram
// =============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BOT_ID = Number(BOT_TOKEN.split(":")[0]);
const BOT_INFO = {
  id: BOT_ID,
  is_bot: true,
  first_name: "Resultados Catoira",
  username: "ResultadosCatoiraBot",
};

const bot = new Bot(BOT_TOKEN, { botInfo: BOT_INFO });

// Registrar comandos y menú avanzado (aparecen en el botón "☰" / barra de comandos)
try {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "start", description: "Iniciar y mostrar menú" },
        { command: "menu", description: "Mostrar menú principal" },
      ],
    }),
  });

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_button: { type: "commands" },
    }),
  });

  console.log("✔️ Comandos y menú registrados correctamente.");
} catch (err) {
  console.error("⚠️ Error registrando comandos/menú:", err);
}

// =============================================
//  Tipos
// =============================================

type Category = { id: string; name: string };
type Subscription = { category_id: string };

// =============================================
//  Helpers de BD
// =============================================

async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("order", { ascending: true }); // ordenar por campo 'order'

  if (error) {
    console.error("[BOT] Error cargando categorías:", error);
    return [];
  }

  return data ?? [];
}

async function getUserSubscriptions(chatId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("category_id")
    .eq("telegram_chat_id", chatId);

  if (error) {
    console.error("[BOT] Error cargando suscripciones del usuario:", error);
    return [];
  }

  return data ?? [];
}

async function toggleSubscription(chatId: string, categoryId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .eq("category_id", categoryId)
    .maybeSingle();

  if (fetchError) {
    console.error("[BOT] Error comprobando suscripción:", fetchError);
    return;
  }

  if (existing) {
    const { error: delError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", existing.id);

    if (delError) {
      console.error("[BOT] Error eliminando suscripción:", delError);
    }
  } else {
    const { error: insError } = await supabase
      .from("subscriptions")
      .insert({ telegram_chat_id: chatId, category_id: categoryId });

    if (insError) {
      console.error("[BOT] Error creando suscripción:", insError);
    }
  }
}

// =============================================
//  Helper para no llenar el chat de mensajes
// =============================================

async function editOrReply(ctx: any, text: string, keyboard?: InlineKeyboard) {
  const options: any = { parse_mode: "Markdown" };
  if (keyboard) options.reply_markup = keyboard;

  const msg = ctx.callbackQuery?.message;
  if (msg) {
    try {
      await ctx.editMessageText(text, options);
      return;
    } catch {
      // Mensaje demasiado antiguo o ya editado → mandamos uno nuevo
      console.warn("[BOT] No se pudo editar el mensaje, enviando uno nuevo");
    }
  }

  await ctx.reply(text, options);
}

// =============================================
//  PANTALLAS DEL BOT
// =============================================

async function showMainMenu(ctx: any) {
  const keyboard = new InlineKeyboard()
    .text("⚙️ Gestionar suscripciones", "manage_subs").row()
    .text("📋 Ver mis suscripciones", "list_subs");

  const text = [
    "*Bienvenido al bot de resultados del Catoira S.D.*",
    "",
    "Puedes suscribirte a una o varias categorías y recibirás notificaciones",
    "cada vez que cambie el resultado o el horario de sus partidos.",
  ].join("\n");

  await editOrReply(ctx, text, keyboard);
}

async function showManageSubscriptions(ctx: any, chatId: string) {
  const [categories, subs] = await Promise.all([
    getCategories(),
    getUserSubscriptions(chatId),
  ]);

  const subscribedIds = new Set(subs.map((s) => s.category_id));
  const kb = new InlineKeyboard();

  for (const cat of categories) {
    const isOn = subscribedIds.has(cat.id);
    kb.text(`${isOn ? "✅" : "⬜️"} ${cat.name}`, `toggle_cat:${cat.id}`).row();
  }

  kb.text("⬅️ Volver", "back_main");

  const text = [
    "*Gestiona tus suscripciones*",
    "",
    "Pulsa sobre cada categoría para activarla o desactivarla.",
  ].join("\n");

  await editOrReply(ctx, text, kb);
}


// =============================================
//  HANDLERS DEL BOT
// =============================================

bot.command("start", async (ctx) => {
  await showMainMenu(ctx);
});

bot.command("menu", async (ctx) => {
  await showMainMenu(ctx);
});

// Gestionar suscripciones
bot.callbackQuery("manage_subs", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return;
  await showManageSubscriptions(ctx, chatId);
});

// Volver al menú principal
bot.callbackQuery("back_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showMainMenu(ctx);
});

// Toggle categoría ON/OFF
bot.callbackQuery(/^toggle_cat:(.*)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return;

  const categoryId = ctx.match[1];
  await toggleSubscription(chatId, categoryId);
  await showManageSubscriptions(ctx, chatId);
});

// =============================================
//  SERVIDOR EDGE (Supabase Function handler)
// =============================================

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const update = await req.json();
    await bot.handleUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("[BOT] Error en telegram-bot-listener:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
