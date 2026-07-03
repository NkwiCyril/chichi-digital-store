# Technical Plan — Video Course Marketplace for Cameroonian Professionals

A phased plan to evolve the current Next.js + Supabase app into a video-first course marketplace, using Bunny Stream (HLS) + a custom Plyr player for in-platform viewing, path-based personalized stores (designed for future subdomains/custom domains), one-time MoMo/Orange course purchases, and a brand-agnostic config so the upcoming rename is trivial.

## Decisions locked in (from your answers)
- **Video:** Bunny Stream (auto-transcode to HLS, signed token auth, Johannesburg PoP) + custom **Plyr** player; watch progress stored in Supabase.
- **Store links:** **Path-based now** (`store.chichi.cm/{slug}`), data model built so **subdomains + custom domains** can be added later.
- **Monetization:** **One-time purchase per course** (lifetime access), keeping the existing 10% commission.
- **MVP focus:** **Creator course authoring** first (create course → upload video → structure → price → publish).

## Current state (baseline)
- Next.js 16 App Router, React 19, Tailwind v4, Supabase Auth (`@supabase/ssr`).
- Auth + dual-role (buyer/creator) onboarding, dashboards, settings, role switching.
- `profiles` + `stores` tables (migration `20260629120000`), avatars storage bucket, metadata-mirror fallback in `lib/db/profile.ts`.
- Marketing site reflects commission + Mobile Money.
- Known rough edges to harden: enum-array upsert robustness, email-confirmation UX, router-during-render in onboarding page.

## Guiding constraints (Cameroon context)
- **Bandwidth/mobile-first:** adaptive HLS is mandatory; default to lower starting rendition; aggressive caching; minimal JS on store/course pages.
- **Payments:** card penetration is low — MTN MoMo / Orange Money via a local aggregator is the primary rail; treat payment as async + webhook-confirmed.
- **Piracy/trust:** short-lived signed playback tokens, domain-locked, optional viewer-email watermark; no public file URLs.
- **Cost control:** Bunny per-minute pricing + Supabase keep fixed costs low at small scale.

---

## Target architecture

### Stack additions
- **Bunny Stream** for video storage, transcoding, HLS delivery, signed playback.
- **Plyr + hls.js** for the player UI; progress + completion tracked in Supabase.
- **Payment aggregator** (decision below) for MoMo/Orange collection via webhooks.
- **Brand config**: `NEXT_PUBLIC_BRAND_NAME` + `NEXT_PUBLIC_ROOT_DOMAIN` env vars and a `lib/brand.ts` constant; all UI/store-URL strings read from it so renaming away from "chichi" is a one-line change.

### Data model additions (schema sketch)
New tables (all RLS: public read of *published* rows, owner-only writes; purchase-gated reads for video tokens):
- **`courses`** — `id, store_id, title, slug, summary, description, cover_url, price_xaf, status(draft|published|archived), level, language, total_duration_sec, lesson_count, published_at, timestamps`.
- **`course_sections`** — `id, course_id, title, position`.
- **`lessons`** — `id, section_id, course_id, title, position, is_preview(bool), bunny_video_id, duration_sec, status(processing|ready|error), thumbnail_url, attachments`.
- **`enrollments`** — `id, user_id, course_id, source(purchase|gift|admin), created_at` (unique `user_id+course_id`); grants playback rights.
- **`orders`** — `id, user_id, course_id, amount_xaf, commission_xaf, status(pending|paid|failed|refunded), provider, provider_ref, idempotency_key, timestamps`.
- **`lesson_progress`** — `user_id, lesson_id, course_id, position_sec, completed(bool), updated_at` (unique `user_id+lesson_id`).
- Extend **`stores`**: add `custom_domain`, `domain_verified`, `subdomain` (nullable) for the future routing phase.
- Optional later: `reviews`, `payouts`, `coupons`, `bundles`.

### Store routing (path-based now, future-proofed)
- Public route group, e.g. `app/(store)/[storeSlug]/page.tsx` and `[storeSlug]/[courseSlug]/page.tsx`.
- **Reserved-slug list** (login, register, dashboard, onboarding, api, auth, etc.) enforced at slug creation.
- Central resolver `resolveStoreFromRequest(host, path)` so Phase 3 can switch on `Host` header:
  - Path: `store.chichi.cm/{slug}` → look up `stores.slug`.
  - Future subdomain: `{slug}.chichi.cm` (wildcard DNS `*.chichi.cm` + middleware rewrite).
  - Future custom domain: `mystore.com` → lookup `stores.custom_domain` where `domain_verified=true` (TXT/CNAME verification flow + host provider SSL).
- SEO: per-store/course metadata, Open Graph images, sitemaps.

### Payments (MoMo / Orange) — decision required
- Recommend a **Cameroon aggregator** rather than raw telco APIs (which need heavy business onboarding): candidates **Campay**, **Fapshi**, **NotchPay**, or **MeSomb**. Pick one with: sandbox, webhooks, MTN+Orange, XAF, reasonable fees.
- Flow: create `orders` row (pending, idempotency key) → call provider → user approves on phone → **webhook** marks `paid` → create `enrollment` (idempotent) → notify buyer. Never grant access on client-side success alone.

### Video pipeline & playback (detailed — see below)

---

## Phased roadmap

### Phase 0 — Hardening + foundations (short)
- Brand config (`lib/brand.ts` + env), replace hardcoded "Chichi"/domain strings.
- Fix known bugs: robust enum-array writes, onboarding redirect in `useEffect`, email-confirmation messaging.
- Add Bunny + aggregator env vars and server-only secrets handling.
- Migration for `courses/sections/lessons/enrollments/orders/lesson_progress` + `stores` domain columns.

### Phase 1 — Creator course authoring (MVP focus)
- Creator dashboard: **Courses** list (draft/published), create/edit course (title, slug, price, cover, description, level/language).
- **Section/lesson builder**: add sections, add lessons, reorder (drag), mark preview lessons.
- **Bunny upload**: server creates Bunny video object → resumable (TUS) upload from browser → store `bunny_video_id`; **webhook** on encode-complete sets `status=ready`, `duration_sec`, `thumbnail_url`.
- Publish/unpublish with validation (≥1 ready lesson, price set, cover present).

### Phase 2 — Buyer learning experience
- Public store page + course landing page (curriculum, preview lessons, price, creator info).
- **MoMo/Orange checkout** via aggregator + webhook → enrollment.
- **In-platform player**: course player layout (lesson list + Plyr), signed-token playback, autosave progress, mark-complete, resume, course % complete.
- Member dashboard "My courses" with continue-watching.

### Phase 3 — Growth & branding
- Subdomains (`{slug}.chichi.cm`) + creator **custom domains** with verification.
- Reviews/ratings, course search & categories, basic creator analytics (views, completion, revenue).
- Coupons; (later) bundles.

### Phase 4 — Scale & trust
- Payout ledger + reconciliation; refund handling.
- Observability (logging, error tracking, webhook retries/dead-letter), rate limiting.
- Optional Bunny **MediaCage DRM** + email watermark overlay for premium piracy protection.

---

## Personalized store links — design detail
- **MVP URL:** `store.chichi.cm/{store_slug}` (slug already on `stores`, unique, reserved-word protected, editable in settings).
- **Resolution layer** abstracts host vs path so later phases don't require page rewrites.
- **Subdomain phase:** wildcard DNS `*.chichi.cm` → Next middleware reads `Host`, rewrites `{slug}.chichi.cm/...` → internal `/(store)/{slug}/...`.
- **Custom domain phase:** `stores.custom_domain` + verification (DNS TXT/CNAME), automated TLS via host (e.g. Vercel/Netlify domains API); fall back to subdomain if unverified.
- **Rename-readiness:** because URLs build from `NEXT_PUBLIC_ROOT_DOMAIN`, switching `chichi.cm` → new domain is config-only.

## Video playback & protection — design detail
- **Upload:** browser → our `/api/lessons/upload` (auth + ownership) creates Bunny video → TUS resumable upload (handles flaky connections) → Bunny webhook confirms encode → lesson marked `ready` with duration/thumbnail.
- **Playback authorization:** `/api/lessons/{id}/playback` verifies the user has an `enrollment` (or lesson `is_preview`) → mints a **Bunny signed token** (short TTL, path + optional IP/referer lock) → returns HLS URL.
- **Player:** Plyr + hls.js; renditions auto-selected for bandwidth; saves `position_sec` every ~10s and on pause/unload; resume from last position; `completed` at ~95%.
- **Protection:** no unsigned URLs, short token expiry, domain lock, download disabled; optional viewer-email watermark; DRM deferred to Phase 4.
- **Progress/analytics:** `lesson_progress` powers continue-watching and course completion; aggregate later for creator analytics.

## Open decisions
- **Payment aggregator** choice (Campay / Fapshi / NotchPay / MeSomb) — affects checkout + webhooks.
- **New brand name/domain** (replacing chichi.cm) — only impacts config when ready.
- **Watermark/DRM** appetite vs cost for premium courses.
- **Hosting target** (Vercel vs Netlify vs self) — influences custom-domain automation in Phase 3.

## Risks & mitigations
- **Payment reliability/disputes:** webhook-driven, idempotent orders, manual reconciliation tooling.
- **Bandwidth/abandonment:** adaptive HLS, lightweight pages, preview lessons to build trust before paying.
- **Piracy:** signed tokens + watermark; accept that no client-side video is 100% leak-proof without DRM.
- **Cost spikes:** monitor Bunny minutes; cap upload sizes/length per plan tier later.
