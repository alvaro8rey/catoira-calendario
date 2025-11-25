// app/admin/page.tsx  ⚠️ IMPORTANTE: NO lleva "use client"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import MatchAdminClient from "./MatchAdminClient";

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies });

  // 🔒 Verificamos sesión ANTES de renderizar
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    return redirect("/login"); // 🚨 Nunca carga nada de admin
  }

  return <MatchAdminClient />;
}
