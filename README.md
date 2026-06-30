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

## Database & roles model

Chichi uses a single account that can act as both a **buyer** and a **creator**. The canonical data lives in two Postgres tables, with the same fields mirrored into Supabase auth `user_metadata` so the proxy/middleware and server components can make fast routing decisions.

### Apply the migration

The schema lives in `supabase/migrations/`. Apply it with the Supabase CLI:

```bash
supabase db push
```

…or paste `supabase/migrations/20260629120000_profiles_stores_avatars.sql` into the Supabase dashboard **SQL Editor** and run it. The migration is idempotent and creates:

- `public.profiles` – identity + onboarding state (one row per `auth.users`), auto-created on sign-up via the `handle_new_user` trigger and backfilled for existing users.
- `public.stores` – one storefront per creator, including Mobile Money payout details.
- Row Level Security: public read, owner-only writes.
- A public `avatars` storage bucket with per-user folder upload policies.

> If the migration has not been applied yet, the app still runs: `lib/db/profile.ts` transparently falls back to reading/writing auth `user_metadata`.

### Onboarding flow

- Sign-up captures intent from `?role=creator|buyer` and routes to `/onboarding`.
- **Creators** complete a 3-step flow (profile → store → Mobile Money payout); **buyers** get a single skippable step.
- `/dashboard` redirects to `/dashboard/creator` or `/dashboard/member` based on the active role; `/dashboard/settings` switches roles or activates creator mode inline.

### Auth setup notes

- For the instant sign-up → onboarding redirect in development, disable **Confirm email** in Supabase **Authentication → Providers → Email**. With it enabled, users confirm by email and land on onboarding via `/auth/callback`.
- Profile photos upload directly to the `avatars` bucket (`lib/supabase/storage.ts`); no `next/image` remote config is needed since avatars render via `<img>`.

## Project structure highlights

- `app/sections/*` – Landing page sections composed in `app/page.tsx`.
- `app/(auth)/*` – Login and registration experiences using Supabase client helpers.
- `app/onboarding/*` – Role-aware onboarding flows (creator 3-step, buyer 1-step) + shared UI.
- `app/dashboard/*` – Protected creator/member dashboards, shell with role switcher, and settings.
- `app/auth/callback/route.ts` – Required route handler for exchanging Supabase auth codes.
- `lib/auth/*` – Role types, metadata helpers, and the `useProfile` client hook.
- `lib/db/profile.ts` – Canonical profile/store reads + dual-write (DB + metadata mirror).
- `lib/supabase/*` – Centralised Supabase client utilities (`@supabase/ssr`), storage, and proxy helpers.
- `supabase/migrations/*` – SQL schema for `profiles`, `stores`, and the `avatars` bucket.
- `middleware.ts` – Cookie-refresh proxy that also guards `/dashboard` and `/onboarding`.

## Next steps

- Configure additional providers or policies in Supabase → Authentication → Providers.
- Extend the proxy matcher if you add static routes that should bypass auth checks.
- Add server actions or RSC data fetching by importing `createSupabaseServerClient()` from `lib/supabase/server`.
