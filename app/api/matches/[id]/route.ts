// app/api/matches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    console.log("📥 PATCH RECIBIDO – ID:", params.id);
    console.log("📥 BODY RECIBIDO:", body);

    // Campos que permitimos editar desde la web
    const updateFields: any = {};
    if ('date' in body) updateFields.date = body.date;
    if ('venue' in body) updateFields.venue = body.venue;
    if ('home_score' in body) updateFields.home_score = body.home_score;
    if ('away_score' in body) updateFields.away_score = body.away_score;

    console.log("📦 DATOS ENVIADOS A SUPABASE:", updateFields);

    const { data, error } = await supabaseServer
      .from('matches')
      .update(updateFields as any)   // 🟢 FORZAMOS TIPO PARA NO ROMPER TS
      .eq('id', params.id)
      .select()
      .single();  // 👈 Devuelve SOLO UNA FILA

    console.log("📤 RESPUESTA SUPABASE:", { data, error });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ ERROR PATCH /api/matches/[id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
