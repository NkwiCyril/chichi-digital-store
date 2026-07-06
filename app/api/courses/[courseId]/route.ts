import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/auth/roles";

export async function GET(
  _request: Request,
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

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Course not found." }, { status: 404 });

  return Response.json(data);
}

export async function PATCH(
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
  const allowed = [
    "title", "slug", "summary", "description", "cover_url",
    "price_xaf", "level", "language",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  // Auto-generate slug from title if title changed but slug wasn't explicitly provided
  if (updates.title && !body.slug) {
    updates.slug = slugify(updates.title as string);
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", courseId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function DELETE(
  _request: Request,
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

  // Fetch lessons with Cloudflare video ids before deleting
  const { data: lessons } = await supabase
    .from("lessons")
    .select("video_uid")
    .eq("course_id", courseId)
    .not("video_uid", "is", null);

  // Delete Cloudflare Stream videos (best-effort)
  if (lessons && lessons.length > 0) {
    try {
      const { deleteStreamVideo } = await import("@/lib/cloudflare/stream");
      await Promise.allSettled(
        lessons
          .filter((l) => l.video_uid)
          .map((l) => deleteStreamVideo(l.video_uid!))
      );
    } catch {
      // Stream not configured — skip
    }
  }

  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
