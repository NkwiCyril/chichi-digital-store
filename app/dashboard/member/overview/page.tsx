import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCreator } from "@/lib/auth/roles";
import { fetchProfile } from "@/lib/db/profile";
import { formatDuration, formatXAF } from "@/lib/db/courses";

interface EnrolledCourse {
  id: string;
  title: string;
  cover_url: string;
  total_duration_sec: number;
  lesson_count: number;
  price_xaf: number;
  enrolled_at: string;
  store_name: string;
}

async function fetchEnrolledCourses(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<EnrolledCourse[]> {
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        "created_at, courses:course_id(id, title, cover_url, total_duration_sec, lesson_count, price_xaf, stores:store_id(name))"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data
      .filter((e: Record<string, unknown>) => e.courses)
      .map((e: Record<string, unknown>) => {
        const c = e.courses as Record<string, unknown>;
        const s = c.stores as Record<string, unknown> | null;
        return {
          id: c.id as string,
          title: c.title as string,
          cover_url: c.cover_url as string,
          total_duration_sec: c.total_duration_sec as number,
          lesson_count: c.lesson_count as number,
          price_xaf: c.price_xaf as number,
          enrolled_at: e.created_at as string,
          store_name: s?.name as string ?? "Unknown",
        };
      });
  } catch {
    return [];
  }
}

export default async function MemberDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await fetchProfile(supabase, user);

  const enrolledCourses = user ? await fetchEnrolledCourses(supabase, user.id) : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-zinc-500">Member dashboard</p>
        <h1 className="text-2xl font-bold text-zinc-900">
          Hi {profile.displayName || "there"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Your courses and purchases, all in one place.</p>
      </header>

      {!isCreator(profile) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-800">Want to start selling?</p>
            <p className="text-sm text-violet-700">
              Activate creator mode and open your own store — keep your buyer account as is.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Become a creator
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Enrolled courses", value: String(enrolledCourses.length) },
          { label: "Total lessons", value: String(enrolledCourses.reduce((s, c) => s + c.lesson_count, 0)) },
          { label: "Watch time", value: formatDuration(enrolledCourses.reduce((s, c) => s + c.total_duration_sec, 0)) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">My courses</h2>
          <Link href="/" className="text-sm font-medium text-violet-600 hover:text-violet-700">
            Browse courses
          </Link>
        </div>
        {enrolledCourses.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-zinc-500">You haven&apos;t enrolled in any courses yet.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {enrolledCourses.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  {c.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_url} alt="" className="h-10 w-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">{c.title}</p>
                    <p className="text-xs text-zinc-400">
                      by {c.store_name} · {c.lesson_count} lessons
                      {c.total_duration_sec > 0 && ` · ${formatDuration(c.total_duration_sec)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold text-zinc-900">
                    {c.price_xaf > 0 ? formatXAF(c.price_xaf) : "Free"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
