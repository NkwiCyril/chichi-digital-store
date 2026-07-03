import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isBunnyConfigured } from "@/lib/bunny/config";
import { createBunnyVideo, createTusUploadCredentials } from "@/lib/bunny/client";

export async function POST(
  _request: Request,
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

  if (!isBunnyConfigured()) {
    return Response.json(
      { error: "Video uploads are not configured. Set BUNNY_STREAM_* environment variables." },
      { status: 503 }
    );
  }

  // Fetch the lesson to get its title
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, bunny_video_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return Response.json({ error: "Lesson not found." }, { status: 404 });
  }

  // Create a Bunny video object
  const video = await createBunnyVideo(lesson.title);

  // Update the lesson with the Bunny video ID
  await supabase
    .from("lessons")
    .update({
      bunny_video_id: video.guid,
      status: "processing",
    })
    .eq("id", lessonId);

  // Return TUS upload credentials
  const credentials = createTusUploadCredentials(video.guid);

  return Response.json(credentials);
}
