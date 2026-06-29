import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseCredentials } from "./env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseCredentials();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Parameters<typeof cookieStore.set>[2];
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can be invoked within Server Components where mutating
          // cookies synchronously is not supported. In that case we rely on
          // the proxy middleware to handle session refreshes.
        }
      },
    },
  });
}
