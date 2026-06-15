"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  evaluateAllStrategyPromotions,
  evaluateStrategyPromotion,
} from "@/lib/api";
import {
  Card,
  CardHeader,
  JsonPreview,
  PageHero,
  PremiumPageShell,
  StatusPill,
  type Tone,
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

  if (value === true) return true;
  if (value === false) return false;

  return fallback;
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

function getRecordArray(data: unknown, key: string): AnyRecord[] {
  if (!isObject(data)) return [];

  const value = data[key];

  if (!Array.isArray(value)) return [];

  return value.filter(isObject);
}

function getPromotionTone(status: string): Tone {
  if (status === "ready_for_testnet_review") return "success";
  if (status === "ready_for_shadow_live") return "warning";
  if (status === "blocked") return "danger";

  return "info";
}

function getRiskTierTone(riskTier: string): Tone {
  if (riskTier === "standard_testnet") return "success";
  if (riskTier === "conservative_testnet") return "warning";
  if (riskTier === "shadow_only") return "warning";
  if (riskTier === "blocked") return "danger";

  return "info";
}

function formatCheckLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace("minimum trades 30", "Minimum 30 trades")
    .replace("win rate at least 45", "Win rate ≥ 45%")
    .replace("profit factor at least 1 2", "Profit factor ≥ 1.2")
    .replace("max drawdown under 15", "Max drawdown < 15%")
    .replace("positive total pnl", "Positive PnL")
    .replace("dry run only", "Dry-run only")
    .replace("no real orders sent", "No real orders")
    .replace("dry run gateway", "Dry-run gateway")
    .replace("gateway available", "Gateway available")
    .replace("audit logging", "Audit logging");
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60 focus:bg-sky-400/5";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.16em] text-slate-500";

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className={labelClassName}>{label}</span>
      <input
        className={inputClassName}
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DecisionBadge({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        active
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
          : "border-amber-400/25 bg-amber-400/10 text-amber-100"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-lg font-black">{active ? "Approved" : "Hold"}</p>
    </div>
  );
}

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

  const [portfolioResult, setPortfolioResult] = useState<unknown>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const hasResult = result !== null;

  const promotionScore = hasResult
    ? getNumber(result, "promotion_score", 0)
    : 0;

  const promotionScoreLabel = hasResult ? String(promotionScore) : "—";

  const status = getString(result, "status", "not_evaluated");

  const recommendedNextStep = getString(
    result,
    "recommended_next_step",
    "Run an evaluation to generate a promotion decision.",
  );

  const riskTier = getString(result, "risk_tier", "not_evaluated");
  const suggestedMaxTestnetOrderUsdt = getNumber(
    result,
    "suggested_max_testnet_order_usdt",
    0,
  );
  const requiredAdditionalTrades = getNumber(
    result,
    "required_additional_trades",
    0,
  );
  const suggestedValidationDays = getNumber(
    result,
    "suggested_validation_days",
    0,
  );
  const promotionSummary = getString(
    result,
    "promotion_summary",
    "Run an evaluation to generate a risk recommendation.",
  );

  const eligibleForShadowLive = getBoolean(result, "eligible_for_shadow_live");
  const eligibleForTestnet = getBoolean(result, "eligible_for_testnet");
  const blockedReasons = getStringArray(result, "blocked_reasons");
  const warnings = getStringArray(result, "warnings");
  const checks = getChecks(result);
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  const portfolioResults = getRecordArray(portfolioResult, "results");
  const totalStrategies = getNumber(portfolioResult, "total_strategies", 0);
  const averagePromotionScore = getNumber(
    portfolioResult,
    "average_promotion_score",
    0,
  );
  const testnetReadyCount = getNumber(portfolioResult, "testnet_ready_count", 0);
  const shadowReadyCount = getNumber(portfolioResult, "shadow_ready_count", 0);
  const blockedCount = getNumber(portfolioResult, "blocked_count", 0);

  const scoreTone: Tone =
    promotionScore >= 80 ? "success" : promotionScore >= 50 ? "warning" : "danger";

  async function loadPortfolioPromotion() {
    setPortfolioLoading(true);
    setPortfolioError(null);

    try {
      const response = await evaluateAllStrategyPromotions({});
      setPortfolioResult(response);
    } catch (err) {
      setPortfolioError(
        err instanceof Error
          ? err.message
          : "Portfolio promotion overview failed.",
      );
    } finally {
      setPortfolioLoading(false);
    }
  }

  useEffect(() => {
    void loadPortfolioPromotion();
  }, []);

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
          { label: "Promotion Engine", tone: "info" },
          { label: "Dry-Run Protected", tone: "success" },
          {
            label: eligibleForTestnet ? "Testnet Review Ready" : "Mainnet Blocked",
            tone: eligibleForTestnet ? "success" : "warning",
          },
        ]}
        title="Strategy Promotion Gate"
        description="A decision cockpit for validating whether a strategy can move from observation into shadow-live or Binance Testnet review."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader
          eyebrow="Portfolio"
          title="Portfolio Promotion Overview"
          description="Batch evaluation across multiple strategies. This shows which strategies are blocked, shadow-live ready, or testnet-review ready."
          action={
            <StatusPill
              label={portfolioLoading ? "Loading" : "Batch Gate"}
              tone={portfolioLoading ? "warning" : "success"}
            />
          }
        />

        <div className="space-y-6 p-6">
          {portfolioError ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
              {portfolioError}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Strategies</p>
              <p className="mt-1 text-2xl font-black text-white">
                {totalStrategies}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Avg Score</p>
              <p className="mt-1 text-2xl font-black text-white">
                {averagePromotionScore}%
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs text-emerald-100/70">Testnet Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">
                {testnetReadyCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="text-xs text-amber-100/70">Shadow Ready</p>
              <p className="mt-1 text-2xl font-black text-amber-100">
                {shadowReadyCount}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
              <p className="text-xs text-rose-100/70">Blocked</p>
              <p className="mt-1 text-2xl font-black text-rose-100">
                {blockedCount}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-[1.4fr_0.6fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <span>Strategy</span>
              <span>Score</span>
              <span>Status</span>
              <span>Risk Tier</span>
              <span>Next Gate</span>
            </div>

            {portfolioResults.length > 0 ? (
              <div className="divide-y divide-white/10">
                {portfolioResults.map((item) => {
                  const itemId = getString(item, "strategy_id");
                  const itemName = getString(item, "strategy_name");
                  const itemStatus = getString(item, "status");
                  const itemScore = getNumber(item, "promotion_score", 0);
                  const itemRiskTier = getString(item, "risk_tier");
                  const itemTestnet = getBoolean(item, "eligible_for_testnet");
                  const itemShadow = getBoolean(
                    item,
                    "eligible_for_shadow_live",
                  );

                  return (
                    <div
                      key={itemId}
                      className="grid grid-cols-[1.4fr_0.6fr_0.8fr_0.8fr_0.8fr] items-center gap-3 px-4 py-4"
                    >
                      <div>
                        <p className="font-bold text-white">{itemName}</p>
                        <p className="mt-1 text-xs text-slate-500">{itemId}</p>
                      </div>

                      <p className="text-sm font-black text-white">
                        {itemScore}%
                      </p>

                      <StatusPill
                        label={itemStatus}
                        tone={getPromotionTone(itemStatus)}
                      />

                      <StatusPill
                        label={itemRiskTier}
                        tone={getRiskTierTone(itemRiskTier)}
                      />

                      <StatusPill
                        label={
                          itemTestnet
                            ? "Testnet Review"
                            : itemShadow
                              ? "Shadow Live"
                              : "Blocked"
                        }
                        tone={
                          itemTestnet
                            ? "success"
                            : itemShadow
                              ? "warning"
                              : "danger"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-400">
                No portfolio promotion data loaded yet.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={loadPortfolioPromotion}
            disabled={portfolioLoading}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            {portfolioLoading ? "Refreshing..." : "Refresh Portfolio Overview"}
          </button>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <Card>
          <CardHeader
            eyebrow="Decision"
            title="Promotion Verdict"
            description="The gate checks performance, drawdown, execution safety, and audit readiness."
            action={<StatusPill label={status} tone={scoreTone} />}
          />

          <div className="space-y-6 p-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Current Strategy
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-white">
                    {strategyName}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">{strategyId}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusPill
                      label={
                        eligibleForShadowLive
                          ? "Shadow Live Ready"
                          : "Shadow Hold"
                      }
                      tone={eligibleForShadowLive ? "success" : "warning"}
                    />

                    <StatusPill
                      label={
                        eligibleForTestnet
                          ? "Testnet Review Ready"
                          : "Testnet Hold"
                      }
                      tone={eligibleForTestnet ? "success" : "warning"}
                    />

                    <StatusPill label="Mainnet Disabled" tone="danger" />
                  </div>
                </div>

                <div
                  className="grid h-36 w-36 shrink-0 place-items-center rounded-full p-2 md:h-40 md:w-40"
                  style={{
                    background: hasResult
                      ? `conic-gradient(rgb(56 189 248) ${
                          promotionScore * 3.6
                        }deg, rgba(255,255,255,0.08) 0deg)`
                      : "linear-gradient(135deg, rgba(148,163,184,0.18), rgba(15,23,42,0.92))",
                  }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full border border-white/10 bg-slate-950 text-center shadow-2xl shadow-black/40">
                    <div>
                      <p className="text-4xl font-black text-white md:text-5xl">
                        {promotionScoreLabel}
                      </p>

                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        {hasResult ? "Score" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <DecisionBadge
                label="Shadow Live"
                active={eligibleForShadowLive}
              />

              <DecisionBadge
                label="Testnet Review"
                active={eligibleForTestnet}
              />
            </div>

                        <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-100/70">
                  Risk Tier
                </p>
                <div className="mt-3">
                  <StatusPill label={riskTier} tone={getRiskTierTone(riskTier)} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Max Testnet Order</p>
                <p className="mt-1 text-xl font-black text-white">
                  ${suggestedMaxTestnetOrderUsdt}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">More Trades Needed</p>
                <p className="mt-1 text-xl font-black text-white">
                  {requiredAdditionalTrades}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Validation Days</p>
                <p className="mt-1 text-xl font-black text-white">
                  {suggestedValidationDays}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Promotion Summary
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-200">
                {promotionSummary}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Recommended Next Step
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-200">
                {recommendedNextStep}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Trades</p>
                <p className="mt-1 text-xl font-black text-white">
                  {totalTrades}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Win Rate</p>
                <p className="mt-1 text-xl font-black text-white">
                  {winRate}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Profit Factor</p>
                <p className="mt-1 text-xl font-black text-white">
                  {profitFactor}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Drawdown</p>
                <p className="mt-1 text-xl font-black text-white">
                  {maxDrawdown}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Input"
            title="Strategy Metrics"
            description="Enter validation metrics. Execution safety values remain locked to dry-run mode."
            action={
              <StatusPill
                label={submitting ? "Evaluating" : "Ready"}
                tone={submitting ? "warning" : "success"}
              />
            }
          />

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Strategy ID"
                value={strategyId}
                onChange={setStrategyId}
              />

              <Field
                label="Strategy Name"
                value={strategyName}
                onChange={setStrategyName}
              />

              <Field
                label="Total Trades"
                value={totalTrades}
                onChange={setTotalTrades}
                type="number"
              />

              <Field
                label="Win Rate %"
                value={winRate}
                onChange={setWinRate}
                type="number"
                step="0.1"
              />

              <Field
                label="Profit Factor"
                value={profitFactor}
                onChange={setProfitFactor}
                type="number"
                step="0.01"
              />

              <Field
                label="Max Drawdown %"
                value={maxDrawdown}
                onChange={setMaxDrawdown}
                type="number"
                step="0.1"
              />

              <Field
                label="Total PnL"
                value={totalPnl}
                onChange={setTotalPnl}
                type="number"
                step="1"
              />
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-sm font-bold text-emerald-100">
                Safety lock active
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                dry_run_only=true, gateway=DRY_RUN_EXCHANGE_GATEWAY,
                real_order_sent=false, audit_logging=true.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {submitting ? "Evaluating Strategy..." : "Evaluate Promotion"}
            </button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader
            eyebrow="Validation"
            title="Promotion Checks"
            description={
              totalChecks
                ? `${passedChecks}/${totalChecks} checks passed.`
                : "Run an evaluation to see all checks."
            }
          />

          <div className="grid gap-3 p-6 md:grid-cols-2">
            {Object.entries(checks).length > 0 ? (
              Object.entries(checks).map(([key, passed]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${
                    passed
                      ? "border-emerald-400/20 bg-emerald-400/10"
                      : "border-rose-400/20 bg-rose-500/10"
                  }`}
                >
                  <span className="text-sm font-medium text-slate-200">
                    {formatCheckLabel(key)}
                  </span>

                  <StatusPill
                    label={passed ? "PASS" : "FAIL"}
                    tone={passed ? "success" : "danger"}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-sm text-slate-400 md:col-span-2">
                No evaluation yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Notes"
            title="Warnings & Blocks"
            description="Reasons are separated so the next fix is obvious."
          />

          <div className="space-y-4 p-6">
            {hasResult && blockedReasons.length > 0 ? (
              <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5">
                <p className="font-bold text-rose-100">Blocked reasons</p>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-rose-100/80">
                  {blockedReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : hasResult ? (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="font-bold text-emerald-100">No hard blocks</p>

                <p className="mt-2 text-sm text-emerald-100/75">
                  The current result has no blocking reason.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <p className="font-bold text-slate-200">No decision yet</p>

                <p className="mt-2 text-sm text-slate-400">
                  Run an evaluation to see warnings and blocking reasons.
                </p>
              </div>
            )}

            {hasResult && warnings.length > 0 ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
                <p className="font-bold text-amber-100">Warnings</p>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/80">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : hasResult ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <p className="font-bold text-slate-200">No warnings</p>

                <p className="mt-2 text-sm text-slate-400">
                  The current result has no warning.
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      {result ? (
        <Card>
          <CardHeader
            eyebrow="Raw Decision"
            title="Promotion API Response"
            description="Developer view for debugging the backend gate response."
          />

          <div className="p-6">
            <JsonPreview data={result} />
          </div>
        </Card>
      ) : null}
    </PremiumPageShell>
  );
} 