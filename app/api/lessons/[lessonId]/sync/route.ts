import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recomputeCourseAggregates } from "@/lib/db/courses";
import {
  isStreamConfigured,
  getStreamVideo,
  mapStreamStatus,
  thumbnailUrl,
} from "@/lib/cloudflare/stream";

export const runtime = "nodejs";

/**
 * Manually refresh a lesson's processing status from Cloudflare Stream.
 * Used as a fallback when the webhook is not reachable (e.g. local dev).
 * Ownership is enforced by RLS on the lessons table.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;

  if (!isStreamConfigured()) {
    return Response.json({ error: "Video streaming is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, course_id, video_uid")
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !lesson) {
    return Response.json({ error: "Lesson not found." }, { status: 404 });
  }

  if (!lesson.video_uid) {
    return Response.json({ error: "No video uploaded for this lesson yet." }, { status: 400 });
  }

  const video = await getStreamVideo(lesson.video_uid);
  const status = mapStreamStatus(video.state);
  const updates: Record<string, unknown> = { status };
  if (status === "ready") {
    if (video.duration > 0) updates.duration_sec = Math.round(video.duration);
    updates.thumbnail_url = video.thumbnail || thumbnailUrl(lesson.video_uid);
  }

  const { data: updated, error: updateError } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", lessonId)
    .select()
    .single();

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  await recomputeCourseAggregates(supabase, lesson.course_id);

  return Response.json(updated);
}
