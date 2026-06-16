"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DemoDataStatus = {
  provider: string;
  actions: string[];
  seedCreates: {
    strategySubmissions: number;
    allocationRequests: number;
    deployments: number;
    auditEvents: number;
  };
  warning: string;
  timestamp: string;
};

type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
};

export default function DemoDataCenterPage() {
  const [status, setStatus] = useState<DemoDataStatus | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  async function loadStatus() {
    setLoading(true);

    try {
      const response = await fetch("/api/system/demo-data", {
        cache: "no-store",
      });

      const payload = await response.json();

      setStatus(payload.data);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: "seed" | "reset") {
    setWorking(true);
    setResult(null);

    try {
      const response = await fetch("/api/system/demo-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();

      setResult(payload);
      await loadStatus();
    } catch (error) {
      setResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Demo data action failed.",
      });
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_480px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Demo Data Center
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Seed or reset the marketplace demo database.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Use this panel before a demo to create a clean approved
                strategy, allocation request, deployment and audit trail.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => runAction("seed")}
                  disabled={working}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {working ? "Working..." : "Seed demo database"}
                </button>

                <button
                  onClick={() => runAction("reset")}
                  disabled={working}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset demo data
                </button>

                <button
                  onClick={loadStatus}
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Active storage provider</p>
              <p className="mt-3 text-4xl font-semibold">
                {loading ? "..." : status?.provider ?? "unknown"}
              </p>

              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <p className="text-sm font-medium text-amber-300">
                  Controlled demo action
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {status?.warning ??
                    "Reset and seed actions are intended only for MVP demos."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Seed package</p>
            <h2 className="mt-1 text-2xl font-semibold">
              What the demo seed creates
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Metric
                label="Approved strategy submission"
                value={String(status?.seedCreates.strategySubmissions ?? 1)}
              />
              <Metric
                label="Approved allocation request"
                value={String(status?.seedCreates.allocationRequests ?? 1)}
              />
              <Metric
                label="Prepared deployment"
                value={String(status?.seedCreates.deployments ?? 1)}
              />
              <Metric
                label="Audit events"
                value={String(status?.seedCreates.auditEvents ?? 4)}
              />
            </div>
          </div>

          {result && (
            <div
              className={`rounded-3xl border p-6 ${
                result.success
                  ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                  : "border-red-500/20 bg-red-500/[0.06]"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  result.success ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {result.success ? "Action completed" : "Action failed"}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {result.message ?? result.error}
              </p>

              <pre className="mt-5 max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-5 text-zinc-500">
                {JSON.stringify(result.data ?? result, null, 2)}
              </pre>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Recommended test after seed</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Demo validation path
            </h2>

            <div className="mt-6 grid gap-3">
              <Step href="/marketplace" label="Marketplace" />
              <Step href="/admin" label="Admin Review" />
              <Step href="/allocation-requests" label="Allocation Review" />
              <Step href="/execution" label="Execution Center" />
              <Step href="/portfolio" label="Portfolio" />
              <Step href="/system/audit" label="Audit Log" />
              <Step href="/system/storage" label="Storage Readiness" />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Demo operating procedure</p>
          <h3 className="mt-1 text-2xl font-semibold">Before a presentation</h3>

          <div className="mt-6 space-y-4">
            <TimelineItem
              step="01"
              title="Seed demo database"
              text="Creates one approved strategy, allocation, deployment and audit chain."
            />
            <TimelineItem
              step="02"
              title="Open Demo Center"
              text="Use /demo as the command center for the walkthrough."
            />
            <TimelineItem
              step="03"
              title="Show marketplace"
              text="Open the seeded strategy report from the marketplace."
            />
            <TimelineItem
              step="04"
              title="Show execution and portfolio"
              text="Demonstrate the full investor-to-deployment workflow."
            />
          </div>

          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
            <p className="text-sm font-medium text-red-300">
              Reset warning
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Reset clears the MVP demo collections. Use it only when you want a
              clean demo state.
            </p>
          </div>

          <Link
            href="/demo"
            className="mt-6 block rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Open Demo Center
          </Link>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Step({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 font-mono text-xs text-emerald-300">{href}</p>
    </Link>
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