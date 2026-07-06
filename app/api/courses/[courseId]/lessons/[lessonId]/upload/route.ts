import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStreamConfigured, createDirectUpload } from "@/lib/cloudflare/stream";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isStreamConfigured()) {
    return Response.json(
      { error: "Video uploads are not configured. Set CLOUDFLARE_STREAM_* environment variables." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    uploadLength?: number;
    fileName?: string;
  };
  const uploadLength = Number(body.uploadLength);
  if (!uploadLength || uploadLength <= 0) {
    return Response.json({ error: "uploadLength (bytes) is required." }, { status: 400 });
  }

  // Ownership is enforced by RLS: this select only returns the lesson if the
  // authenticated user owns the parent course's store.
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, video_uid")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return Response.json({ error: "Lesson not found." }, { status: 404 });
  }

  // Create a one-time direct-creator upload URL (signed playback required).
  const { uploadURL, uid } = await createDirectUpload({
    uploadLength,
    name: lesson.title || body.fileName || "lesson-video",
    requireSignedURLs: true,
  });

  await supabase
    .from("lessons")
    .update({ video_uid: uid, video_provider: "cloudflare", status: "processing" })
    .eq("id", lessonId);

  return Response.json({ uploadURL, uid });
}
