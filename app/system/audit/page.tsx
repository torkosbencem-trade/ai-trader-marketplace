"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuditEvent = {
  id: string;
  type: string;
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAuditLog() {
    setLoading(true);

    try {
      const response = await fetch("/api/audit-log", {
        cache: "no-store",
      });

      const payload = await response.json();
      setEvents(payload.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLog();
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

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Audit log
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Persistent workflow events for platform actions.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Strategy submissions, admin decisions, deployment preparation
                and portfolio risk changes are stored in a file-based audit log.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <Metric label="Events" value={String(events.length)} />
              <Metric label="Store" value="File" />
              <Metric label="Mode" value="Demo" />
              <Metric label="Status" value={loading ? "Loading" : "Ready"} positive={!loading} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Stored events</p>
            <h2 className="mt-1 text-2xl font-semibold">Latest audit records</h2>
          </div>

          <button
            onClick={loadAuditLog}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/20"
          >
            Refresh log
          </button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
            <p className="text-lg font-medium">No audit events yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Run actions from Strategy Builder, Admin, Execution or Portfolio.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-xs text-emerald-300">
                      {event.type}
                    </p>

                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {event.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                      {event.detail}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm font-medium text-zinc-300">
                      {event.actor}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {event.metadata && (
                  <pre className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#020409] p-4 text-xs leading-5 text-zinc-400">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
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