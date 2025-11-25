// app/api/matches/[id]/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }   // 👈 CAMBIO IMPORTANTE
) {
  try {
    const body = await req.json();
    const { id } = await context.params;         // 👈 LO ESPERAMOS

    if (!id) {
      console.error('❌ Sin ID recibido');
      return NextResponse.json({ error: 'Missing match id' }, { status: 400 });
    }

    // Evitamos invalid date:
    let validDate = null;
    if (body.date) {
      const dateObj = new Date(body.date);
      if (!isNaN(dateObj.getTime())) {
        validDate = dateObj.toISOString().replace('T', ' ').slice(0, 19);
      }
    }

    const updateData: any = {
      venue: body.venue || null,
      home_score: body.home_score ?? null,
      away_score: body.away_score ?? null,
    };

    if (validDate) {
      updateData.date = validDate;
    }

    const { data, error } = await supabaseServer
      .from('matches')
      .update(updateData)
      .eq('id', id)    // 👈 AQUI SÍ TENEMOS EL ID REAL
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PATCH ERROR SUPABASE]', error);
    return NextResponse.json(
      { message: error.message, details: String(error) },
      { status: 500 }
    );
  }
}
