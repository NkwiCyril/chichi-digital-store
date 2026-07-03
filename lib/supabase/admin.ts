import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for webhook handlers and admin operations
 * that need to bypass Row Level Security.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set (never expose to the browser).
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Set it in your environment variables."
    );
  }

  return createClient(url, serviceKey);
}
