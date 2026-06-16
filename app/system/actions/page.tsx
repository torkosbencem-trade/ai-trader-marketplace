"use client";

import Link from "next/link";
import { useState } from "react";

type ActionLog = {
  title: string;
  status: "success" | "error";
  detail: string;
  payload: string;
};

const actions = [
  {
    title: "Submit strategy",
    description:
      "Simulates a Strategy Builder submission entering the admin review queue.",
    endpoint: "POST /api/strategy-submissions",
    button: "Run submission",
    run: async () => {
      const response = await fetch("/api/strategy-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyName: "Institutional Momentum Alpha",
          assetClass: "Crypto",
          timeframe: "1h",
          riskProfile: "Balanced",
          maxDrawdown: 8,
          monthlyTarget: 6,
        }),
      });

      return response;
    },
  },
  {
    title: "Approve submission",
    description:
      "Simulates an admin approval decision for a submitted strategy.",
    endpoint: "PATCH /api/admin/submissions/institutional-momentum-alpha",
    button: "Run approval",
    run: async () => {
      const response = await fetch(
        "/api/admin/submissions/institutional-momentum-alpha",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Approved",
            reviewer: "demo-admin",
            reason: "Risk and documentation checks passed.",
          }),
        }
      );

      return response;
    },
  },
  {
    title: "Prepare deployment",
    description:
      "Simulates server-side preparation of a broker deployment package.",
    endpoint: "POST /api/execution/deploy",
    button: "Run deployment",
    run: async () => {
      const response = await fetch("/api/execution/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyId: "alpha-pulse",
          broker: "Alpaca",
          deploymentMode: "Paper",
          riskState: "Passed",
          maxAllocation: 25000,
        }),
      });

      return response;
    },
  },
  {
    title: "Change portfolio risk mode",
    description:
      "Simulates portfolio risk intervention and audit-ready state change.",
    endpoint: "POST /api/portfolio/risk-mode",
    button: "Run risk change",
    run: async () => {
      const response = await fetch("/api/portfolio/risk-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          portfolioId: "demo-investor-001",
          riskMode: "Reduced",
          requestedBy: "demo-investor",
        }),
      });

      return response;
    },
  },
];

export default function SystemActionsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loadingAction, setLoadingAction] = useState("");

  async function runAction(action: (typeof actions)[number]) {
    setLoadingAction(action.title);

    try {
      const response = await action.run();
      const payload = await response.json();

      setLogs((current) => [
        {
          title: action.title,
          status: response.ok ? "success" : "error",
          detail: payload.message ?? payload.error ?? `HTTP ${response.status}`,
          payload: JSON.stringify(payload, null, 2),
        },
        ...current,
      ]);
    } catch (error) {
      setLogs((current) => [
        {
          title: action.title,
          status: "error",
          detail: error instanceof Error ? error.message : "Request failed",
          payload: "{}",
        },
        ...current,
      ]);
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <Link
            href="/system"
            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08]"
          >
            ← Back to system console
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Mutation workflow tester
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Test write actions before connecting a real database.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                These mock API mutations simulate the workflows users will
                trigger from Strategy Builder, Admin Review, Execution Center and
                Portfolio Risk Monitor.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <Metric label="Workflows" value="4" />
              <Metric label="Mode" value="Mock" />
              <Metric label="Logs" value={String(logs.length)} />
              <Metric label="Status" value="Ready" positive />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_430px] lg:px-8">
        <div className="grid gap-4">
          {actions.map((action) => (
            <div
              key={action.title}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-xs text-emerald-300">
                    {action.endpoint}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {action.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                    {action.description}
                  </p>
                </div>

                <button
                  onClick={() => runAction(action)}
                  disabled={Boolean(loadingAction)}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingAction === action.title ? "Running..." : action.button}
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Action log</p>
          <h3 className="mt-1 text-2xl font-semibold">Latest responses</h3>

          {logs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-500">
                No actions have been executed yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {logs.map((log, index) => (
                <div
                  key={`${log.title}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-white">{log.title}</p>
                    <span
                      className={
                        log.status === "success"
                          ? "text-xs font-semibold text-emerald-300"
                          : "text-xs font-semibold text-red-300"
                      }
                    >
                      {log.status}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {log.detail}
                  </p>

                  <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#020409] p-4 text-xs leading-5 text-zinc-400">
                    {log.payload}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
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