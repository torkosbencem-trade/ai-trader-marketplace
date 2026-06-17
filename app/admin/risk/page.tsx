"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PortfolioRiskMode = "Normal" | "Reduced" | "Paused";

type CurrentRiskMode = {
  portfolioId: string;
  riskMode: PortfolioRiskMode;
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

const riskModes: {
  id: PortfolioRiskMode;
  title: string;
  description: string;
  className: string;
}[] = [
  {
    id: "Normal",
    title: "Normal",
    description: "Standard paper deployment workflow is allowed.",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  {
    id: "Reduced",
    title: "Reduced",
    description: "Execution remains available, but with tighter monitoring.",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  {
    id: "Paused",
    title: "Paused",
    description: "All new deployment packages are blocked by the firewall.",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
  },
];

export default function AdminRiskConsolePage() {
  const [currentMode, setCurrentMode] = useState<CurrentRiskMode | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingMode, setChangingMode] = useState<PortfolioRiskMode | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadRiskConsole() {
    setLoading(true);
    setError("");

    try {
      const [riskModeResponse, auditResponse] = await Promise.all([
        fetch("/api/portfolio/risk-mode", { cache: "no-store" }),
        fetch("/api/audit-log", { cache: "no-store" }),
      ]);

      const riskModePayload = await riskModeResponse.json();
      const auditPayload = await auditResponse.json();

      if (!riskModeResponse.ok) {
        throw new Error(riskModePayload.error ?? "Failed to load portfolio risk mode.");
      }

      if (!auditResponse.ok) {
        throw new Error(auditPayload.error ?? "Failed to load audit log.");
      }

      setCurrentMode(riskModePayload.data ?? null);
      setAuditEvents(auditPayload.data ?? []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load risk console.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRiskConsole();
  }, []);

  async function changeRiskMode(riskMode: PortfolioRiskMode) {
    setChangingMode(riskMode);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/portfolio/risk-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riskMode,
          portfolioId: "demo-investor-001",
          requestedBy: "admin-risk-console",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to change risk mode.");
      }

      setMessage(payload.message ?? `Portfolio risk mode changed to ${riskMode}.`);
      await loadRiskConsole();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to change risk mode.");
    } finally {
      setChangingMode(null);
    }
  }

  const riskModeEvents = useMemo(
    () => auditEvents.filter((event) => event.type === "portfolio-risk-mode").slice(0, 8),
    [auditEvents]
  );

  const blockedDeploymentEvents = useMemo(
    () =>
      auditEvents
        .filter(
          (event) =>
            event.type === "execution-deployment" &&
            event.title.toLowerCase().includes("blocked")
        )
        .slice(0, 8),
    [auditEvents]
  );

  const activeMode =
    riskModes.find((mode) => mode.id === currentMode?.riskMode) ?? riskModes[0];

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(239,68,68,0.12),_transparent_30%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Admin Risk Console
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Central risk control for execution readiness.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Monitor portfolio risk mode, blocked deployment attempts, and execution firewall activity from one institutional control panel.
              </p>
            </div>

            <div className={`rounded-3xl border p-5 ${activeMode.className}`}>
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                Current portfolio mode
              </p>
              <p className="mt-2 text-4xl font-semibold">
                {loading ? "Loading" : currentMode?.riskMode ?? "Normal"}
              </p>
              <p className="mt-2 max-w-xs text-sm opacity-80">
                {activeMode.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Portfolio Risk Mode</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Global execution switch
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  This control is read by the Execution Firewall. When the mode is Paused, new deployment packages are blocked before they can be created.
                </p>
              </div>

              <button
                onClick={loadRiskConsole}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {riskModes.map((mode) => {
                const active = currentMode?.riskMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => changeRiskMode(mode.id)}
                    disabled={changingMode !== null}
                    className={`rounded-3xl border p-5 text-left transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60 ${
                      active ? mode.className : "border-white/10 bg-black/20 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xl font-semibold">{mode.title}</p>
                      {active && (
                        <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-6 opacity-80">
                      {mode.description}
                    </p>

                    <p className="mt-5 text-xs opacity-70">
                      {changingMode === mode.id ? "Changing..." : "Set mode"}
                    </p>
                  </button>
                );
              })}
            </div>

            {message && (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Blocked deployment attempts</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Execution Firewall blocks
            </h2>

            <div className="mt-6 space-y-3">
              {blockedDeploymentEvents.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
                  No blocked deployment attempts found in the audit log.
                </div>
              )}

              {blockedDeploymentEvents.map((event) => (
                <AuditCard key={event.id} event={event} danger />
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-6 lg:sticky lg:top-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Risk status</p>
            <h3 className="mt-1 text-2xl font-semibold">
              Current control state
            </h3>

            <div className="mt-6 space-y-3 text-sm">
              <Row label="Portfolio ID" value={currentMode?.portfolioId ?? "demo-investor-001"} />
              <Row label="Risk mode" value={currentMode?.riskMode ?? "Normal"} />
              <Row label="Source" value={currentMode?.source ?? "default"} />
              <Row
                label="Updated"
                value={
                  currentMode?.updatedAt
                    ? new Date(currentMode.updatedAt).toLocaleString()
                    : "Not changed yet"
                }
              />
              <Row label="Blocked deployments" value={String(blockedDeploymentEvents.length)} />
            </div>

            <Link
              href="/execution"
              className="mt-6 block rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Open execution center
            </Link>

            <Link
              href="/system/audit"
              className="mt-3 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]"
            >
              Open full audit log
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Risk mode history</p>
            <h3 className="mt-1 text-2xl font-semibold">Recent changes</h3>

            <div className="mt-6 space-y-3">
              {riskModeEvents.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
                  No portfolio risk mode changes found yet.
                </div>
              )}

              {riskModeEvents.map((event) => (
                <AuditCard key={event.id} event={event} compact />
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function AuditCard({
  event,
  danger = false,
  compact = false,
}: {
  event: AuditEvent;
  danger?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger ? "border-red-500/20 bg-red-500/[0.06]" : "border-white/10 bg-black/20"
      }`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold text-white">{event.title}</p>
          {!compact && (
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              {event.detail}
            </p>
          )}
          <p className="mt-2 text-xs text-zinc-600">
            {event.actor} · {new Date(event.createdAt).toLocaleString()}
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs ${
            danger
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-white/10 bg-white/[0.04] text-zinc-400"
          }`}
        >
          {event.type}
        </span>
      </div>
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