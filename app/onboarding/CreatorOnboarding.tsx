"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PAYOUT_METHODS,
  STORE_CATEGORIES,
  slugify,
  type PayoutMethod,
  type Role,
  type StoreCategory,
  type UserProfile,
} from "@/lib/auth/roles";
import { persistProfile, type ProfilePersistPayload } from "@/lib/db/profile";
import {
  AvatarUploadField,
  ErrorBanner,
  Field,
  GhostButton,
  PrimaryButton,
  ProgressSteps,
  SelectField,
  TextArea,
  TextField,
} from "./ui";

interface CreatorOnboardingProps {
  supabase: SupabaseClient;
  userId: string;
  initial: UserProfile;
  mode: "onboarding" | "settings";
  onComplete: () => void;
  onSaveLater: () => void;
}

interface FormState {
  displayName: string;
  avatarUrl: string;
  bio: string;
  storeName: string;
  storeSlug: string;
  category: StoreCategory | "";
  payoutMethod: PayoutMethod;
  payoutNumber: string;
}

export default function CreatorOnboarding({
  supabase,
  userId,
  initial,
  mode,
  onComplete,
  onSaveLater,
}: CreatorOnboardingProps) {
  const [step, setStep] = useState(1);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.store?.slug));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    displayName: initial.displayName,
    avatarUrl: initial.avatarUrl,
    bio: initial.bio,
    storeName: initial.store?.name ?? "",
    storeSlug: initial.store?.slug ?? "",
    category: initial.store?.category ?? "",
    payoutMethod: initial.payout?.method ?? "mtn",
    payoutNumber: initial.payout?.number ?? "",
  });

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const handleStoreName = (value: string) => {
    update({ storeName: value, ...(slugEdited ? {} : { storeSlug: slugify(value) }) });
  };

  const validateStep = (current: number): boolean => {
    const next: Record<string, string> = {};
    if (current === 1) {
      if (!form.displayName.trim()) next.displayName = "Display name is required.";
    }
    if (current === 2) {
      if (!form.storeName.trim()) next.storeName = "Store name is required.";
      if (!form.storeSlug.trim()) next.storeSlug = "Store URL is required.";
      else if (!/^[a-z0-9-]+$/.test(form.storeSlug))
        next.storeSlug = "Use lowercase letters, numbers, and dashes only.";
      if (!form.category) next.category = "Please choose a category.";
    }
    if (current === 3) {
      if (!form.payoutNumber.trim()) next.payoutNumber = "Mobile Money number is required.";
      else if (!/^[0-9+\s]{8,}$/.test(form.payoutNumber))
        next.payoutNumber = "Enter a valid phone number.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setBanner(null);
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const buildPayload = (complete: boolean): ProfilePersistPayload => {
    const roles: Role[] = Array.from(new Set([...initial.roles, "buyer"])) as Role[];
    if (complete && !roles.includes("creator")) roles.push("creator");

    return {
      display_name: form.displayName.trim(),
      avatar_url: form.avatarUrl.trim(),
      bio: form.bio.trim(),
      roles,
      // Reaching this flow means the user has at least a usable buyer account,
      // so base onboarding is complete either way. Creator status only flips
      // once the full flow is finished.
      active_role: complete ? "creator" : "buyer",
      onboarding_complete: true,
      creator_onboarding_complete: complete,
      store: form.storeName.trim()
        ? {
            name: form.storeName.trim(),
            slug: form.storeSlug.trim(),
            category: (form.category || "other") as StoreCategory,
          }
        : null,
      payout: form.payoutNumber.trim()
        ? { method: form.payoutMethod, number: form.payoutNumber.trim() }
        : null,
    };
  };

  const persist = async (complete: boolean) => {
    setSaving(true);
    setBanner(null);
    const { error } = await persistProfile(supabase, userId, buildPayload(complete));
    setSaving(false);
    if (error) {
      setBanner(error);
      return false;
    }
    return true;
  };

  const handleSaveLater = async () => {
    if (await persist(false)) onSaveLater();
  };

  const handleFinish = async () => {
    if (!validateStep(3)) return;
    if (await persist(true)) onComplete();
  };

  const titles = [
    { title: "Set up your profile", subtitle: "Tell buyers who you are." },
    { title: "Create your store", subtitle: "This is your public storefront on Chichi." },
    { title: "Get paid", subtitle: "Where should we send your earnings?" },
  ];

  return (
    <div>
      <ProgressSteps current={step} total={3} />

      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900">{titles[step - 1].title}</h1>
        <p className="text-sm text-zinc-500">{titles[step - 1].subtitle}</p>
      </div>

      {banner && (
        <div className="mb-5">
          <ErrorBanner message={banner} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Field id="displayName" label="Display name" error={errors.displayName}>
            <TextField
              id="displayName"
              value={form.displayName}
              onChange={(v) => update({ displayName: v })}
              placeholder="e.g. Amara Njike"
            />
          </Field>
          <Field id="avatar" label="Profile photo">
            <AvatarUploadField
              supabase={supabase}
              userId={userId}
              value={form.avatarUrl}
              onChange={(v) => update({ avatarUrl: v })}
              displayName={form.displayName}
            />
          </Field>
          <Field id="bio" label="Short bio" hint="A sentence or two about what you create.">
            <TextArea
              id="bio"
              value={form.bio}
              onChange={(v) => update({ bio: v })}
              placeholder="I design packaging templates for African brands..."
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field id="storeName" label="Store name" error={errors.storeName}>
            <TextField
              id="storeName"
              value={form.storeName}
              onChange={handleStoreName}
              placeholder="Mukstyle Studio"
            />
          </Field>
          <Field
            id="storeSlug"
            label="Store URL"
            error={errors.storeSlug}
            hint="This is where buyers will find your store."
          >
            <TextField
              id="storeSlug"
              value={form.storeSlug}
              onChange={(v) => {
                setSlugEdited(true);
                update({ storeSlug: slugify(v) });
              }}
              placeholder="mukstyle"
              prefix="store.chichi.co/"
            />
          </Field>
          <Field id="category" label="Category" error={errors.category}>
            <SelectField
              id="category"
              value={form.category}
              onChange={(v) => update({ category: v as StoreCategory })}
              options={STORE_CATEGORIES}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <Field id="payoutMethod" label="Payout method">
            <SelectField
              id="payoutMethod"
              value={form.payoutMethod}
              onChange={(v) => update({ payoutMethod: v as PayoutMethod })}
              options={PAYOUT_METHODS}
            />
          </Field>
          <Field
            id="payoutNumber"
            label="Mobile Money number"
            error={errors.payoutNumber}
            hint="Earnings are paid out here, minus the Chichi commission."
          >
            <TextField
              id="payoutNumber"
              value={form.payoutNumber}
              onChange={(v) => update({ payoutNumber: v })}
              placeholder="+237 6XX XXX XXX"
            />
          </Field>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        {step > 1 ? (
          <GhostButton onClick={goBack} disabled={saving}>
            Back
          </GhostButton>
        ) : mode === "settings" ? (
          <GhostButton onClick={onSaveLater} disabled={saving}>
            Cancel
          </GhostButton>
        ) : null}

        {step < 3 ? (
          <PrimaryButton onClick={goNext} disabled={saving}>
            Continue
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleFinish} disabled={saving}>
            {saving ? "Saving..." : "Finish & open dashboard"}
          </PrimaryButton>
        )}
      </div>

      {step >= 2 && (
        <button
          type="button"
          onClick={handleSaveLater}
          disabled={saving}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-60 cursor-pointer"
        >
          Save &amp; continue later
        </button>
      )}
    </div>
  );
}
