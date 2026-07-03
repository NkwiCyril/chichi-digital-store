import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const { lesson_id, course_id, position_sec, completed } = body as {
    lesson_id?: string;
    course_id?: string;
    position_sec?: number;
    completed?: boolean;
  };

  if (!lesson_id || !course_id) {
    return Response.json({ error: "lesson_id and course_id are required." }, { status: 400 });
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id,
      course_id,
      position_sec: position_sec ?? 0,
      completed: completed ?? false,
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("course_id");

  if (!courseId) {
    return Response.json({ error: "course_id is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, position_sec, completed, updated_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}
