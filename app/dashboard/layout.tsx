import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/db/profile";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const profile = await fetchProfile(supabase, user);

  if (!profile.onboardingComplete) {
    redirect(`/onboarding?role=${profile.signupIntent}`);
  }

  return (
    <DashboardShell userId={user.id} email={user.email ?? ""} initialProfile={profile}>
      {children}
    </DashboardShell>
  );
}
