import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recomputeCourseAggregates } from "@/lib/db/courses";

export async function PATCH(
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

  const body = await request.json();
  const allowed = ["title", "position", "is_preview", "section_id"] as const;
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", lessonId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { courseId, lessonId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  // Check for Bunny video
  const { data: lesson } = await supabase
    .from("lessons")
    .select("bunny_video_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lesson?.bunny_video_id) {
    try {
      const { deleteBunnyVideo } = await import("@/lib/bunny/client");
      await deleteBunnyVideo(lesson.bunny_video_id);
    } catch {
      // Bunny not configured
    }
  }

  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await recomputeCourseAggregates(supabase, courseId);

  return new Response(null, { status: 204 });
}
