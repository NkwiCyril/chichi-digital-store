const steps = [
  {
    number: "01",
    title: "Create your storefront",
    description:
      "Set up your store in minutes with our drag-and-drop builder. Add branding, a bio, and your custom domain.",
  },
  {
    number: "02",
    title: "Upload your products",
    description:
      "Add digital files, set your prices, write descriptions, and configure instant delivery — all in one place.",
  },
  {
    number: "03",
    title: "Start earning",
    description:
      "Share your store link anywhere. We handle payments, file delivery, and receipts automatically.",
  },
] as const;

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-zinc-500">
            No coding required. No complex setup. Just create and sell.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex flex-col items-start">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-violet-200 flex items-center justify-center mb-5 shadow-sm">
                  <span className="text-lg font-bold text-violet-600">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
