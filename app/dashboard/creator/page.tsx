import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/db/profile";

const COMMISSION_RATE = 0.1;

const stats = [
  { label: "Total earnings", value: "XAF 7,450,000", note: "after commission" },
  { label: "This month", value: "XAF 842,000", note: "+18% vs last month" },
  { label: "Total sales", value: "847", note: "across 4 products" },
  { label: "Avg. rating", value: "4.9", note: "from 213 reviews" },
];

const products = [
  { name: "Packaging Design Kit Pro", category: "Templates", price: "XAF 29,000", sales: 312 },
  { name: "Brand Library 2.0", category: "Digital Assets", price: "XAF 18,000", sales: 268 },
  { name: "Branding Starter Kit", category: "Templates", price: "XAF 24,000", sales: 154 },
  { name: "Package Designer — Beginner to Pro", category: "Course", price: "XAF 35,000", sales: 113 },
];

export default async function CreatorDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await fetchProfile(supabase, user);
  const storeName = profile.store?.name ?? profile.displayName ?? "your store";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Creator dashboard</p>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back, {profile.displayName || "creator"} 👋</h1>
          {profile.store?.slug && (
            <p className="mt-1 text-sm text-zinc-400">store.chichi.co/{profile.store.slug}</p>
          )}
        </div>
        <button className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-colors hover:bg-violet-700">
          + New product
        </button>
      </header>

      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-800">
        Chichi takes a flat <strong>{Math.round(COMMISSION_RATE * 100)}% commission</strong> per sale —
        no monthly fees. Payouts go to your {profile.payout?.method === "orange" ? "Orange Money" : "MTN MoMo"}
        {profile.payout?.number ? ` (${profile.payout.number})` : ""}.
      </div>

      <section id="sales" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{s.note}</p>
          </div>
        ))}
      </section>

      <section id="products" className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Your products</h2>
          <Link href="#" className="text-sm font-medium text-violet-600 hover:text-violet-700">
            Manage all
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {products.map((p) => (
            <div key={p.name} className="flex items-center justify-between px-6 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{p.name}</p>
                <p className="text-xs text-zinc-400">{p.category}</p>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{p.price}</p>
                  <p className="text-xs text-zinc-400">price</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{p.sales}</p>
                  <p className="text-xs text-zinc-400">sales</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
