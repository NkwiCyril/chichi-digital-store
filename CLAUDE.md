# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (flat config, no args needed)
npm start        # Serve production build
supabase db push # Apply migrations from supabase/migrations/
```

No test framework is configured yet.

## Architecture

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase Auth (`@supabase/ssr`), TypeScript strict mode.

**IMPORTANT — Next.js 16 has breaking changes.** Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. APIs, conventions, and file structure may differ from training data. Heed deprecation notices.

### Path alias
`@/*` maps to the project root (tsconfig paths).

### Auth & middleware flow
- `middleware.ts` → calls `lib/supabase/proxy.ts:updateSession()` which refreshes Supabase cookies and guards `/dashboard` and `/onboarding` (redirects unauthenticated users to `/login`).
- `app/auth/callback/route.ts` — exchanges Supabase auth codes (OAuth, magic link).
- `lib/supabase/client.ts` — browser Supabase client; `lib/supabase/server.ts` — server client (RSC/actions).
- `lib/supabase/env.ts` — reads `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`). App runs without these (proxy no-ops).

### Dual-role user model
Users have a single account that can be both **buyer** and **creator**. Key types live in `lib/auth/roles.ts` (`Role`, `UserProfile`, `ProfileMetadata`). `profileFromMetadata()` normalises raw Supabase `user_metadata` into a `UserProfile`.

### Data persistence — dual-write pattern
`lib/db/profile.ts` writes to both the Postgres `profiles`/`stores` tables AND mirrors into Supabase `user_metadata`. If the DB tables don't exist (migration not applied), it falls back gracefully to metadata-only. `fetchProfile()` reads from DB first, falls back to metadata.

### Brand configuration
`lib/brand.ts` — all user-facing brand strings and store URLs derive from `NEXT_PUBLIC_BRAND_NAME` and `NEXT_PUBLIC_ROOT_DOMAIN` env vars. Renaming away from "Chichi" is a config-only change. Store URLs follow `store.{ROOT_DOMAIN}/{slug}`. Reserved slugs are enforced via `RESERVED_SLUGS` set.

### Route groups
- `app/sections/*` — Landing page sections composed in `app/page.tsx`.
- `app/(auth)/*` — Login/registration with Supabase client helpers.
- `app/onboarding/*` — Role-aware onboarding (creator 3-step, buyer 1-step). Shared UI in `app/onboarding/ui.tsx`.
- `app/dashboard/*` — Protected dashboards with `DashboardShell` layout, role switcher, and settings.
- `app/dashboard/creator/courses/*` — Course management: list, create, edit (details/curriculum/pricing), publish.
- `app/(store)/[storeSlug]/*` — Public storefront pages (store profile, course landing pages).
- `app/api/courses/*` — Course CRUD, section/lesson management, publish/unpublish, Cloudflare Stream direct-upload URL creation.
- `app/api/lessons/[lessonId]/playback` — Signed HLS URL generation (enrollment-gated).
- `app/api/lessons/[lessonId]/sync` — Manual poll of Cloudflare video status (webhook fallback for local dev).
- `app/api/progress` — Save/fetch lesson watch progress.
- `app/api/webhooks/cloudflare` — Cloudflare Stream encode-complete webhook.

### Video pipeline (Cloudflare Stream)
- `lib/cloudflare/stream.ts` — server-only config, direct-creator-upload URL creation, video fetch/delete, JWT-signed HLS playback URLs, webhook signature verification, status mapping.
- Upload flow: API requests a direct-upload URL from Cloudflare → browser uploads via tus (`tus-js-client`) → Cloudflare webhook on encode-complete updates lesson `status`/`duration_sec`/`thumbnail_url`.
- Playback: `/api/lessons/[id]/playback` checks enrollment or ownership, mints a short-lived signed JWT and returns the HLS URL.
- Lessons store `video_uid` + `video_provider` (provider-agnostic columns).

### Database
Migrations in `supabase/migrations/`:
- `20260629120000_profiles_stores_avatars.sql` — `profiles`, `stores`, `avatars` bucket, RLS, `handle_new_user` trigger.
- `20260630090000_courses.sql` — `courses`, `course_sections`, `lessons`, `enrollments`, `orders`, `lesson_progress`, domain columns on `stores`, RLS policies, `owns_course()` helper.

### Supabase clients
- `lib/supabase/client.ts` — browser (anon key).
- `lib/supabase/server.ts` — server components/actions (anon key, cookie-based auth).
- `lib/supabase/admin.ts` — service role client for webhooks (bypasses RLS, requires `SUPABASE_SERVICE_ROLE_KEY`).

### Course data access
`lib/db/courses.ts` — `fetchOwnerStore`, `listCoursesForStore`, `fetchCourseCurriculum`, `recomputeCourseAggregates`, `formatDuration`, `formatXAF`.

## Environment variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # or NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=...              # server-only, for webhooks

# Brand (optional, defaults shown)
NEXT_PUBLIC_BRAND_NAME=Chichi
NEXT_PUBLIC_ROOT_DOMAIN=chichi.cm

# Cloudflare Stream (optional, video features disabled without these)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_STREAM_API_TOKEN=...                  # Stream:Edit token — secret
CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN=...         # e.g. customer-xxxx.cloudflarestream.com
CLOUDFLARE_STREAM_SIGNING_KEY_ID=...             # from POST /stream/keys, for signed playback
CLOUDFLARE_STREAM_SIGNING_KEY_PEM=...            # PKCS8 RSA private key (raw PEM or base64) — secret
CLOUDFLARE_STREAM_WEBHOOK_SECRET=...             # verify webhook origin — secret
CLOUDFLARE_STREAM_ALLOWED_ORIGINS=...            # optional, comma-separated playback origins
```
