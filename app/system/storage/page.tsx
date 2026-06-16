"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RepositoryStatus = {
  repositoryName: string;
  configuredStorageProvider: "file-store" | "database";
  activeStorageProvider: "file-store" | "database";
  databaseConnected: boolean;
  migrationReady: boolean;
  collections: Record<string, number>;
  migrationTargets: Array<{
    table: string;
    status: string;
    purpose: string;
  }>;
  nextRecommendedProvider: string;
  timestamp: string;
};

export default function StorageSystemPage() {
  const [status, setStatus] = useState<RepositoryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/system/storage", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load repository status.");
      }

      setStatus(payload.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load repository status."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

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

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_500px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Repository readiness
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Database-ready storage architecture.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                The platform now has a repository layer between API routes and
                storage. Today it still uses file-store, but the code path is
                prepared for PostgreSQL, Supabase or Neon.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <Metric
                label="Active provider"
                value={status?.activeStorageProvider ?? "..."}
              />
              <Metric
                label="Configured"
                value={status?.configuredStorageProvider ?? "..."}
              />
              <Metric
                label="DB connected"
                value={status?.databaseConnected ? "Yes" : "No"}
              />
              <Metric
                label="Migration"
                value={status?.migrationReady ? "Ready" : "Blocked"}
                positive={Boolean(status?.migrationReady)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_430px] lg:px-8">
        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Current collections</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  File-store data shape
                </h2>
              </div>

              <button
                onClick={loadStatus}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Refresh
              </button>
            </div>

            {loading && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
                Loading repository status...
              </div>
            )}

            {status && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {Object.entries(status.collections).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                      {key}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Migration map</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Database table targets
            </h2>

            <div className="mt-6 grid gap-4">
              {status?.migrationTargets.map((target) => (
                <div
                  key={target.table}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-mono text-sm text-emerald-300">
                        {target.table}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {target.purpose}
                      </p>
                    </div>

                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                      {target.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Production path</p>
          <h3 className="mt-1 text-2xl font-semibold">Next infrastructure step</h3>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Recommended database
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {status?.nextRecommendedProvider ?? "PostgreSQL via Supabase or Neon"}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <ChecklistItem title="Repository abstraction exists" active />
            <ChecklistItem title="API routes can import repository layer" active />
            <ChecklistItem title="File-store still active for local MVP" active />
            <ChecklistItem title="Real database not connected yet" active={false} />
            <ChecklistItem title="Auth / roles still pending" active={false} />
          </div>

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <p className="text-sm font-medium text-amber-300">
              Important
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              File-store is acceptable for local demos, but not for production.
              Before real users, use PostgreSQL, authentication, role-based
              access and secure audit persistence.
            </p>
          </div>

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
        className={`mt-2 text-xl font-semibold ${
          positive ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ChecklistItem({ title, active }: { title: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
          active
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
        }`}
      >
        {active ? "✓" : "!"}
      </div>

      <p className={active ? "text-sm text-zinc-200" : "text-sm text-amber-300"}>
        {title}
      </p>
    </div>
  );
}