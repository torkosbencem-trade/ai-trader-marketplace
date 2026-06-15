"use client";

import { FormEvent, useState } from "react";

import { evaluateStrategyPromotion } from "@/lib/api";
import {
  Card,
  CardHeader,
  JsonPreview,
  MetricCard,
  PageHero,
  PremiumPageShell,
  StatusPill,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

function isObject(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(data: unknown, key: string, fallback = "—") {
  if (!isObject(data)) return fallback;
  const value = data[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumber(data: unknown, key: string, fallback = 0) {
  if (!isObject(data)) return fallback;
  const value = data[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function getBoolean(data: unknown, key: string, fallback = false) {
  if (!isObject(data)) return fallback;
  const value = data[key];
  return value === true ? true : value === false ? false : fallback;
}

function getStringArray(data: unknown, key: string) {
  if (!isObject(data)) return [];
  const value = data[key];
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function getChecks(data: unknown): Record<string, boolean> {
  if (!isObject(data)) return {};
  const checks = data.checks;

  if (!isObject(checks)) return {};

  return Object.fromEntries(
    Object.entries(checks).map(([key, value]) => [key, value === true]),
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50 focus:bg-sky-400/5";

export default function PromotionPage() {
  const [strategyId, setStrategyId] = useState("trend-pulse-ai");
  const [strategyName, setStrategyName] = useState("Trend Pulse AI");
  const [totalTrades, setTotalTrades] = useState("75");
  const [winRate, setWinRate] = useState("54");
  const [profitFactor, setProfitFactor] = useState("1.45");
  const [maxDrawdown, setMaxDrawdown] = useState("9.5");
  const [totalPnl, setTotalPnl] = useState("320");

  const [result, setResult] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promotionScore = getNumber(result, "promotion_score", 0);
  const status = getString(result, "status", "not_evaluated");
  const recommendedNextStep = getString(result, "recommended_next_step", "Run an evaluation first.");
  const eligibleForShadowLive = getBoolean(result, "eligible_for_shadow_live");
  const eligibleForTestnet = getBoolean(result, "eligible_for_testnet");
  const blockedReasons = getStringArray(result, "blocked_reasons");
  const warnings = getStringArray(result, "warnings");
  const checks = getChecks(result);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        strategy_id: strategyId,
        strategy_name: strategyName,
        total_trades: Number(totalTrades),
        win_rate: Number(winRate),
        profit_factor: Number(profitFactor),
        max_drawdown_percent: Number(maxDrawdown),
        total_pnl: Number(totalPnl),
        dry_run_only: true,
        real_order_sent: false,
        gateway: "DRY_RUN_EXCHANGE_GATEWAY",
        gateway_available: true,
        audit_logging: true,
      };

      const response = await evaluateStrategyPromotion(payload);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Promotion evaluation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumPageShell>
      <PageHero
        pills={[
          { label: "Strategy Promotion", tone: "info" },
          { label: "Dry Run Gate", tone: "success" },
          {
            label: eligibleForTestnet ? "Testnet Review Ready" : "Not Promoted",
            tone: eligibleForTestnet ? "success" : "warning",
          },
        ]}
        title="Strategy Promotion Gate"
        description="Evaluate whether a strategy is ready to move from observation into shadow-live or Binance Testnet review. Mainnet remains disabled."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Promotion Score"
          value={`${promotionScore}%`}
          helper="Rule pass ratio"
          tone={promotionScore >= 80 ? "success" : promotionScore >= 50 ? "warning" : "danger"}
        />
        <MetricCard
          label="Shadow Live"
          value={String(eligibleForShadowLive)}
          helper="Can continue simulation"
          tone={eligibleForShadowLive ? "success" : "warning"}
        />
        <MetricCard
          label="Testnet Review"
          value={String(eligibleForTestnet)}
          helper="Never mainnet"
          tone={eligibleForTestnet ? "success" : "warning"}
        />
        <MetricCard
          label="Status"
          value={status}
          helper="Promotion gate state"
          tone={eligibleForTestnet ? "success" : status === "blocked" ? "danger" : "warning"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader
            eyebrow="Input"
            title="Evaluate Strategy"
            description="Enter performance metrics from backtest, paper trading, or shadow-live validation."
            action={
              <StatusPill
                label={submitting ? "Evaluating" : "Ready"}
                tone={submitting ? "warning" : "success"}
              />
            }
          />

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <label className="space-y-2 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Strategy ID
              </span>
              <input
                className={inputClassName}
                value={strategyId}
                onChange={(event) => setStrategyId(event.target.value)}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Strategy Name
              </span>
              <input
                className={inputClassName}
                value={strategyName}
                onChange={(event) => setStrategyName(event.target.value)}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Total Trades
              </span>
              <input
                className={inputClassName}
                type="number"
                value={totalTrades}
                onChange={(event) => setTotalTrades(event.target.value)}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Win Rate %
              </span>
              <input
                className={inputClassName}
                type="number"
                step="0.1"
                value={winRate}
                onChange={(event) => setWinRate(event.target.value)}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Profit Factor
              </span>
              <input
                className={inputClassName}
                type="number"
                step="0.01"
                value={profitFactor}
                onChange={(event) => setProfitFactor(event.target.value)}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Max Drawdown %
              </span>
              <input
                className={inputClassName}
                type="number"
                step="0.1"
                value={maxDrawdown}
                onChange={(event) => setMaxDrawdown(event.target.value)}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Total PnL
              </span>
              <input
                className={inputClassName}
                type="number"
                step="1"
                value={totalPnl}
                onChange={(event) => setTotalPnl(event.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {submitting ? "Evaluating..." : "Evaluate Promotion"}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Result"
            title="Promotion Decision"
            description="The gate explains what passed, what failed, and the next safe step."
          />

          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              {recommendedNextStep}
            </div>

            {blockedReasons.length > 0 ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
                <p className="font-bold text-rose-100">Blocked reasons</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-rose-100/80">
                  {blockedReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {warnings.length > 0 ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <p className="font-bold text-amber-100">Warnings</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/80">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-2">
              {Object.entries(checks).map(([key, passed]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                >
                  <span className="text-sm text-slate-300">{key}</span>
                  <StatusPill
                    label={passed ? "PASS" : "FAIL"}
                    tone={passed ? "success" : "danger"}
                  />
                </div>
              ))}
            </div>

            {result ? <JsonPreview data={result} /> : null}
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}