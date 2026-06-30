import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/db/profile";

export default async function DashboardIndex() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await fetchProfile(supabase, user);
  redirect(profile.activeRole === "creator" ? "/dashboard/creator" : "/dashboard/member");
}
