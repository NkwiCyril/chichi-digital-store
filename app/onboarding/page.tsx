"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useProfile } from "@/lib/auth/useProfile";
import CreatorOnboarding from "./CreatorOnboarding";
import BuyerOnboarding from "./BuyerOnboarding";
import { Card, OnboardingShell } from "./ui";

function CenteredNote({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-zinc-400">{text}</div>;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading, supabase } = useProfile();

  const role = useMemo(() => {
    const param = searchParams.get("role");
    if (param === "creator" || param === "buyer") return param;
    return profile.signupIntent;
  }, [searchParams, profile.signupIntent]);

  const nextPath = searchParams.get("next") || "";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/onboarding");
    }
  }, [loading, user, router]);

  if (loading) {
    return <CenteredNote text="Loading..." />;
  }

  if (!user) {
    return <CenteredNote text="Redirecting to sign in..." />;
  }

  if (role === "creator") {
    return (
      <CreatorOnboarding
        supabase={supabase}
        userId={user.id}
        initial={profile}
        mode="onboarding"
        onComplete={() => {
          router.replace("/dashboard/creator/overview");
          router.refresh();
        }}
        onSaveLater={() => {
          router.replace("/dashboard/member/overview");
          router.refresh();
        }}
      />
    );
  }

  return (
    <BuyerOnboarding
      supabase={supabase}
      userId={user.id}
      initial={profile}
      onComplete={() => {
        router.replace(nextPath || "/dashboard/member/overview");
        router.refresh();
      }}
    />
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingShell>
      <Suspense
        fallback={
          <Card>
            <div className="py-10 text-center text-sm text-zinc-400">Loading...</div>
          </Card>
        }
      >
        <Card>
          <OnboardingContent />
        </Card>
      </Suspense>
    </OnboardingShell>
  );
}
