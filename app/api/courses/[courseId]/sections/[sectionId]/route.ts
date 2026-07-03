import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recomputeCourseAggregates } from "@/lib/db/courses";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; sectionId: string }> }
) {
  const { sectionId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if ("title" in body) updates.title = body.title;
  if ("position" in body) updates.position = body.position;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("course_sections")
    .update(updates)
    .eq("id", sectionId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; sectionId: string }> }
) {
  const { courseId, sectionId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  // Delete Bunny videos for lessons in this section (best-effort)
  const { data: lessons } = await supabase
    .from("lessons")
    .select("bunny_video_id")
    .eq("section_id", sectionId)
    .not("bunny_video_id", "is", null);

  if (lessons && lessons.length > 0) {
    try {
      const { deleteBunnyVideo } = await import("@/lib/bunny/client");
      await Promise.allSettled(
        lessons
          .filter((l) => l.bunny_video_id)
          .map((l) => deleteBunnyVideo(l.bunny_video_id!))
      );
    } catch {
      // Bunny not configured
    }
  }

  const { error } = await supabase
    .from("course_sections")
    .delete()
    .eq("id", sectionId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await recomputeCourseAggregates(supabase, courseId);

  return new Response(null, { status: 204 });
}
