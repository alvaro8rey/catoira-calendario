import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import type { Match } from '@/types/match';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const updateData: any = {};

    if (body.date) updateData.date = body.date;
    updateData.venue = body.venue || null;
    updateData.home_score =
      body.home_score === '' ? null : Number(body.home_score);
    updateData.away_score =
      body.away_score === '' ? null : Number(body.away_score);

    // 👉 ESTA ES LA LÍNEA CORRECTA
    const { data, error } = await supabaseServer
      .from('matches')
      .update(updateData as Partial<Match>)  // <- 💯 SOLUCIÓN FINAL
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data?.[0] ?? {});
  } catch (error: any) {
    console.error('[PATCH ERROR SUPABASE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
