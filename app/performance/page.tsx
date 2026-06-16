"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardHeader,
  EmptyState,
  JsonPreview,
  LoadingBlock,
  MetricCard,
  PageHero,
  PremiumPageShell,
  SafetyNotice,
  ScoreBar,
  SecondaryLink,
  SectionLabel,
  StatusPill,
  type Tone,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8005";

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValue(source: AnyRecord, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
  }

  return fallback;
}

function getNumber(source: AnyRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function getArray(source: unknown): AnyRecord[] {
  if (Array.isArray(source)) {
    return source.filter(isRecord);
  }

  if (isRecord(source)) {
    const possibleKeys = [
      "items",
      "data",
      "performance",
      "strategies",
      "results",
      "rows",
    ];

    for (const key of possibleKeys) {
      const value = source[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }

  return [];
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function formatMoney(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";

  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function getPnlTone(value: number): Tone {
  if (value > 0) return "success";
  if (value < 0) return "danger";
  return "neutral";
}

function getWinRateTone(value: number): Tone {
  if (value >= 60) return "success";
  if (value >= 45) return "warning";
  if (value > 0) return "danger";
  return "neutral";
}

function getRiskTone(value: string): Tone {
  const normalized = value.toLowerCase();

  if (normalized.includes("low") || normalized.includes("safe")) return "success";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "warning";
  if (normalized.includes("high") || normalized.includes("danger")) return "danger";

  return "neutral";
}

function StrategyRow({ item }: { item: AnyRecord }) {
  const name = getValue(item, ["strategy_name", "strategy", "name", "id"], "Unknown");
  const symbol = getValue(item, ["symbol", "market", "pair"], "—").toUpperCase();
  const trades = getNumber(item, ["total_trades", "trades", "trade_count"], 0);
  const winRate = getNumber(item, ["win_rate", "winrate", "success_rate"], 0);
  const pnl = getNumber(item, ["total_pnl", "net_pnl", "pnl", "profit"], 0);
  const drawdown = getNumber(item, ["max_drawdown", "drawdown"], 0);
  const risk = getValue(item, ["risk_tier", "risk", "risk_status"], "Review");
  const status = getValue(item, ["status", "state"], "Tracked");

  return (
    <tr className="border-b border-slate-800/70 transition hover:bg-slate-950/70">
      <td className="px-4 py-4 align-top">
        <p className="text-sm font-semibold text-slate-50">{name}</p>
        <p className="mt-1 text-xs text-slate-500">{symbol}</p>
      </td>

      <td className="px-4 py-4 align-top text-sm text-slate-300">
        {formatNumber(trades)}
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={formatPercent(winRate)} tone={getWinRateTone(winRate)} />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={formatMoney(pnl)} tone={getPnlTone(pnl)} />
      </td>

      <td className="px-4 py-4 align-top text-sm text-slate-300">
        {formatPercent(drawdown)}
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={risk} tone={getRiskTone(risk)} />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={status} tone="neutral" />
      </td>
    </tr>
  );
}

async function fetchPerformance() {
  const endpoints = [
    "/marketplace/performance",
    "/performance",
    "/analytics/performance",
  ];

  let lastError: string | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        lastError = `${endpoint}: HTTP ${response.status}`;
        continue;
      }

      return await response.json();
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Request failed";
    }
  }

  throw new Error(lastError ?? "Performance endpoint unavailable.");
}

export default function PerformancePage() {
  const [data, setData] = useState<unknown>(null);
  const [rows, setRows] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPerformance() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchPerformance();
      setData(response);
      setRows(getArray(response));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load performance data.",
      );
      setData(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerformance();
  }, []);

  const aggregate = useMemo(() => {
    const source = isRecord(data) ? data : {};

    const totalPnl =
      getNumber(source, ["total_pnl", "net_pnl", "pnl"], 0) ||
      rows.reduce(
        (sum, row) => sum + getNumber(row, ["total_pnl", "net_pnl", "pnl"], 0),
        0,
      );

    const totalTrades =
      getNumber(source, ["total_trades", "trades", "trade_count"], 0) ||
      rows.reduce(
        (sum, row) =>
          sum + getNumber(row, ["total_trades", "trades", "trade_count"], 0),
        0,
      );

    const winRates = rows
      .map((row) => getNumber(row, ["win_rate", "winrate", "success_rate"], 0))
      .filter((value) => value > 0);

    const averageWinRate =
      getNumber(source, ["win_rate", "average_win_rate", "success_rate"], 0) ||
      (winRates.length > 0
        ? winRates.reduce((sum, value) => sum + value, 0) / winRates.length
        : 0);

    const maxDrawdown =
      getNumber(source, ["max_drawdown", "drawdown"], 0) ||
      rows.reduce(
        (max, row) =>
          Math.max(max, getNumber(row, ["max_drawdown", "drawdown"], 0)),
        0,
      );

    return {
      totalPnl,
      totalTrades,
      averageWinRate,
      maxDrawdown,
    };
  }, [data, rows]);

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Performance Analytics", tone: "info" },
            { label: "Validation First", tone: "success" },
            { label: "No Auto Promotion", tone: "warning" },
          ]}
          title="Performance"
          description="Trading analytics surface for reviewing strategy quality, drawdown, win rate and profitability before any promotion decision. Performance data should inform validation, not bypass safety gates."
          actions={
            <>
              <button
                type="button"
                onClick={loadPerformance}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Performance"}
              </button>

              <SecondaryLink href="/promotion" tone="neutral">
                Promotion Gate
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total PnL"
            value={formatMoney(aggregate.totalPnl)}
            helper="Aggregated performance result."
            tone={getPnlTone(aggregate.totalPnl)}
          />

          <MetricCard
            label="Total Trades"
            value={formatNumber(aggregate.totalTrades)}
            helper="Total validated or tracked trades."
            tone="info"
          />

          <MetricCard
            label="Average Win Rate"
            value={formatPercent(aggregate.averageWinRate)}
            helper="Average strategy win-rate estimate."
            tone={getWinRateTone(aggregate.averageWinRate)}
          />

          <MetricCard
            label="Max Drawdown"
            value={formatPercent(aggregate.maxDrawdown)}
            helper="Largest reported drawdown."
            tone={aggregate.maxDrawdown > 20 ? "danger" : aggregate.maxDrawdown > 10 ? "warning" : "success"}
          />
        </div>

        <SafetyNotice
          title="Performance does not equal execution approval"
          tone="warning"
          description="Positive performance metrics should not automatically promote a strategy. Every candidate still needs risk checks, promotion gate evaluation, audit review and protected dry-run validation."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader
              eyebrow="Strategy Analytics"
              title="Performance table"
              description={
                rows.length > 0
                  ? `${rows.length} strategy performance row(s) loaded.`
                  : "No strategy-level performance rows are currently available."
              }
            />

            <div className="p-5 sm:p-6">
              {loading ? (
                <LoadingBlock />
              ) : error ? (
                <EmptyState
                  title="Performance unavailable"
                  description={error}
                  label="Load Error"
                  tone="danger"
                />
              ) : rows.length === 0 ? (
                <EmptyState
                  title="No performance rows available"
                  description="The backend did not return strategy-level performance rows. Raw aggregate data will still be shown below if available."
                  label="No Rows"
                  tone="neutral"
                />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full min-w-[920px] border-collapse text-left">
                    <thead className="border-b border-slate-800 bg-slate-950/70">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Strategy
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Trades
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Win Rate
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          PnL
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Drawdown
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Risk
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, index) => (
                        <StrategyRow
                          key={String(
                            row.id ??
                              row.strategy_id ??
                              row.strategy_name ??
                              row.strategy ??
                              index,
                          )}
                          item={row}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionLabel>Analytics Confidence</SectionLabel>

            <div className="mt-5 space-y-4">
              <ScoreBar
                label="Data Coverage"
                value={rows.length > 0 ? 78 : data ? 42 : 0}
                tone={rows.length > 0 ? "info" : data ? "warning" : "neutral"}
                helper="Measures whether strategy-level rows are available."
              />

              <ScoreBar
                label="Risk Awareness"
                value={86}
                tone="warning"
                helper="Performance review should always include drawdown and risk checks."
              />

              <ScoreBar
                label="Execution Approval"
                value={0}
                tone="danger"
                helper="Performance analytics do not approve real execution."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Review logic
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use this page to identify promising candidates, then move to the
                promotion gate for explicit eligibility checks.
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Raw Data"
            title="Performance payload"
            description="Raw backend response for compatibility checks and debugging."
          />

          <div className="p-5 sm:p-6">
            <JsonPreview
              data={
                data ?? {
                  status: loading ? "loading" : "not_available",
                  message:
                    error ??
                    "Performance data has not been loaded or no endpoint returned data.",
                }
              }
            />
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}