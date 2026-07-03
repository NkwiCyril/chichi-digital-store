import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const action = body.action as "publish" | "unpublish";

  if (action === "publish") {
    // Fetch the course to validate
    const { data: course } = await supabase
      .from("courses")
      .select("title, cover_url, price_xaf")
      .eq("id", courseId)
      .maybeSingle();

    if (!course) {
      return Response.json({ error: "Course not found." }, { status: 404 });
    }

    const reasons: string[] = [];
    if (!course.title?.trim()) reasons.push("Course needs a title.");
    if (!course.cover_url?.trim()) reasons.push("Course needs a cover image.");

    // Check for at least 1 ready lesson
    const { count } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .eq("status", "ready");

    if (!count || count < 1) {
      reasons.push("Course needs at least 1 lesson with a processed video.");
    }

    if (reasons.length > 0) {
      return Response.json(
        { error: "Cannot publish: " + reasons.join(" ") },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("courses")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", courseId)
      .select("status, published_at")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json(data);
  }

  if (action === "unpublish") {
    const { data, error } = await supabase
      .from("courses")
      .update({ status: "draft", published_at: null })
      .eq("id", courseId)
      .select("status, published_at")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json(data);
  }

  return Response.json({ error: 'action must be "publish" or "unpublish".' }, { status: 400 });
}
