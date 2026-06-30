import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  profileFromMetadata,
  type CreatorStore,
  type PayoutDetails,
  type PayoutMethod,
  type Role,
  type StoreCategory,
  type UserProfile,
} from "@/lib/auth/roles";

/**
 * The full set of fields written when persisting onboarding/profile changes.
 * Mirrors the canonical `profiles`/`stores` rows and the auth `user_metadata`.
 */
export interface ProfilePersistPayload {
  display_name: string;
  avatar_url: string;
  bio: string;
  roles: Role[];
  active_role: Role;
  onboarding_complete: boolean;
  creator_onboarding_complete: boolean;
  store: CreatorStore | null;
  payout: PayoutDetails | null;
}

/**
 * Read a normalised profile. Prefers the canonical `profiles`/`stores` tables,
 * and gracefully falls back to auth `user_metadata` when the tables are not yet
 * available (e.g. the migration has not been applied) or the row is missing.
 */
export async function fetchProfile(
  supabase: SupabaseClient,
  user: User | null
): Promise<UserProfile> {
  if (!user) return profileFromMetadata(null);

  try {
    const { data: p, error } = await supabase
      .from("profiles")
      .select(
        "display_name, avatar_url, bio, roles, active_role, signup_intent, onboarding_complete, creator_onboarding_complete"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!p) return profileFromMetadata(user.user_metadata);

    const { data: s } = await supabase
      .from("stores")
      .select("name, slug, category, payout_method, payout_number")
      .eq("owner_id", user.id)
      .maybeSingle();

    const roles: Role[] =
      Array.isArray(p.roles) && p.roles.length > 0 ? (p.roles as Role[]) : ["buyer"];
    const activeRole: Role =
      p.active_role && roles.includes(p.active_role as Role)
        ? (p.active_role as Role)
        : roles[0];

    return {
      roles,
      activeRole,
      displayName: p.display_name ?? "",
      avatarUrl: p.avatar_url ?? "",
      bio: p.bio ?? "",
      store: s ? { name: s.name, slug: s.slug, category: s.category as StoreCategory } : null,
      payout: s?.payout_number
        ? { method: s.payout_method as PayoutMethod, number: s.payout_number }
        : null,
      signupIntent: p.signup_intent === "creator" ? "creator" : "buyer",
      onboardingComplete: Boolean(p.onboarding_complete),
      creatorOnboardingComplete: Boolean(p.creator_onboarding_complete),
    };
  } catch {
    // Tables missing or unreachable — fall back to metadata so the app keeps working.
    return profileFromMetadata(user.user_metadata);
  }
}

/**
 * Persist a profile/store update to the canonical tables AND mirror routing
 * fields into auth metadata. DB failures degrade gracefully (a warning is
 * returned) so onboarding still completes via metadata in dev environments
 * where the migration has not been applied.
 */
export async function persistProfile(
  supabase: SupabaseClient,
  userId: string,
  p: ProfilePersistPayload
): Promise<{ error: string | null; dbWarning: string | null }> {
  let dbWarning: string | null = null;

  try {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      bio: p.bio,
      roles: p.roles,
      active_role: p.active_role,
      onboarding_complete: p.onboarding_complete,
      creator_onboarding_complete: p.creator_onboarding_complete,
    });
    if (profileError) throw profileError;

    if (p.store) {
      const { error: storeError } = await supabase.from("stores").upsert(
        {
          owner_id: userId,
          name: p.store.name,
          slug: p.store.slug,
          category: p.store.category,
          payout_method: p.payout?.method ?? null,
          payout_number: p.payout?.number ?? null,
        },
        { onConflict: "owner_id" }
      );
      if (storeError) throw storeError;
    }
  } catch (e) {
    dbWarning = e instanceof Error ? e.message : String(e);
    if (typeof console !== "undefined") {
      console.warn("[chichi] DB persist skipped, using metadata fallback:", dbWarning);
    }
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      display_name: p.display_name,
      full_name: p.display_name,
      avatar_url: p.avatar_url,
      bio: p.bio,
      roles: p.roles,
      active_role: p.active_role,
      onboarding_complete: p.onboarding_complete,
      creator_onboarding_complete: p.creator_onboarding_complete,
      store: p.store,
      payout: p.payout,
    },
  });

  return { error: metaError?.message ?? null, dbWarning };
}

/** Switch the active role in both the DB and auth metadata. */
export async function setActiveRole(
  supabase: SupabaseClient,
  userId: string,
  role: Role
): Promise<void> {
  try {
    await supabase.from("profiles").update({ active_role: role }).eq("id", userId);
  } catch {
    // ignore — metadata mirror below keeps routing correct
  }
  await supabase.auth.updateUser({ data: { active_role: role } });
}
