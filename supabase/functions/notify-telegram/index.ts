import { serve } from 'https://deno.land/std@0.219.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'; 

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!; 
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; 

const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

// ------------------------------------------------
// INTERFACES y HELPERS
// ------------------------------------------------

// Coincide con el JSON que envía un Webhook de Tabla (NO de Tópico)
interface TableWebhookPayload {
    type: 'UPDATE';
    table: string; // 'matches'
    schema: string; // 'public'
    record: {
        old: any;
        new: any;
    };
}

/**
 * Genera el texto del mensaje de notificación basado en los cambios detectados
 * y determina si hubo un cambio de score o de fecha.
 */
function generateNotificationMessage(newMatch: any, oldMatch: any): { message: string, score_change: boolean, date_change: boolean } {
    
    const score_change = (newMatch.home_score !== oldMatch.home_score) || (newMatch.away_score !== oldMatch.away_score) || (newMatch.is_finished !== oldMatch.is_finished);
    const date_change = (newMatch.date !== oldMatch.date) || (newMatch.venue !== oldMatch.venue);

    // Si el Trigger se disparó por un cambio en otra columna (e.g., created_at), no hacer nada.
    if (!score_change && !date_change) {
        return { message: '', score_change: false, date_change: false };
    }

    const matchTitle = `⚽ *${newMatch.home_team} vs ${newMatch.away_team}*`;
    let message = `${matchTitle}\n\n`;

    // 1. Lógica de cambio de resultados (SCORE)
    if (score_change) {
        const newScore = `${newMatch.home_score} - ${newMatch.away_score}`;
        const oldScore = `${oldMatch.home_score} - ${oldMatch.away_score}`;
        
        // El partido acaba de terminar
        if (newMatch.is_finished && !oldMatch.is_finished) {
            message += `✅ *¡Partido Finalizado!*\nResultado final: ${newScore}\n\n`;
        } else if (newScore !== oldScore) {
            // Un cambio de score que no es el final
            message += `🚨 *¡Cambio en el Marcador!* (Aún no finalizado)\nNuevo marcador: ${newScore}\n\n`;
        }
    }

    // 2. Lógica de cambio de horario/lugar (SCHEDULE)
    if (date_change) {
        message += `🗓️ *¡Cambio de Programación!* \n`;
        
        if (newMatch.date && newMatch.date !== oldMatch.date) {
            message += `- Fecha/Hora: De ${new Date(oldMatch.date).toLocaleString()} a *${new Date(newMatch.date).toLocaleString()}*\n`;
        }
        if (newMatch.venue && newMatch.venue !== oldMatch.venue) {
            message += `- Campo/Sede: De "${oldMatch.venue}" a *"${newMatch.venue}"*\n`;
        }
    }

    return { message, score_change, date_change };
}

/**
 * Intenta enviar un mensaje a un chat de Telegram.
 */
async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
    };

    try {
        const response = await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Error al enviar mensaje a chat ${chatId}. Código: ${response.status}`, await response.text());
        }
    } catch (error) {
        console.error(`Fallo de red al intentar enviar a chat ${chatId}:`, error);
    }
}

// ------------------------------------------------
// HANDLER PRINCIPAL (supabase/functions/notify-telegram/index.ts)
// ------------------------------------------------

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    if (!BOT_TOKEN) {
        return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN no está configurado.' }), { status: 500 });
    }

    try {
        // 1. Inicializar Supabase Client con Service Role Key
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 2. Recibir y parsear el payload de Webhook de Tabla
        const body: TableWebhookPayload = await req.json();
        
        const newMatch = body.record.new;
        const oldMatch = body.record.old;
        const category_id = newMatch.category_id; // Obtenemos el ID de la categoría del nuevo registro

        console.log(`[DEBUG] Webhook de Tabla recibido para match ID: ${newMatch.id}`);

        // 3. Generar el mensaje y determinar los cambios
        const { message: notificationMessage, score_change, date_change } = generateNotificationMessage(newMatch, oldMatch);
        
        if (!notificationMessage) {
            console.log('No hubo cambio relevante (score/fecha/venue). Terminando ejecución.');
            return new Response(JSON.stringify({ message: 'No significant change detected' }), { status: 200 });
        }
        
        // 4. Determinar los criterios de suscripción (FILTRADO)
        
        let whereConditions: string[] = [];

        if (score_change) {
            whereConditions.push('notify_results.eq.true');
        }
        if (date_change) {
            whereConditions.push('notify_date_changes.eq.true');
        }
        
        const filterClause = `category_id.eq.${category_id},or(${whereConditions.join(',')})`;
        
        console.log(`[DEBUG] Subscription Filter Clause: ${filterClause}`); 

        // 5. Consultar la tabla de suscripciones
        const { data: subscriptions, error: subError } = await supabaseClient
            .from('subscriptions')
            .select('telegram_chat_id')
            .or(filterClause);

        if (subError) {
            console.error('Error al consultar suscripciones:', subError);
            return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log(`No hay suscriptores que cumplan los criterios para la categoría ${category_id}.`);
            return new Response(JSON.stringify({ message: 'No subscribers found' }), { status: 200 });
        }

        console.log(`[DEBUG] Found Subscribers: ${subscriptions.length}`);
        
        // 6. Enviar mensajes a todos los suscriptores encontrados
        const sendPromises = subscriptions.map((sub: { telegram_chat_id: string }) => 
            sendTelegramMessage(sub.telegram_chat_id, notificationMessage)
        );

        await Promise.all(sendPromises);

        return new Response(JSON.stringify({ message: `Sent notifications to ${subscriptions.length} users.` }), { status: 200 });

    } catch (error) {
        console.error('Error inesperado en el Edge Function:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', detail: error.message }), { status: 500 });
    }
});