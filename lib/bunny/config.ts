import "server-only";

/**
 * Server-side Bunny Stream configuration. All keys are secret and must never
 * be exposed to the browser. See README "Video (Bunny Stream)" for setup.
 *
 *   BUNNY_STREAM_LIBRARY_ID       numeric video library id
 *   BUNNY_STREAM_API_KEY          library API key (AccessKey) — secret
 *   BUNNY_STREAM_CDN_HOSTNAME     pull-zone host, e.g. vz-xxxx.b-cdn.net
 *   BUNNY_STREAM_TOKEN_AUTH_KEY   token authentication key for signed URLs
 *   BUNNY_STREAM_WEBHOOK_SECRET   optional shared secret to verify webhooks
 */
export interface BunnyConfig {
  libraryId: string;
  apiKey: string;
  cdnHostname: string;
  tokenAuthKey: string | null;
  webhookSecret: string | null;
}

export function isBunnyConfigured(): boolean {
  return Boolean(
    process.env.BUNNY_STREAM_LIBRARY_ID &&
      process.env.BUNNY_STREAM_API_KEY &&
      process.env.BUNNY_STREAM_CDN_HOSTNAME
  );
}

export function getBunnyConfig(): BunnyConfig {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;

  if (!libraryId || !apiKey || !cdnHostname) {
    throw new Error(
      "Bunny Stream is not configured. Set BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY and BUNNY_STREAM_CDN_HOSTNAME."
    );
  }

  return {
    libraryId,
    apiKey,
    cdnHostname,
    tokenAuthKey: process.env.BUNNY_STREAM_TOKEN_AUTH_KEY ?? null,
    webhookSecret: process.env.BUNNY_STREAM_WEBHOOK_SECRET ?? null,
  };
}
