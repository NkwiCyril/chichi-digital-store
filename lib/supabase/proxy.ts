import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseCredentials } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let credentials: { url: string; key: string } | null = null;

  try {
    credentials = getSupabaseCredentials();
  } catch {
    // Necessary environment variables are missing. Skip Supabase session
    // handling so the rest of the app can render (useful locally before
    // secrets are configured).
    return response;
  }

  const { url, key } = credentials;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Parameters<typeof response.cookies.set>[2];
        }[]
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
