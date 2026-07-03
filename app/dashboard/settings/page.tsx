"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useProfile } from "@/lib/auth/useProfile";
import { isCreator, type Role } from "@/lib/auth/roles";
import { setActiveRole } from "@/lib/db/profile";
import { storeDisplayUrl } from "@/lib/brand";
import CreatorOnboarding from "@/app/onboarding/CreatorOnboarding";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, supabase, reload } = useProfile();
  const [activating, setActivating] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (loading || !user) {
    return <p className="text-sm text-zinc-400">Loading...</p>;
  }

  const creator = isCreator(profile);

  const switchRole = async (role: Role) => {
    if (role === profile.activeRole) return;
    setSwitching(true);
    await setActiveRole(supabase, user.id, role);
    await reload();
    setSwitching(false);
    router.push(role === "creator" ? "/dashboard/creator/overview" : "/dashboard/member/overview");
    router.refresh();
  };

  if (activating) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Become a creator</h1>
          <p className="text-sm text-zinc-500">
            Complete these steps to open your store. Your buyer account stays active.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CreatorOnboarding
            supabase={supabase}
            userId={user.id}
            initial={profile}
            mode="settings"
            onComplete={async () => {
              await reload();
              router.refresh();
              router.push("/dashboard/creator/overview");
            }}
            onSaveLater={() => setActivating(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-zinc-500">Settings</p>
        <h1 className="text-2xl font-bold text-zinc-900">Account &amp; roles</h1>
      </header>

      {/* Roles */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Your roles</h2>
        <p className="mt-1 text-sm text-zinc-500">
          You can buy and sell from the same account. Switch modes any time.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {profile.roles.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700"
            >
              {r === "buyer" ? "Buyer" : "Creator"}
              {profile.activeRole === r && <span className="text-violet-400">· active</span>}
            </span>
          ))}
        </div>

        {creator ? (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-zinc-700">Active mode</p>
            <div className="inline-flex rounded-xl bg-zinc-100 p-1">
              {(["creator", "buyer"] as const).map((role) => {
                const active = profile.activeRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => switchRole(role)}
                    disabled={switching}
                    className={`cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-colors ${
                      active ? "bg-white text-violet-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {role === "buyer" ? "Buyer" : "Creator"}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-violet-300 bg-violet-50 p-5">
            <p className="text-sm font-semibold text-violet-800">Activate creator mode</p>
            <p className="mt-1 text-sm text-violet-700">
              Set up your store and start selling digital products. Takes about 2 minutes.
            </p>
            <button
              onClick={() => setActivating(true)}
              className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Get started
            </button>
          </div>
        )}
      </section>

      {/* Profile summary */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Display name</dt>
            <dd className="font-medium text-zinc-900">{profile.displayName || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Bio</dt>
            <dd className="max-w-xs text-right font-medium text-zinc-900">{profile.bio || "—"}</dd>
          </div>
          {creator && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Store</dt>
                <dd className="font-medium text-zinc-900">
                  {profile.store ? storeDisplayUrl(profile.store.slug) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Payout</dt>
                <dd className="font-medium text-zinc-900">
                  {profile.payout
                    ? `${profile.payout.method === "orange" ? "Orange Money" : "MTN MoMo"} · ${profile.payout.number}`
                    : "—"}
                </dd>
              </div>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}
