"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { profileFromMetadata, type UserProfile } from "./roles";

interface UseProfileResult {
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
  reload: () => Promise<void>;
}

/**
 * Client hook that exposes the current Supabase user, a normalised profile
 * derived from user_metadata, and the browser client for mutations.
 */
export function useProfile(): UseProfileResult {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    reload();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, reload]);

  const profile = useMemo(() => profileFromMetadata(user?.user_metadata), [user]);

  return { user, profile, loading, supabase, reload };
}
