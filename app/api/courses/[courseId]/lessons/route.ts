import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recomputeCourseAggregates } from "@/lib/db/courses";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const sectionId = body.section_id as string;
  const title = (body.title as string)?.trim() || "Untitled lesson";

  if (!sectionId) {
    return Response.json({ error: "section_id is required." }, { status: 400 });
  }

  // Get max position in section
  const { data: existing } = await supabase
    .from("lessons")
    .select("position")
    .eq("section_id", sectionId)
    .order("position", { ascending: false })
    .limit(1);

  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("lessons")
    .insert({ course_id: courseId, section_id: sectionId, title, position })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await recomputeCourseAggregates(supabase, courseId);

  return Response.json(data, { status: 201 });
}
