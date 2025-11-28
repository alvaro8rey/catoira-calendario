// app/api/matches/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Evitamos romper el render del admin cuando aún no hay categoría seleccionada.
  return NextResponse.json([]);
}
