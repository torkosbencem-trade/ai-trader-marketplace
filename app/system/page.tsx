"use client";

import { useEffect, useState } from "react";

type EndpointState = {
  label: string;
  route: string;
  status: "loading" | "online" | "error";
  detail: string;
};

const endpoints = [
  {
    label: "Strategies",
    route: "/api/strategies",
  },
  {
    label: "Strategy detail",
    route: "/api/strategies/alpha-pulse",
  },
  {
    label: "Portfolio",
    route: "/api/portfolio",
  },
  {
    label: "Admin submissions",
    route: "/api/admin/submissions",
  },
  {
    label: "System health",
    route: "/api/system/health",
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

  useEffect(() => {
    async function checkEndpoints() {
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.route, {
              cache: "no-store",
            });

            if (!response.ok) {
              return {
                ...endpoint,
                status: "error" as const,
                detail: `HTTP ${response.status}`,
              };
            }

            const payload = await response.json();

            return {
              ...endpoint,
              status: "online" as const,
              detail: payload?.meta?.source
                ? `Source: ${payload.meta.source}`
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
    }

    checkEndpoints();
  }, []);

  const onlineCount = states.filter((item) => item.status === "online").length;
  const errorCount = states.filter((item) => item.status === "error").length;

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Developer system console
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                API readiness layer for the AI Trader platform.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                This page checks the mock API endpoints that will later be
                connected to database records, authentication, broker data and
                admin workflows.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <Metric label="Endpoints" value={String(states.length)} />
              <Metric label="Online" value={String(onlineCount)} positive />
              <Metric label="Errors" value={String(errorCount)} />
              <Metric label="Mode" value="Mock" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <p className="text-sm text-zinc-500">Endpoint checks</p>
          <h2 className="mt-1 text-2xl font-semibold">Mock API status</h2>

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
                      {endpoint.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Next backend step</p>
          <h3 className="mt-1 text-2xl font-semibold">Replace mock data</h3>

          <div className="mt-6 space-y-4">
            <NextStep
              title="Database models"
              text="Create tables for users, strategies, submissions, allocations, audit logs and broker connections."
            />
            <NextStep
              title="Authentication"
              text="Protect investor, creator and admin routes with real sessions and role-based authorization."
            />
            <NextStep
              title="API mutations"
              text="Add POST, PATCH and DELETE endpoints for strategy submission and admin approval actions."
            />
            <NextStep
              title="Broker data"
              text="Connect read-only broker position data before enabling any execution workflow."
            />
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

function NextStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  );
}