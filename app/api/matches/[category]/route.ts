// app/api/matches/[category]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// --- OPERACIÓN GET (LISTADO) ---
// Maneja la petición de lista: /api/matches/UUID_CAT
export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { category } = params;

    // Asegúrate de que el usuario está autenticado si es necesario, aunque Next.js se encarga en la página.

    const { data, error } = await supabaseServer
      .from("matches")
      .select("*")
      .eq("category_id", category) // Filtra por el ID de categoría de la URL
      .order("jornada", { ascending: true })
      .order("date", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("❌ ERROR GET /api/matches/[category]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- OPERACIÓN PATCH (ACTUALIZACIÓN) ---
// Maneja la petición de edición: /api/matches/UUID_CAT
export async function PATCH(
  req: NextRequest,
  { params }: { params: { category: string } } // Mantenemos category, aunque no se usa para el WHERE
) {
  try {
    const body = await req.json();
    const categoryId = params.category;

    if (!body.id) {
      return NextResponse.json(
        { error: "ID del partido faltante en el cuerpo de la solicitud." },
        { status: 400 }
      );
    }

    // 1. Construir los campos a actualizar
    const updateFields: any = {};

    // Mapear campos solo si están presentes en el cuerpo
    if ("date" in body) updateFields.date = body.date || null;
    if ("venue" in body) updateFields.venue = body.venue || null;
    
    // Convertir puntuaciones a Number o null
    if ("home_score" in body) {
        const score = body.home_score === "" ? null : Number(body.home_score);
        updateFields.home_score = isNaN(score) ? null : score;
    }
    if ("away_score" in body) {
        const score = body.away_score === "" ? null : Number(body.away_score);
        updateFields.away_score = isNaN(score) ? null : score;
    }
    
    // 2. Ejecutar la actualización en Supabase
    const { data, error } = await supabaseServer
      .from("matches")
      .update(updateFields)
      .eq("id", body.id) // Buscar el partido por ID (enviado en el BODY)
      .eq("category_id", categoryId) // Opcional pero recomendado: asegurar que pertenece a la categoría
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ ERROR PATCH /api/matches/[category]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}