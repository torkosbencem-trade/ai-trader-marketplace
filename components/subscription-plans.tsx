"use client";

import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Explore delayed signals and limited strategy previews.",
    badge: "Starter",
    highlighted: false,
    features: [
      "Delayed signal feed",
      "Limited strategy statistics",
      "Marketplace browsing",
      "Basic risk disclosure",
      "No webhook access",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    description: "Real-time signals, full analytics, and strategy tracking.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Real-time AI signals",
      "Full strategy performance",
      "Signal explanations",
      "Email / Telegram alerts",
      "Webhook alerts",
      "Subscribed strategy dashboard",
    ],
  },
  {
    name: "Premium",
    price: "$149",
    description: "Advanced analytics, API access, and future automation tools.",
    badge: "Advanced",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Multiple strategy bundles",
      "Advanced performance reports",
      "API access",
      "Priority alerts",
      "Auto-execution waitlist",
    ],
  },
];

export function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState("Pro");

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan.name;

        return (
          <div
            key={plan.name}
            className={`rounded-3xl border p-6 transition ${
              isSelected
                ? "border-cyan-400/60 bg-cyan-400/[0.08] shadow-2xl shadow-cyan-400/10"
                : "border-white/10 bg-white/[0.03] hover:border-cyan-400/30"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{plan.name}</div>
                <div className="mt-2 text-sm text-slate-400">
                  {plan.description}
                </div>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isSelected
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {isSelected ? "Selected" : plan.badge}
              </div>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold">{plan.price}</span>
              <span className="ml-2 text-slate-400">/mo</span>
            </div>

            <button
              onClick={() => setSelectedPlan(plan.name)}
              className={`mb-6 w-full rounded-xl px-4 py-3 text-sm font-bold ${
                isSelected
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
              }`}
            >
              {isSelected ? "Current Selection" : `Choose ${plan.name}`}
            </button>

            <div className="space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-cyan-300">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}