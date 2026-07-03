import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchOwnerStore } from "@/lib/db/courses";
import { slugify } from "@/lib/auth/roles";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const store = await fetchOwnerStore(supabase, user.id);
  if (!store) {
    return Response.json([]);
  }

  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, store_id, title, slug, summary, description, cover_url, price_xaf, level, language, status, total_duration_sec, lesson_count, published_at, created_at, updated_at"
    )
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const store = await fetchOwnerStore(supabase, user.id);
  if (!store) {
    return Response.json({ error: "You need a store to create courses." }, { status: 400 });
  }

  const body = await request.json();
  const title = (body.title as string)?.trim();

  if (!title) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const slug = slugify(title);

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({ store_id: store.id, title, slug })
    .select()
    .single();

  if (courseError) {
    return Response.json({ error: courseError.message }, { status: 500 });
  }

  // Create a default first section
  await supabase
    .from("course_sections")
    .insert({ course_id: course.id, title: "Getting Started", position: 0 });

  return Response.json(course, { status: 201 });
}
