import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

const COMMISSION_RATE = 10; // percent per sale

const included = [
  "Unlimited products & storefronts",
  "Instant automated file delivery",
  "MTN MoMo & Orange Money payouts",
  "Real-time sales analytics",
  "Custom storefront & store URL",
  "No monthly fees, ever",
];

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-violet-200" fill="none" viewBox="0 0 16 16">
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
  const keepRate = 100 - COMMISSION_RATE;
  const example = 20000;
  const earn = Math.round((example * keepRate) / 100);

  return (
    <section id="pricing" className="py-24 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            No subscriptions
          </span>
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Free to start. We only earn when you do.
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Forget monthly plans. {BRAND_NAME} takes a flat commission on each sale of your
            digital products — that&apos;s it. List for free and keep the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-stretch">
          {/* Commission card */}
          <div className="relative rounded-2xl bg-violet-600 p-8 text-white shadow-2xl shadow-violet-200 flex flex-col">
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <span className="rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                For creators
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold tracking-tight">{COMMISSION_RATE}%</span>
              <span className="mb-2 text-sm text-violet-200">per sale</span>
            </div>
            <p className="mt-2 text-sm text-violet-100">
              No setup fees. No monthly fees. You keep{" "}
              <strong className="text-white">{keepRate}%</strong> of every sale.
            </p>

            <ul className="mt-8 space-y-3">
              {included.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-sm text-violet-100">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register?role=creator"
              className="mt-8 block w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50"
            >
              Start selling free
            </Link>
          </div>

          {/* Example + buyer note */}
          <div className="flex flex-col gap-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-900">How a sale breaks down</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Example: a product priced at XAF {example.toLocaleString()}.
              </p>
              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-zinc-500">Sale price</dt>
                  <dd className="text-sm font-semibold text-zinc-900">XAF {example.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-zinc-500">{BRAND_NAME} commission ({COMMISSION_RATE}%)</dt>
                  <dd className="text-sm font-semibold text-rose-600">
                    − XAF {(example - earn).toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                  <dt className="text-sm font-semibold text-zinc-900">You receive</dt>
                  <dd className="text-lg font-bold text-emerald-600">XAF {earn.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-900">Buying is always free</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Members pay only for the products they buy — no account or membership fees.
                Pay securely with MTN MoMo or Orange Money.
              </p>
              <Link
                href="/register?role=buyer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700"
              >
                Browse the marketplace
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
