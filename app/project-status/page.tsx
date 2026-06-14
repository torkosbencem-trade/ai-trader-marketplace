import Link from "next/link";

import {
  Card,
  JsonPreview,
  PremiumPageShell,
  StatusPill,
} from "@/components/ui/PremiumUI";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type CheckResult = {
  label: string;
  url: string;
  ok: boolean;
  status: number | null;
  data: unknown;
  error?: string;
};

async function checkJson(label: string, path: string): Promise<CheckResult> {
  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      label,
      url,
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      label,
      url,
      ok: false,
      status: null,
      data: null,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

function getStatusTone(ok: boolean): "success" | "danger" {
  return ok ? "success" : "danger";
}

function getCount(data: unknown): number | null {
  if (Array.isArray(data)) return data.length;

  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  for (const key of [
    "items",
    "signals",
    "strategies",
    "trades",
    "logs",
    "test_runs",
    "runs",
  ]) {
    const value = record[key];

    if (Array.isArray(value)) return value.length;
  }

  if (typeof record.count === "number") return record.count;

  return null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    return ["1", "true", "yes", "on", "enabled"].includes(
      value.trim().toLowerCase(),
    );
  }

  return fallback;
}

function getNestedBoolean(
  data: unknown,
  keys: string[],
  fallback = false,
): boolean {
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, unknown>;

  for (const key of keys) {
    if (key in record) {
      return asBoolean(record[key], fallback);
    }
  }

  return fallback;
}

function getNestedString(
  data: unknown,
  keys: string[],
  fallback = "—",
): string {
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

export default async function ProjectStatusPage() {
  const checks = await Promise.all([
    checkJson("Backend Health", "/health"),
    checkJson("Execution Status", "/execution/status"),
    checkJson("Execution Audit", "/execution/audit?limit=10"),
    checkJson("Execution Gateway Status", "/execution/gateway-status"),
    checkJson("Marketplace Strategies", "/marketplace/strategies"),
    checkJson("Marketplace Signals", "/marketplace/signals"),
    checkJson("Shadow Live Config", "/shadow-live/config"),
    checkJson("Shadow Live Performance", "/shadow-live/performance"),
  ]);

  const failed = checks.filter((check) => !check.ok);

  const executionStatus = checks.find(
    (check) => check.label === "Execution Status",
  );

  const executionAudit = checks.find(
    (check) => check.label === "Execution Audit",
  );

  const executionGatewayStatus = checks.find(
    (check) => check.label === "Execution Gateway Status",
  );

  const realOrdersEnabled = getNestedBoolean(
    executionStatus?.data,
    [
      "real_orders_enabled",
      "realOrdersEnabled",
      "allow_real_orders",
      "allowRealOrders",
    ],
    false,
  );

  const realOrderSent = getNestedBoolean(
    executionAudit?.data,
    ["real_order_sent", "realOrderSent"],
    false,
  );

  const dryRunOnly = getNestedBoolean(
    executionAudit?.data,
    ["dry_run_only", "dryRunOnly"],
    true,
  );

  const gatewayName = getNestedString(
    executionGatewayStatus?.data,
    ["gateway"],
    "UNKNOWN",
  );

  const gatewayEngine = getNestedString(
    executionGatewayStatus?.data,
    ["execution_engine", "executionEngine"],
    "UNKNOWN",
  );

  const gatewayAvailable = getNestedBoolean(
    executionGatewayStatus?.data,
    ["gateway_available", "gatewayAvailable"],
    false,
  );

  const gatewayDryRunOnly = getNestedBoolean(
    executionGatewayStatus?.data,
    ["dry_run_only", "dryRunOnly"],
    false,
  );

  const gatewayRealOrderSent = getNestedBoolean(
    executionGatewayStatus?.data,
    ["real_order_sent", "realOrderSent"],
    true,
  );

  const gatewayNetworkRequestSent = getNestedBoolean(
    executionGatewayStatus?.data,
    ["network_request_sent", "networkRequestSent"],
    true,
  );

  const gatewayBinanceOrderSent = getNestedBoolean(
    executionGatewayStatus?.data,
    ["binance_order_sent", "binanceOrderSent"],
    true,
  );

  const auditLoggingEnabled = getNestedBoolean(
    executionGatewayStatus?.data,
    ["audit_logging", "auditLogging"],
    false,
  );

  const gatewaySafe =
    executionGatewayStatus?.ok === true &&
    gatewayAvailable &&
    gatewayName === "DRY_RUN_EXCHANGE_GATEWAY" &&
    gatewayEngine === "dry_run_only" &&
    gatewayDryRunOnly &&
    !gatewayRealOrderSent &&
    !gatewayNetworkRequestSent &&
    !gatewayBinanceOrderSent &&
    auditLoggingEnabled;

  const safetyOk =
    failed.length === 0 &&
    !realOrdersEnabled &&
    !realOrderSent &&
    dryRunOnly &&
    gatewaySafe;

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusPill label="Project Status" tone="info" />
                <StatusPill
                  label={safetyOk ? "Safety OK" : "Needs Attention"}
                  tone={safetyOk ? "success" : "danger"}
                />
                <StatusPill label="Dry Run Only" tone="success" />
              </div>

              <h1 className="premium-text-gradient text-4xl font-black tracking-tight md:text-6xl">
                Project Status Snapshot
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Quick developer checkpoint for backend connectivity, execution
                safety, audit visibility, marketplace data, and shadow-live
                configuration.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/system"
                className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/15"
              >
                System Health
              </Link>

              <Link
                href="/execution-audit"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
              >
                Execution Audit
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Checks passed
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {checks.length - failed.length}/{checks.length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Backend JSON endpoints
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Real orders enabled
            </p>
            <p
              className={
                realOrdersEnabled
                  ? "mt-3 text-3xl font-black text-red-200"
                  : "mt-3 text-3xl font-black text-emerald-200"
              }
            >
              {String(realOrdersEnabled)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Must remain false</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              real_order_sent
            </p>
            <p
              className={
                realOrderSent
                  ? "mt-3 text-3xl font-black text-red-200"
                  : "mt-3 text-3xl font-black text-emerald-200"
              }
            >
              {String(realOrderSent)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Must remain false</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Dry run only
            </p>
            <p
              className={
                dryRunOnly
                  ? "mt-3 text-3xl font-black text-emerald-200"
                  : "mt-3 text-3xl font-black text-red-200"
              }
            >
              {String(dryRunOnly)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Must remain true</p>
          </Card>
        </section>

        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusPill
                  label={gatewaySafe ? "Gateway Safe" : "Gateway Needs Review"}
                  tone={gatewaySafe ? "success" : "danger"}
                />
                <StatusPill
                  label={safetyOk ? "Go State" : "No-Go State"}
                  tone={safetyOk ? "success" : "danger"}
                />
              </div>

              <h2 className="text-2xl font-bold text-white">
                Safety Readiness Checklist
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Consolidated execution safety state based on backend health,
                execution status, audit data, and the dry-run exchange gateway
                status endpoint.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-400">
              Backend:{" "}
              <span className="font-semibold text-slate-200">
                {API_BASE_URL}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Backend endpoints
              </p>
              <p
                className={
                  failed.length === 0
                    ? "mt-2 font-bold text-emerald-200"
                    : "mt-2 font-bold text-red-200"
                }
              >
                {checks.length - failed.length}/{checks.length} passing
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Gateway
              </p>
              <p
                className={
                  gatewaySafe
                    ? "mt-2 font-bold text-emerald-200"
                    : "mt-2 font-bold text-red-200"
                }
              >
                {gatewayName}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Engine
              </p>
              <p
                className={
                  gatewayEngine === "dry_run_only"
                    ? "mt-2 font-bold text-emerald-200"
                    : "mt-2 font-bold text-red-200"
                }
              >
                {gatewayEngine}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Real orders sent
              </p>
              <p
                className={
                  !gatewayRealOrderSent && !realOrderSent
                    ? "mt-2 font-bold text-emerald-200"
                    : "mt-2 font-bold text-red-200"
                }
              >
                {String(gatewayRealOrderSent || realOrderSent)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Exchange requests
              </p>
              <p
                className={
                  !gatewayNetworkRequestSent && !gatewayBinanceOrderSent
                    ? "mt-2 font-bold text-emerald-200"
                    : "mt-2 font-bold text-red-200"
                }
              >
                network={String(gatewayNetworkRequestSent)}, binance=
                {String(gatewayBinanceOrderSent)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Audit logging
              </p>
              <p
                className={
                  auditLoggingEnabled
                    ? "mt-2 font-bold text-emerald-200"
                    : "mt-2 font-bold text-red-200"
                }
              >
                {String(auditLoggingEnabled)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-50">
            Full backend safety check:
            <code className="ml-2 rounded-lg bg-black/30 px-2 py-1 text-xs text-cyan-100">
              python run_safety_suite.py --base-url {API_BASE_URL}
            </code>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-bold text-white">
              Backend endpoint snapshot
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              These checks use the configured NEXT_PUBLIC_API_BASE_URL.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Check</th>
                  <th className="px-5 py-4">HTTP</th>
                  <th className="px-5 py-4">Count</th>
                  <th className="px-5 py-4">URL</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {checks.map((check) => {
                  const count = getCount(check.data);

                  return (
                    <tr
                      key={check.label}
                      className="align-top transition hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-4">
                        <StatusPill
                          label={check.ok ? "OK" : "FAIL"}
                          tone={getStatusTone(check.ok)}
                        />
                      </td>

                      <td className="px-5 py-4 font-bold text-white">
                        {check.label}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {check.status ?? "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {count ?? "—"}
                      </td>

                      <td className="max-w-[420px] px-5 py-4 text-xs text-slate-500">
                        <span className="break-all">{check.url}</span>
                        {check.error ? (
                          <p className="mt-2 text-red-200">{check.error}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill label="Execution Status" tone="info" />
              <StatusPill
                label={executionStatus?.ok ? "Loaded" : "Unavailable"}
                tone={executionStatus?.ok ? "success" : "danger"}
              />
            </div>

            <JsonPreview data={executionStatus?.data ?? null} />
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill label="Execution Gateway" tone="info" />
              <StatusPill
                label={gatewaySafe ? "Safe" : "Review"}
                tone={gatewaySafe ? "success" : "danger"}
              />
            </div>

            <JsonPreview data={executionGatewayStatus?.data ?? null} />
          </Card>
        </section>
      </div>
    </PremiumPageShell>
  );
}