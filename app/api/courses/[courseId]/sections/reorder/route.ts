import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PUT(
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
  const order = body.order as string[];

  if (!Array.isArray(order)) {
    return Response.json({ error: "order must be an array of section IDs." }, { status: 400 });
  }

  // Update each section's position
  const updates = order.map((id, i) =>
    supabase
      .from("course_sections")
      .update({ position: i })
      .eq("id", id)
      .eq("course_id", courseId)
  );

  await Promise.all(updates);

  return Response.json({ ok: true });
}
