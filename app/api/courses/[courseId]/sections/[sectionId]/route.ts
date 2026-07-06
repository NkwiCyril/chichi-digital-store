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

  // Delete Cloudflare Stream videos for lessons in this section (best-effort)
  const { data: lessons } = await supabase
    .from("lessons")
    .select("video_uid")
    .eq("section_id", sectionId)
    .not("video_uid", "is", null);

  if (lessons && lessons.length > 0) {
    try {
      const { deleteStreamVideo } = await import("@/lib/cloudflare/stream");
      await Promise.allSettled(
        lessons
          .filter((l) => l.video_uid)
          .map((l) => deleteStreamVideo(l.video_uid!))
      );
    } catch {
      // Stream not configured
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
