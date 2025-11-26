// app/api/matches/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("matches")
      .select("*")
      .order("category", { ascending: true })
      .order("jornada", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
