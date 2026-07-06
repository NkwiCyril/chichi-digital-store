import { recomputeCourseAggregates } from "@/lib/db/courses";
import {
  isStreamConfigured,
  mapStreamStatus,
  verifyWebhookSignature,
  thumbnailUrl,
} from "@/lib/cloudflare/stream";

export const runtime = "nodejs";

/**
 * Cloudflare Stream webhook. Configure once (account-level) to point here.
 * Cloudflare signs the request with `Webhook-Signature: time=...,sig1=...`.
 */
export async function POST(request: Request) {
  if (!isStreamConfigured()) {
    return Response.json({ error: "Stream not configured." }, { status: 503 });
  }

  const raw = await request.text();

  if (!verifyWebhookSignature(request.headers.get("Webhook-Signature"), raw)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let body: {
    uid?: string;
    duration?: number;
    thumbnail?: string;
    status?: { state?: string };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const uid = body.uid;
  if (!uid) {
    return Response.json({ error: "uid is required." }, { status: 400 });
  }

  // Service-role client to bypass RLS; fall back to the anon server client.
  let admin;
  try {
    const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
    admin = createSupabaseAdmin();
  } catch {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    admin = await createSupabaseServerClient();
  }

  const { data: lesson } = await admin
    .from("lessons")
    .select("id, course_id")
    .eq("video_uid", uid)
    .maybeSingle();

  if (!lesson) {
    return Response.json({ ok: true, skipped: true });
  }

  const status = mapStreamStatus(body.status?.state ?? "");
  const updates: Record<string, unknown> = { status };
  if (status === "ready") {
    if (typeof body.duration === "number" && body.duration > 0) {
      updates.duration_sec = Math.round(body.duration);
    }
    updates.thumbnail_url = body.thumbnail || thumbnailUrl(uid);
  }

  await admin.from("lessons").update(updates).eq("id", lesson.id);
  await recomputeCourseAggregates(admin, lesson.course_id);

  return Response.json({ ok: true });
}
