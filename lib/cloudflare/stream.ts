import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { SignJWT, importPKCS8 } from "jose";

import type { LessonStatus } from "@/lib/db/courses";

/**
 * Server-side Cloudflare Stream integration. All secrets stay on the server.
 *
 *   CLOUDFLARE_ACCOUNT_ID                 account id
 *   CLOUDFLARE_STREAM_API_TOKEN           API token (Stream:Edit) — secret
 *   CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN  e.g. customer-xxxx.cloudflarestream.com
 *   CLOUDFLARE_STREAM_SIGNING_KEY_ID      signing key id (from POST /stream/keys)
 *   CLOUDFLARE_STREAM_SIGNING_KEY_PEM     PKCS8 RSA private key (raw PEM or base64) — secret
 *   CLOUDFLARE_STREAM_WEBHOOK_SECRET      shared secret to verify webhooks — secret
 *   CLOUDFLARE_STREAM_ALLOWED_ORIGINS     optional comma-separated playback origins
 */
export interface StreamConfig {
  accountId: string;
  apiToken: string;
  customerSubdomain: string;
  signingKeyId: string | null;
  signingKeyPem: string | null;
  webhookSecret: string | null;
  allowedOrigins: string[];
}

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

export function isStreamConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_STREAM_API_TOKEN &&
      process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN
  );
}

export function isSignedPlaybackConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID && process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM
  );
}

export function getStreamConfig(): StreamConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  const customerSubdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;

  if (!accountId || !apiToken || !customerSubdomain) {
    throw new Error(
      "Cloudflare Stream is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN and CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN."
    );
  }

  return {
    accountId,
    apiToken,
    customerSubdomain,
    signingKeyId: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID ?? null,
    signingKeyPem: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM ?? null,
    webhookSecret: process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET ?? null,
    allowedOrigins: (process.env.CLOUDFLARE_STREAM_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// Video lifecycle
// ---------------------------------------------------------------------------
export interface StreamVideo {
  uid: string;
  state: string; // pendingupload, downloading, queued, inprogress, ready, error
  duration: number; // seconds (-1 while unknown)
  thumbnail: string | null;
  readyToStream: boolean;
}

interface CfVideoResult {
  uid: string;
  status?: { state?: string };
  duration?: number;
  thumbnail?: string;
  readyToStream?: boolean;
}

function normalizeVideo(v: CfVideoResult): StreamVideo {
  return {
    uid: v.uid,
    state: v.status?.state ?? "unknown",
    duration: typeof v.duration === "number" ? v.duration : -1,
    thumbnail: v.thumbnail ?? null,
    readyToStream: Boolean(v.readyToStream),
  };
}

function base64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

export interface DirectUploadOptions {
  uploadLength: number; // bytes
  name: string;
  maxDurationSeconds?: number;
  requireSignedURLs?: boolean;
}

export interface DirectUploadResult {
  uploadURL: string;
  uid: string;
}

/**
 * Create a one-time TUS direct-creator-upload URL. The browser uploads the file
 * straight to Cloudflare with tus-js-client; the API token never leaves here.
 */
export async function createDirectUpload(
  opts: DirectUploadOptions
): Promise<DirectUploadResult> {
  const cfg = getStreamConfig();

  const metadataParts: string[] = [`name ${base64(opts.name)}`];
  if (opts.requireSignedURLs ?? true) {
    metadataParts.push("requiresignedurls");
  }
  if (opts.maxDurationSeconds) {
    metadataParts.push(`maxDurationSeconds ${base64(String(opts.maxDurationSeconds))}`);
  }
  if (cfg.allowedOrigins.length > 0) {
    metadataParts.push(`allowedorigins ${base64(cfg.allowedOrigins.join(","))}`);
  }

  const res = await fetch(`${CF_API_BASE}/accounts/${cfg.accountId}/stream?direct_user=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiToken}`,
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(opts.uploadLength),
      "Upload-Metadata": metadataParts.join(","),
    },
  });

  if (res.status !== 201) {
    throw new Error(`Cloudflare direct upload failed (${res.status}): ${await res.text()}`);
  }

  const uploadURL = res.headers.get("Location");
  const uid = res.headers.get("stream-media-id");
  if (!uploadURL || !uid) {
    throw new Error("Cloudflare direct upload response missing Location or stream-media-id.");
  }

  return { uploadURL, uid };
}

export async function getStreamVideo(uid: string): Promise<StreamVideo> {
  const cfg = getStreamConfig();
  const res = await fetch(`${CF_API_BASE}/accounts/${cfg.accountId}/stream/${uid}`, {
    headers: { Authorization: `Bearer ${cfg.apiToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Cloudflare getVideo failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { result: CfVideoResult };
  return normalizeVideo(json.result);
}

export async function deleteStreamVideo(uid: string): Promise<void> {
  const cfg = getStreamConfig();
  await fetch(`${CF_API_BASE}/accounts/${cfg.accountId}/stream/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${cfg.apiToken}` },
  });
}

// ---------------------------------------------------------------------------
// Signed playback
// ---------------------------------------------------------------------------
function decodeSigningKey(pem: string): string {
  return pem.includes("BEGIN") ? pem : Buffer.from(pem, "base64").toString("utf8");
}

/**
 * Mint a short-lived signed playback token (RS256 JWT) for a video.
 * Requires the video to have requireSignedURLs=true.
 */
export async function signPlaybackToken(uid: string, ttlSeconds = 60 * 60 * 3): Promise<string> {
  const cfg = getStreamConfig();
  if (!cfg.signingKeyId || !cfg.signingKeyPem) {
    throw new Error(
      "Signed playback is not configured. Set CLOUDFLARE_STREAM_SIGNING_KEY_ID and CLOUDFLARE_STREAM_SIGNING_KEY_PEM."
    );
  }

  const key = await importPKCS8(decodeSigningKey(cfg.signingKeyPem), "RS256");
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ sub: uid, kid: cfg.signingKeyId, downloadable: false })
    .setProtectedHeader({ alg: "RS256", kid: cfg.signingKeyId })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(key);
}

/**
 * HLS manifest URL. For signed playback, Cloudflare uses the JWT token in place
 * of the video uid in the path; unsigned playback uses the uid directly.
 */
export function hlsManifestUrl(uid: string, token?: string | null): string {
  const cfg = getStreamConfig();
  const pathSegment = token ?? uid;
  return `https://${cfg.customerSubdomain}/${pathSegment}/manifest/video.m3u8`;
}

export function thumbnailUrl(uid: string): string {
  const cfg = getStreamConfig();
  return `https://${cfg.customerSubdomain}/${uid}/thumbnails/thumbnail.jpg`;
}

export function mapStreamStatus(state: string): LessonStatus {
  if (state === "ready") return "ready";
  if (state === "error") return "error";
  return "processing";
}

// ---------------------------------------------------------------------------
// Webhook verification
// Cloudflare sends: Webhook-Signature: time=<unix>,sig1=<hex hmac of `time.body`>
// ---------------------------------------------------------------------------
export function verifyWebhookSignature(signatureHeader: string | null, rawBody: string): boolean {
  const cfg = getStreamConfig();
  if (!cfg.webhookSecret) return false;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k.trim(), (v ?? "").trim()];
    })
  );
  const time = parts["time"];
  const sig = parts["sig1"];
  if (!time || !sig) return false;

  const expected = createHmac("sha256", cfg.webhookSecret)
    .update(`${time}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
