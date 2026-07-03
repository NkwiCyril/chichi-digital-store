import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDuration, formatXAF } from "@/lib/db/courses";
import type { Course, CourseSection, Lesson } from "@/lib/db/courses";
import { BRAND_NAME } from "@/lib/brand";

async function getStoreBySlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, slug: string) {
  const { data } = await supabase
    .from("stores")
    .select("id, name, slug, owner_id")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getCourseBySlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, storeId: string, slug: string) {
  const { data } = await supabase
    .from("courses")
    .select("id, store_id, title, slug, summary, description, cover_url, price_xaf, level, language, status, total_duration_sec, lesson_count, published_at, created_at, updated_at")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as Course | null;
}

async function getCourseCurriculum(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, courseId: string) {
  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, course_id, title, position")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, section_id, course_id, title, position, is_preview, duration_sec, status")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  const sectionList = (sections ?? []) as CourseSection[];
  const lessonList = (lessons ?? []) as Pick<Lesson, "id" | "section_id" | "course_id" | "title" | "position" | "is_preview" | "duration_sec" | "status">[];

  return sectionList.map((s) => ({
    ...s,
    lessons: lessonList.filter((l) => l.section_id === s.id),
  }));
}

async function getCreatorProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, ownerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", ownerId)
    .maybeSingle();
  return data;
}

export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ storeSlug: string; courseSlug: string }>;
}) {
  const { storeSlug, courseSlug } = await params;
  const supabase = await createSupabaseServerClient();

  const store = await getStoreBySlug(supabase, storeSlug);
  if (!store) notFound();

  const course = await getCourseBySlug(supabase, store.id, courseSlug);
  if (!course) notFound();

  const [curriculum, creator] = await Promise.all([
    getCourseCurriculum(supabase, course.id),
    getCreatorProfile(supabase, store.owner_id),
  ]);

  const totalLessons = curriculum.reduce((sum, s) => sum + s.lessons.length, 0);
  const previewLessons = curriculum.flatMap((s) => s.lessons).filter((l) => l.is_preview).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="border-b border-zinc-200 bg-linear-to-br from-zinc-900 to-zinc-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <Link
            href={`/${storeSlug}`}
            className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {store.name}
          </Link>

          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  {course.level.replace("_", " ")}
                </span>
                <span className="text-xs text-zinc-400">{course.language === "fr" ? "French" : course.language === "en,fr" ? "EN & FR" : "English"}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{course.title}</h1>
              {course.summary && (
                <p className="text-lg text-zinc-300">{course.summary}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                <span>{totalLessons} lessons</span>
                {course.total_duration_sec > 0 && <span>{formatDuration(course.total_duration_sec)} total</span>}
                {previewLessons > 0 && <span>{previewLessons} free previews</span>}
              </div>

              {creator && (
                <div className="flex items-center gap-3 pt-2">
                  {creator.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={creator.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500">
                      <span className="text-sm font-bold text-white">
                        {(creator.display_name || store.name)[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{creator.display_name || store.name}</p>
                    <p className="text-xs text-zinc-400">Instructor</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price card */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                {course.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.cover_url} alt="" className="mb-4 w-full rounded-xl object-cover" />
                )}
                <p className="text-3xl font-bold">
                  {course.price_xaf > 0 ? formatXAF(course.price_xaf) : "Free"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">One-time purchase, lifetime access</p>
                <button className="mt-4 w-full cursor-pointer rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-900/30">
                  {course.price_xaf > 0 ? "Buy this course" : "Enroll for free"}
                </button>
                <p className="mt-3 text-center text-[10px] text-zinc-500">
                  Secure payment via MTN MoMo & Orange Money
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-10">
            {/* Description */}
            {course.description && (
              <section>
                <h2 className="text-lg font-bold text-zinc-900 mb-3">About this course</h2>
                <div className="prose prose-sm prose-zinc max-w-none">
                  <p className="whitespace-pre-line text-zinc-600">{course.description}</p>
                </div>
              </section>
            )}

            {/* Curriculum */}
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">
                Course curriculum
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  {totalLessons} lessons · {formatDuration(course.total_duration_sec)}
                </span>
              </h2>
              <div className="space-y-3">
                {curriculum.map((section, i) => (
                  <div key={section.id} className="rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900">
                      Section {i + 1}: {section.title}
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {section.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                            </svg>
                            <span className="text-sm text-zinc-700 truncate">{lesson.title}</span>
                            {lesson.is_preview && (
                              <span className="shrink-0 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 uppercase">
                                Free
                              </span>
                            )}
                          </div>
                          {lesson.duration_sec > 0 && (
                            <span className="shrink-0 text-xs text-zinc-400">{formatDuration(lesson.duration_sec)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">This course includes</h3>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {totalLessons} video lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {formatDuration(course.total_duration_sec)} of content
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Lifetime access
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Mobile-friendly streaming
                  </li>
                </ul>
              </div>

              <p className="text-center text-xs text-zinc-400">
                Powered by {BRAND_NAME}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
