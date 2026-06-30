import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
export const ACCEPTED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export interface AvatarUploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload an avatar image to the public `avatars` bucket under `{userId}/...`.
 * Returns the public URL on success. Validates type and size client-side.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<AvatarUploadResult> {
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return { url: null, error: "Please choose a PNG, JPG, WEBP, or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { url: null, error: "Image must be 2 MB or smaller." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
