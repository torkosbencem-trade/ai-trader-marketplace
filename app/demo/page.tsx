"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DemoStats = {
  submissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  allocationRequests: number;
  approvedAllocationRequests: number;
  deployments: number;
  auditEvents: number;
  storageProvider: string;
};

const demoFlows = [
  {
    label: "Creator workflow",
    title: "Submit strategy evidence",
    description:
      "Upload CSV/JSON backtest evidence, parse metrics and submit the package for admin review.",
    href: "/strategy-builder",
    primaryAction: "Open Strategy Builder",
    steps: [
      "Upload CSV backtest",
      "Parse return series",
      "Save submission",
      "Send to Admin Review",
    ],
  },
  {
    label: "Admin workflow",
    title: "Review strategy submissions",
    description:
      "Approve or reject creator-submitted strategies before they become visible in the marketplace.",
    href: "/admin",
    primaryAction: "Open Admin Review",
    steps: [
      "Load pending submissions",
      "Inspect parsed metrics",
      "Approve marketplace listing",
      "Write audit event",
    ],
  },
  {
    label: "Marketplace workflow",
    title: "Publish approved strategies",
    description:
      "Approved creator strategies appear in the marketplace with parsed metrics and strategy reports.",
    href: "/marketplace",
    primaryAction: "Open Marketplace",
    steps: [
      "Browse strategies",
      "Open performance report",
      "Review parsed evidence",
      "Request allocation access",
    ],
  },
  {
    label: "Investor workflow",
    title: "Request allocation access",
    description:
      "Investors request access to a strategy before execution approval and deployment preparation.",
    href: "/allocation-requests",
    primaryAction: "Open Allocation Review",
    steps: [
      "Submit allocation request",
      "Review suitability intent",
      "Approve request",
      "Move to execution queue",
    ],
  },
  {
    label: "Execution workflow",
    title: "Prepare deployment package",
    description:
      "Approved allocation requests can be converted into controlled deployment packages.",
    href: "/execution",
    primaryAction: "Open Execution Center",
    steps: [
      "Select approved request",
      "Choose broker connector",
      "Set guardrails",
      "Save deployment",
    ],
  },
  {
    label: "Portfolio workflow",
    title: "Monitor deployment allocations",
    description:
      "Prepared deployment packages appear as portfolio allocations with risk mode controls.",
    href: "/portfolio",
    primaryAction: "Open Portfolio",
    steps: [
      "Load deployments",
      "Inspect allocation risk",
      "Change risk mode",
      "Write audit event",
    ],
  },
];

const systemLinks = [
  {
    label: "Demo Data Center",
    href: "/system/demo-data",
    description: "Seed or reset Supabase demo data before presentations.",
  },
  {
    label: "Audit Log",
    href: "/system/audit",
    description: "Operational event history for submissions, reviews and deployments.",
  },
  {
    label: "Storage Readiness",
    href: "/system/storage",
    description: "Repository layer status and database migration readiness.",
  },
  {
    label: "System Actions",
    href: "/system/actions",
    description: "Manual API action tester for workflow mutations.",
  },
  {
    label: "API Strategies",
    href: "/api/marketplace",
    description: "Marketplace API response with approved strategy data.",
  },
];

export default function DemoControlCenterPage() {
  const [stats, setStats] = useState<DemoStats>({
    submissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    allocationRequests: 0,
    approvedAllocationRequests: 0,
    deployments: 0,
    auditEvents: 0,
    storageProvider: "file-store",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");

    try {
      const [
        submissionsResponse,
        allocationResponse,
        deploymentsResponse,
        auditResponse,
        storageResponse,
      ] = await Promise.all([
        fetch("/api/strategy-submissions", { cache: "no-store" }),
        fetch("/api/allocation-requests", { cache: "no-store" }),
        fetch("/api/deployments", { cache: "no-store" }),
        fetch("/api/audit-log", { cache: "no-store" }),
        fetch("/api/system/storage", { cache: "no-store" }),
      ]);

      const [
        submissionsPayload,
        allocationPayload,
        deploymentsPayload,
        auditPayload,
        storagePayload,
      ] = await Promise.all([
        submissionsResponse.json(),
        allocationResponse.json(),
        deploymentsResponse.json(),
        auditResponse.json(),
        storageResponse.json(),
      ]);

      const submissions = submissionsPayload.data ?? [];
      const allocationRequests = allocationPayload.data ?? [];
      const deployments = deploymentsPayload.data ?? [];
      const auditEvents = auditPayload.data ?? [];

      setStats({
        submissions: submissions.length,
        pendingSubmissions: submissions.filter(
          (item: { status: string }) => item.status === "Pending"
        ).length,
        approvedSubmissions: submissions.filter(
          (item: { status: string }) => item.status === "Approved"
        ).length,
        allocationRequests: allocationRequests.length,
        approvedAllocationRequests: allocationRequests.filter(
          (item: { status: string }) => item.status === "Approved"
        ).length,
        deployments: deployments.length,
        auditEvents: auditEvents.length,
        storageProvider:
          storagePayload.data?.activeStorageProvider ??
          storagePayload.data?.configuredStorageProvider ??
          "file-store",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load demo stats."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const demoReadiness = useMemo(() => {
    let score = 45;

    if (stats.submissions > 0) score += 10;
    if (stats.approvedSubmissions > 0) score += 10;
    if (stats.allocationRequests > 0) score += 10;
    if (stats.approvedAllocationRequests > 0) score += 10;
    if (stats.deployments > 0) score += 10;
    if (stats.auditEvents > 0) score += 5;

    return Math.min(score, 100);
  }, [stats]);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Demo Control Center
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Present the full AI Trader Marketplace workflow.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Use this page as the command center for investor, partner or
                internal demos. It links the creator, admin, marketplace,
                investor, execution, portfolio and audit workflows.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/strategy-builder"
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Start creator flow
                </Link>

                <Link
                  href="/marketplace"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Open marketplace
                </Link>

                <button
                  onClick={loadStats}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  Refresh status
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Demo readiness</p>
                  <p className="mt-2 text-5xl font-semibold">
                    {loading ? "..." : `${demoReadiness}%`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-500">Storage</p>
                  <p className="mt-2 font-mono text-sm text-emerald-300">
                    {stats.storageProvider}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: `${demoReadiness}%` }}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-zinc-500">
                Readiness increases as the demo contains submissions, approvals,
                allocation requests, deployments and audit activity.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Submissions" value={String(stats.submissions)} />
          <StatCard
            label="Approved strategies"
            value={String(stats.approvedSubmissions)}
          />
          <StatCard
            label="Allocation requests"
            value={String(stats.allocationRequests)}
          />
          <StatCard label="Deployments" value={String(stats.deployments)} />
          <StatCard label="Audit events" value={String(stats.auditEvents)} />
          <StatCard
            label="Pending submissions"
            value={String(stats.pendingSubmissions)}
          />
          <StatCard
            label="Approved allocations"
            value={String(stats.approvedAllocationRequests)}
          />
          <StatCard label="Provider" value={stats.storageProvider} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_390px]">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-zinc-500">Demo walkthrough</p>
              <h2 className="mt-1 text-3xl font-semibold">
                Core platform flows
              </h2>
            </div>

            <div className="grid gap-4">
              {demoFlows.map((flow, index) => (
                <div
                  key={flow.label}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-bold text-emerald-300">
                          {index + 1}
                        </span>

                        <p className="text-sm text-zinc-500">{flow.label}</p>
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold text-white">
                        {flow.title}
                      </h3>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                        {flow.description}
                      </p>

                      <div className="mt-5 grid gap-3 md:grid-cols-4">
                        {flow.steps.map((step) => (
                          <div
                            key={step}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-400"
                          >
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      href={flow.href}
                      className="shrink-0 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                    >
                      {flow.primaryAction}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
            <p className="text-sm text-zinc-500">Recommended demo script</p>
            <h3 className="mt-1 text-2xl font-semibold">Presentation order</h3>

            <div className="mt-6 space-y-4">
              <TimelineItem
                step="01"
                title="Upload strategy"
                text="Submit CSV evidence through Strategy Builder."
              />
              <TimelineItem
                step="02"
                title="Approve strategy"
                text="Open Admin Review and approve the submission."
              />
              <TimelineItem
                step="03"
                title="Show marketplace"
                text="Refresh Marketplace and open the strategy report."
              />
              <TimelineItem
                step="04"
                title="Request allocation"
                text="Submit investor allocation access request."
              />
              <TimelineItem
                step="05"
                title="Approve allocation"
                text="Approve request from Allocation Review."
              />
              <TimelineItem
                step="06"
                title="Prepare execution"
                text="Create deployment package from approved request."
              />
              <TimelineItem
                step="07"
                title="Show portfolio"
                text="Open Portfolio and test risk mode controls."
              />
              <TimelineItem
                step="08"
                title="Show audit"
                text="Finish with the Audit Log and Storage Readiness."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
              <p className="text-sm font-medium text-amber-300">
                Demo boundary
              </p>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                This is an MVP prototype. It does not execute real trades,
                manage real money or connect to live broker accounts yet.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {systemLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
                >
                  <p className="text-sm font-semibold text-white">
                    {link.label}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {link.description}
                  </p>
                  <p className="mt-2 font-mono text-xs text-emerald-300">
                    {link.href}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-3 truncate text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TimelineItem({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-xs font-bold text-emerald-300">
        {step}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p>
      </div>
    </div>
  );
}