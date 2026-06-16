"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RiskMode = "Normal" | "Reduced" | "Paused";

type Deployment = {
  id: string;
  allocationRequestId: string | null;
  strategyId: string;
  strategyName: string;
  investorEmail: string | null;
  requestedCapital: number;
  broker: string;
  deploymentMode: "Paper" | "Live";
  riskState: string;
  maxAllocation: number;
  maxDrawdown: number;
  dailyLossLimit: number;
  status: "Prepared" | "Active" | "Paused";
  createdAt: string;
  updatedAt: string | null;
};

export default function PortfolioPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [riskMode, setRiskMode] = useState<RiskMode>("Normal");
  const [actionMessage, setActionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadDeployments() {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/deployments", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load deployments.");
      }

      const loaded = (payload.data ?? []) as Deployment[];

      setDeployments(loaded);

      if (loaded.length > 0) {
        setSelectedId((current) =>
          loaded.some((deployment) => deployment.id === current)
            ? current
            : loaded[0].id
        );
      }
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load deployments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeployments();
  }, []);

  const selectedDeployment =
    deployments.find((deployment) => deployment.id === selectedId) ??
    deployments[0];

  const totalCapital = deployments.reduce(
    (sum, deployment) => sum + Number(deployment.maxAllocation ?? 0),
    0
  );

  const paperCount = deployments.filter(
    (deployment) => deployment.deploymentMode === "Paper"
  ).length;

  const liveCount = deployments.filter(
    (deployment) => deployment.deploymentMode === "Live"
  ).length;

  const averageDrawdown =
    deployments.length > 0
      ? deployments.reduce(
          (sum, deployment) => sum + Number(deployment.maxDrawdown ?? 0),
          0
        ) / deployments.length
      : 0;

  const totalDailyLossLimit =
    deployments.length > 0
      ? deployments.reduce(
          (sum, deployment) => sum + Number(deployment.dailyLossLimit ?? 0),
          0
        ) / deployments.length
      : 0;

  const equitySeries = useMemo(() => {
    const base = 100;
    const allocationEffect = Math.min(totalCapital / 100000, 8);

    return [
      base,
      base + allocationEffect * 0.3,
      base + allocationEffect * 0.8,
      base + allocationEffect * 0.4,
      base + allocationEffect * 1.1,
      base + allocationEffect * 1.6,
      base + allocationEffect * 1.3,
      base + allocationEffect * 2.1,
      base + allocationEffect * 2.8,
      base + allocationEffect * 2.5,
      base + allocationEffect * 3.2,
      base + allocationEffect * 3.7,
    ].map((value) => Number(value.toFixed(2)));
  }, [totalCapital]);

  async function handleRiskModeChange(mode: RiskMode) {
    setRiskMode(mode);
    setActionMessage("Sending risk mode update...");

    try {
      const response = await fetch("/api/portfolio/risk-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          portfolioId: "demo-investor-001",
          riskMode: mode,
          requestedBy: "demo-investor",
          deploymentCount: deployments.length,
          totalCapital,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Risk mode update failed.");
      }

      setActionMessage(payload.message ?? `Portfolio risk mode changed to ${mode}.`);
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Risk mode update failed."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Portfolio risk monitor
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Monitor deployments created by the execution workflow.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Deployment packages prepared from approved allocation requests
                now appear as portfolio allocations. Risk mode actions are
                stored in the audit log.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur md:grid-cols-4">
              <HeaderMetric label="Deployments" value={String(deployments.length)} />
              <HeaderMetric
                label="Capital"
                value={`$${Math.round(totalCapital / 1000)}K`}
              />
              <HeaderMetric label="Paper" value={String(paperCount)} />
              <HeaderMetric label="Live" value={String(liveCount)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_430px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Portfolio allocations</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Deployment-backed allocation list
                </h2>
                <p className="mt-2 text-xs text-zinc-600">
                  Loaded from /api/deployments.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={loadDeployments}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  Refresh
                </button>

                <Link
                  href="/execution"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Execution
                </Link>
              </div>
            </div>

            {loadError && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {loadError}
              </div>
            )}

            <div className="mt-6 grid gap-4">
              {loading && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
                  <p className="text-sm text-zinc-400">Loading deployments...</p>
                </div>
              )}

              {!loading &&
                deployments.map((deployment) => (
                  <button
                    key={deployment.id}
                    onClick={() => setSelectedId(deployment.id)}
                    className={`rounded-3xl border p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                      selectedDeployment?.id === deployment.id
                        ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-white">
                            {deployment.strategyName}
                          </h3>

                          <span className={modeClass(deployment.deploymentMode)}>
                            {deployment.deploymentMode}
                          </span>

                          <span className={statusClass(deployment.status)}>
                            {deployment.status}
                          </span>

                          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                            {deployment.broker}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-500">
                          {deployment.investorEmail ?? "Unknown investor"} ·{" "}
                          {deployment.riskState} risk state
                        </p>

                        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                          Created from approved allocation request{" "}
                          {deployment.allocationRequestId ?? "N/A"}.
                        </p>
                      </div>

                      <div className="grid min-w-[250px] grid-cols-2 gap-3">
                        <SmallMetric
                          label="Max allocation"
                          value={`$${Number(
                            deployment.maxAllocation
                          ).toLocaleString()}`}
                        />
                        <SmallMetric
                          label="Requested"
                          value={`$${Number(
                            deployment.requestedCapital
                          ).toLocaleString()}`}
                        />
                        <SmallMetric
                          label="Max DD"
                          value={`${deployment.maxDrawdown}%`}
                        />
                        <SmallMetric
                          label="Daily loss"
                          value={`${deployment.dailyLossLimit}%`}
                        />
                      </div>
                    </div>
                  </button>
                ))}

              {!loading && deployments.length === 0 && (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-8 text-center">
                  <p className="text-lg font-medium text-amber-300">
                    No deployment allocations yet
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Prepare a deployment package from the Execution Center first.
                  </p>
                  <Link
                    href="/execution"
                    className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    Open execution center
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Portfolio performance</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Allocation equity preview
                </h2>
              </div>

              <p className="text-sm text-zinc-500">
                Demo curve based on deployment capital
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
              <svg
                viewBox="0 0 720 260"
                className="h-[260px] w-full"
                role="img"
                aria-label="Portfolio equity curve"
              >
                <path d="M 24 220 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d="M 24 140 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d="M 24 60 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path
                  d={buildPath(equitySeries, 720, 260, 24)}
                  fill="none"
                  stroke="rgb(52,211,153)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Risk control</p>
          <h3 className="mt-1 text-2xl font-semibold">Portfolio guardrails</h3>

          <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
            {(["Normal", "Reduced", "Paused"] as RiskMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleRiskModeChange(mode)}
                className={`rounded-xl px-3 py-3 text-xs font-semibold transition ${
                  riskMode === mode
                    ? "bg-emerald-400 text-black"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {actionMessage && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300">
              {actionMessage}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Portfolio summary
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <Row label="Risk mode" value={riskMode} />
              <Row label="Deployments" value={String(deployments.length)} />
              <Row
                label="Total capital"
                value={`$${Number(totalCapital).toLocaleString()}`}
              />
              <Row
                label="Avg. max DD"
                value={`${averageDrawdown.toFixed(1)}%`}
              />
              <Row
                label="Avg. daily loss"
                value={`${totalDailyLossLimit.toFixed(1)}%`}
              />
            </div>
          </div>

          {selectedDeployment ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium text-zinc-300">
                Selected allocation
              </p>

              <h4 className="mt-3 text-lg font-semibold">
                {selectedDeployment.strategyName}
              </h4>

              <div className="mt-4 space-y-3 text-sm">
                <Row label="Deployment ID" value={selectedDeployment.id} />
                <Row label="Broker" value={selectedDeployment.broker} />
                <Row label="Mode" value={selectedDeployment.deploymentMode} />
                <Row label="Status" value={selectedDeployment.status} />
                <Row
                  label="Created"
                  value={new Date(selectedDeployment.createdAt).toLocaleString()}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-500">
                No deployment selected.
              </p>
            </div>
          )}

          <Link
            href="/system/audit"
            className="mt-6 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]"
          >
            View audit log
          </Link>
        </aside>
      </section>
    </main>
  );
}

function buildPath(values: number[], width: number, height: number, padding: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x =
        padding + (index / (values.length - 1)) * (width - padding * 2);

      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function HeaderMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[220px] truncate text-right font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}

function modeClass(mode: Deployment["deploymentMode"]) {
  if (mode === "Live") {
    return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300";
  }

  return "rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300";
}

function statusClass(status: Deployment["status"]) {
  if (status === "Active") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300";
  }

  if (status === "Paused") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300";
  }

  return "rounded-full border border-zinc-500/30 bg-zinc-500/10 px-3 py-1 text-xs text-zinc-300";
}