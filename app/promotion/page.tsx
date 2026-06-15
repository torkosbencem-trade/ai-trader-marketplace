"use client";

import { FormEvent, useState } from "react";

import { evaluateStrategyPromotion } from "@/lib/api";
import {
  Card,
  CardHeader,
  JsonPreview,
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

function formatCheckLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace("at least", "≥")
    .replace("under", "<")
    .replace("no real orders sent", "No real orders")
    .replace("dry run gateway", "Dry-run gateway")
    .replace("dry run only", "Dry-run only")
    .replace("positive total pnl", "Positive PnL")
    .replace("audit logging", "Audit logging")
    .replace("gateway available", "Gateway available")
    .replace("minimum trades 30", "Minimum 30 trades")
    .replace("win rate ≥ 45", "Win rate ≥ 45%")
    .replace("profit factor ≥ 1 2", "Profit factor ≥ 1.2")
    .replace("max drawdown < 15", "Max drawdown < 15%");
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

  const hasResult = result !== null;
  const promotionScore = hasResult ? getNumber(result, "promotion_score", 0) : 0;
  const promotionScoreLabel = hasResult ? String(promotionScore) : "—";
  const status = getString(result, "status", "not_evaluated");
  const recommendedNextStep = getString(
    result,
    "recommended_next_step",
    "Run an evaluation to generate a promotion decision.",
  );
  const eligibleForShadowLive = getBoolean(result, "eligible_for_shadow_live");
  const eligibleForTestnet = getBoolean(result, "eligible_for_testnet");
  const blockedReasons = getStringArray(result, "blocked_reasons");
  const warnings = getStringArray(result, "warnings");
  const checks = getChecks(result);
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  const scoreTone =
    promotionScore >= 80 ? "success" : promotionScore >= 50 ? "warning" : "danger";

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
                      label={eligibleForShadowLive ? "Shadow Live Ready" : "Shadow Hold"}
                      tone={eligibleForShadowLive ? "success" : "warning"}
                    />
                    <StatusPill
                      label={eligibleForTestnet ? "Testnet Review Ready" : "Testnet Hold"}
                      tone={eligibleForTestnet ? "success" : "warning"}
                    />
                    <StatusPill label="Mainnet Disabled" tone="danger" />
                  </div>
                </div>

                                <div
                  className="grid h-36 w-36 shrink-0 place-items-center rounded-full p-2 md:h-40 md:w-40"
                  style={{
                    background: hasResult
                      ? `conic-gradient(rgb(56 189 248) ${promotionScore * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
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
              <DecisionBadge label="Shadow Live" active={eligibleForShadowLive} />
              <DecisionBadge label="Testnet Review" active={eligibleForTestnet} />
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
                <p className="mt-1 text-xl font-black text-white">{totalTrades}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Win Rate</p>
                <p className="mt-1 text-xl font-black text-white">{winRate}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-500">Profit Factor</p>
                <p className="mt-1 text-xl font-black text-white">{profitFactor}</p>
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
              <Field label="Strategy ID" value={strategyId} onChange={setStrategyId} />
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
            {blockedReasons.length > 0 ? (
              <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5">
                <p className="font-bold text-rose-100">Blocked reasons</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-rose-100/80">
                  {blockedReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="font-bold text-emerald-100">No hard blocks</p>
                <p className="mt-2 text-sm text-emerald-100/75">
                  The current result has no blocking reason.
                </p>
              </div>
            )}

            {warnings.length > 0 ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
                <p className="font-bold text-amber-100">Warnings</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/80">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <p className="font-bold text-slate-200">No warnings yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Run or adjust the evaluation to generate warnings.
                </p>
              </div>
            )}
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