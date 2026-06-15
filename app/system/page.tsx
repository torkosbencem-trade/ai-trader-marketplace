"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BinanceTestnetStatusCard } from "@/components/system/BinanceTestnetStatusCard";
import { ExecutionGatewayStatusCard } from "@/components/system/ExecutionGatewayStatusCard";

import {
  getBackendHealth,
  getExecutionStatus,
  getPerformanceSummary,
  getShadowLiveConfig,
  getShadowLivePerformance,
} from "@/lib/api";

import {
  type AnyRecord,
  clamp,
  formatAbsoluteMoney,
  formatInteger,
  formatMoney,
  formatPercent,
  getBoolean,
  getNumber,
  getValue,
  normalizeConfig,
  normalizeExecutionStatus,
  normalizeObject,
  normalizePerformance,
  normalizePercent,
  resolveSettled,
} from "@/lib/marketplace-utils";

import {
  Card,
  CardHeader,
  JsonPreview,
  LoadingBlock,
  MetricCard,
  PageHero,
  PremiumPageShell,
  ScoreBar,
  SecondaryLink,
  StatusPill,
  type Tone,
} from "@/components/ui/PremiumUI";

function StatusRow({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{helper}</p>
      </div>

      <StatusPill label={value} tone={tone} />
    </div>
  );
}

function SystemGate({
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

export default function SystemPage() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<AnyRecord>({});
  const [executionData, setExecutionData] = useState<AnyRecord>({});
  const [configData, setConfigData] = useState<AnyRecord>({});
  const [performanceData, setPerformanceData] = useState<AnyRecord>({});
  const [shadowPerformanceData, setShadowPerformanceData] =
    useState<AnyRecord>({});
  const [error, setError] = useState<string | null>(null);

  async function loadSystemData() {
    setLoading(true);
    setError(null);

    const [
      healthResult,
      executionResult,
      configResult,
      performanceResult,
      shadowPerformanceResult,
    ] = await Promise.allSettled([
      getBackendHealth(),
      getExecutionStatus(),
      getShadowLiveConfig(),
      getPerformanceSummary(),
      getShadowLivePerformance(),
    ]);

    setHealthData(resolveSettled(healthResult, { status: "unknown", message: "Backend health not loaded." }));
    setExecutionData(resolveSettled(executionResult, { status: "unknown", mode: "DRY_RUN_ONLY", dry_run_only: true, real_order_sent: false, binance_order_sent: false, network_request_sent: false }));
    setConfigData(resolveSettled(configResult, { emergency_stop: false, max_order_usdt: 100, max_risk_percent: 1 }));
    setPerformanceData(resolveSettled(performanceResult, { total_pnl: 0, pnl: 0, net_pnl: 0, win_rate: 0, total_trades: 0, trades: 0 }));
    setShadowPerformanceData(resolveSettled(shadowPerformanceResult, { total_pnl: 0, pnl: 0, net_pnl: 0, win_rate: 0, total_trades: 0, trades: 0 }));

    const hasRejected = [
      healthResult,
      executionResult,
      configResult,
      performanceResult,
      shadowPerformanceResult,
    ].some((result) => result.status === "rejected");

    if (hasRejected) {
      setError("NĂ©hĂˇny system adat nem tĂ¶ltĹ‘dĂ¶tt be, de az oldal mĹ±kĂ¶dik.");
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadSystemData();
  }, []);

  const health = normalizeObject(healthData, [
    "health",
    "status",
    "data",
    "result",
  ]);

  const execution = normalizeExecutionStatus(executionData);
  const config = normalizeConfig(configData);
  const performance = normalizePerformance(performanceData);
  const shadowPerformance = normalizePerformance(shadowPerformanceData);

  const backendStatus = getValue<string>(
    health,
    ["status", "state", "message"],
    "unknown",
  );

  const backendOk = ["ok", "healthy", "running", "up"].includes(
    String(backendStatus).toLowerCase(),
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

  const executionMode = getValue<string>(
    execution,
    ["mode", "execution_mode", "executionMode", "status"],
    dryRunOnly ? "DRY_RUN_ONLY" : "UNKNOWN",
  );

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

  const totalPnl = getNumber(performance, [
    "total_pnl",
    "pnl",
    "net_pnl",
    "profit",
  ]);

  const winRate = getNumber(performance, [
    "win_rate",
    "winRate",
    "success_rate",
    "accuracy",
  ]);

  const totalTrades = getNumber(performance, [
    "total_trades",
    "trades",
    "trade_count",
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

  const safetyScore = useMemo(() => {
    let score = 100;

    if (!backendOk) score -= 15;
    if (!dryRunOnly) score -= 35;
    if (realOrderSent) score -= 50;
    if (emergencyStop) score -= 15;

    return clamp(score);
  }, [backendOk, dryRunOnly, realOrderSent, emergencyStop]);

  const performanceScore = useMemo(() => {
    return clamp(
      normalizePercent(winRate) * 0.55 +
        Math.min(totalTrades, 25) +
        (totalPnl > 0 ? 20 : 0),
    );
  }, [winRate, totalTrades, totalPnl]);

  const shadowScore = useMemo(() => {
    return clamp(
      normalizePercent(shadowWinRate) * 0.5 +
        Math.min(shadowTrades * 5, 30) +
        (shadowPnl > 0 ? 20 : 0),
    );
  }, [shadowWinRate, shadowTrades, shadowPnl]);

  const systemState =
    realOrderSent || !dryRunOnly
      ? "Execution Review Required"
      : emergencyStop
        ? "Emergency Stop Active"
        : !backendOk
          ? "Backend Unknown"
          : "System Protected";

  const systemTone: Tone =
    realOrderSent || !dryRunOnly
      ? "danger"
      : emergencyStop || !backendOk
        ? "warning"
        : "success";

  const debugData = {
    backend_health: healthData,
    execution_status: executionData,
    shadow_live_config: configData,
    performance: performanceData,
    shadow_performance: shadowPerformanceData,
  };

  return (
    <PremiumPageShell>
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PageHero
          pills={[
            { label: "System Status", tone: "info" },
            { label: systemState, tone: systemTone },
            {
              label: realOrderSent ? "Real Order Flag" : "No Real Orders",
              tone: realOrderSent ? "danger" : "success",
            },
          ]}
          title="System Health Center"
          description="Operational overview for backend health, execution safeguards, Shadow Live configuration and marketplace performance state."
          actions={
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Back to Dashboard
              </Link>

              <SecondaryLink href="/execution" tone="warning">
                Execution Center
              </SecondaryLink>

              <button
                type="button"
                onClick={loadSystemData}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:border-sky-400/40 hover:bg-sky-400/10"
              >
                Refresh System
              </button>
            </>
          }
        />

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Operating State"
            title={systemState}
            description="System decision based on backend, execution and safety configuration."
            action={<StatusPill label={systemState} tone={systemTone} />}
          />

          <div className="space-y-3 p-6">
            <div
              className={`rounded-2xl border p-4 ${
                systemTone === "success"
                  ? "border-emerald-400/20 bg-emerald-400/10"
                  : systemTone === "danger"
                    ? "border-rose-400/20 bg-rose-400/10"
                    : "border-amber-400/20 bg-amber-400/10"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  systemTone === "success"
                    ? "text-emerald-200"
                    : systemTone === "danger"
                      ? "text-rose-200"
                      : "text-amber-200"
                }`}
              >
                {systemState}
              </p>

              <p
                className={`mt-2 text-sm leading-6 ${
                  systemTone === "success"
                    ? "text-emerald-100/80"
                    : systemTone === "danger"
                      ? "text-rose-100/80"
                      : "text-amber-100/80"
                }`}
              >
                {systemTone === "success"
                  ? "Dry-run protection is active and no real order flag is detected."
                  : "Review the affected safety layer before continuing execution tests."}
              </p>
            </div>

            <SecondaryLink href="/shadow-live" tone="info">
              Review Shadow Live
            </SecondaryLink>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <ExecutionGatewayStatusCard />
        <BinanceTestnetStatusCard />
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {error}
        </div>
      )}

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
            label="Backend"
            value={backendOk ? "Healthy" : "Unknown"}
            helper={`Health endpoint: ${String(backendStatus)}`}
            tone={backendOk ? "success" : "warning"}
          />

          <MetricCard
            label="Execution Mode"
            value={String(executionMode).toUpperCase()}
            helper="Current execution backend status"
            tone={dryRunOnly ? "success" : "warning"}
          />

          <MetricCard
            label="Max Order"
            value={formatAbsoluteMoney(maxOrderUsdt)}
            helper="Configured Shadow Live risk cap"
            tone="info"
          />

          <MetricCard
            label="Real Orders"
            value={realOrderSent ? "Detected" : "Blocked"}
            helper="Runtime real-order safety flag"
            tone={realOrderSent ? "danger" : "success"}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Health Checks"
            title="Safety Checklist"
            description="Critical checks for the current validation-first operating mode."
            action={<StatusPill label="Dry-Run Governance" tone="success" />}
          />

          <div className="space-y-3 p-6">
            <StatusRow
              label="Backend Health"
              value={backendOk ? "Healthy" : "Unknown"}
              helper="FastAPI backend health endpoint availability."
              tone={backendOk ? "success" : "warning"}
            />

            <StatusRow
              label="Dry Run Mode"
              value={dryRunOnly ? "Enabled" : "Not Confirmed"}
              helper="Execution should remain dry-run only in the current version."
              tone={dryRunOnly ? "success" : "danger"}
            />

            <StatusRow
              label="Real Order Protection"
              value={realOrderSent ? "Review" : "Blocked"}
              helper="Real exchange orders must remain blocked until later safety phases."
              tone={realOrderSent ? "danger" : "success"}
            />

            <StatusRow
              label="Emergency Stop"
              value={emergencyStop ? "Active" : "Inactive"}
              helper="Emergency stop blocks promotion and execution testing."
              tone={emergencyStop ? "warning" : "success"}
            />

            <StatusRow
              label="Risk Guardrails"
              value={`${formatAbsoluteMoney(maxOrderUsdt)} / ${formatPercent(
                maxRiskPercent,
                2,
              )}`}
              helper="Configured max order size and max risk percent."
              tone="info"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Readiness"
            title="System Scores"
            description="Internal readiness indicators for system monitoring."
            action={<StatusPill label="Monitoring" tone="info" />}
          />

          <div className="space-y-4 p-6">
            <ScoreBar
              label="Safety"
              value={safetyScore}
              helper="Backend health, dry-run mode, real-order flag and emergency stop state."
              tone={safetyScore >= 80 ? "success" : "warning"}
            />

            <ScoreBar
              label="Marketplace Performance"
              value={performanceScore}
              helper="Based on win rate, trade sample and positive PnL."
              tone={performanceScore >= 65 ? "success" : "info"}
            />

            <ScoreBar
              label="Shadow Live"
              value={shadowScore}
              helper="Based on simulated trades, shadow win rate and shadow PnL."
              tone={shadowScore >= 65 ? "success" : "info"}
            />
          </div>
        </Card>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Performance Snapshot"
            title="Marketplace And Shadow Performance"
            description="Current performance indicators from marketplace and Shadow Live layers."
          />

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <StatusPill label="Marketplace" tone="info" />

              <p className="mt-5 text-3xl font-bold text-white">
                {formatMoney(totalPnl)}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {formatPercent(winRate)} win rate Â·{" "}
                {formatInteger(totalTrades)} trades
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <StatusPill label="Shadow Live" tone="success" />

              <p className="mt-5 text-3xl font-bold text-white">
                {formatMoney(shadowPnl)}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {formatPercent(shadowWinRate)} win rate Â·{" "}
                {formatInteger(shadowTrades)} simulated trades
              </p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="System Gates"
            title="Recommended Operating Gates"
            description="Keep these gates in place before any future testnet phase."
          />

          <div className="space-y-3 p-6">
            <SystemGate
              label="Gate 1"
              title="Backend must be healthy"
              description="Avoid execution testing while backend status is unknown."
              tone="info"
            />

            <SystemGate
              label="Gate 2"
              title="Dry-run only must be confirmed"
              description="Do not proceed if the execution status does not confirm dry-run mode."
              tone="warning"
            />

            <SystemGate
              label="Gate 3"
              title="No real order flag"
              description="Any real order flag requires immediate review before continuing."
              tone="success"
            />
          </div>
        </Card>
      </section>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          eyebrow="Debug"
          title="Raw System Response"
          description="Combined API responses for quick frontend/backend verification."
          action={<StatusPill label="Developer View" tone="neutral" />}
        />

        <div className="p-6">
          <JsonPreview data={debugData} />
        </div>
      </Card>
    </PremiumPageShell>
  );
}


