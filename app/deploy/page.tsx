"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DeployCheck = {
  label: string;
  status: boolean;
  detail: string;
};

type DeployStatus = {
  score: number;
  status: string;
  productionTradingReady: boolean;
  checks: DeployCheck[];
  warnings: string[];
  timestamp: string;
};

export default function DeployPage() {
  const [deployStatus, setDeployStatus] = useState<DeployStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDeployStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/system/deploy-check", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error("Deploy check failed.");
      }

      setDeployStatus(payload.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Deploy check failed."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeployStatus();
  }, []);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_480px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Deployment Console
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Online demo deployment preparation.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                This page prepares the AI Trader Marketplace for a controlled
                online demo. It is not a live trading deployment and should not
                handle real capital or live broker execution.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={loadDeployStatus}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Refresh deploy check
                </button>

                <Link
                  href="/demo"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Demo Center
                </Link>

                <Link
                  href="/readiness"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Readiness
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Deploy readiness</p>

              <p className="mt-3 text-5xl font-semibold">
                {loading ? "..." : `${deployStatus?.score ?? 0}%`}
              </p>

              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: `${deployStatus?.score ?? 0}%` }}
                />
              </div>

              <p className="mt-5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs font-semibold text-red-300">
                Production trading: blocked
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

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <p className="text-sm text-zinc-500">Deployment checks</p>
          <h2 className="mt-1 text-2xl font-semibold">
            Online demo readiness
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {deployStatus?.checks.map((check) => (
              <div
                key={check.label}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{check.label}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {check.detail}
                    </p>
                  </div>

                  <span
                    className={
                      check.status
                        ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                        : "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
                    }
                  >
                    {check.status ? "ready" : "pending"}
                  </span>
                </div>
              </div>
            ))}

            {!deployStatus && !loading && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
                No deployment status loaded.
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Vercel commands</p>
          <h3 className="mt-1 text-2xl font-semibold">Deploy steps</h3>

          <div className="mt-6 space-y-4">
            <Command title="Local dev" command="npm run dev" />
            <Command title="Build check" command="npm run build" />
            <Command title="Install Vercel CLI" command="npm install -g vercel" />
            <Command title="Preview deploy" command="vercel" />
            <Command title="Production demo deploy" command="vercel --prod" />
          </div>

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <p className="text-sm font-medium text-amber-300">
              Important limitation
            </p>

            <p className="mt-3 text-xs leading-5 text-zinc-500">
              This project still uses local file-store. For a real online
              product, connect Supabase or PostgreSQL before onboarding users.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              href="/system/storage"
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
            >
              <p className="text-sm font-semibold text-white">
                Storage readiness
              </p>
              <p className="mt-2 font-mono text-xs text-emerald-300">
                /system/storage
              </p>
            </Link>

            <Link
              href="/system/audit"
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
            >
              <p className="text-sm font-semibold text-white">Audit log</p>
              <p className="mt-2 font-mono text-xs text-emerald-300">
                /system/audit
              </p>
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Command({ title, command }: { title: string; command: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-mono text-xs text-emerald-300">
        {command}
      </p>
    </div>
  );
}