import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/db/profile";
import { fetchOwnerStore, listCoursesForStore, formatDuration, formatXAF } from "@/lib/db/courses";
import { BRAND_NAME } from "@/lib/brand";
import { storeDisplayUrl } from "@/lib/brand";

const COMMISSION_RATE = 0.1;

export default async function CreatorDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await fetchProfile(supabase, user);

  let courses: Awaited<ReturnType<typeof listCoursesForStore>> = [];
  let store: Awaited<ReturnType<typeof fetchOwnerStore>> = null;

  if (user) {
    store = await fetchOwnerStore(supabase, user.id);
    if (store) {
      courses = await listCoursesForStore(supabase, store.id);
    }
  }

  const publishedCount = courses.filter((c) => c.status === "published").length;
  const totalLessons = courses.reduce((sum, c) => sum + c.lesson_count, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Creator dashboard</p>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back, {profile.displayName || "creator"}</h1>
          {profile.store?.slug && (
            <p className="mt-1 text-sm text-zinc-400">{storeDisplayUrl(profile.store.slug)}</p>
          )}
        </div>
        <Link
          href="/dashboard/creator/courses/new"
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-colors hover:bg-violet-700"
        >
          + New course
        </Link>
      </header>

      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-800">
        {BRAND_NAME} takes a flat <strong>{Math.round(COMMISSION_RATE * 100)}% commission</strong> per sale —
        no monthly fees. Payouts go to your {profile.payout?.method === "orange" ? "Orange Money" : "MTN MoMo"}
        {profile.payout?.number ? ` (${profile.payout.number})` : ""}.
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total courses", value: String(courses.length), note: `${publishedCount} published` },
          { label: "Total lessons", value: String(totalLessons), note: "across all courses" },
          { label: "Draft courses", value: String(courses.filter((c) => c.status === "draft").length), note: "in progress" },
          { label: "Published", value: String(publishedCount), note: "live courses" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{s.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Your courses</h2>
          <Link href="/dashboard/creator/courses" className="text-sm font-medium text-violet-600 hover:text-violet-700">
            Manage all
          </Link>
        </div>
        {courses.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-zinc-500">No courses yet. Create your first video course to get started.</p>
            <Link
              href="/dashboard/creator/courses/new"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Create your first course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {courses.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/creator/courses/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{c.title || "Untitled"}</p>
                  <p className="text-xs text-zinc-400">
                    {c.lesson_count} lessons
                    {c.total_duration_sec > 0 && ` · ${formatDuration(c.total_duration_sec)}`}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{c.price_xaf > 0 ? formatXAF(c.price_xaf) : "Free"}</p>
                    <p className="text-xs text-zinc-400">price</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      c.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {c.status === "published" ? "Live" : "Draft"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
