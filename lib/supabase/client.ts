import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseCredentials } from "./env";

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabaseCredentials();

  return createBrowserClient(url, key);
}
