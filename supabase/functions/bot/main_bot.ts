// supabase\functions\bot\main_bot.ts
bot.command("start", async (ctx) => {
  const categories = await getCategoriesFromSupabase();

  let keyboard = categories.map((c) => [{ text: `${c.emoji} ${c.name}`, callback_data: `cat_${c.id}` }]);

  ctx.reply("Elige una categoría para recibir avisos ⬇", {
    reply_markup: { inline_keyboard: keyboard },
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.from.id;
  const data = query.data;

  if (data.startsWith("cat_")) {
    const category = data.split("_")[1];

    ctx.reply(`¿Qué quieres recibir de *${category}*?`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Resultados", callback_data: `sub_${category}_result` }],
          [{ text: "Cambios horario", callback_data: `sub_${category}_schedule` }],
          [{ text: "Todo", callback_data: `sub_${category}_all` }],
        ],
      },
    });
  }

  if (data.startsWith("sub_")) {
    const parts = data.split("_");
    const category = parts[1];
    const mode = parts[2];

    await saveSubscriptionToSupabase(chatId, category, mode);
    ctx.reply(`📌 Suscripción activada a *${category}* (${mode})`, { parse_mode: "Markdown" });
  }
});
