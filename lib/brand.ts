/**
 * Central brand + domain configuration.
 *
 * The platform is being rebranded away from "Chichi" (domain availability),
 * so every user-facing brand string and store URL is derived from these two
 * env vars. Renaming later is a config-only change.
 *
 *   NEXT_PUBLIC_BRAND_NAME   e.g. "Chichi"
 *   NEXT_PUBLIC_ROOT_DOMAIN  e.g. "chichi.cm"
 */
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Chichi";
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "chichi.cm";

/** Subdomain that hosts public storefronts in the path-based MVP. */
export const STORE_SUBDOMAIN = "store";

/** Public host for storefronts, e.g. "store.chichi.cm". */
export function storeHost(): string {
  return `${STORE_SUBDOMAIN}.${ROOT_DOMAIN}`;
}

/** Display URL (no protocol) for a store, e.g. "store.chichi.cm/mukstyle". */
export function storeDisplayUrl(slug: string): string {
  return `${storeHost()}/${slug}`;
}

/** Absolute URL for a store, e.g. "https://store.chichi.cm/mukstyle". */
export function storeUrl(slug: string): string {
  return `https://${storeDisplayUrl(slug)}`;
}

/** Display URL (no protocol) for a course landing page. */
export function courseDisplayUrl(storeSlug: string, courseSlug: string): string {
  return `${storeHost()}/${storeSlug}/${courseSlug}`;
}

/**
 * Internal app path for the path-based storefront routing used in the MVP.
 * (When subdomains/custom domains land, a host-aware resolver maps to these.)
 */
export function storePath(slug: string): string {
  return `/${slug}`;
}

export function coursePath(storeSlug: string, courseSlug: string): string {
  return `/${storeSlug}/${courseSlug}`;
}

/**
 * Slugs that can never be used as a store slug because they collide with
 * first-party routes. Enforced wherever store slugs are created/edited.
 */
export const RESERVED_SLUGS = new Set<string>([
  "login",
  "register",
  "logout",
  "dashboard",
  "onboarding",
  "settings",
  "api",
  "auth",
  "admin",
  "store",
  "stores",
  "course",
  "courses",
  "checkout",
  "cart",
  "pricing",
  "about",
  "blog",
  "help",
  "support",
  "terms",
  "privacy",
  "static",
  "_next",
  "favicon.ico",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
