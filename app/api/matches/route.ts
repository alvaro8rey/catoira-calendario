import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('matches')
      .select('*')
      .or(`home_team.eq.CATOIRA S.D.,away_team.eq.CATOIRA S.D.`)
      .order('jornada', { ascending: true })
      .order('date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    console.error('Error GET /api/matches', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
