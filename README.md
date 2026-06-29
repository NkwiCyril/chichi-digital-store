## Chichi Digital Storefront

Modern marketing site and authentication experience for the Chichi digital products platform. The app is built with the Next.js App Router, Tailwind CSS v4, and first-party Supabase Auth integration aligned with the [official quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs).

## Prerequisites

- Node.js 18+ (recommended LTS)
- npm (bundled with Node). You can swap in pnpm/bun/yarn if you prefer.
- A Supabase project with Auth enabled

## Installation

Install dependencies (required to pull in `@supabase/ssr`):

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env.local` (or create `.env.local`) and populate the values from your Supabase dashboard **Project Settings → API**. Both new Publishable keys and legacy anon keys are supported.

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_or_anon_key
```

If you are still using the legacy anon key, set it with the same variable name:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-legacy-anon-key
```

> The proxy middleware will no-op if these values are missing so you can run the UI without backend credentials during design work.

## Running locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Auth pages live under `/login` and `/register`. OAuth and magic-link flows round-trip through `/auth/callback`, which exchanges the Supabase session using the new `@supabase/ssr` helpers.

## Project structure highlights

- `app/sections/*` – Landing page sections composed in `app/page.tsx`.
- `app/(auth)/*` – Login and registration experiences using Supabase client helpers.
- `app/auth/callback/route.ts` – Required route handler for exchanging Supabase auth codes.
- `lib/supabase/*` – Centralised Supabase client utilities (`@supabase/ssr`) and proxy helpers.
- `middleware.ts` – Cookie-refresh proxy ensuring server/client auth state remains in sync.

## Next steps

- Configure additional providers or policies in Supabase → Authentication → Providers.
- Extend the proxy matcher if you add static routes that should bypass auth checks.
- Add server actions or RSC data fetching by importing `createSupabaseServerClient()` from `lib/supabase/server`.
