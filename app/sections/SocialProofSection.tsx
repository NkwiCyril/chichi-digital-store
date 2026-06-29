const brands = ["Invollv", "Cyrix Tech", "Mukstule Studio", "G2G Entertainment"] as const;

export default function SocialProofSection() {
  return (
    <section className="py-14 border-y border-zinc-100 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-zinc-400 uppercase tracking-widest font-medium mb-8">
          Trusted by creators at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-xl font-bold text-zinc-200 hover:text-zinc-300 transition-colors cursor-default select-none"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
