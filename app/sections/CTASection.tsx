export default function CTASection() {
  return (
    <section className="py-24 bg-violet-600 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-500 opacity-50 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-violet-700 opacity-50 blur-3xl" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Ready to start selling?
        </h2>
        <p className="text-xl text-violet-200 mb-10">
          Join 50,000+ creators who earn with Chichi. Free to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center bg-white text-violet-700 font-semibold px-8 py-4 rounded-xl hover:bg-violet-50 transition-colors text-sm"
          >
            Start for free
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center border-2 border-violet-400 text-white font-semibold px-8 py-4 rounded-xl hover:bg-violet-500 transition-colors text-sm"
          >
            Talk to sales
          </a>
        </div>
        <p className="mt-8 text-sm text-violet-300">No credit card required</p>
      </div>
    </section>
  );
}
