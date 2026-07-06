import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchOwnerStore } from "@/lib/db/courses";

function formatXAF(amount: number) {
  return `XAF ${amount.toLocaleString("fr-CM")}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const store = user ? await fetchOwnerStore(supabase, user.id) : null;

  const products =
    store
      ? (
          await supabase
            .from("digital_products")
            .select("id, title, description, price_xaf, file_name, file_size, file_type, status, download_count, created_at")
            .eq("store_id", store.id)
            .order("created_at", { ascending: false })
        ).data ?? []
      : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Creator dashboard</p>
          <h1 className="text-2xl font-bold text-zinc-900">Digital Products</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Sell PDFs, templates, ZIP files, and more.
          </p>
        </div>
        <Link
          href="/dashboard/creator/products/new"
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-colors hover:bg-violet-700"
        >
          + Upload product
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        {products.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
              <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-700">No products yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Upload a PDF, ZIP, or any digital file to start selling.
            </p>
            <Link
              href="/dashboard/creator/products/new"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Upload your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/creator/products/${p.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{p.title || "Untitled"}</p>
                  <p className="text-xs text-zinc-400">
                    {p.file_name ?? "—"}
                    {p.file_size ? ` · ${formatBytes(p.file_size)}` : ""}
                    {` · ${p.download_count} download${p.download_count !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-4 text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-900">
                    {p.price_xaf > 0 ? formatXAF(p.price_xaf) : "Free"}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {p.status === "published" ? "Live" : "Draft"}
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
