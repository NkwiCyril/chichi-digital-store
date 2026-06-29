export default function HeroSection() {
  const products = [
    {
      name: "UI Design Kit Pro",
      cat: "Design Templates",
      price: "$49",
      gradient: "from-violet-400 to-purple-600",
    },
    {
      name: "Icon Library 2.0",
      cat: "Digital Assets",
      price: "$29",
      gradient: "from-blue-400 to-indigo-600",
    },
    {
      name: "Brand Starter Kit",
      cat: "Templates",
      price: "$39",
      gradient: "from-rose-400 to-pink-600",
    },
    {
      name: "Motion UI Pack",
      cat: "Animations",
      price: "$59",
      gradient: "from-amber-400 to-orange-500",
    },
  ] as const;

  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-32">
      {/* Soft radial blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 w-[700px] h-[700px] rounded-full bg-violet-50 opacity-70 blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full bg-violet-50 opacity-50 blur-3xl" />
        <div className="dot-grid absolute inset-0 opacity-[0.35]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-xs font-medium text-violet-700">
                50,000+ creators worldwide
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.08] mb-6">
              The simplest way to{" "}
              <span className="text-violet-600">sell digital products</span>
            </h1>

            <p className="text-xl text-zinc-500 leading-relaxed mb-10">
              Build your storefront in minutes. Sell ebooks, courses, templates,
              and more — with instant delivery and zero transaction fees on Pro.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-violet-100"
              >
                Start for free
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 16 16"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8h10M9 4l4 4-4 4"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-semibold px-6 py-3.5 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5 3.5v9l7-4.5-7-4.5z" />
                </svg>
                Watch demo
              </a>
            </div>

            <p className="text-xs text-zinc-400 tracking-wide">
              No credit card required · Set up in 2 minutes · Cancel anytime
            </p>
          </div>

          {/* Store mockup */}
          <div className="hidden lg:block relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 bg-white">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white border border-zinc-200 rounded-md px-3 py-1 flex items-center gap-2">
                  <svg
                    className="w-3 h-3 text-zinc-400 shrink-0"
                    fill="none"
                    viewBox="0 0 16 16"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 10.5l-3-3m0 0a4 4 0 10-5.657-5.657A4 4 0 007.5 7.5z"
                    />
                  </svg>
                  <span className="text-xs text-zinc-400">
                    store.chichi.co/sarah
                  </span>
                </div>
              </div>

              {/* Store body */}
              <div className="p-5 bg-white">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-400 to-purple-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Sarah&apos;s Digital Shop
                    </p>
                    <p className="text-xs text-zinc-400">
                      Design resources &amp; templates
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <div
                      key={product.name}
                      className="rounded-xl overflow-hidden border border-zinc-100"
                    >
                      <div className={`h-20 bg-linear-to-br ${product.gradient}`} />
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-zinc-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-zinc-400 mb-2">{product.cat}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-900">
                            {product.price}
                          </span>
                          <span className="text-xs font-medium bg-violet-600 text-white px-2 py-0.5 rounded-md">
                            Buy
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 flex gap-6">
                  {[
                    ["$12,430", "Total earnings"],
                    ["847", "Total sales"],
                    ["4.9★", "Avg rating"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <p className="text-sm font-bold text-zinc-900">{value}</p>
                      <p className="text-xs text-zinc-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative accents */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-violet-100 rounded-2xl -z-10" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-violet-50 rounded-xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
