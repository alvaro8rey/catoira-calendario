// app\admin\page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import MatchAdminClient from "./MatchAdminClient";
import type { Database } from "@/types/database"; // Asegúrate de que esta ruta es correcta

export default async function AdminPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect("/login");
  }

  // Renderiza el componente cliente para manejar la interactividad
  return <MatchAdminClient />;
}
