"use client";

import { useState } from "react";

import {
  Card,
  CardHeader,
  PageHero,
  PremiumPageShell,
  PrimaryLink,
  SafetyNotice,
  SecondaryLink,
  StatusPill,
  type Tone,
} from "@/components/ui/PremiumUI";

type BillingMode = "monthly" | "yearly";

type Plan = {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  badge: string;
  badgeTone: Tone;
  highlighted?: boolean;
  features: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    name: "Observer",
    description:
      "For users who want to review marketplace strategies and monitor basic signal flow.",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    badge: "Free",
    badgeTone: "neutral",
    features: [
      "Marketplace strategy discovery",
      "Basic signal visibility",
      "Performance overview",
      "Dry-run safety context",
      "No real order access",
    ],
    cta: "Current Access",
  },
  {
    name: "Pro Validator",
    description:
      "For active users who want structured validation with Test Runs and Shadow Live monitoring.",
    monthlyPrice: "$29",
    yearlyPrice: "$290",
    badge: "Recommended",
    badgeTone: "success",
    highlighted: true,
    features: [
      "Full marketplace signal review",
      "Strategy validation workflow",
      "Test Runs Center access",
      "Shadow Live monitoring",
      "Performance intelligence",
      "Premium cockpit UI",
      "No real order access",
    ],
    cta: "Choose Pro",
  },
  {
    name: "Operator",
    description:
      "For advanced users preparing for future testnet and execution governance workflows.",
    monthlyPrice: "$79",
    yearlyPrice: "$790",
    badge: "Advanced",
    badgeTone: "warning",
    features: [
      "Everything in Pro Validator",
      "Execution Center dry-run testing",
      "Advanced safety configuration",
      "Risk governance workflow",
      "Priority validation cockpit",
      "Future testnet-ready structure",
      "No real order access",
    ],
    cta: "Choose Operator",
  },
];

function FeatureItem({ children }: { children: string }) {
  return (
    <li className="flex gap-3 text-sm leading-6 text-slate-300">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
      <span>{children}</span>
    </li>
  );
}

function BillingToggle({
  billing,
  setBilling,
}: {
  billing: BillingMode;
  setBilling: (value: BillingMode) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-white/10 bg-black/25 p-1">
      <button
        type="button"
        onClick={() => setBilling("monthly")}
        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
          billing === "monthly"
            ? "bg-white text-slate-950"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Monthly
      </button>

      <button
        type="button"
        onClick={() => setBilling("yearly")}
        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
          billing === "yearly"
            ? "bg-white text-slate-950"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Yearly
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  billing,
}: {
  plan: Plan;
  billing: BillingMode;
}) {
  const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const period = billing === "monthly" ? "/mo" : "/yr";

  return (
    <Card
      className={`relative overflow-hidden p-6 ${
        plan.highlighted
          ? "border-sky-400/40 bg-sky-400/[0.075] shadow-sky-950/40"
          : ""
      }`}
    >
      {plan.highlighted && (
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-400/20 via-violet-400/10 to-transparent" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {plan.name}
            </h3>

            <p className="mt-3 min-h-20 text-sm leading-6 text-slate-400">
              {plan.description}
            </p>
          </div>

          <StatusPill label={plan.badge} tone={plan.badgeTone} />
        </div>

        <div className="mt-7 flex items-end gap-2">
          <p className="text-5xl font-black tracking-tight text-white">
            {price}
          </p>

          <p className="pb-2 text-sm font-semibold text-slate-500">{period}</p>
        </div>

        {billing === "yearly" && plan.monthlyPrice !== "$0" && (
          <p className="mt-2 text-sm text-emerald-300">
            Yearly billing includes roughly two months free.
          </p>
        )}

        <div className="mt-7">
          <button
            type="button"
            className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-sm font-bold transition ${
              plan.highlighted
                ? "bg-white text-slate-950 hover:bg-slate-200"
                : "border border-white/10 bg-white/[0.06] text-white hover:border-sky-400/40 hover:bg-sky-400/10"
            }`}
          >
            {plan.cta}
          </button>
        </div>

        <ul className="mt-7 space-y-3">
          {plan.features.map((feature) => (
            <FeatureItem key={feature}>{feature}</FeatureItem>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function WorkflowStep({
  label,
  title,
  description,
  tone,
}: {
  label: string;
  title: string;
  description: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <StatusPill label={label} tone={tone} />

      <p className="mt-4 font-semibold text-white">{title}</p>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="font-semibold text-white">{question}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
    </div>
  );
}

export default function SubscriptionPage() {
  const [billing, setBilling] = useState<BillingMode>("monthly");

  return (
    <PremiumPageShell>
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PageHero
          pills={[
            { label: "Premium Access", tone: "info" },
            { label: "Safety First", tone: "success" },
            { label: "No Real Orders", tone: "neutral" },
          ]}
          title="Choose your validation layer."
          description="Upgrade the AI Trader Marketplace workflow with stronger strategy validation, Shadow Live monitoring and protected dry-run execution tooling. Premium access improves the validation cockpit — it does not unlock real trading."
          actions={
            <>
              <PrimaryLink href="/dashboard">Open Dashboard</PrimaryLink>

              <SecondaryLink href="/signals" tone="info">
                View Signals
              </SecondaryLink>

              <SecondaryLink href="/test-runs" tone="success">
                Start Validation
              </SecondaryLink>
            </>
          }
        />

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Billing"
            title="Access Mode"
            description="Switch between monthly and yearly pricing preview. Stripe or real billing can be connected later."
            action={<StatusPill label="Preview UI" tone="warning" />}
          />

          <div className="space-y-5 p-6">
            <BillingToggle billing={billing} setBilling={setBilling} />

            <SafetyNotice
              title="Billing is not connected yet"
              description="This page is currently a premium subscription UI layer. Payment processing, Stripe checkout and account entitlement enforcement can be added later."
              tone="warning"
            />
          </div>
        </Card>
      </div>

      <section className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} billing={billing} />
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Workflow"
            title="Premium Validation Workflow"
            description="Premium access should strengthen the validation process, not bypass safety."
            action={<StatusPill label="Validation First" tone="success" />}
          />

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <WorkflowStep
              label="Step 1"
              title="Marketplace discovery"
              description="Review strategies, risk profiles and signal behavior."
              tone="info"
            />

            <WorkflowStep
              label="Step 2"
              title="Test Run validation"
              description="Collect controlled validation data before promotion."
              tone="warning"
            />

            <WorkflowStep
              label="Step 3"
              title="Shadow Live monitoring"
              description="Observe simulated market behavior without order routing."
              tone="success"
            />

            <WorkflowStep
              label="Step 4"
              title="Dry-run execution"
              description="Submit protected dry-run payloads only after validation."
              tone="neutral"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Safety"
            title="What Premium Does Not Do"
            description="This project remains safety-first even with paid access."
            action={<StatusPill label="Important" tone="warning" />}
          />

          <div className="space-y-3 p-6">
            <SafetyNotice
              title="Premium does not enable real orders"
              description="Real exchange order routing should remain blocked until a separate testnet and safety review phase is completed."
              tone="success"
            />

            <SafetyNotice
              title="Signals are not execution commands"
              description="Marketplace signals should be treated as validation candidates and decision inputs, not automatic trade instructions."
              tone="info"
            />

            <SafetyNotice
              title="Execution Center remains dry-run only"
              description="The execution page is currently for protected payload testing and safety governance."
              tone="warning"
            />
          </div>
        </Card>
      </section>

      <section className="mt-10">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="FAQ"
            title="Subscription Questions"
            description="Current product assumptions for the marketplace pricing layer."
          />

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <FaqItem
              question="Does Pro send real trades?"
              answer="No. Pro improves validation workflow access, but does not enable real order routing."
            />

            <FaqItem
              question="When should a strategy be promoted?"
              answer="Only after enough Test Run and Shadow Live evidence has been collected."
            />

            <FaqItem
              question="Is Stripe connected?"
              answer="Not yet. This page is ready as a premium pricing interface, but checkout integration can be added later."
            />

            <FaqItem
              question="Can this support testnet later?"
              answer="Yes. The current dry-run and safety architecture is a good foundation for a future testnet phase."
            />
          </div>
        </Card>
      </section>
    </PremiumPageShell>
  );
}