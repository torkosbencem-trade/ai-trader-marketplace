"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getActiveTestRun,
  getBackendHealth,
  getExecutionStatus,
  getPerformanceSummary,
  getShadowLiveConfig,
  getShadowLivePerformance,
  getUserDashboardData,
} from "@/lib/api";

import {
  type AnyRecord,
  clamp,
  formatDate,
  formatInteger,
  formatMoney,
  formatPercent,
  getBoolean,
  getNumber,
  getValue,
  normalizeActiveRun,
  normalizeConfig,
  normalizeExecutionStatus,
  normalizeObject,
  normalizePerformance,
  normalizePercent,
} from "@/lib/marketplace-utils";

import {
  Card,
  CardHeader,
  LoadingBlock,
  MetricCard,
  PageHero,
  PremiumPageShell,
  ScoreBar,
  SecondaryLink,
  StatusPill,
  type Tone,
} from "@/components/ui/PremiumUI";

const PERFORMANCE_FALLBACK: AnyRecord = {
  total_pnl: 0,
  pnl: 0,
  net_pnl: 0,
  win_rate: 0,
  total_trades: 0,
  trades: 0,
};

const DASHBOARD_FALLBACK: AnyRecord = {
  strategies: 0,
  total_strategies: 0,
  signals: 0,
  total_signals: 0,
  performance: PERFORMANCE_FALLBACK,
};

const SHADOW_CONFIG_FALLBACK: AnyRecord = {
  emergency_stop: false,
  max_order_usdt: 0,
  max_risk_percent: 0,
};

const EXECUTION_STATUS_FALLBACK: AnyRecord = {
  mode: "DRY_RUN_ONLY",
  execution_mode: "DRY_RUN_ONLY",
  dry_run_only: true,
  real_order_sent: false,
  network_request_sent: false,
  binance_order_sent: false,
};

const BACKEND_HEALTH_FALLBACK: AnyRecord = {
  status: "unknown",
};

function toRecord(value: unknown, fallback: AnyRecord = {}): AnyRecord {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as AnyRecord;
  }

  return fallback;
}

function getSettledValue<T>(
  result: PromiseSettledResult<T>,
  fallback: unknown,
): unknown {
  return result.status === "fulfilled" ? result.value : fallback;
}

function getSettledRecord<T>(
  result: PromiseSettledResult<T>,
  fallback: AnyRecord,
): AnyRecord {
  return toRecord(getSettledValue(result, fallback), fallback);
}

function SystemStatusCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{helper}</p>
        </div>

        <StatusPill label={value} tone={tone} />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  tone: Tone;
}) {
  const hoverClassByTone: Record<Tone, string> = {
    success: "hover:border-emerald-400/40 hover:bg-emerald-400/10",
    warning: "hover:border-amber-400/40 hover:bg-amber-400/10",
    danger: "hover:border-rose-400/40 hover:bg-rose-400/10",
    neutral: "hover:border-slate-300/30 hover:bg-white/[0.07]",
    info: "hover:border-sky-400/40 hover:bg-sky-400/10",
  };

  const className = [
    "rounded-2xl",
    "border",
    "border-white/10",
    "bg-white/[0.035]",
    "p-5",
    "transition",
    hoverClassByTone[tone],
  ].join(" ");

  return (
    <Link href={href} className={className}>
      <StatusPill label={title} tone={tone} />
      <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
    </Link>
  );
}

function PipelineStep({
  label,
  title,
  description,
  tone,
}: {
  label: string;
  title: string;
  description: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <StatusPill label={label} tone={tone} />
      <p className="mt-4 font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [performanceData, setPerformanceData] =
    useState<AnyRecord>(PERFORMANCE_FALLBACK);

  const [dashboardData, setDashboardData] =
    useState<AnyRecord>(DASHBOARD_FALLBACK);

  const [activeRun, setActiveRun] = useState<AnyRecord | null>(null);

  const [shadowPerformanceData, setShadowPerformanceData] =
    useState<AnyRecord>(PERFORMANCE_FALLBACK);

  const [shadowConfig, setShadowConfig] =
    useState<AnyRecord>(SHADOW_CONFIG_FALLBACK);

  const [executionStatus, setExecutionStatus] =
    useState<AnyRecord>(EXECUTION_STATUS_FALLBACK);

  const [backendHealth, setBackendHealth] =
    useState<AnyRecord>(BACKEND_HEALTH_FALLBACK);

  const [error, setError] = useState<string | null>(null);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    const [
      performanceResult,
      dashboardResult,
      activeRunResult,
      shadowPerformanceResult,
      shadowConfigResult,
      executionStatusResult,
      backendHealthResult,
    ] = await Promise.allSettled([
      getPerformanceSummary(),
      getUserDashboardData(),
      getActiveTestRun(),
      getShadowLivePerformance(),
      getShadowLiveConfig(),
      getExecutionStatus(),
      getBackendHealth(),
    ]);

    setPerformanceData(
      getSettledRecord(performanceResult, PERFORMANCE_FALLBACK),
    );

    setDashboardData(getSettledRecord(dashboardResult, DASHBOARD_FALLBACK));

    setActiveRun(normalizeActiveRun(getSettledValue(activeRunResult, null)));

    setShadowPerformanceData(
      getSettledRecord(shadowPerformanceResult, PERFORMANCE_FALLBACK),
    );

    setShadowConfig(
      getSettledRecord(shadowConfigResult, SHADOW_CONFIG_FALLBACK),
    );

    setExecutionStatus(
      getSettledRecord(executionStatusResult, EXECUTION_STATUS_FALLBACK),
    );

    setBackendHealth(
      getSettledRecord(backendHealthResult, BACKEND_HEALTH_FALLBACK),
    );

    const hasRejected = [
      performanceResult,
      dashboardResult,
      activeRunResult,
      shadowPerformanceResult,
      shadowConfigResult,
      executionStatusResult,
      backendHealthResult,
    ].some((result) => result.status === "rejected");

    if (hasRejected) {
      setError("Néhány dashboard adat nem töltődött be, de az oldal működik.");
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const performance = normalizePerformance(performanceData);

  const dashboard = normalizeObject(dashboardData, [
    "dashboard",
    "summary",
    "data",
    "result",
  ]);

  const shadowPerformance = normalizePerformance(shadowPerformanceData);
  const config = normalizeConfig(shadowConfig);
  const execution = normalizeExecutionStatus(executionStatus);

  const health = normalizeObject(backendHealth, [
    "health",
    "status",
    "data",
    "result",
  ]);

  const totalPnl = getNumber(performance, [
    "total_pnl",
    "pnl",
    "net_pnl",
    "profit",
    "totalProfit",
  ]);

  const winRate = getNumber(performance, [
    "win_rate",
    "winRate",
    "success_rate",
    "accuracy",
  ]);

  const totalSignals = getNumber(dashboard, [
    "signals",
    "total_signals",
    "signal_count",
    "totalSignals",
  ]);

  const totalTrades = getNumber(performance, [
    "total_trades",
    "trades",
    "trade_count",
    "totalTrades",
  ]);

  const shadowPnl = getNumber(shadowPerformance, [
    "total_pnl",
    "pnl",
    "net_pnl",
    "profit",
  ]);

  const shadowWinRate = getNumber(shadowPerformance, [
    "win_rate",
    "winRate",
    "success_rate",
    "accuracy",
  ]);

  const shadowTrades = getNumber(shadowPerformance, [
    "total_trades",
    "trades",
    "trade_count",
  ]);

  const emergencyStop = getBoolean(
    config,
    ["emergency_stop", "emergencyStop"],
    false,
  );

  const maxOrderUsdt = getNumber(
    config,
    ["max_order_usdt", "maxOrderUsdt", "max_order_size"],
    100,
  );

  const maxRiskPercent = getNumber(
    config,
    ["max_risk_percent", "maxRiskPercent", "risk_percent"],
    1,
  );

  const dryRunOnly = getBoolean(
    execution,
    ["dry_run_only", "dryRunOnly", "dry_run", "dryRun"],
    true,
  );

  const realOrderSent = getBoolean(
    execution,
    ["real_order_sent", "realOrderSent", "real_order", "realOrder"],
    false,
  );

  const rawExecutionMode = getValue(
    execution,
    ["mode", "execution_mode", "executionMode", "status"],
    dryRunOnly ? "DRY_RUN_ONLY" : "UNKNOWN",
  );

  const executionMode = String(rawExecutionMode);

  const rawBackendStatus = getValue(
    health,
    ["status", "state", "message"],
    "unknown",
  );

  const backendStatus = String(rawBackendStatus);

  const backendOk = ["ok", "healthy", "running", "up"].includes(
    backendStatus.toLowerCase(),
  );

  const activeRunName = activeRun
    ? String(
        getValue(
          activeRun,
          ["strategy_name", "strategy", "name", "slug"],
          "Active validation run",
        ),
      )
    : "No active test run";

  const activeRunStatus = activeRun
    ? String(getValue(activeRun, ["status", "state"], "RUNNING"))
    : "IDLE";

  const activeRunStartedAt = activeRun
    ? getValue(
        activeRun,
        ["started_at", "created_at", "start_time", "timestamp"],
        null,
      )
    : null;

  const safetyScore = useMemo(() => {
    let score = 100;

    if (!dryRunOnly) score -= 35;
    if (realOrderSent) score -= 45;
    if (emergencyStop) score -= 15;
    if (!backendOk) score -= 10;

    return clamp(score);
  }, [dryRunOnly, realOrderSent, emergencyStop, backendOk]);

  const validationScore = useMemo(() => {
    const winRateScore = normalizePercent(winRate) * 0.5;
    const tradeScore = Math.min(totalTrades, 25);
    const signalScore = Math.min(totalSignals, 25);

    return clamp(winRateScore + tradeScore + signalScore);
  }, [winRate, totalTrades, totalSignals]);

  const shadowScore = useMemo(() => {
    const winRateScore = normalizePercent(shadowWinRate) * 0.45;
    const tradeScore = Math.min(shadowTrades * 4, 35);
    const pnlScore = shadowPnl > 0 ? 20 : 0;

    return clamp(winRateScore + tradeScore + pnlScore);
  }, [shadowWinRate, shadowTrades, shadowPnl]);

  const systemDecision =
    safetyScore < 70
      ? "Review safety controls"
      : validationScore < 45
        ? "Collect validation data"
        : shadowScore < 45
          ? "Monitor Shadow Live"
          : "Pipeline healthy";

  return (
    <PremiumPageShell>
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PageHero
          pills={[
            {
              label: dryRunOnly ? "Dry Run Only" : "Execution Unknown",
              tone: dryRunOnly ? "success" : "warning",
            },
            {
              label: emergencyStop ? "Emergency Stop Active" : "Safety OK",
              tone: emergencyStop ? "warning" : "success",
            },
            {
              label: realOrderSent ? "Real Order Sent" : "No Real Orders",
              tone: realOrderSent ? "danger" : "success",
            },
          ]}
          title="AI Trader Control Center"
          description="Central cockpit for marketplace signals, strategy validation, shadow-live monitoring and protected dry-run execution."
          actions={
            <>
              <Link
                href="/test-runs"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Start Validation
              </Link>

              <SecondaryLink href="/signals" tone="info">
                View Signals
              </SecondaryLink>

              <button
                type="button"
                onClick={loadDashboardData}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
              >
                Refresh
              </button>
            </>
          }
        />

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="System Decision"
            title={systemDecision}
            description="Based on backend health, order protection, validation depth and shadow-live maturity."
          />

          <div className="space-y-3 p-6">
            <div
              className={[
                "rounded-2xl",
                "border",
                "p-4",
                safetyScore >= 70
                  ? "border-emerald-400/20 bg-emerald-400/10"
                  : "border-amber-400/20 bg-amber-400/10",
              ].join(" ")}
            >
              <p
                className={
                  safetyScore >= 70
                    ? "text-sm font-semibold text-emerald-200"
                    : "text-sm font-semibold text-amber-200"
                }
              >
                {safetyScore >= 70
                  ? "Safety layer is protected"
                  : "Safety layer needs review"}
              </p>

              <p
                className={
                  safetyScore >= 70
                    ? "mt-2 text-sm leading-6 text-emerald-100/80"
                    : "mt-2 text-sm leading-6 text-amber-100/80"
                }
              >
                Real orders should remain blocked while validation and dry-run
                workflows mature.
              </p>
            </div>

            <SecondaryLink href="/execution" tone="warning">
              Open Execution Center
            </SecondaryLink>
          </div>
        </Card>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LoadingBlock />
          <LoadingBlock />
          <LoadingBlock />
          <LoadingBlock />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total PnL"
            value={formatMoney(totalPnl)}
            helper="Aggregated marketplace performance"
            tone={totalPnl >= 0 ? "success" : "danger"}
          />

          <MetricCard
            label="Win Rate"
            value={formatPercent(winRate)}
            helper="Overall validation success ratio"
            tone={normalizePercent(winRate) >= 50 ? "success" : "warning"}
          />

          <MetricCard
            label="Signals"
            value={formatInteger(totalSignals)}
            helper="Marketplace signal candidates"
            tone="info"
          />

          <MetricCard
            label="Trades"
            value={formatInteger(totalTrades)}
            helper="Total evaluated trade sample"
            tone="neutral"
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="System Overview"
            title="Runtime Status"
            description="Core operating state across backend, execution and risk governance."
            action={
              <StatusPill
                label={backendOk ? "Backend OK" : "Backend Unknown"}
                tone={backendOk ? "success" : "warning"}
              />
            }
          />

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <SystemStatusCard
              title="Backend"
              value={backendOk ? "Healthy" : "Unknown"}
              helper="FastAPI health endpoint status."
              tone={backendOk ? "success" : "warning"}
            />

            <SystemStatusCard
              title="Order Protection"
              value={realOrderSent ? "Review" : "Blocked"}
              helper="No real orders should be sent in current version."
              tone={realOrderSent ? "danger" : "success"}
            />

            <SystemStatusCard
              title="Current Mode"
              value={executionMode.toUpperCase()}
              helper="Execution backend mode."
              tone={dryRunOnly ? "success" : "warning"}
            />

            <SystemStatusCard
              title="Risk Cap"
              value={`${formatMoney(maxOrderUsdt)} / ${formatPercent(
                maxRiskPercent,
              )}`}
              helper="Max order and max risk limits."
              tone="info"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Quality"
            title="Readiness Scores"
            description="Internal workflow indicators for validation maturity."
            action={<StatusPill label="Not Trading Advice" tone="neutral" />}
          />

          <div className="space-y-4 p-6">
            <ScoreBar
              label="Safety"
              value={safetyScore}
              helper="Backend health, dry-run mode, real-order protection and emergency state."
              tone={safetyScore >= 70 ? "success" : "warning"}
            />

            <ScoreBar
              label="Validation"
              value={validationScore}
              helper="Signals, trades and win-rate evidence."
              tone={validationScore >= 60 ? "success" : "info"}
            />

            <ScoreBar
              label="Shadow Live"
              value={shadowScore}
              helper="Shadow trades, simulated win rate and shadow PnL."
              tone={shadowScore >= 60 ? "success" : "info"}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Active Run"
            title="Current Validation"
            description="The currently running test validation, if one exists."
            action={
              <StatusPill
                label={activeRun ? "Active" : "Idle"}
                tone={activeRun ? "success" : "neutral"}
              />
            }
          />

          <div className="p-6">
            <div
              className={[
                "rounded-2xl",
                "border",
                "p-5",
                activeRun
                  ? "border-emerald-400/20 bg-emerald-400/10"
                  : "border-white/10 bg-black/20",
              ].join(" ")}
            >
              <p className="text-2xl font-bold text-white">{activeRunName}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill
                  label={activeRunStatus.toUpperCase()}
                  tone={activeRun ? "success" : "neutral"}
                />

                <StatusPill
                  label={formatDate(activeRunStartedAt)}
                  tone="neutral"
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                {activeRun
                  ? "Monitor this validation run before promoting the strategy into Shadow Live."
                  : "No active validation run is currently detected."}
              </p>

              <Link
                href="/test-runs"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Open Test Runs
              </Link>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Shadow Live"
            title="Simulation Snapshot"
            description="Current simulated live performance summary."
            action={<StatusPill label="No Real Orders" tone="success" />}
          />

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs text-slate-500">Shadow PnL</p>
              <p className="mt-2 text-xl font-bold text-white">
                {formatMoney(shadowPnl)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs text-slate-500">Win Rate</p>
              <p className="mt-2 text-xl font-bold text-white">
                {formatPercent(shadowWinRate)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs text-slate-500">Trades</p>
              <p className="mt-2 text-xl font-bold text-white">
                {formatInteger(shadowTrades)}
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 p-6">
            <SecondaryLink href="/shadow-live" tone="warning">
              Open Shadow Live
            </SecondaryLink>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Quick Actions"
            title="Trading Workflow"
            description="Move through the validation-first operating pipeline."
          />

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <QuickAction
              href="/signals"
              title="Signals"
              description="Review marketplace signal candidates."
              tone="info"
            />

            <QuickAction
              href="/test-runs"
              title="Test Runs"
              description="Launch controlled strategy validation."
              tone="warning"
            />

            <QuickAction
              href="/shadow-live"
              title="Shadow Live"
              description="Observe simulated live strategy behavior."
              tone="success"
            />

            <QuickAction
              href="/execution"
              title="Execution"
              description="Submit protected dry-run order tests only."
              tone="neutral"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Promotion Pipeline"
            title="Decision Gate"
            description="Strategies should progress only after enough evidence is collected."
          />

          <div className="space-y-3 p-6">
            <PipelineStep
              label="Gate 1"
              title="Signal review"
              description="Check confidence, symbol, side and source strategy."
              tone="info"
            />

            <PipelineStep
              label="Gate 2"
              title="Controlled test run"
              description="Collect validation data before simulated live observation."
              tone="warning"
            />

            <PipelineStep
              label="Gate 3"
              title="Shadow Live monitoring"
              description="Observe behavior without routing real exchange orders."
              tone="success"
            />
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}