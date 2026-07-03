import { BRAND_NAME } from "@/lib/brand";

const posts = [
  {
    tag: "Guide",
    tagColor: "text-violet-600 bg-violet-50",
    title: `How to sell your designs in Cameroon with ${BRAND_NAME}`,
    excerpt:
      "A complete guide for Cameroonian creators: from setting up your storefront to receiving your first payment via MTN MoMo or Orange Money.",
    author: `${BRAND_NAME} Team`,
    date: "June 20, 2025",
    readTime: "5 min",
    gradient: "from-violet-400 to-purple-600",
  },
  {
    tag: "News",
    tagColor: "text-emerald-600 bg-emerald-50",
    title: "MTN MoMo & Orange Money: Local payments from day one",
    excerpt:
      `${BRAND_NAME} is the first digital product sales platform to natively accept Cameroon's two major Mobile Money providers from launch.`,
    author: `${BRAND_NAME} Team`,
    date: "June 15, 2025",
    readTime: "3 min",
    gradient: "from-emerald-400 to-teal-600",
  },
  {
    tag: "Inspiration",
    tagColor: "text-amber-600 bg-amber-50",
    title: "Top 5 digital products Cameroonian creators sell the most",
    excerpt:
      "Design courses, Canva templates, business e-books, photo presets — discover what's trending in Cameroon's digital market.",
    author: "Amara Njike",
    date: "June 8, 2025",
    readTime: "4 min",
    gradient: "from-amber-400 to-orange-500",
  },
];

export default function BlogSection() {
  return (
    <section id="blog" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-3">
              Resources &amp; News
            </h2>
            <p className="text-lg text-zinc-500">
              Tips, guides, and news for Cameroonian creators.
            </p>
          </div>
          <a
            href="#"
            className="shrink-0 text-sm font-semibold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1.5"
          >
            View all articles
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <a
              key={post.title}
              href="#"
              className="group flex flex-col rounded-2xl border border-zinc-100 bg-white overflow-hidden hover:shadow-lg hover:shadow-zinc-100/80 transition-shadow"
            >
              <div className={`h-40 bg-linear-to-br ${post.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10" />
              </div>
              <div className="flex flex-col flex-1 p-6 gap-3">
                <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${post.tagColor}`}>
                  {post.tag}
                </span>
                <h3 className="text-base font-bold text-zinc-900 leading-snug group-hover:text-violet-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <span className="text-xs text-zinc-400">{post.author}</span>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
