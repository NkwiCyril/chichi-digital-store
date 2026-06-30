import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCreator } from "@/lib/auth/roles";
import { fetchProfile } from "@/lib/db/profile";

const purchases = [
  { name: "Packaging Design Kit Pro", creator: "Mukstyle Studio", price: "XAF 29,000", date: "Jun 24, 2025" },
  { name: "Lightroom Presets — Lagos Nights", creator: "Amara Njike", price: "XAF 12,000", date: "Jun 12, 2025" },
  { name: "Business Plan Template (FR)", creator: "Bertrand Fomba", price: "XAF 9,500", date: "May 30, 2025" },
];

export default async function MemberDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await fetchProfile(supabase, user);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-zinc-500">Member dashboard</p>
        <h1 className="text-2xl font-bold text-zinc-900">
          Hi {profile.displayName || "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Your purchases and downloads, all in one place.</p>
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
          { label: "Purchases", value: String(purchases.length) },
          { label: "Downloads", value: "12" },
          { label: "Wishlist", value: "5" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{s.value}</p>
          </div>
        ))}
      </div>

      <section id="library" className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">My library</h2>
          <Link href="/" className="text-sm font-medium text-violet-600 hover:text-violet-700">
            Browse marketplace
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {purchases.map((p) => (
            <div key={p.name} className="flex items-center justify-between px-6 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{p.name}</p>
                <p className="text-xs text-zinc-400">by {p.creator} · {p.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-zinc-900">{p.price}</span>
                <button className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
