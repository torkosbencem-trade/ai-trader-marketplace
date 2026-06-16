"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  getPerformanceSummary,
  getSignals,
  getStrategies,
  getStrategyBySlug,
} from "@/lib/api";

import {
  type AnyRecord,
  clamp,
  formatDate,
  formatInteger,
  formatMoney,
  formatPercent,
  getNumber,
  getRiskTone,
  getSideTone,
  getStrategySlug,
  getValue,
  hasUsableStrategyData,
  normalizeObject,
  normalizePercent,
  normalizeSignals,
  normalizeStrategies,
  resolveSettled,
  safeDecodeURIComponent,
  slugify,
  titleFromSlug,
} from "@/lib/marketplace-utils";

import {
  Card,
  CardHeader,
  EmptyState,
  LoadingBlock,
  MetricCard,
  PageHero,
  PremiumPageShell,
  ScoreBar,
  SecondaryLink,
  StatusPill,
  type Tone,
} from "@/components/ui/PremiumUI";

function SignalRow({ signal }: { signal: AnyRecord }) {
  const symbol = getValue<string>(
    signal,
    ["symbol", "ticker", "pair"],
    "UNKNOWN"
  );

  const side = getValue<string>(
    signal,
    ["side", "direction", "action"],
    "WATCH"
  ).toUpperCase();

  const confidence = getNumber(
    signal,
    ["confidence", "score", "probability"],
    0
  );

  const timeframe = getValue<string>(
    signal,
    ["timeframe", "interval", "tf"],
    "N/A"
  );

  const createdAt = getValue<unknown>(
    signal,
    ["created_at", "timestamp", "time"],
    null
  );

  return (
    <div className="grid gap-4 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_0.7fr_0.8fr_0.7fr_1fr] md:items-center">
      <div>
        <p className="font-semibold text-white">{symbol}</p>
        <p className="mt-1 text-xs text-slate-500">Related signal</p>
      </div>

      <StatusPill label={side} tone={getSideTone(side)} />

      <p className="text-sm font-semibold text-white">
        {formatPercent(confidence)}
      </p>

      <p className="text-sm text-slate-400">{timeframe}</p>

      <p className="text-xs text-slate-500">{formatDate(createdAt)}</p>
    </div>
  );
}

function WorkflowStep({
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

export default function StrategyDetailPage() {
  const params = useParams();

  const routeSlug = useMemo(() => {
    const rawSlug = params?.slug;

    if (Array.isArray(rawSlug)) {
      return slugify(safeDecodeURIComponent(rawSlug[0] ?? "strategy"));
    }

    return slugify(safeDecodeURIComponent(String(rawSlug ?? "strategy")));
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [directStrategyData, setDirectStrategyData] = useState<unknown>(null);
  const [strategiesData, setStrategiesData] = useState<unknown>([]);
  const [signalsData, setSignalsData] = useState<unknown>([]);
  const [performanceData, setPerformanceData] = useState<AnyRecord>({});
  const [error, setError] = useState<string | null>(null);

  async function loadStrategyData() {
    setLoading(true);
    setError(null);

    const [
      directStrategyResult,
      strategiesResult,
      signalsResult,
      performanceResult,
    ] = await Promise.allSettled([
      getStrategyBySlug(routeSlug),
      getStrategies(),
      getSignals(),
      getPerformanceSummary(),
    ]);

    setDirectStrategyData(resolveSettled(directStrategyResult, null));
    setStrategiesData(resolveSettled(strategiesResult, []));
    setSignalsData(resolveSettled(signalsResult, []));
    setPerformanceData(resolveSettled(performanceResult, { total_pnl: 0, pnl: 0, net_pnl: 0, win_rate: 0, total_trades: 0, trades: 0 }));

    const hasRejected = [
      directStrategyResult,
      strategiesResult,
      signalsResult,
      performanceResult,
    ].some((result) => result.status === "rejected");

    if (hasRejected) {
      setError("NĂ©hĂˇny strategy adat nem tĂ¶ltĹ‘dĂ¶tt be, de az oldal mĹ±kĂ¶dik.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStrategyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSlug]);

  const strategies = useMemo(
    () => normalizeStrategies(strategiesData),
    [strategiesData]
  );

  const signals = useMemo(() => normalizeSignals(signalsData), [signalsData]);

  const directStrategyObject = normalizeObject(directStrategyData, [
    "strategy",
    "item",
    "data",
    "result",
  ]);

  const fallbackStrategy = strategies.find((strategy) => {
    const strategySlug = getStrategySlug(strategy);

    const strategyName = getValue<string>(
      strategy,
      ["name", "title", "strategy_name", "strategyName"],
      ""
    );

    return strategySlug === routeSlug || slugify(strategyName) === routeSlug;
  });

  const generatedFallbackStrategy: AnyRecord = {
    name: titleFromSlug(routeSlug),
    slug: routeSlug,
    description:
      "Strategy profile generated from the current route. Backend strategy details were not found for this slug yet, but the page remains available for validation workflow.",
    risk_level: "Moderate",
    win_rate: 0,
    total_pnl: 0,
    total_trades: 0,
    subscribers: 0,
    is_generated_fallback: true,
  };

  const finalStrategy = hasUsableStrategyData(directStrategyObject)
    ? directStrategyObject
    : hasUsableStrategyData(fallbackStrategy)
      ? fallbackStrategy
      : generatedFallbackStrategy;

  const isGeneratedFallback = Boolean(
    getValue<boolean>(finalStrategy, ["is_generated_fallback"], false)
  );

  const strategyName = getValue<string>(
    finalStrategy,
    ["name", "title", "strategy_name", "strategyName"],
    titleFromSlug(routeSlug)
  );

  const strategySlug = getStrategySlug(finalStrategy) || routeSlug;

  const description = getValue<string>(
    finalStrategy,
    ["description", "summary", "details"],
    "Marketplace strategy candidate ready for validation workflow."
  );

  const risk = getValue<string>(
    finalStrategy,
    ["risk_level", "riskLevel", "risk", "category"],
    "Moderate"
  );

  const fallbackPerformance = normalizeObject(performanceData, [
    "performance",
    "summary",
    "data",
    "result",
  ]);

  const winRate = getNumber(
    finalStrategy,
    ["win_rate", "winRate", "success_rate", "accuracy"],
    getNumber(fallbackPerformance, ["win_rate", "winRate"], 0)
  );

  const totalPnl = getNumber(
    finalStrategy,
    ["total_pnl", "pnl", "net_pnl", "profit"],
    getNumber(fallbackPerformance, ["total_pnl", "pnl", "net_pnl"], 0)
  );

  const totalTrades = getNumber(
    finalStrategy,
    ["total_trades", "trades", "trade_count"],
    getNumber(fallbackPerformance, ["total_trades", "trades"], 0)
  );

  const subscribers = getNumber(
    finalStrategy,
    ["subscribers", "users", "followers"],
    0
  );

  const createdAt = getValue<unknown>(
    finalStrategy,
    ["created_at", "createdAt", "published_at", "updated_at"],
    null
  );

  const relatedSignals = signals
    .filter((signal) => {
      const signalStrategySlug = slugify(
        getValue<string>(
          signal,
          ["strategy_slug", "strategySlug", "slug", "strategy_id"],
          ""
        )
      );

      const signalStrategyName = slugify(
        getValue<string>(
          signal,
          ["strategy_name", "strategy", "source", "strategyName"],
          ""
        )
      );

      return (
        signalStrategySlug === strategySlug ||
        signalStrategySlug === routeSlug ||
        signalStrategyName === slugify(strategyName) ||
        signalStrategyName === routeSlug
      );
    })
    .slice(0, 8);

  const highConfidenceSignals = relatedSignals.filter((signal) => {
    const confidence = normalizePercent(
      getNumber(signal, ["confidence", "score", "probability"], 0)
    );

    return confidence >= 70;
  }).length;

  const validationScore = clamp(
    normalizePercent(winRate) * 0.5 +
      Math.min(totalTrades, 30) +
      Math.min(relatedSignals.length * 8, 20)
  );

  const riskScore = clamp(
    risk.toLowerCase().includes("low")
      ? 85
      : risk.toLowerCase().includes("high") ||
          risk.toLowerCase().includes("aggressive")
        ? 35
        : 60
  );

  const signalScore = clamp(
    Math.min(relatedSignals.length * 12, 60) +
      Math.min(highConfidenceSignals * 10, 40)
  );

  const strategyStatus = isGeneratedFallback
    ? "Generated Profile"
    : validationScore >= 70
      ? "Validation Candidate"
      : "Needs More Data";

  const strategyStatusTone: Tone = isGeneratedFallback
    ? "warning"
    : validationScore >= 70
      ? "success"
      : "info";

  return (
    <PremiumPageShell>
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PageHero
          pills={[
            { label: "Strategy Profile", tone: "info" },
            { label: risk, tone: getRiskTone(risk) },
            { label: strategyStatus, tone: strategyStatusTone },
          ]}
          title={strategyName}
          description={description}
          actions={
            <>
              <Link
                href="/test-runs"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Start Test Run
              </Link>

              <SecondaryLink href="/signals" tone="info">
                View Signals
              </SecondaryLink>

              <SecondaryLink href="/dashboard" tone="success">
                Dashboard
              </SecondaryLink>
            </>
          }
        />

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Strategy Status"
            title={strategyStatus}
            description={
              isGeneratedFallback
                ? "The route is valid, but backend strategy data was not found for this slug yet."
                : "This strategy is available for marketplace validation workflow."
            }
            action={
              <StatusPill
                label={isGeneratedFallback ? "Fallback" : "Backend Data"}
                tone={isGeneratedFallback ? "warning" : "success"}
              />
            }
          />

          <div className="space-y-3 p-6">
            <div
              className={`rounded-2xl border p-4 ${
                isGeneratedFallback
                  ? "border-amber-400/20 bg-amber-400/10"
                  : "border-emerald-400/20 bg-emerald-400/10"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isGeneratedFallback ? "text-amber-200" : "text-emerald-200"
                }`}
              >
                {isGeneratedFallback
                  ? "Generated fallback profile"
                  : "Strategy data loaded"}
              </p>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isGeneratedFallback
                    ? "text-amber-100/80"
                    : "text-emerald-100/80"
                }`}
              >
                {isGeneratedFallback
                  ? "Later we should connect signals to real backend strategy slugs."
                  : "The strategy profile can now be used in validation workflow."}
              </p>
            </div>

            <SecondaryLink href="/performance" tone="info">
              Review Performance
            </SecondaryLink>
          </div>
        </Card>
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
            label="Win Rate"
            value={formatPercent(winRate)}
            helper="Strategy success ratio"
            tone={normalizePercent(winRate) >= 50 ? "success" : "warning"}
          />

          <MetricCard
            label="Net PnL"
            value={formatMoney(totalPnl)}
            helper="Strategy performance result"
            tone={totalPnl >= 0 ? "success" : "danger"}
          />

          <MetricCard
            label="Trades"
            value={formatInteger(totalTrades)}
            helper="Evaluated trade sample"
            tone="info"
          />

          <MetricCard
            label="Users"
            value={formatInteger(subscribers)}
            helper="Marketplace subscribers or users"
            tone="neutral"
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Quality"
            title="Validation Readiness"
            description="Internal indicators for deciding whether this strategy needs more data."
            action={<StatusPill label="Decision Support" tone="info" />}
          />

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <ScoreBar
              label="Validation"
              value={validationScore}
              helper="Based on win rate, trade sample and related signal count."
              tone={validationScore >= 70 ? "success" : "warning"}
            />

            <ScoreBar
              label="Risk Profile"
              value={riskScore}
              helper="Low-risk profiles score higher. High-risk strategies need stricter validation."
              tone={riskScore >= 70 ? "success" : "warning"}
            />

            <ScoreBar
              label="Signal Evidence"
              value={signalScore}
              helper="Based on related signals and high-confidence signal count."
              tone={signalScore >= 60 ? "success" : "info"}
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Marketplace Context"
            title="Strategy Metadata"
            description="Current route and backend context for this profile."
          />

          <div className="space-y-3 p-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Route Slug</p>
              <p className="mt-1 break-all font-semibold text-white">
                {routeSlug}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Strategy Slug</p>
              <p className="mt-1 break-all font-semibold text-white">
                {strategySlug}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Created / Updated</p>
              <p className="mt-1 font-semibold text-white">
                {formatDate(createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Related Signals</p>
              <p className="mt-1 font-semibold text-white">
                {formatInteger(relatedSignals.length)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Signals"
            title="Related Signals"
            description="Signals connected to this strategy by slug or strategy name."
            action={
              <StatusPill
                label={`${formatInteger(relatedSignals.length)} signals`}
                tone="info"
              />
            }
          />

          {loading ? (
            <div className="p-6">
              <LoadingBlock />
            </div>
          ) : relatedSignals.length > 0 ? (
            <div>
              {relatedSignals.map((signal, index) => (
                <SignalRow
                  key={getValue<string>(signal, ["id", "signal_id"], "") || index}
                  signal={signal}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No related signals yet."
              description="Signals will appear here once the backend returns records connected to this strategy slug or name."
              label="No Signals"
              tone="neutral"
            />
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Promotion Logic"
            title="Strategy Validation Flow"
            description="Use staged validation before any strategy moves closer to execution."
          />

          <div className="space-y-3 p-6">
            <WorkflowStep
              label="Gate 1"
              title="Review strategy profile"
              description="Check description, risk level, performance and available signal evidence."
              tone="info"
            />

            <WorkflowStep
              label="Gate 2"
              title="Start controlled Test Run"
              description="Collect validation performance before Shadow Live monitoring."
              tone="warning"
            />

            <WorkflowStep
              label="Gate 3"
              title="Promote only stable candidates"
              description="Shadow Live remains simulated and should not send real orders."
              tone="success"
            />

            <Link
              href="/test-runs"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
            >
              Start Validation
            </Link>
          </div>
        </Card>
      </section>
    </PremiumPageShell>
  );
}
