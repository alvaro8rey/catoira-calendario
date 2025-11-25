import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    // 👌 Guardamos sesión con cookie válida 7 días
    const response = NextResponse.json({ ok: true });
    response.cookies.set("auth", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
    return response;
  }

  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
