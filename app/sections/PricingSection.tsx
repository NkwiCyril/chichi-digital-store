'use client';

import { useState } from "react";

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "Perfect for getting started",
    features: [
      "Up to 3 products",
      "5% platform fee",
      "Basic analytics",
      "Standard storefront",
      "Community support",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro",
    monthly: 15000,
    yearly: 12000,
    description: "For serious creators",
    features: [
      "Unlimited products",
      "0% platform fee",
      "Advanced analytics",
      "Custom domain",
      "Priority email support",
      "Custom storefront themes",
      "Automated email sequences",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Business",
    monthly: 45000,
    yearly: 36000,
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "API access",
      "White-label storefronts",
      "Priority phone support",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    highlight: false,
  },
] as const;

function CheckIcon({ highlight }: { highlight: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 ${highlight ? 'text-violet-200' : 'text-violet-600'}`}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3 8L6.5 11.5L13 4.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto mb-10">
            Start for free. Scale as you grow. No hidden fees, no surprises.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 bg-white border border-zinc-200 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !yearly ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                yearly ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Yearly
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                –20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-violet-600 ring-2 ring-violet-600 shadow-2xl shadow-violet-200 text-white'
                  : 'bg-white border border-zinc-200 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full border border-violet-200">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3
                  className={`text-base font-semibold mb-1 ${
                    plan.highlight ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-violet-200' : 'text-zinc-500'}`}>
                  {plan.description}
                </p>
                <div className="flex items-end gap-1">
                  <span
                    className={`text-5xl font-bold tracking-tight ${
                      plan.highlight ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {plan.monthly === 0 ? "Free" : `XAF ${(yearly ? plan.yearly : plan.monthly).toLocaleString()}`}
                  </span>
                  {plan.monthly > 0 && (
                    <span className={`text-sm mb-2 ${plan.highlight ? 'text-violet-200' : 'text-zinc-400'}`}>
                      /mo
                    </span>
                  )}
                </div>
                {yearly && plan.monthly > 0 && (
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-violet-300' : 'text-zinc-400'}`}>
                    Billed XAF {(plan.yearly * 12).toLocaleString()}/year
                  </p>
                )}
              </div>

              <a
                href="#"
                className={`block w-full text-center py-3 rounded-xl text-sm font-semibold mb-8 transition-colors ${
                  plan.highlight
                    ? 'bg-white text-violet-700 hover:bg-violet-50'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckIcon highlight={plan.highlight} />
                    <span className={`text-sm ${plan.highlight ? 'text-violet-100' : 'text-zinc-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
