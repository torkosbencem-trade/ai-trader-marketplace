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

function getBoolean(source: AnyRecord, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
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
      "runs",
      "test_runs",
      "results",
      "history",
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

function formatDate(value: string) {
  if (value === "—") return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function getStatusTone(status: string): Tone {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("pass") ||
    normalized.includes("success") ||
    normalized.includes("complete") ||
    normalized.includes("approved")
  ) {
    return "success";
  }

  if (
    normalized.includes("running") ||
    normalized.includes("pending") ||
    normalized.includes("review")
  ) {
    return "warning";
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("blocked") ||
    normalized.includes("rejected")
  ) {
    return "danger";
  }

  return "neutral";
}

function getEligibilityTone(eligible: boolean): Tone {
  return eligible ? "success" : "warning";
}

function TestRunRow({ run }: { run: AnyRecord }) {
  const id = getValue(run, ["id", "run_id", "test_run_id"], "—");
  const strategy = getValue(
    run,
    ["strategy_name", "strategy", "strategy_id", "name"],
    "Unknown",
  );
  const symbol = getValue(run, ["symbol", "market", "pair"], "—").toUpperCase();
  const status = getValue(run, ["status", "state", "result"], "Review");
  const trades = getNumber(run, ["total_trades", "trades", "trade_count"], 0);
  const winRate = getNumber(run, ["win_rate", "winrate", "success_rate"], 0);
  const score = getNumber(
    run,
    ["promotion_score", "score", "validation_score"],
    0,
  );
  const eligible = getBoolean(
    run,
    ["eligible_for_shadow_live", "eligible_for_testnet", "eligible"],
    false,
  );
  const createdAt = getValue(run, ["created_at", "timestamp", "started_at"], "—");

  return (
    <tr className="border-b border-slate-800/70 transition hover:bg-slate-950/70">
      <td className="px-4 py-4 align-top">
        <p className="font-mono text-xs text-slate-500">{id}</p>
        <p className="mt-1 text-sm font-semibold text-slate-50">{strategy}</p>
      </td>

      <td className="px-4 py-4 align-top">
        <p className="text-sm font-semibold text-slate-100">{symbol}</p>
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={status} tone={getStatusTone(status)} />
      </td>

      <td className="px-4 py-4 align-top text-sm text-slate-300">
        {formatNumber(trades)}
      </td>

      <td className="px-4 py-4 align-top text-sm text-slate-300">
        {formatPercent(winRate)}
      </td>

      <td className="px-4 py-4 align-top text-sm text-slate-300">
        {formatNumber(score)}
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill
          label={eligible ? "Eligible" : "Review"}
          tone={getEligibilityTone(eligible)}
        />
      </td>

      <td className="px-4 py-4 align-top text-xs text-slate-500">
        {formatDate(createdAt)}
      </td>
    </tr>
  );
}

async function fetchTestRuns() {
  const endpoints = [
    "/test-runs",
    "/marketplace/test-runs",
    "/strategy-promotion/audit?limit=50",
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

  throw new Error(lastError ?? "Test run endpoint unavailable.");
}

export default function TestRunsPage() {
  const [data, setData] = useState<unknown>(null);
  const [runs, setRuns] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTestRuns() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchTestRuns();
      setData(response);
      setRuns(getArray(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test runs.");
      setData(null);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTestRuns();
  }, []);

  const aggregate = useMemo(() => {
    const passed = runs.filter((run) =>
      getStatusTone(getValue(run, ["status", "state", "result"], "")) ===
      "success",
    ).length;

    const failed = runs.filter((run) =>
      getStatusTone(getValue(run, ["status", "state", "result"], "")) ===
      "danger",
    ).length;

    const eligible = runs.filter((run) =>
      getBoolean(
        run,
        ["eligible_for_shadow_live", "eligible_for_testnet", "eligible"],
        false,
      ),
    ).length;

    const averageScore =
      runs.length > 0
        ? runs.reduce(
            (sum, run) =>
              sum +
              getNumber(run, ["promotion_score", "score", "validation_score"], 0),
            0,
          ) / runs.length
        : 0;

    return {
      passed,
      failed,
      eligible,
      averageScore,
    };
  }, [runs]);

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Validation History", tone: "info" },
            { label: "Promotion Required", tone: "warning" },
            { label: "No Auto Execution", tone: "success" },
          ]}
          title="Test Runs"
          description="Validation history for strategy candidates. Test runs help determine whether a strategy deserves deeper review, shadow-live validation or testnet consideration."
          actions={
            <>
              <button
                type="button"
                onClick={loadTestRuns}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Runs"}
              </button>

              <SecondaryLink href="/promotion" tone="neutral">
                Promotion Gate
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Runs"
            value={runs.length}
            helper="Loaded validation records."
            tone="info"
          />

          <MetricCard
            label="Passed"
            value={aggregate.passed}
            helper="Runs with successful status."
            tone="success"
          />

          <MetricCard
            label="Failed / Blocked"
            value={aggregate.failed}
            helper="Runs requiring investigation."
            tone={aggregate.failed > 0 ? "danger" : "neutral"}
          />

          <MetricCard
            label="Eligible"
            value={aggregate.eligible}
            helper="Candidates marked eligible for progression."
            tone="warning"
          />
        </div>

        <SafetyNotice
          title="Test run success is not live approval"
          tone="warning"
          description="A successful validation run does not enable live trading. Strategies must still pass promotion gate checks, audit review and protected dry-run execution before any future testnet or live path is considered."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader
              eyebrow="Validation Records"
              title="Test run history"
              description={
                runs.length > 0
                  ? `${runs.length} validation record(s) loaded.`
                  : "No validation records are currently available."
              }
            />

            <div className="p-5 sm:p-6">
              {loading ? (
                <LoadingBlock />
              ) : error ? (
                <EmptyState
                  title="Test runs unavailable"
                  description={error}
                  label="Load Error"
                  tone="danger"
                />
              ) : runs.length === 0 ? (
                <EmptyState
                  title="No test runs available"
                  description="Validation history will appear here once the backend returns test run or promotion audit records."
                  label="No Runs"
                  tone="neutral"
                />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full min-w-[980px] border-collapse text-left">
                    <thead className="border-b border-slate-800 bg-slate-950/70">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Strategy
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Market
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Trades
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Win Rate
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Score
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Eligibility
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {runs.map((run, index) => (
                        <TestRunRow
                          key={String(
                            run.id ??
                              run.run_id ??
                              run.test_run_id ??
                              run.audit_id ??
                              index,
                          )}
                          run={run}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionLabel>Validation Quality</SectionLabel>

            <div className="mt-5 space-y-4">
              <ScoreBar
                label="Average Score"
                value={Math.max(0, Math.min(100, aggregate.averageScore))}
                tone={
                  aggregate.averageScore >= 70
                    ? "success"
                    : aggregate.averageScore >= 45
                      ? "warning"
                      : "neutral"
                }
                helper="Average promotion or validation score across loaded runs."
              />

              <ScoreBar
                label="Eligibility Rate"
                value={
                  runs.length > 0
                    ? Math.round((aggregate.eligible / runs.length) * 100)
                    : 0
                }
                tone={aggregate.eligible > 0 ? "warning" : "neutral"}
                helper="Share of candidates marked eligible for progression."
              />

              <ScoreBar
                label="Execution Approval"
                value={0}
                tone="danger"
                helper="Test runs do not approve real order execution."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Recommended review path
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review test run stability, inspect promotion gate output, then
                validate through dry-run execution before considering shadow-live
                or testnet progression.
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Raw Data"
            title="Test run payload"
            description="Raw backend response for compatibility checks and debugging."
          />

          <div className="p-5 sm:p-6">
            <JsonPreview
              data={
                data ?? {
                  status: loading ? "loading" : "not_available",
                  message:
                    error ??
                    "Test run data has not been loaded or no endpoint returned data.",
                }
              }
            />
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}