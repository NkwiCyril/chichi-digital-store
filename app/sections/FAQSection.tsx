'use client';

import { useState } from "react";

const faqs = [
  {
    q: "How does Chichi handle digital file delivery?",
    a: "Chichi automatically delivers your digital files to customers immediately after purchase. Files are stored securely on our CDN and customers receive a personalised download link via email — no manual steps needed.",
  },
  {
    q: "How much does Chichi cost?",
    a: "There are no subscriptions or monthly fees. Listing products is free — Chichi simply takes a flat 10% commission on each sale of your digital products. You keep 90% of every sale.",
  },
  {
    q: "Can I use my own custom store URL?",
    a: "Yes! Every creator gets a custom store URL (store.chichi.co/your-store) during onboarding, and you can update it any time from your dashboard.",
  },
  {
    q: "What types of digital products can I sell?",
    a: "Any digital product — ebooks, PDFs, software, music, videos, design assets, courses, Notion templates, Figma files, and more. There are no file-type restrictions.",
  },
  {
    q: "How and when do I get paid?",
    a: "Buyers pay with MTN Mobile Money or Orange Money. Your earnings — minus the 10% commission — are paid out to the Mobile Money number you set during creator onboarding.",
  },
  {
    q: "Can I offer discount codes and run sales?",
    a: "Yes! You can create percentage or fixed-amount discount codes, schedule limited-time flash sales, and bundle products together — at no extra cost.",
  },
] as const;

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-zinc-600">
            Everything you need to know about Chichi.
          </p>
        </div>

        <div className="divide-y divide-zinc-100">
          {faqs.map((faq, index) => (
            <div key={faq.q} className="py-6">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-start justify-between text-left gap-4"
              >
                <span className="text-base font-medium text-zinc-900">
                  {faq.q}
                </span>
                <svg
                  className={`w-5 h-5 shrink-0 text-zinc-400 transition-transform duration-200 mt-0.5 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M5 8l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500">
            Still have questions?{" "}
            <a href="#" className="text-violet-600 font-medium hover:underline">
              Chat with us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
