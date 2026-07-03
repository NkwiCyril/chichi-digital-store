import "server-only";

import { createHash } from "node:crypto";

import { getBunnyConfig } from "./config";

const BUNNY_API_BASE = "https://video.bunnycdn.com";
const BUNNY_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

export interface BunnyVideo {
  guid: string;
  title: string;
  status: number; // 0=created,1=uploaded,2=processing,3=transcoding,4=finished,5=error,6=upload-failed
  length: number; // seconds
  thumbnailFileName: string | null;
}

interface BunnyVideoApiResponse {
  guid: string;
  title: string;
  status: number;
  length: number;
  thumbnailFileName?: string | null;
}

function normalizeVideo(v: BunnyVideoApiResponse): BunnyVideo {
  return {
    guid: v.guid,
    title: v.title,
    status: v.status,
    length: v.length ?? 0,
    thumbnailFileName: v.thumbnailFileName ?? null,
  };
}

/** Create an empty video object in the library and return its guid. */
export async function createBunnyVideo(title: string): Promise<BunnyVideo> {
  const { libraryId, apiKey } = getBunnyConfig();
  const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`Bunny createVideo failed (${res.status}): ${await res.text()}`);
  }
  return normalizeVideo((await res.json()) as BunnyVideoApiResponse);
}

/** Fetch a video's current details (status, length, thumbnail). */
export async function getBunnyVideo(videoId: string): Promise<BunnyVideo> {
  const { libraryId, apiKey } = getBunnyConfig();
  const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
    headers: { AccessKey: apiKey, accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Bunny getVideo failed (${res.status}): ${await res.text()}`);
  }
  return normalizeVideo((await res.json()) as BunnyVideoApiResponse);
}

/** Delete a video object (used when a lesson is removed). */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const { libraryId, apiKey } = getBunnyConfig();
  await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
    method: "DELETE",
    headers: { AccessKey: apiKey, accept: "application/json" },
  });
}

export interface TusUploadCredentials {
  endpoint: string;
  libraryId: string;
  videoId: string;
  signature: string;
  expiration: number; // unix seconds
}

/**
 * Build the credentials a browser needs to upload a file directly to Bunny via
 * the TUS resumable protocol, without ever seeing the API key.
 *
 * signature = sha256( libraryId + apiKey + expiration + videoId )
 */
export function createTusUploadCredentials(
  videoId: string,
  ttlSeconds = 60 * 60
): TusUploadCredentials {
  const { libraryId, apiKey } = getBunnyConfig();
  const expiration = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = createHash("sha256")
    .update(`${libraryId}${apiKey}${expiration}${videoId}`)
    .digest("hex");

  return { endpoint: BUNNY_TUS_ENDPOINT, libraryId, videoId, signature, expiration };
}

/** Public (unsigned) HLS playlist URL — used only for free preview lessons. */
export function publicHlsUrl(videoId: string): string {
  const { cdnHostname } = getBunnyConfig();
  return `https://${cdnHostname}/${videoId}/playlist.m3u8`;
}

/** Thumbnail URL for a processed video. */
export function thumbnailUrl(videoId: string, thumbnailFileName: string | null): string {
  const { cdnHostname } = getBunnyConfig();
  const file = thumbnailFileName || "thumbnail.jpg";
  return `https://${cdnHostname}/${videoId}/${file}`;
}

/**
 * Generate a token-authenticated HLS URL for protected playback.
 * Bunny token auth: token = base64url( sha256_raw( authKey + path + expires ) ).
 * The token is generated for the video directory so all HLS segments inherit it.
 */
export function signedHlsUrl(videoId: string, ttlSeconds = 60 * 60 * 3): string {
  const { cdnHostname, tokenAuthKey } = getBunnyConfig();
  const path = `/${videoId}/playlist.m3u8`;

  if (!tokenAuthKey) {
    // Token auth not enabled — fall back to the public URL.
    return `https://${cdnHostname}${path}`;
  }

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signaturePath = `/${videoId}/`;
  const token = createHash("sha256")
    .update(`${tokenAuthKey}${signaturePath}${expires}`)
    .digest("base64")
    .replace(/\n/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `https://${cdnHostname}${path}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(
    signaturePath
  )}`;
}

/** Map Bunny numeric status to our lesson status. */
export function mapBunnyStatus(status: number): "processing" | "ready" | "error" {
  if (status === 4) return "ready";
  if (status === 5 || status === 6) return "error";
  return "processing";
}
