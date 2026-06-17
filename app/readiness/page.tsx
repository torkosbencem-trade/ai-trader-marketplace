"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../lib/supabase-browser";

type ReadinessStats = {
  submissions: number;
  approvedSubmissions: number;
  allocationRequests: number;
  approvedAllocations: number;
  deployments: number;
  auditEvents: number;
  storageProvider: string;
  databaseActive: boolean;
  riskMode: string;
};

type ReadinessStatus = "ready" | "partial" | "pending" | "blocked" | "planned";

type ReadinessItem = {
  label: string;
  status: ReadinessStatus;
  detail: string;
};

type ReadinessGroup = {
  title: string;
  description: string;
  items: ReadinessItem[];
};

async function getAccessToken() {
  if (!hasSupabaseBrowserConfig()) {
    return null;
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

const readinessGroups: ReadinessGroup[] = [
  {
    title: "Core platform workflow",
    description: "The main marketplace, review, allocation and portfolio lifecycle.",
    items: [
      {
        label: "Strategy Builder",
        status: "ready",
        detail: "CSV/JSON strategy evidence upload and parser are working.",
      },
      {
        label: "Admin Review",
        status: "ready",
        detail: "Submitted strategies can be approved or rejected by admin users.",
      },
      {
        label: "Marketplace",
        status: "ready",
        detail: "Approved strategies appear in marketplace and report pages.",
      },
      {
        label: "Allocation Requests",
        status: "ready",
        detail: "Investors can request allocation access from strategy reports.",
      },
      {
        label: "Execution Preparation",
        status: "ready",
        detail: "Approved allocation requests can become paper deployment packages.",
      },
      {
        label: "Portfolio Allocation",
        status: "ready",
        detail: "Prepared deployments appear in portfolio view.",
      },
    ],
  },
  {
    title: "Infrastructure and identity",
    description: "Persistence, authentication and role-aware access control.",
    items: [
      {
        label: "Repository Layer",
        status: "ready",
        detail: "Storage abstraction is active across submissions, allocations, deployments and audit events.",
      },
      {
        label: "Supabase Database",
        status: "ready",
        detail: "Database-backed persistence is available through the repository adapter.",
      },
      {
        label: "Supabase Auth",
        status: "ready",
        detail: "Real Supabase sign-in, sign-up and session handling are implemented.",
      },
      {
        label: "Profiles and Roles",
        status: "ready",
        detail: "Profiles support investor, creator and admin roles with ADMIN_EMAILS admin resolution.",
      },
      {
        label: "Server-side Admin Guard",
        status: "ready",
        detail: "Critical admin, risk and execution APIs require bearer-token admin authorization.",
      },
      {
        label: "Route Middleware",
        status: "pending",
        detail: "Middleware route protection remains disabled until the auth flow is stable enough for full route gating.",
      },
    ],
  },
  {
    title: "Risk and execution controls",
    description: "Suitability, firewall checks and paper-only execution protection.",
    items: [
      {
        label: "Risk Compatibility Engine",
        status: "ready",
        detail: "User risk profile and strategy risk are compared through a shared compatibility engine.",
      },
      {
        label: "Allocation Risk Firewall",
        status: "ready",
        detail: "Not-aligned allocation requests are blocked server-side.",
      },
      {
        label: "Execution Firewall",
        status: "ready",
        detail: "Execution package creation checks allocation approval, risk state, strategy approval and limits.",
      },
      {
        label: "Portfolio Risk Mode",
        status: "ready",
        detail: "Normal, Reduced and Paused modes are supported; Paused blocks deployments.",
      },
      {
        label: "Admin Risk Console",
        status: "ready",
        detail: "Admins can monitor and change portfolio risk mode from /admin/risk.",
      },
      {
        label: "Live Broker Execution",
        status: "blocked",
        detail: "Live execution is intentionally disabled. Only paper deployment packages are allowed.",
      },
    ],
  },
  {
    title: "Governance and hardening",
    description: "Operational controls required before real users or capital exposure.",
    items: [
      {
        label: "Audit Trail",
        status: "ready",
        detail: "Risk mode changes, deployment attempts and workflow events are written to the audit log.",
      },
      {
        label: "Protected Approval APIs",
        status: "ready",
        detail: "Strategy review and allocation review mutation endpoints are admin-only.",
      },
      {
        label: "Protected Admin Reads",
        status: "ready",
        detail: "Admin submission and allocation queues require admin authorization.",
      },
      {
        label: "Dedicated Portfolio Settings Table",
        status: "pending",
        detail: "Portfolio risk mode is currently derived from audit history; a dedicated settings table should replace this later.",
      },
      {
        label: "Monitoring",
        status: "pending",
        detail: "Production needs uptime checks, structured logs and error tracking.",
      },
      {
        label: "Legal and Compliance Review",
        status: "blocked",
        detail: "Disclaimers, suitability language, terms, privacy policy and legal review are required before real trading.",
      },
    ],
  },
];

const launchPhases = [
  {
    phase: "Phase 1",
    title: "Controlled online demo",
    timeline: "Current target",
    status: "closest",
    description:
      "A polished, database-backed, paper-only platform demo with auth, admin guards, risk controls and audit trail.",
  },
  {
    phase: "Phase 2",
    title: "Closed beta MVP",
    timeline: "After route protection + monitoring",
    status: "planned",
    description:
      "Invite controlled users with role-based access, stable onboarding and monitored production infrastructure.",
  },
  {
    phase: "Phase 3",
    title: "Broker read-only integration",
    timeline: "After security hardening",
    status: "planned",
    description:
      "Connect read-only broker/account data before any execution permissions are considered.",
  },
  {
    phase: "Phase 4",
    title: "Trading production",
    timeline: "Later",
    status: "blocked",
    description:
      "Requires broker safety layer, legal review, compliance, monitoring, kill-switches and operational controls.",
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
    storageProvider: "unknown",
    databaseActive: false,
    riskMode: "Normal",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReadinessStats() {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      const allocationHeaders = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined;

      const [
        submissionsResponse,
        allocationResponse,
        deploymentsResponse,
        auditResponse,
        storageResponse,
        riskModeResponse,
      ] = await Promise.all([
        fetch("/api/strategy-submissions", { cache: "no-store" }),
        fetch("/api/allocation-requests", {
          cache: "no-store",
          headers: allocationHeaders,
        }),
        fetch("/api/deployments", { cache: "no-store" }),
        fetch("/api/audit-log", { cache: "no-store" }),
        fetch("/api/system/storage", { cache: "no-store" }),
        fetch("/api/portfolio/risk-mode", { cache: "no-store" }),
      ]);

      const [
        submissionsPayload,
        allocationPayload,
        deploymentsPayload,
        auditPayload,
        storagePayload,
        riskModePayload,
      ] = await Promise.all([
        submissionsResponse.json(),
        allocationResponse.json(),
        deploymentsResponse.json(),
        auditResponse.json(),
        storageResponse.json(),
        riskModeResponse.json(),
      ]);

      const submissions = submissionsPayload.data ?? [];
      const allocationRequests = allocationResponse.ok
        ? allocationPayload.data ?? []
        : [];
      const deployments = deploymentsPayload.data ?? [];
      const auditEvents = auditPayload.data ?? [];

      const activeStorageProvider =
        storagePayload.data?.activeStorageProvider ??
        storagePayload.data?.configuredStorageProvider ??
        "unknown";

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
        storageProvider: activeStorageProvider,
        databaseActive: activeStorageProvider === "database",
        riskMode: riskModePayload.data?.riskMode ?? "Normal",
      });

      if (!allocationResponse.ok && allocationResponse.status === 401) {
        setError(
          "Admin session required for allocation readiness stats. Sign in as admin for full readiness data."
        );
      }
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
    let score = 45;

    if (stats.databaseActive) score += 10;
    if (stats.submissions > 0) score += 5;
    if (stats.approvedSubmissions > 0) score += 5;
    if (stats.allocationRequests > 0) score += 5;
    if (stats.approvedAllocations > 0) score += 5;
    if (stats.deployments > 0) score += 5;
    if (stats.auditEvents > 0) score += 5;

    score += 15;

    return Math.min(score, 92);
  }, [stats]);

  const allItems = readinessGroups.flatMap((group) => group.items);

  const readyItems = allItems.filter((item) => item.status === "ready").length;
  const partialItems = allItems.filter((item) => item.status === "partial").length;
  const pendingItems = allItems.filter((item) => item.status === "pending").length;
  const blockedItems = allItems.filter((item) => item.status === "blocked").length;

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
                Paper-only trading infrastructure readiness.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Tracks what is already production-like, what remains blocked,
                and what must be hardened before real users, broker data or
                capital exposure.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Readiness score</p>
                  <p className="mt-2 text-6xl font-semibold text-emerald-300">
                    {loading ? "..." : `${readinessScore}%`}
                  </p>
                </div>

                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
                  Paper-only
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Metric label="Ready" value={String(readyItems)} positive />
                <Metric label="Pending" value={String(pendingItems)} />
                <Metric label="Blocked" value={String(blockedItems)} />
                <Metric label="Risk mode" value={stats.riskMode} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_400px] lg:px-8">
        <div className="space-y-6">
          {error && (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm leading-6 text-amber-300">
              {error}
            </div>
          )}

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
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-white">{item.label}</p>
                      <span className={statusClass(item.status)}>
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Launch sequence</p>
            <h2 className="mt-1 text-2xl font-semibold">Release phases</h2>

            <div className="mt-6 grid gap-4">
              {launchPhases.map((phase) => (
                <div
                  key={phase.phase}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">{phase.phase} · {phase.timeline}</p>
                      <h3 className="mt-1 text-xl font-semibold text-white">
                        {phase.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-500">
                        {phase.description}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                      {phase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-6 lg:sticky lg:top-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Live platform stats</p>
            <h3 className="mt-1 text-2xl font-semibold">Current data state</h3>

            <div className="mt-6 space-y-3 text-sm">
              <Row label="Storage provider" value={stats.storageProvider} />
              <Row label="Database active" value={stats.databaseActive ? "Yes" : "No"} />
              <Row label="Submissions" value={String(stats.submissions)} />
              <Row label="Approved strategies" value={String(stats.approvedSubmissions)} />
              <Row label="Allocation requests" value={String(stats.allocationRequests)} />
              <Row label="Approved allocations" value={String(stats.approvedAllocations)} />
              <Row label="Deployments" value={String(stats.deployments)} />
              <Row label="Audit events" value={String(stats.auditEvents)} />
            </div>

            <button
              onClick={loadReadinessStats}
              className="mt-6 w-full rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
            >
              Refresh readiness
            </button>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
            <p className="text-sm text-amber-300">Important limitation</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">
              Not ready for real trading
            </h3>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              The platform is suitable as a controlled paper-only demo. It must
              not connect to live broker execution or handle real capital until
              legal, compliance, monitoring, route protection and broker safety
              layers are complete.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Fast links</p>
            <div className="mt-5 grid gap-3">
              <QuickLink href="/system" label="System Dashboard" />
              <QuickLink href="/admin/risk" label="Admin Risk Console" />
              <QuickLink href="/system/storage" label="Storage Status" />
              <QuickLink href="/execution" label="Execution Center" />
              <QuickLink href="/system/audit" label="Audit Log" />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function statusClass(status: ReadinessStatus) {
  if (status === "ready") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs capitalize text-emerald-300";
  }

  if (status === "partial") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs capitalize text-amber-300";
  }

  if (status === "blocked") {
    return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs capitalize text-red-300";
  }

  return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs capitalize text-zinc-400";
}

function Metric({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          positive ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]"
    >
      {label}
    </Link>
  );
}