"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserProfile } from "@/lib/auth/roles";
import { persistProfile } from "@/lib/db/profile";
import {
  AvatarUploadField,
  ErrorBanner,
  Field,
  GhostButton,
  PrimaryButton,
  TextField,
} from "./ui";

interface BuyerOnboardingProps {
  supabase: SupabaseClient;
  userId: string;
  initial: UserProfile;
  onComplete: () => void;
}

export default function BuyerOnboarding({
  supabase,
  userId,
  initial,
  onComplete,
}: BuyerOnboardingProps) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const persist = async (withDetails: boolean) => {
    setSaving(true);
    setBanner(null);
    const { error } = await persistProfile(supabase, userId, {
      display_name: withDetails ? displayName.trim() : initial.displayName,
      avatar_url: withDetails ? avatarUrl.trim() : initial.avatarUrl,
      bio: initial.bio,
      roles: initial.roles,
      active_role: "buyer",
      onboarding_complete: true,
      creator_onboarding_complete: initial.creatorOnboardingComplete,
      store: initial.store,
      payout: initial.payout,
    });
    setSaving(false);
    if (error) {
      setBanner(error);
      return;
    }
    onComplete();
  };

  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome to Chichi</h1>
        <p className="text-sm text-zinc-500">
          Add a name and photo so creators know who you are. You can skip this for now.
        </p>
      </div>

      {banner && (
        <div className="mb-5">
          <ErrorBanner message={banner} />
        </div>
      )}

      <div className="space-y-5">
        <Field id="displayName" label="Display name">
          <TextField
            id="displayName"
            value={displayName}
            onChange={setDisplayName}
            placeholder="e.g. Bertrand Fomba"
          />
        </Field>
        <Field id="avatar" label="Avatar">
          <AvatarUploadField
            supabase={supabase}
            userId={userId}
            value={avatarUrl}
            onChange={setAvatarUrl}
            displayName={displayName}
          />
        </Field>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <GhostButton onClick={() => persist(false)} disabled={saving}>
          Skip for now
        </GhostButton>
        <PrimaryButton onClick={() => persist(true)} disabled={saving}>
          {saving ? "Saving..." : "Continue"}
        </PrimaryButton>
      </div>
    </div>
  );
}
