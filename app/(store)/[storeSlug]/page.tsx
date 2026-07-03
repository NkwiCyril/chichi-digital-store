import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDuration, formatXAF } from "@/lib/db/courses";
import type { Course } from "@/lib/db/courses";

async function getStoreBySlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, slug: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, slug, category, owner_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function getPublishedCourses(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, storeId: string) {
  const { data } = await supabase
    .from("courses")
    .select("id, store_id, title, slug, summary, cover_url, price_xaf, level, language, total_duration_sec, lesson_count, published_at")
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data ?? []) as Pick<Course, "id" | "store_id" | "title" | "slug" | "summary" | "cover_url" | "price_xaf" | "level" | "language" | "total_duration_sec" | "lesson_count" | "published_at">[];
}

async function getCreatorProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, ownerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio")
    .eq("id", ownerId)
    .maybeSingle();
  return data;
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const supabase = await createSupabaseServerClient();

  const store = await getStoreBySlug(supabase, storeSlug);
  if (!store) notFound();

  const [courses, creator] = await Promise.all([
    getPublishedCourses(supabase, store.id),
    getCreatorProfile(supabase, store.owner_id),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Store header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-5">
            {creator?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-violet-400 to-purple-600">
                <span className="text-xl font-bold text-white">
                  {(store.name || "S")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{store.name}</h1>
              {creator?.bio && (
                <p className="mt-1 text-sm text-zinc-500">{creator.bio}</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                {courses.length} {courses.length === 1 ? "course" : "courses"} available
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Courses grid */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
            <p className="text-sm text-zinc-500">No courses published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/${storeSlug}/${course.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg"
              >
                {course.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.cover_url}
                    alt=""
                    className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-linear-to-br from-violet-400 to-purple-600">
                    <svg className="h-10 w-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900 truncate">{course.title}</h3>
                  {course.summary && (
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{course.summary}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{course.lesson_count} lessons</span>
                      {course.total_duration_sec > 0 && (
                        <span>· {formatDuration(course.total_duration_sec)}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-zinc-900">
                      {course.price_xaf > 0 ? formatXAF(course.price_xaf) : "Free"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
