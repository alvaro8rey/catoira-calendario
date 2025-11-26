// app/api/matches/[category]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { category } = params;

    const { data, error } = await supabaseServer
      .from("matches")
      .select("*")
      .eq("category_id", category) // ← FILTRAR POR CATEGORÍA
      .order("jornada", { ascending: true })
      .order("date", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("❌ ERROR GET /api/matches/[category]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// app/api/matches/[category]/route.ts

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // 🛑 DEBUG: Log completo del cuerpo recibido (¡revisa esto si el error persiste!)
    console.log("📥 CUERPO DE ENTRADA:", body);

    if (!body.id) {
      return NextResponse.json(
        { error: "ID del partido faltante" },
        { status: 400 }
      );
    }

    // 🛑 SOLO aceptamos estos campos
    const updateFields: any = {};
    if ("date" in body) updateFields.date = body.date || null;
    if ("venue" in body) updateFields.venue = body.venue || null;
    
    // Convertimos a Number, asegurándonos de que si hay un error de parseo (aunque con Number es improbable),
    // no se pase un tipo incorrecto.
    if ("home_score" in body) {
        const score = body.home_score === "" ? null : Number(body.home_score);
        updateFields.home_score = isNaN(score) ? null : score;
    }
    if ("away_score" in body) {
        const score = body.away_score === "" ? null : Number(body.away_score);
        updateFields.away_score = isNaN(score) ? null : score;
    }
    
    if ("category_id" in body) updateFields.category_id = body.category_id; // ✔️ opcional

    console.log("📦 ENVIANDO A SUPABASE:", updateFields);

    // 💡 Posible Causa: El error 'column "mode" does not exist' suele ocurrir
    // cuando una opción de librería o un campoj desconocido se pasa a la base de datos.
    // La solución es asegurarse de que solo se pasen las columnas correctas.
    // Como ya lo estás haciendo al crear updateFields, esto debería ser suficiente.

    const { data, error } = await supabaseServer
      .from("matches")
      .update(updateFields)
      .eq("id", body.id) // 👈 MUY IMPORTANTE
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ ERROR PATCH /api/matches/[category]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}