import Link from "next/link";

import {
  Card,
  PremiumPageShell,
  StatusPill,
} from "@/components/ui/PremiumUI";

export const dynamic = "force-dynamic";

type AuditItem = {
  id: number;
  created_at: string;
  symbol: string;
  side: string;
  order_type: string;
  source: string;
  notional_usdt: number | null;
  quantity: number | null;
  accepted: boolean;
  status: string;
  dry_run_only: boolean;
  real_order_sent: boolean;
  reason: string;
  violations: string[];
  warnings: string[];
};

type AuditResponse = {
  status: string;
  items: AuditItem[];
  count: number;
  limit: number;
  real_order_sent: boolean;
  dry_run_only: boolean;
  error?: string;
};

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

function getSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
  fallback = "",
): string {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] || fallback;
  }

  return typeof value === "string" ? value : fallback;
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

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function normalizeAuditItem(raw: unknown): AuditItem {
  const item =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    id: Number(item.id || 0),
    created_at: String(item.created_at || item.createdAt || ""),
    symbol: String(item.symbol || ""),
    side: String(item.side || ""),
    order_type: String(item.order_type || item.orderType || "MARKET"),
    source: String(item.source || "unknown"),
    notional_usdt: asNumber(item.notional_usdt ?? item.notionalUsdt),
    quantity: asNumber(item.quantity),
    accepted: asBoolean(item.accepted),
    status: String(
      item.status || (asBoolean(item.accepted) ? "accepted" : "blocked"),
    ),
    dry_run_only: asBoolean(item.dry_run_only ?? item.dryRunOnly, true),
    real_order_sent: asBoolean(
      item.real_order_sent ?? item.realOrderSent,
      false,
    ),
    reason: String(item.reason || ""),
    violations: asStringArray(item.violations),
    warnings: asStringArray(item.warnings),
  };
}

function formatDate(value: string): string {
  if (!value) return "Unknown time";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatMoney(value: number | null): string {
  if (value === null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

async function getExecutionAudit(limit = 75): Promise<AuditResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/execution/audit?limit=${limit}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return {
        status: "error",
        items: [],
        count: 0,
        limit,
        real_order_sent: false,
        dry_run_only: true,
        error: `Backend returned HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items = rawItems.map(normalizeAuditItem);

    return {
      status: String(data.status || "ok"),
      items,
      count: Number(data.count ?? items.length),
      limit: Number(data.limit ?? limit),
      real_order_sent: asBoolean(
        data.real_order_sent ?? data.realOrderSent,
        false,
      ),
      dry_run_only: asBoolean(data.dry_run_only ?? data.dryRunOnly, true),
      error: typeof data.error === "string" ? data.error : undefined,
    };
  } catch (error) {
    return {
      status: "error",
      items: [],
      count: 0,
      limit,
      real_order_sent: false,
      dry_run_only: true,
      error:
        error instanceof Error ? error.message : "Unknown frontend fetch error",
    };
  }
}

export default async function ExecutionAuditPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const statusFilter = getSearchParam(
    resolvedSearchParams,
    "status",
    "all",
  );

  const realOrderFilter = getSearchParam(
    resolvedSearchParams,
    "realOrder",
    "all",
  );

  const symbolFilter = getSearchParam(
    resolvedSearchParams,
    "symbol",
    "",
  )
    .trim()
    .toUpperCase();

  const sourceFilter = getSearchParam(
    resolvedSearchParams,
    "source",
    "",
  )
    .trim()
    .toLowerCase();

  const audit = await getExecutionAudit();
  const items = audit.items;

  const filteredItems = items.filter((item) => {
    const statusMatches =
      statusFilter === "all" ||
      (statusFilter === "accepted" && item.accepted) ||
      (statusFilter === "blocked" && !item.accepted);

    const realOrderMatches =
      realOrderFilter === "all" ||
      (realOrderFilter === "true" && item.real_order_sent) ||
      (realOrderFilter === "false" && !item.real_order_sent);

    const symbolMatches =
      !symbolFilter || item.symbol.toUpperCase().includes(symbolFilter);

    const sourceMatches =
      !sourceFilter || item.source.toLowerCase().includes(sourceFilter);

    return statusMatches && realOrderMatches && symbolMatches && sourceMatches;
  });

  const acceptedCount = items.filter((item) => item.accepted).length;
  const blockedCount = items.filter((item) => !item.accepted).length;
  const realOrderCount = items.filter((item) => item.real_order_sent).length;
  const dryRunCount = items.filter((item) => item.dry_run_only).length;

  const filteredAcceptedCount = filteredItems.filter(
    (item) => item.accepted,
  ).length;

  const filteredBlockedCount = filteredItems.filter(
    (item) => !item.accepted,
  ).length;

  const filteredRealOrderCount = filteredItems.filter(
    (item) => item.real_order_sent,
  ).length;

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusPill label="Execution Audit" tone="info" />
                <StatusPill label="Dry Run Only" tone="success" />
                <StatusPill label="Real Orders Disabled" tone="success" />
              </div>

              <h1 className="premium-text-gradient text-4xl font-black tracking-tight md:text-6xl">
                Execution Audit Log
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Review every dry-run order attempt that passed through the
                execution safety gate. Accepted and blocked attempts are logged
                here with safety reasons, violations, warnings, and the
                permanent real_order_sent=false control flag.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/execution"
                className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/15"
              >
                Back to Execution
              </Link>

              <Link
                href="/system"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
              >
                System Health
              </Link>
            </div>
          </div>
        </section>

        {audit.status === "error" ? (
          <Card className="border-red-400/20 bg-red-950/20 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label="Backend Error" tone="danger" />
              <StatusPill label="Audit unavailable" tone="warning" />
            </div>

            <h2 className="mt-4 text-2xl font-bold text-white">
              Could not load execution audit.
            </h2>

            <p className="mt-3 text-sm leading-6 text-red-100/80">
              {audit.error || "Unknown error while reading /execution/audit."}
            </p>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Total attempts
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {items.length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Last {audit.limit} audit rows
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Accepted
            </p>
            <p className="mt-3 text-3xl font-black text-emerald-200">
              {acceptedCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Safety gate allowed as dry-run
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Blocked
            </p>
            <p className="mt-3 text-3xl font-black text-amber-200">
              {blockedCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Violations prevented execution
            </p>
          </Card>

          <Card
            className={
              realOrderCount > 0
                ? "border-red-400/30 bg-red-950/20 p-5"
                : "p-5"
            }
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Real orders sent
            </p>
            <p
              className={
                realOrderCount > 0
                  ? "mt-3 text-3xl font-black text-red-200"
                  : "mt-3 text-3xl font-black text-emerald-200"
              }
            >
              {realOrderCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">Must remain zero</p>
          </Card>
        </section>

        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Audit Filters
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                Filter execution attempts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredItems.length} of {items.length} audit rows.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={`${filteredAcceptedCount} accepted`}
                tone="success"
              />
              <StatusPill
                label={`${filteredBlockedCount} blocked`}
                tone="warning"
              />
              <StatusPill
                label={`${filteredRealOrderCount} real orders`}
                tone={filteredRealOrderCount > 0 ? "danger" : "success"}
              />
            </div>
          </div>

          <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="GET">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Status
              </span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50"
              >
                <option value="all">All</option>
                <option value="accepted">Accepted</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Real order
              </span>
              <select
                name="realOrder"
                defaultValue={realOrderFilter}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50"
              >
                <option value="all">All</option>
                <option value="false">False only</option>
                <option value="true">True only</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Symbol
              </span>
              <input
                name="symbol"
                defaultValue={symbolFilter}
                placeholder="BTCUSDT"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Source
              </span>
              <input
                name="source"
                defaultValue={sourceFilter}
                placeholder="frontend"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
              />
            </label>

            <div className="flex gap-3 md:col-span-2 xl:col-span-1">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Apply
              </button>

              <Link
                href="/execution-audit"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
              >
                Reset
              </Link>
            </div>
          </form>
        </Card>

        {items.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-wrap gap-2">
              <StatusPill label="No audit rows yet" tone="warning" />
              <StatusPill label="Waiting for dry-run order" tone="info" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              No execution attempts have been logged yet.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Submit a dry-run order from the Execution page or call the backend
              endpoint directly, then refresh this page.
            </p>

            <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">
{`Invoke-RestMethod \`
  -Uri "http://127.0.0.1:8000/execution/dry-run-order" \`
  -Method POST \`
  -ContentType "application/json" \`
  -Body '{"symbol":"BTCUSDT","side":"BUY","notional_usdt":10,"source":"frontend_audit_test"}'`}
            </pre>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-wrap gap-2">
              <StatusPill label="No matching rows" tone="warning" />
              <StatusPill label="Filters active" tone="info" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              No execution attempts match the current filters.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Adjust the status, real order, symbol, or source filters, then
              apply again.
            </p>

            <Link
              href="/execution-audit"
              className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
            >
              Reset filters
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Recent execution attempts
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ordered newest first from backend /execution/audit. Showing
                    filtered rows.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`${dryRunCount} dry-run`} tone="success" />
                  <StatusPill
                    label={`${filteredBlockedCount} blocked`}
                    tone="warning"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Time</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Symbol</th>
                    <th className="px-5 py-4">Side</th>
                    <th className="px-5 py-4">Notional</th>
                    <th className="px-5 py-4">Source</th>
                    <th className="px-5 py-4">Safety</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="align-top transition hover:bg-white/[0.035]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill
                          label={item.accepted ? "Accepted" : "Blocked"}
                          tone={item.accepted ? "success" : "warning"}
                        />
                      </td>

                      <td className="px-5 py-4 font-bold text-white">
                        {item.symbol || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-bold text-slate-200">
                          {item.side || "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-200">
                        {formatMoney(item.notional_usdt)}
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {item.source || "unknown"}
                      </td>

                      <td className="min-w-[320px] px-5 py-4">
                        <p className="text-xs leading-5 text-slate-400">
                          {item.reason || "No safety reason returned."}
                        </p>

                        {item.violations.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.violations.map((violation) => (
                              <span
                                key={violation}
                                className="rounded-full border border-red-400/25 bg-red-950/30 px-3 py-1 text-xs font-semibold text-red-100"
                              >
                                {violation}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {item.warnings.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.warnings.map((warning) => (
                              <span
                                key={warning}
                                className="rounded-full border border-amber-400/25 bg-amber-950/25 px-3 py-1 text-xs font-semibold text-amber-100"
                              >
                                {warning}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-950/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                            dry_run_only={String(item.dry_run_only)}
                          </span>

                          <span className="rounded-full border border-emerald-400/25 bg-emerald-950/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                            real_order_sent={String(item.real_order_sent)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </PremiumPageShell>
  );
}