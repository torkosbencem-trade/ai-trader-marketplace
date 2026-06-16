"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type BillingCycle = "Monthly" | "Annual";

type Plan = {
  id: string;
  name: string;
  audience: string;
  description: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  platformFee: string;
  revenueShare: string;
  highlighted: boolean;
  cta: string;
  href: string;
  features: string[];
};

const plans: Plan[] = [
  {
    id: "investor",
    name: "Investor",
    audience: "For capital allocators",
    description:
      "Access verified strategies, monitor allocations and manage risk from a client-facing portfolio dashboard.",
    priceMonthly: 49,
    priceAnnual: 39,
    platformFee: "0.5% allocation fee",
    revenueShare: "No creator revenue share",
    highlighted: false,
    cta: "Explore marketplace",
    href: "/marketplace",
    features: [
      "Strategy marketplace access",
      "Portfolio risk monitor",
      "Performance reports",
      "Paper allocation workflow",
      "Basic execution readiness",
    ],
  },
  {
    id: "creator",
    name: "Strategy Creator",
    audience: "For traders and quant teams",
    description:
      "Upload, validate and submit systematic strategies for marketplace review and investor allocation.",
    priceMonthly: 149,
    priceAnnual: 119,
    platformFee: "Listing included",
    revenueShare: "15% platform share",
    highlighted: true,
    cta: "Upload strategy",
    href: "/strategy-builder",
    features: [
      "Strategy Builder access",
      "Backtest upload workflow",
      "Risk validation preview",
      "Admin review pipeline",
      "Marketplace publication workflow",
    ],
  },
  {
    id: "institution",
    name: "Institution",
    audience: "For funds, brokers and enterprises",
    description:
      "Operate a governed strategy marketplace with admin review, execution controls and custom compliance workflows.",
    priceMonthly: null,
    priceAnnual: null,
    platformFee: "Custom platform fee",
    revenueShare: "Negotiated",
    highlighted: false,
    cta: "Contact sales",
    href: "/admin",
    features: [
      "Admin Review Dashboard",
      "Custom approval workflow",
      "Broker integration planning",
      "Role-based access model",
      "Dedicated compliance controls",
    ],
  },
];

const revenueItems = [
  {
    title: "Subscription revenue",
    value: "$49 - $149/mo",
    detail:
      "Recurring SaaS revenue from investors and strategy creators using the marketplace infrastructure.",
  },
  {
    title: "Allocation fee",
    value: "0.5% - 1.5%",
    detail:
      "Platform fee on deployed capital, configurable by account type, volume and jurisdiction.",
  },
  {
    title: "Creator revenue share",
    value: "10% - 25%",
    detail:
      "Revenue share from paid strategy listings, performance subscriptions or signal licensing.",
  },
  {
    title: "Enterprise licensing",
    value: "Custom",
    detail:
      "White-label or institutional platform licensing for funds, brokers and private marketplaces.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("Monthly");
  const [selectedPlanId, setSelectedPlanId] = useState("creator");

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.id === selectedPlanId) ?? plans[1];
  }, [selectedPlanId]);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Pricing and revenue model
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Monetize the AI trading marketplace with clear subscription tiers.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Define how investors, strategy creators and institutions pay for
                access, validation, marketplace distribution and execution
                infrastructure.
              </p>

              <div className="mt-8 flex w-fit rounded-2xl border border-white/10 bg-black/20 p-1">
                {(["Monthly", "Annual"] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      billingCycle === cycle
                        ? "bg-emerald-400 text-black"
                        : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-sm text-emerald-300">
                Annual billing shows the effective monthly price with a demo
                discount applied.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <p className="text-sm text-zinc-500">Selected plan</p>
              <h2 className="mt-2 text-3xl font-semibold">
                {selectedPlan.name}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {selectedPlan.audience}
              </p>

              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-sm text-emerald-300">Estimated price</p>
                <p className="mt-2 text-4xl font-semibold text-white">
                  {formatPlanPrice(selectedPlan, billingCycle)}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Pricing is demo data and should be refined before production launch.
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <Row label="Platform fee" value={selectedPlan.platformFee} />
                <Row label="Revenue share" value={selectedPlan.revenueShare} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`flex min-h-[620px] flex-col rounded-3xl border p-6 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.06] ${
                selectedPlanId === plan.id
                  ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                  : plan.highlighted
                    ? "border-emerald-400/25 bg-white/[0.04]"
                    : "border-white/10 bg-white/[0.035]"
              }`}
            >
              {plan.highlighted ? (
                <div className="mb-5 w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  Recommended
                </div>
              ) : (
                <div className="mb-5 w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                  {plan.audience}
                </div>
              )}

              <h2 className="text-2xl font-semibold text-white">{plan.name}</h2>

              <p className="mt-3 min-h-[72px] text-sm leading-6 text-zinc-500">
                {plan.description}
              </p>

              <div className="mt-6">
                <p className="text-4xl font-semibold text-white">
                  {formatPlanPrice(plan, billingCycle)}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {plan.priceMonthly === null
                    ? "Custom commercial terms"
                    : billingCycle === "Monthly"
                      ? "per month"
                      : "effective monthly price, billed annually"}
                </p>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                <Row label="Platform fee" value={plan.platformFee} />
                <Row label="Revenue share" value={plan.revenueShare} />
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-xs text-emerald-300">
                      ✓
                    </div>
                    <p className="text-sm leading-5 text-zinc-400">{feature}</p>
                  </div>
                ))}
              </div>

              <Link
                href={plan.href}
                className={`mt-auto block rounded-2xl px-5 py-4 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-emerald-400 text-black hover:bg-emerald-300"
                    : "border border-white/10 text-white hover:bg-white/[0.06]"
                }`}
              >
                {plan.cta}
              </Link>
            </button>
          ))}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Business model</p>
          <h3 className="mt-1 text-2xl font-semibold">Revenue architecture</h3>

          <div className="mt-6 space-y-4">
            {revenueItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    {item.value}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm font-medium text-amber-300">
              Production note
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-400">
              A real trading marketplace should separate software subscription
              revenue from regulated investment, advisory, brokerage or
              performance-fee activity. Legal structure depends on jurisdiction.
            </p>
          </div>

          <Link
            href="/admin"
            className="mt-6 block rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/20 hover:text-emerald-200"
          >
            Open admin governance
          </Link>
        </aside>
      </section>
    </main>
  );
}

function formatPlanPrice(plan: Plan, billingCycle: BillingCycle) {
  if (plan.priceMonthly === null || plan.priceAnnual === null) {
    return "Custom";
  }

  const price =
    billingCycle === "Monthly" ? plan.priceMonthly : plan.priceAnnual;

  return `$${price}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}