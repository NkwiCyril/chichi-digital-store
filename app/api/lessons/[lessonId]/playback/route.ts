import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isBunnyConfigured } from "@/lib/bunny/config";
import { signedHlsUrl, publicHlsUrl } from "@/lib/bunny/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;

  if (!isBunnyConfigured()) {
    return Response.json({ error: "Video streaming is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the lesson
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, course_id, bunny_video_id, is_preview, status")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return Response.json({ error: "Lesson not found." }, { status: 404 });
  }

  if (!lesson.bunny_video_id || lesson.status !== "ready") {
    return Response.json({ error: "Video is not available." }, { status: 404 });
  }

  // Preview lessons are publicly accessible
  if (lesson.is_preview) {
    return Response.json({
      url: publicHlsUrl(lesson.bunny_video_id),
      preview: true,
    });
  }

  // Non-preview lessons require authentication + enrollment
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  // Check enrollment or course ownership
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", lesson.course_id)
    .maybeSingle();

  if (!enrollment) {
    // Check if user owns the course (creator viewing their own content)
    const { data: course } = await supabase
      .from("courses")
      .select("store_id")
      .eq("id", lesson.course_id)
      .maybeSingle();

    if (course) {
      const { data: store } = await supabase
        .from("stores")
        .select("owner_id")
        .eq("id", course.store_id)
        .maybeSingle();

      if (!store || store.owner_id !== user.id) {
        return Response.json({ error: "Enrollment required." }, { status: 403 });
      }
    } else {
      return Response.json({ error: "Course not found." }, { status: 404 });
    }
  }

  return Response.json({
    url: signedHlsUrl(lesson.bunny_video_id),
    preview: false,
  });
}
