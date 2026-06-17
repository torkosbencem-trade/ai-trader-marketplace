"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EndpointState = {
  label: string;
  route: string;
  status: "loading" | "online" | "error";
  detail: string;
  category: string;
};

type SystemCard = {
  label: string;
  href: string;
  description: string;
  status: string;
};

type PortfolioRiskModePayload = {
  portfolioId: string;
  riskMode: "Normal" | "Reduced" | "Paused";
  source: "audit-log" | "default";
  updatedAt: string | null;
};

type AuditEvent = {
  id: string;
  type: string;
  title: string;
  detail: string;
  actor: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const endpoints = [
  {
    label: "Storage readiness",
    route: "/api/system/storage",
    category: "Infrastructure",
  },
  {
    label: "Deploy readiness",
    route: "/api/system/deploy-check",
    category: "Infrastructure",
  },
  {
    label: "Auth status",
    route: "/api/auth/status",
    category: "Identity",
  },
  {
    label: "Portfolio risk mode",
    route: "/api/portfolio/risk-mode",
    category: "Risk",
  },
  {
    label: "Audit log",
    route: "/api/audit-log",
    category: "Risk",
  },
  {
    label: "Marketplace",
    route: "/api/marketplace",
    category: "Product",
  },
  {
    label: "Allocation requests",
    route: "/api/allocation-requests",
    category: "Workflow",
  },
  {
    label: "Deployments",
    route: "/api/deployments",
    category: "Execution",
  },
];

const adminProtectionChecks = [
  {
    label: "Portfolio risk mode changes",
    route: "POST /api/portfolio/risk-mode",
    status: "Admin-only",
  },
  {
    label: "Execution deployment packages",
    route: "POST /api/execution/deploy",
    status: "Admin-only",
  },
  {
    label: "Strategy approval decisions",
    route: "PATCH /api/admin/submissions/[id]",
    status: "Admin-only",
  },
  {
    label: "Allocation approval decisions",
    route: "PATCH /api/allocation-requests/[id]",
    status: "Admin-only",
  },
  {
    label: "Admin submission queue",
    route: "GET /api/admin/submissions",
    status: "Admin-only",
  },
  {
    label: "Allocation request queue",
    route: "GET /api/allocation-requests",
    status: "Admin-only",
  },
];

const systemCards: SystemCard[] = [
  {
    label: "Storage",
    href: "/system/storage",
    description: "Repository provider, persistence mode and database readiness.",
    status: "Core",
  },
  {
    label: "Readiness",
    href: "/readiness",
    description: "Production readiness checklist and release state.",
    status: "Ops",
  },
  {
    label: "Deploy",
    href: "/deploy",
    description: "Deployment environment and release checks.",
    status: "Ops",
  },
  {
    label: "Admin Risk",
    href: "/admin/risk",
    description: "Portfolio Risk Mode, blocked deployments and risk history.",
    status: "Risk",
  },
  {
    label: "Audit",
    href: "/system/audit",
    description: "Full platform audit trail and workflow events.",
    status: "Governance",
  },
  {
    label: "Demo Data",
    href: "/system/demo-data",
    description: "Seed and reset demo platform records.",
    status: "Data",
  },
  {
    label: "System Actions",
    href: "/system/actions",
    description: "Operational action console for platform checks.",
    status: "Tools",
  },
];

export default function SystemPage() {
  const [states, setStates] = useState<EndpointState[]>(
    endpoints.map((endpoint) => ({
      ...endpoint,
      status: "loading",
      detail: "Checking endpoint...",
    }))
  );
  const [riskMode, setRiskMode] = useState<PortfolioRiskModePayload | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  async function checkSystem() {
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await fetch(endpoint.route, {
            cache: "no-store",
          });

          let payload: any = null;

          try {
            payload = await response.json();
          } catch {
            payload = null;
          }

          if (!response.ok) {
            return {
              ...endpoint,
              status: "error" as const,
              detail: payload?.error ? String(payload.error) : `HTTP ${response.status}`,
            };
          }

          if (endpoint.route === "/api/portfolio/risk-mode") {
            setRiskMode(payload?.data ?? null);
          }

          if (endpoint.route === "/api/audit-log") {
            setAuditEvents(payload?.data ?? []);
          }

          return {
            ...endpoint,
            status: "online" as const,
            detail:
              payload?.meta?.source
                ? `Source: ${payload.meta.source}`
                : payload?.data?.riskMode
                  ? `Mode: ${payload.data.riskMode}`
                  : payload?.meta?.count !== undefined
                    ? `Count: ${payload.meta.count}`
                    : "Operational",
          };
        } catch {
          return {
            ...endpoint,
            status: "error" as const,
            detail: "Request failed",
          };
        }
      })
    );

    setStates(results);
    setLastCheckedAt(new Date().toISOString());
  }

  useEffect(() => {
    checkSystem();
  }, []);

  const onlineCount = states.filter((item) => item.status === "online").length;
  const errorCount = states.filter((item) => item.status === "error").length;
  const loadingCount = states.filter((item) => item.status === "loading").length;

  const blockedDeployments = useMemo(
    () =>
      auditEvents.filter(
        (event) =>
          event.type === "execution-deployment" &&
          event.title.toLowerCase().includes("blocked")
      ),
    [auditEvents]
  );

  const riskModeEvents = useMemo(
    () => auditEvents.filter((event) => event.type === "portfolio-risk-mode"),
    [auditEvents]
  );

  const systemHealth =
    errorCount > 0 ? "Attention" : loadingCount > 0 ? "Checking" : "Operational";

  const riskTone =
    riskMode?.riskMode === "Paused"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : riskMode?.riskMode === "Reduced"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                System Status Dashboard
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Platform readiness and risk infrastructure in one view.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Monitor storage, auth, risk mode, audit activity, allocation
                workflow and execution readiness from a single operations page.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <Metric label="System" value={systemHealth} positive={errorCount === 0} />
              <Metric label="Online" value={`${onlineCount}/${states.length}`} positive={errorCount === 0} />
              <Metric label="Errors" value={String(errorCount)} />
              <Metric label="Risk Mode" value={riskMode?.riskMode ?? "Normal"} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_400px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Live checks</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Platform endpoint status
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  These checks call the same APIs used by the marketplace,
                  allocation workflow, auth layer, storage layer and execution
                  controls.
                </p>
              </div>

              <button
                onClick={checkSystem}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Refresh checks
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {states.map((endpoint) => (
                <div
                  key={endpoint.route}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            endpoint.status === "online"
                              ? "bg-emerald-400"
                              : endpoint.status === "error"
                                ? "bg-red-400"
                                : "bg-amber-400"
                          }`}
                        />
                        <h3 className="text-lg font-semibold text-white">
                          {endpoint.label}
                        </h3>
                      </div>

                      <p className="mt-2 font-mono text-xs text-zinc-500">
                        {endpoint.route}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className={statusTextClass(endpoint.status)}>
                        {endpoint.status}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {endpoint.category} · {endpoint.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lastCheckedAt && (
              <p className="mt-5 text-xs text-zinc-600">
                Last checked: {new Date(lastCheckedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Operations map</p>
            <h2 className="mt-1 text-2xl font-semibold">
              System modules
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {systemCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-lg font-semibold text-white">{card.label}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                      {card.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {card.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Access control</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Admin API Protection
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Critical review, risk and execution endpoints now require a valid
              Supabase session with admin authorization.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {adminProtectionChecks.map((check) => (
                <div
                  key={check.route}
                  className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-white">{check.label}</p>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                      {check.status}
                    </span>
                  </div>

                  <p className="mt-3 font-mono text-xs text-zinc-500">
                    {check.route}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-6 lg:sticky lg:top-6">
          <div className={`rounded-3xl border p-6 ${riskTone}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">
              Portfolio Risk Mode
            </p>

            <h3 className="mt-2 text-4xl font-semibold">
              {riskMode?.riskMode ?? "Normal"}
            </h3>

            <p className="mt-3 text-sm leading-6 opacity-80">
              {riskMode?.riskMode === "Paused"
                ? "New deployment packages are blocked by the Execution Firewall."
                : riskMode?.riskMode === "Reduced"
                  ? "Paper deployment may continue with tighter monitoring."
                  : "Standard paper deployment workflow is available."}
            </p>

            <Link
              href="/admin/risk"
              className="mt-6 block rounded-2xl border border-white/20 bg-black/20 px-5 py-4 text-center text-sm font-semibold transition hover:bg-black/30"
            >
              Open Admin Risk Console
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Risk activity</p>
            <h3 className="mt-1 text-2xl font-semibold">
              Firewall overview
            </h3>

            <div className="mt-6 space-y-3 text-sm">
              <Row label="Blocked deployments" value={String(blockedDeployments.length)} />
              <Row label="Risk mode changes" value={String(riskModeEvents.length)} />
              <Row label="Audit events" value={String(auditEvents.length)} />
              <Row label="Risk source" value={riskMode?.source ?? "default"} />
            </div>

            <Link
              href="/system/audit"
              className="mt-6 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]"
            >
              View audit log
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Recommended next checks</p>
            <h3 className="mt-1 text-2xl font-semibold">
              Production hardening
            </h3>

            <div className="mt-6 space-y-4">
              <NextStep
                title="Route protection"
                text="Enable middleware or server-side guards after the current auth flow remains stable."
              />
              <NextStep
                title="Role enforcement"
                text="Restrict admin and execution APIs to authenticated admin profiles."
              />
              <NextStep
                title="Persistent risk mode"
                text="Move portfolio risk mode from audit-derived state into a dedicated portfolio settings table."
              />
              <NextStep
                title="Broker safety layer"
                text="Keep execution paper-only until broker permissions, position sync and kill-switch controls exist."
              />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function statusTextClass(status: EndpointState["status"]) {
  if (status === "online") {
    return "text-sm font-semibold capitalize text-emerald-300";
  }

  if (status === "error") {
    return "text-sm font-semibold capitalize text-red-300";
  }

  return "text-sm font-semibold capitalize text-amber-300";
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

function NextStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  );
}