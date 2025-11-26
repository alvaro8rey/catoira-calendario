// app/admin/page.tsx 
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import MatchAdminClient from "./MatchAdminClient";

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();

  if (!data.session) return redirect("/login");

  return <MatchAdminClient />;
}
