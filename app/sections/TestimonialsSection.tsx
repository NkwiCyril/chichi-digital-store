const testimonials = [
  {
    initials: "AN",
    name: "Amara Njike",
    role: "Graphic Designer, Douala",
    gradient: "from-violet-400 to-purple-600",
    quote:
      "Since I started using Chichi, I've been selling my design kits across Cameroon. The storefront is beautiful and MTN MoMo payments make it so easy for my clients.",
  },
  {
    initials: "BF",
    name: "Bertrand Fomba",
    role: "Indie Developer, Yaoundé",
    gradient: "from-blue-400 to-indigo-600",
    quote:
      "The Pro plan pays for itself after just two sales. I sell web templates and automated delivery works perfectly. Orange Money has made local payments seamless.",
  },
  {
    initials: "CN",
    name: "Célestine Ngo Biyong",
    role: "Online Educator, Bafoussam",
    gradient: "from-rose-400 to-pink-600",
    quote:
      "My revenue tripled since I started selling courses on Chichi. The analytics dashboard showed me exactly which products convert best in Cameroon.",
  },
] as const;

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 16 16">
          <path d="M8 1l1.854 3.756L14 5.633l-3 2.921.708 4.129L8 10.573l-3.708 2.11L5 8.554 2 5.633l4.146-.877L8 1z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Loved by Cameroonian creators
          </h2>
          <p className="text-lg text-zinc-500">Don't just take our word for it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100 flex flex-col gap-5"
            >
              <Stars />
              <p className="text-sm text-zinc-600 leading-relaxed flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full bg-linear-to-br ${testimonial.gradient} flex items-center justify-center shrink-0`}
                >
                  <span className="text-xs font-bold text-white">
                    {testimonial.initials}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-zinc-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
