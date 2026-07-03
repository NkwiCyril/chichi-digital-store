export type Role = "buyer" | "creator";

export type StoreCategory = "ebooks" | "templates" | "courses" | "software" | "other";

export const STORE_CATEGORIES: { value: StoreCategory; label: string }[] = [
  { value: "ebooks", label: "eBooks" },
  { value: "templates", label: "Templates" },
  { value: "courses", label: "Courses" },
  { value: "software", label: "Software" },
  { value: "other", label: "Other" },
];

export type PayoutMethod = "mtn" | "orange";

export const PAYOUT_METHODS: { value: PayoutMethod; label: string }[] = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "orange", label: "Orange Money" },
];

export interface CreatorStore {
  name: string;
  slug: string;
  category: StoreCategory;
}

export interface PayoutDetails {
  method: PayoutMethod;
  number: string;
}

export interface UserProfile {
  roles: Role[];
  activeRole: Role;
  displayName: string;
  avatarUrl: string;
  bio: string;
  store: CreatorStore | null;
  payout: PayoutDetails | null;
  signupIntent: Role;
  onboardingComplete: boolean;
  creatorOnboardingComplete: boolean;
}

// Raw shape of what we persist into Supabase `user_metadata`.
export interface ProfileMetadata {
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  roles?: Role[];
  active_role?: Role;
  store?: CreatorStore | null;
  payout?: PayoutDetails | null;
  signup_intent?: Role;
  onboarding_complete?: boolean;
  creator_onboarding_complete?: boolean;
}

/**
 * Build a normalised UserProfile from raw Supabase user_metadata. Pure function
 * so it can be used both on the server and the client.
 */
export function profileFromMetadata(
  meta: Record<string, unknown> | undefined | null
): UserProfile {
  const m = (meta ?? {}) as ProfileMetadata;

  const roles: Role[] =
    Array.isArray(m.roles) && m.roles.length > 0
      ? (Array.from(new Set(m.roles)) as Role[])
      : ["buyer"];

  const activeRole: Role =
    m.active_role && roles.includes(m.active_role) ? m.active_role : roles[0];

  return {
    roles,
    activeRole,
    displayName: m.display_name ?? m.full_name ?? "",
    avatarUrl: m.avatar_url ?? "",
    bio: m.bio ?? "",
    store: m.store ?? null,
    payout: m.payout ?? null,
    signupIntent: m.signup_intent === "creator" ? "creator" : "buyer",
    onboardingComplete: Boolean(m.onboarding_complete),
    creatorOnboardingComplete: Boolean(m.creator_onboarding_complete),
  };
}

export function isCreator(profile: UserProfile): boolean {
  return profile.roles.includes("creator");
}

/** Convert a free-text store name into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Where a user should land after authentication, given their profile state. */
export function resolvePostAuthPath(profile: UserProfile): string {
  if (!profile.onboardingComplete) {
    return `/onboarding?role=${profile.signupIntent}`;
  }
  return profile.activeRole === "creator" ? "/dashboard/creator/overview" : "/dashboard/member/overview";
}
