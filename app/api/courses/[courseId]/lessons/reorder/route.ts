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
  const order = body.order as { id: string; section_id: string; position: number }[];

  if (!Array.isArray(order)) {
    return Response.json({ error: "order must be an array." }, { status: 400 });
  }

  const updates = order.map((item) =>
    supabase
      .from("lessons")
      .update({ section_id: item.section_id, position: item.position })
      .eq("id", item.id)
      .eq("course_id", courseId)
  );

  await Promise.all(updates);

  return Response.json({ ok: true });
}
