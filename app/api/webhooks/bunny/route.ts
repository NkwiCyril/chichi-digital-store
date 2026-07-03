import { recomputeCourseAggregates } from "@/lib/db/courses";
import { isBunnyConfigured } from "@/lib/bunny/config";

export async function POST(request: Request) {
  if (!isBunnyConfigured()) {
    return Response.json({ error: "Bunny not configured." }, { status: 503 });
  }

  const { getBunnyConfig } = await import("@/lib/bunny/config");
  const { getBunnyVideo, mapBunnyStatus, thumbnailUrl } = await import("@/lib/bunny/client");

  const config = getBunnyConfig();

  // Optional: verify webhook secret
  if (config.webhookSecret) {
    const signature = request.headers.get("x-bunny-webhook-secret");
    if (signature !== config.webhookSecret) {
      return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
  }

  const body = await request.json();
  const videoGuid = body.VideoGuid as string;
  const bunnyStatus = body.Status as number;

  if (!videoGuid) {
    return Response.json({ error: "VideoGuid is required." }, { status: 400 });
  }

  // Use service-role client to bypass RLS
  let admin;
  try {
    const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
    admin = createSupabaseAdmin();
  } catch {
    // Fall back to server client if service role key not available
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    admin = await createSupabaseServerClient();
  }

  // Find the lesson with this Bunny video ID
  const { data: lesson, error: lessonError } = await admin
    .from("lessons")
    .select("id, course_id")
    .eq("bunny_video_id", videoGuid)
    .maybeSingle();

  if (lessonError || !lesson) {
    // Not found — might be a video we don't track
    return Response.json({ ok: true, skipped: true });
  }

  const status = mapBunnyStatus(bunnyStatus);
  const updates: Record<string, unknown> = { status };

  // If ready, fetch full details for duration and thumbnail
  if (status === "ready") {
    try {
      const video = await getBunnyVideo(videoGuid);
      updates.duration_sec = video.length;
      updates.thumbnail_url = thumbnailUrl(videoGuid, video.thumbnailFileName);
    } catch {
      // Could not fetch details — still mark as ready
    }
  }

  await admin
    .from("lessons")
    .update(updates)
    .eq("id", lesson.id);

  // Recompute course aggregates
  await recomputeCourseAggregates(admin, lesson.course_id);

  return Response.json({ ok: true });
}
