// app/api/matches/[category]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { category } = params;
    if (!category) return NextResponse.json([]);

    const { data, error } = await supabaseServer
      .from("matches")
      .select("*")
      .eq("category_id", category)
      .order("jornada", { ascending: true })
      .order("date", { ascending: true });

    return NextResponse.json(error ? [] : data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { category } = params;
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "Se requiere 'id'." }, { status: 400 });
    }

    const updateData = {
      date: body.date || null,
      venue: body.venue || null,
      home_score: body.home_score === "" ? null : Number(body.home_score),
      away_score: body.away_score === "" ? null : Number(body.away_score),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from("matches")
      .update(updateData)
      .eq("id", body.id)
      .eq("category_id", category)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
