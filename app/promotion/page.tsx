"use client";

import { useMemo, useState } from "react";

import {
  evaluateAllStrategyPromotions,
  evaluateStrategyPromotion,
} from "@/lib/api";
import {
  Card,
  CardHeader,
  EmptyState,
  Field,
  JsonPreview,
  MetricCard,
  PageHero,
  PremiumPageShell,
  SafetyNotice,
  ScoreBar,
  SecondaryLink,
  SectionLabel,
  StatusPill,
  inputClassName,
  type Tone,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

type PromotionFormState = {
  strategy_id: string;
  strategy_name: string;
  symbol: string;
  total_trades: string;
  win_rate: string;
  max_drawdown: string;
  profit_factor: string;
  sharpe_ratio: string;
  validation_days: string;
  live_order_sent: string;
};

const defaultForm: PromotionFormState = {
  strategy_id: "btc-momentum-validation",
  strategy_name: "BTC Momentum Validation",
  symbol: "BTCUSDT",
  total_trades: "75",
  win_rate: "58",
  max_drawdown: "8",
  profit_factor: "1.45",
  sharpe_ratio: "1.2",
  validation_days: "21",
  live_order_sent: "false",
};

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValue(source: unknown, keys: string[], fallback = "—") {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
  }

  return fallback;
}

function getNumber(source: unknown, keys: string[], fallback = 0) {
  if (!isRecord(source)) return fallback;

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

function getBoolean(source: unknown, keys: string[], fallback = false) {
  if (!isRecord(source)) return fallback;

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

function getArray(source: unknown, keys: string[]) {
  if (!isRecord(source)) return [];

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function getScoreTone(score: number): Tone {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  if (score > 0) return "danger";
  return "neutral";
}

function getEligibilityTone(eligible: boolean): Tone {
  return eligible ? "success" : "warning";
}

function toPayload(form: PromotionFormState) {
  const totalTrades = parseNumber(form.total_trades);
  const winRate = parseNumber(form.win_rate);
  const maxDrawdown = parseNumber(form.max_drawdown);
  const profitFactor = parseNumber(form.profit_factor);
  const sharpeRatio = parseNumber(form.sharpe_ratio);
  const validationDays = parseNumber(form.validation_days);

  return {
    strategy_id: form.strategy_id.trim(),
    strategy_name: form.strategy_name.trim(),
    symbol: form.symbol.trim().toUpperCase(),
    total_trades: totalTrades ?? 0,
    win_rate: winRate ?? 0,
    max_drawdown: maxDrawdown ?? 0,
    profit_factor: profitFactor ?? 0,
    sharpe_ratio: sharpeRatio ?? 0,
    validation_days: validationDays ?? 0,

    real_order_sent: form.live_order_sent === "true",
    network_request_sent: false,
    binance_order_sent: false,
    order_network_request_sent: false,
  };
}

function BlockedReasonList({ result }: { result: unknown }) {
  const blockedReasons = getArray(result, ["blocked_reasons", "reasons"]);
  const warnings = getArray(result, ["warnings"]);

  if (blockedReasons.length === 0 && warnings.length === 0) {
    return (
      <EmptyState
        title="No blockers reported"
        description="The latest evaluation did not return blocked reasons or warnings."
        label="Clean"
        tone="success"
      />
    );
  }

  return (
    <div className="space-y-3">
      {blockedReasons.map((reason, index) => (
        <div
          key={`blocked-${index}`}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200"
        >
          {String(reason)}
        </div>
      ))}

      {warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200"
        >
          {String(warning)}
        </div>
      ))}
    </div>
  );
}

export default function PromotionPage() {
  const [form, setForm] = useState<PromotionFormState>(defaultForm);
  const [singleResult, setSingleResult] = useState<unknown>(null);
  const [batchResult, setBatchResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [evaluatingSingle, setEvaluatingSingle] = useState(false);
  const [evaluatingAll, setEvaluatingAll] = useState(false);

  const payload = useMemo(() => toPayload(form), [form]);

  const strategyInvalid = !form.strategy_id.trim();
  const tradesInvalid = parseNumber(form.total_trades) === null;
  const winRateInvalid = parseNumber(form.win_rate) === null;
  const drawdownInvalid = parseNumber(form.max_drawdown) === null;

  const promotionScore = getNumber(singleResult, ["promotion_score", "score"], 0);
  const eligibleForShadowLive = getBoolean(
    singleResult,
    ["eligible_for_shadow_live"],
    false,
  );
  const eligibleForTestnet = getBoolean(
    singleResult,
    ["eligible_for_testnet"],
    false,
  );
  const riskTier = getValue(singleResult, ["risk_tier", "risk"], "Not evaluated");
  const status = getValue(singleResult, ["status"], "Not evaluated");
  const requiredAdditionalTrades = getNumber(
    singleResult,
    ["required_additional_trades"],
    0,
  );

  async function handleEvaluateSingle() {
    setEvaluatingSingle(true);
    setError(null);

    try {
      const response = await evaluateStrategyPromotion(payload);
      setSingleResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Strategy promotion evaluation failed.",
      );
    } finally {
      setEvaluatingSingle(false);
    }
  }

  async function handleEvaluateAll() {
    setEvaluatingAll(true);
    setError(null);

    try {
      const response = await evaluateAllStrategyPromotions({});
      setBatchResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Batch promotion evaluation failed.",
      );
    } finally {
      setEvaluatingAll(false);
    }
  }

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Promotion Gate", tone: "info" },
            { label: "Manual Review Required", tone: "warning" },
            { label: "No Auto Execution", tone: "success" },
            { label: "Mainnet Locked", tone: "danger" },
          ]}
          title="Strategy Promotion Gate"
          description="Controlled evaluation surface for deciding whether a strategy is eligible for shadow-live or testnet validation. Promotion output is advisory and must not bypass execution safety."
          actions={
            <>
              <button
                type="button"
                onClick={handleEvaluateAll}
                disabled={evaluatingAll}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {evaluatingAll ? "Evaluating..." : "Evaluate All"}
              </button>

              <SecondaryLink href="/promotion-audit" tone="neutral">
                Promotion Audit
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Promotion Score"
            value={promotionScore > 0 ? formatNumber(promotionScore) : "—"}
            helper="Latest single strategy evaluation score."
            tone={getScoreTone(promotionScore)}
          />

          <MetricCard
            label="Shadow Live"
            value={eligibleForShadowLive ? "Eligible" : "Review"}
            helper="Eligibility returned by the promotion gate."
            tone={getEligibilityTone(eligibleForShadowLive)}
          />

          <MetricCard
            label="Testnet"
            value={eligibleForTestnet ? "Eligible" : "Review"}
            helper="Testnet progression remains separate from live trading."
            tone={getEligibilityTone(eligibleForTestnet)}
          />

          <MetricCard
            label="Risk Tier"
            value={riskTier}
            helper={`Current evaluation status: ${status}`}
            tone={riskTier.toLowerCase().includes("high") ? "danger" : "neutral"}
          />
        </div>

        <SafetyNotice
          title="Promotion is not execution approval"
          tone="warning"
          description="A promoted strategy may become eligible for deeper validation, but this does not enable real exchange order routing. Mainnet remains locked, and every candidate still requires protected dry-run and audit review."
        />

        {error ? (
          <Card className="p-5 sm:p-6">
            <EmptyState
              title="Promotion evaluation failed"
              description={error}
              label="Error"
              tone="danger"
            />
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
          <Card>
            <CardHeader
              eyebrow="Single Evaluation"
              title="Strategy candidate"
              description="Edit the candidate metrics and run a controlled promotion evaluation."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <Field label="Strategy ID" helper="Stable internal strategy identifier.">
                <input
                  className={inputClassName(strategyInvalid)}
                  value={form.strategy_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      strategy_id: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Strategy Name">
                <input
                  className={inputClassName()}
                  value={form.strategy_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      strategy_name: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Symbol">
                <input
                  className={inputClassName()}
                  value={form.symbol}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      symbol: event.target.value,
                    }))
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Total Trades">
                  <input
                    className={inputClassName(tradesInvalid)}
                    value={form.total_trades}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        total_trades: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Win Rate">
                  <input
                    className={inputClassName(winRateInvalid)}
                    value={form.win_rate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        win_rate: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Max Drawdown">
                  <input
                    className={inputClassName(drawdownInvalid)}
                    value={form.max_drawdown}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        max_drawdown: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                  />
                </Field>

                <Field label="Profit Factor">
                  <input
                    className={inputClassName()}
                    value={form.profit_factor}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        profit_factor: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sharpe Ratio">
                  <input
                    className={inputClassName()}
                    value={form.sharpe_ratio}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sharpe_ratio: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                  />
                </Field>

                <Field label="Validation Days">
                  <input
                    className={inputClassName()}
                    value={form.validation_days}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        validation_days: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                  />
                </Field>
              </div>

              <Field
                label="Live Order Sent"
                helper="This must stay false for safe promotion evaluation."
              >
                <select
                  className={inputClassName(form.live_order_sent === "true")}
                  value={form.live_order_sent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      live_order_sent: event.target.value,
                    }))
                  }
                >
                  <option value="false">False</option>
                  <option value="true">True - unsafe test state</option>
                </select>
              </Field>

              <button
                type="button"
                onClick={handleEvaluateSingle}
                disabled={
                  evaluatingSingle ||
                  strategyInvalid ||
                  tradesInvalid ||
                  winRateInvalid ||
                  drawdownInvalid
                }
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {evaluatingSingle ? "Evaluating..." : "Evaluate Strategy"}
              </button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader
                eyebrow="Result"
                title="Promotion decision"
                description="Latest strategy promotion output from the backend."
              />

              <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                  <StatusPill
                    label={status}
                    tone={getStatusToneFromResult(status, promotionScore)}
                  />
                  <p className="mt-4 text-sm font-semibold text-slate-100">
                    Evaluation status
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Recommended next step:{" "}
                    {getValue(singleResult, ["recommended_next_step"], "—")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                  <StatusPill
                    label={`${formatNumber(requiredAdditionalTrades)} more trades`}
                    tone={requiredAdditionalTrades > 0 ? "warning" : "success"}
                  />
                  <p className="mt-4 text-sm font-semibold text-slate-100">
                    Additional validation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Suggested validation days:{" "}
                    {getValue(singleResult, ["suggested_validation_days"], "—")}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SectionLabel>Promotion Readiness</SectionLabel>

              <div className="mt-5 space-y-4">
                <ScoreBar
                  label="Promotion Score"
                  value={Math.max(0, Math.min(100, promotionScore))}
                  tone={getScoreTone(promotionScore)}
                  helper="Returned by the strategy promotion gate."
                />

                <ScoreBar
                  label="Shadow-live Readiness"
                  value={eligibleForShadowLive ? 85 : 35}
                  tone={eligibleForShadowLive ? "success" : "warning"}
                  helper="Eligibility does not bypass manual review."
                />

                <ScoreBar
                  label="Live Execution Approval"
                  value={0}
                  tone="danger"
                  helper="Promotion does not approve mainnet order routing."
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                eyebrow="Blockers"
                title="Blocked reasons and warnings"
                description="Any blocking reasons returned by the promotion gate should be resolved before progression."
              />

              <div className="p-5 sm:p-6">
                <BlockedReasonList result={singleResult} />
              </div>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader
              eyebrow="Payload Preview"
              title="Evaluation request"
              description="Normalized request body sent to the single strategy promotion endpoint."
            />

            <div className="p-5 sm:p-6">
              <JsonPreview data={payload} />
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Raw Result"
              title="Single evaluation response"
              description="Raw backend response for debugging and audit verification."
            />

            <div className="p-5 sm:p-6">
              <JsonPreview
                data={
                  singleResult ?? {
                    status: "not_evaluated",
                    message: "Run a strategy evaluation to inspect the result.",
                  }
                }
              />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Batch Evaluation"
            title="Evaluate-all response"
            description="Raw response returned by the batch promotion endpoint."
          />

          <div className="p-5 sm:p-6">
            <JsonPreview
              data={
                batchResult ?? {
                  status: "not_evaluated",
                  message: "Click Evaluate All to inspect batch output.",
                }
              }
            />
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}

function getStatusToneFromResult(status: string, score: number): Tone {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("eligible") ||
    normalized.includes("approved") ||
    normalized.includes("pass") ||
    score >= 75
  ) {
    return "success";
  }

  if (
    normalized.includes("blocked") ||
    normalized.includes("rejected") ||
    normalized.includes("failed")
  ) {
    return "danger";
  }

  if (normalized.includes("review") || normalized.includes("pending")) {
    return "warning";
  }

  return "neutral";
}