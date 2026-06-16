"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReadinessStats = {
  submissions: number;
  approvedSubmissions: number;
  allocationRequests: number;
  approvedAllocations: number;
  deployments: number;
  auditEvents: number;
  storageProvider: string;
  migrationReady: boolean;
};

const readinessGroups = [
  {
    title: "Core platform workflow",
    description: "The main marketplace and allocation lifecycle.",
    items: [
      {
        label: "Strategy Builder",
        status: "ready",
        detail: "CSV/JSON strategy evidence upload and parser are working.",
      },
      {
        label: "Admin Review",
        status: "ready",
        detail: "Submitted strategies can be approved or rejected.",
      },
      {
        label: "Marketplace",
        status: "ready",
        detail: "Approved strategies appear in the marketplace and report pages.",
      },
      {
        label: "Allocation Requests",
        status: "ready",
        detail: "Investors can request allocation access.",
      },
      {
        label: "Execution Preparation",
        status: "ready",
        detail: "Approved allocation requests can become deployment packages.",
      },
      {
        label: "Portfolio Allocation",
        status: "ready",
        detail: "Prepared deployments appear in the portfolio view.",
      },
    ],
  },
  {
    title: "Production infrastructure",
    description: "Required foundation before real users or online production.",
    items: [
      {
        label: "Repository Layer",
        status: "ready",
        detail: "Storage abstraction exists and is database-migration ready.",
      },
      {
        label: "Database",
        status: "pending",
        detail: "Currently still using local JSON file-store. Needs PostgreSQL/Supabase/Neon.",
      },
      {
        label: "Authentication",
        status: "pending",
        detail: "Demo login exists, but production requires secure server-side auth.",
      },
      {
        label: "Role Authorization",
        status: "partial",
        detail: "Role concept exists, but middleware was disabled for stability.",
      },
      {
        label: "Deployment Hosting",
        status: "pending",
        detail: "Needs Vercel or equivalent production environment.",
      },
      {
        label: "Monitoring",
        status: "pending",
        detail: "Needs error tracking, uptime monitoring and structured logs.",
      },
    ],
  },
  {
    title: "Trading operations",
    description: "Required before real broker connection or capital handling.",
    items: [
      {
        label: "Paper Execution",
        status: "partial",
        detail: "Deployment preparation exists, but paper broker connection is not live yet.",
      },
      {
        label: "Live Broker Execution",
        status: "blocked",
        detail: "No live broker API should be connected before security and compliance.",
      },
      {
        label: "Risk Engine",
        status: "partial",
        detail: "Basic guardrail fields exist. Needs real-time enforcement.",
      },
      {
        label: "Audit Trail",
        status: "ready",
        detail: "Workflow actions are written to audit log.",
      },
      {
        label: "Compliance Layer",
        status: "blocked",
        detail: "Disclaimers, suitability, terms and legal review are required.",
      },
      {
        label: "Capital Handling",
        status: "blocked",
        detail: "The platform must not handle real money in current MVP state.",
      },
    ],
  },
  {
    title: "Mobile readiness",
    description: "Prerequisites before building the phone app.",
    items: [
      {
        label: "Shared API Layer",
        status: "partial",
        detail: "Core APIs exist and can later serve a mobile app.",
      },
      {
        label: "Stable Auth",
        status: "pending",
        detail: "Mobile app should start after production auth is implemented.",
      },
      {
        label: "Database Backend",
        status: "pending",
        detail: "Mobile app should not be built on local file-store.",
      },
      {
        label: "Investor Mobile Flow",
        status: "planned",
        detail: "Marketplace, strategy reports, allocation request and portfolio view.",
      },
      {
        label: "Push Notifications",
        status: "planned",
        detail: "Useful later for approvals, deployment and risk events.",
      },
      {
        label: "App Store Readiness",
        status: "planned",
        detail: "Requires compliance, privacy policy and production backend.",
      },
    ],
  },
];

const launchPhases = [
  {
    phase: "Phase 1",
    title: "Polished online demo",
    timeline: "Next",
    status: "closest",
    description:
      "Deploy a controlled demo online with file-store or temporary database, clear warnings and no real trading.",
  },
  {
    phase: "Phase 2",
    title: "Closed MVP",
    timeline: "After database + auth",
    status: "planned",
    description:
      "Use real users in a controlled test environment with PostgreSQL, auth, roles and audit history.",
  },
  {
    phase: "Phase 3",
    title: "Mobile MVP",
    timeline: "After stable backend",
    status: "planned",
    description:
      "Build investor-focused React Native / Expo app using the same backend APIs.",
  },
  {
    phase: "Phase 4",
    title: "Trading production",
    timeline: "Later",
    status: "blocked",
    description:
      "Requires broker integration, legal review, security hardening, compliance and operational monitoring.",
  },
];

export default function ProductionReadinessPage() {
  const [stats, setStats] = useState<ReadinessStats>({
    submissions: 0,
    approvedSubmissions: 0,
    allocationRequests: 0,
    approvedAllocations: 0,
    deployments: 0,
    auditEvents: 0,
    storageProvider: "file-store",
    migrationReady: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReadinessStats() {
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
        approvedSubmissions: submissions.filter(
          (item: { status: string }) => item.status === "Approved"
        ).length,
        allocationRequests: allocationRequests.length,
        approvedAllocations: allocationRequests.filter(
          (item: { status: string }) => item.status === "Approved"
        ).length,
        deployments: deployments.length,
        auditEvents: auditEvents.length,
        storageProvider:
          storagePayload.data?.activeStorageProvider ??
          storagePayload.data?.configuredStorageProvider ??
          "file-store",
        migrationReady: Boolean(storagePayload.data?.migrationReady),
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load production readiness data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReadinessStats();
  }, []);

  const readinessScore = useMemo(() => {
    let score = 35;

    if (stats.submissions > 0) score += 8;
    if (stats.approvedSubmissions > 0) score += 8;
    if (stats.allocationRequests > 0) score += 8;
    if (stats.approvedAllocations > 0) score += 8;
    if (stats.deployments > 0) score += 8;
    if (stats.auditEvents > 0) score += 5;
    if (stats.migrationReady) score += 10;

    return Math.min(score, 90);
  }, [stats]);

  const readyItems = readinessGroups
    .flatMap((group) => group.items)
    .filter((item) => item.status === "ready").length;

  const partialItems = readinessGroups
    .flatMap((group) => group.items)
    .filter((item) => item.status === "partial").length;

  const pendingItems = readinessGroups
    .flatMap((group) => group.items)
    .filter((item) => item.status === "pending").length;

  const blockedItems = readinessGroups
    .flatMap((group) => group.items)
    .filter((item) => item.status === "blocked").length;

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Production Readiness
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                What is ready, what is demo-only, and what blocks production.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                This page gives a realistic readiness view for the AI Trader
                Marketplace MVP. The workflow is working, but real production
                trading still requires database, auth, compliance, security and
                broker hardening.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Open demo center
                </Link>

                <Link
                  href="/system/storage"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Storage readiness
                </Link>

                <button
                  onClick={loadReadinessStats}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-sm text-zinc-500">Demo readiness</p>
                  <p className="mt-2 text-5xl font-semibold">
                    {loading ? "..." : `${readinessScore}%`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-500">Production trading</p>
                  <p className="mt-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                    Not ready
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-zinc-500">
                This score describes demo maturity, not permission to trade live.
                Live trading is blocked until production controls are complete.
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
          <Metric label="Ready" value={String(readyItems)} tone="green" />
          <Metric label="Partial" value={String(partialItems)} tone="blue" />
          <Metric label="Pending" value={String(pendingItems)} tone="amber" />
          <Metric label="Blocked" value={String(blockedItems)} tone="red" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric label="Submissions" value={String(stats.submissions)} />
          <Metric
            label="Approved strategies"
            value={String(stats.approvedSubmissions)}
          />
          <Metric label="Deployments" value={String(stats.deployments)} />
          <Metric label="Audit events" value={String(stats.auditEvents)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_410px]">
          <div className="space-y-6">
            {readinessGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
              >
                <p className="text-sm text-zinc-500">{group.description}</p>
                <h2 className="mt-1 text-2xl font-semibold">{group.title}</h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {group.items.map((item) => (
                    <div
                      key={`${group.title}-${item.label}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-500">
                            {item.detail}
                          </p>
                        </div>

                        <span className={statusClass(item.status)}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
            <p className="text-sm text-zinc-500">Launch plan</p>
            <h3 className="mt-1 text-2xl font-semibold">Recommended phases</h3>

            <div className="mt-6 space-y-4">
              {launchPhases.map((phase) => (
                <div
                  key={phase.phase}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">{phase.phase}</p>
                      <p className="mt-1 font-semibold text-white">
                        {phase.title}
                      </p>
                    </div>

                    <span className={phaseClass(phase.status)}>
                      {phase.timeline}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-zinc-500">
                    {phase.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
              <p className="text-sm font-medium text-emerald-300">
                Best next step
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Prepare the app for online deployment, then connect Supabase
                PostgreSQL and production authentication.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
              <p className="text-sm font-medium text-red-300">
                Current production blocker
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                The app must not handle live capital or execute real trades
                until legal, compliance, security and broker controls are
                implemented.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                href="/demo"
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-semibold text-white">Demo Center</p>
                <p className="mt-2 font-mono text-xs text-emerald-300">
                  /demo
                </p>
              </Link>

              <Link
                href="/system/storage"
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-semibold text-white">
                  Storage Readiness
                </p>
                <p className="mt-2 font-mono text-xs text-emerald-300">
                  /system/storage
                </p>
              </Link>

              <Link
                href="/system/audit"
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-semibold text-white">Audit Log</p>
                <p className="mt-2 font-mono text-xs text-emerald-300">
                  /system/audit
                </p>
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-300"
      : tone === "blue"
      ? "text-blue-300"
      : tone === "amber"
      ? "text-amber-300"
      : tone === "red"
      ? "text-red-300"
      : "text-white";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-3 truncate text-3xl font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "ready") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300";
  }

  if (status === "partial") {
    return "rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300";
  }

  if (status === "pending") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300";
  }

  return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300";
}

function phaseClass(status: string) {
  if (status === "closest") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300";
  }

  if (status === "planned") {
    return "rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300";
  }

  return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300";
}