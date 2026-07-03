import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchOwnerStore, listCoursesForStore, formatDuration, formatXAF } from "@/lib/db/courses";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100", text: "text-zinc-600", label: "Draft" },
  published: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Published" },
  archived: { bg: "bg-amber-50", text: "text-amber-700", label: "Archived" },
};

export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const store = await fetchOwnerStore(supabase, user.id);

  if (!store) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-zinc-900">Courses</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-500">
            You need to set up your store before creating courses.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Set up store
          </Link>
        </div>
      </div>
    );
  }

  const courses = await listCoursesForStore(supabase, store.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Creator dashboard</p>
          <h1 className="text-2xl font-bold text-zinc-900">Courses</h1>
        </div>
        <Link
          href="/dashboard/creator/courses/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-colors hover:bg-violet-700"
        >
          + New course
        </Link>
      </header>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
            <svg className="h-6 w-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900">No courses yet</h3>
          <p className="mt-1 text-sm text-zinc-500">Create your first video course and start teaching.</p>
          <Link
            href="/dashboard/creator/courses/new"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="divide-y divide-zinc-100">
            {courses.map((course) => {
              const st = statusStyles[course.status] ?? statusStyles.draft;
              return (
                <Link
                  key={course.id}
                  href={`/dashboard/creator/courses/${course.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {course.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.cover_url}
                        alt=""
                        className="h-12 w-20 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                        <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{course.title || "Untitled course"}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span>{course.lesson_count} lessons</span>
                        {course.total_duration_sec > 0 && <span>{formatDuration(course.total_duration_sec)}</span>}
                        {course.price_xaf > 0 && <span>{formatXAF(course.price_xaf)}</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
