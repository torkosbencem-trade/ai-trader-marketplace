"use client";

import { useEffect, useMemo, useState } from "react";

import { getSignals, type Signal } from "@/lib/api";
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

type SignalRecord = Signal & Record<string, unknown>;

function getValue(source: SignalRecord, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
  }

  return fallback;
}

function getNumberValue(source: SignalRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function getSideTone(side: string): Tone {
  const normalized = side.toUpperCase();

  if (normalized.includes("BUY") || normalized.includes("LONG")) return "success";
  if (normalized.includes("SELL") || normalized.includes("SHORT")) return "danger";

  return "neutral";
}

function getStatusTone(status: string): Tone {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("active") ||
    normalized.includes("open") ||
    normalized.includes("valid") ||
    normalized.includes("live")
  ) {
    return "success";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("watch")
  ) {
    return "warning";
  }

  if (
    normalized.includes("blocked") ||
    normalized.includes("failed") ||
    normalized.includes("rejected") ||
    normalized.includes("invalid")
  ) {
    return "danger";
  }

  return "neutral";
}

function getConfidenceTone(confidence: number | null): Tone {
  if (confidence === null) return "neutral";
  if (confidence >= 70) return "success";
  if (confidence >= 45) return "warning";
  return "danger";
}

function formatConfidence(confidence: number | null) {
  if (confidence === null) return "—";
  return `${Math.round(confidence)}%`;
}

function formatPrice(value: string) {
  if (value === "—") return value;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;

  return parsed.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

function LiveSignalRow({ signal }: { signal: SignalRecord }) {
  const strategy = getValue(signal, ["strategy_name", "strategy", "strategy_id"], "Unknown");
  const symbol = getValue(signal, ["symbol"], "—").toUpperCase();
  const side = getValue(signal, ["side", "direction"], "—").toUpperCase();
  const status = getValue(signal, ["status"], "Review");
  const confidence = getNumberValue(signal, ["confidence", "score"]);
  const entry = formatPrice(getValue(signal, ["entry", "entry_price", "price"], "—"));
  const stop = formatPrice(getValue(signal, ["stop_loss_price", "stop_loss", "stop", "sl"], "—"));
  const target = formatPrice(
    getValue(signal, ["take_profit_price", "take_profit", "target", "tp"], "—"),
  );
  const timeframe = getValue(signal, ["timeframe"], "—");
  const timestamp = getValue(signal, ["created_at", "timestamp"], "—");

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 transition hover:border-slate-700 hover:bg-slate-950/70">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-50">{symbol}</h3>
            <StatusPill label={side} tone={getSideTone(side)} />
            <StatusPill label={status} tone={getStatusTone(status)} />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {strategy} · {timeframe}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill
            label={`Confidence ${formatConfidence(confidence)}`}
            tone={getConfidenceTone(confidence)}
          />
          <StatusPill label="Review only" tone="neutral" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Entry
          </p>
          <p className="mt-2 font-mono text-sm text-slate-200">{entry}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Stop
          </p>
          <p className="mt-2 font-mono text-sm text-slate-200">{stop}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Target
          </p>
          <p className="mt-2 font-mono text-sm text-slate-200">{target}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-600">Last update: {timestamp}</p>
    </div>
  );
}

export default function LiveSignalsPage() {
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSignals() {
    setLoading(true);
    setError(null);

    try {
      const response = await getSignals();
      setSignals(Array.isArray(response) ? (response as SignalRecord[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load live signals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignals();
  }, []);

  const activeSignals = useMemo(
    () =>
      signals.filter((signal) => {
        const status = getValue(signal, ["status"], "").toLowerCase();
        return status.includes("active") || status.includes("open") || status.includes("live");
      }),
    [signals],
  );

  const highConfidenceSignals = useMemo(
    () =>
      signals.filter((signal) => {
        const confidence = getNumberValue(signal, ["confidence", "score"]);
        return confidence !== null && confidence >= 70;
      }),
    [signals],
  );

  const visibleSignals = activeSignals.length > 0 ? activeSignals : signals;

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Live Signal Monitor", tone: "info" },
            { label: "Review Only", tone: "success" },
            { label: "No Auto Execution", tone: "danger" },
          ]}
          title="Live Signals"
          description="Operational monitor for current signal candidates. This view is designed for fast review and validation, not automatic order execution."
          actions={
            <>
              <button
                type="button"
                onClick={loadSignals}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Signals"}
              </button>

              <SecondaryLink href="/signals" tone="neutral">
                Signal Review
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Loaded Signals"
            value={signals.length}
            helper="Total signal candidates returned by the backend."
            tone="info"
          />

          <MetricCard
            label="Active Signals"
            value={activeSignals.length}
            helper="Signals marked active, open or live."
            tone="success"
          />

          <MetricCard
            label="High Confidence"
            value={highConfidenceSignals.length}
            helper="Signals with confidence score above 70."
            tone="warning"
          />

          <MetricCard
            label="Execution"
            value="Blocked"
            helper="Signals do not create exchange orders."
            tone="danger"
          />
        </div>

        <SafetyNotice
          title="Live signals are still non-executing"
          tone="warning"
          description="This page may display current strategy output, but every signal remains review-only. Execution requires separate dry-run validation, promotion gate approval and explicit safety controls."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader
              eyebrow="Monitor"
              title="Current signal stream"
              description={
                visibleSignals.length > 0
                  ? `${visibleSignals.length} signal(s) visible in the live monitor.`
                  : "No signal candidates are currently visible."
              }
            />

            <div className="space-y-4 p-5 sm:p-6">
              {loading ? (
                <LoadingBlock />
              ) : error ? (
                <EmptyState
                  title="Live signals unavailable"
                  description={error}
                  label="Load Error"
                  tone="danger"
                />
              ) : visibleSignals.length === 0 ? (
                <EmptyState
                  title="No live signals available"
                  description="The live signal monitor will populate once the backend returns signal candidates."
                  label="No Signals"
                  tone="neutral"
                />
              ) : (
                visibleSignals.map((signal, index) => (
                  <LiveSignalRow
                    key={String(
                      signal.id ??
                        signal.signal_id ??
                        `${signal.symbol}-${signal.side}-${index}`,
                    )}
                    signal={signal}
                  />
                ))
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionLabel>Live Monitor State</SectionLabel>

            <div className="mt-5 space-y-4">
              <ScoreBar
                label="Review Coverage"
                value={signals.length > 0 ? 82 : 0}
                tone={signals.length > 0 ? "info" : "neutral"}
                helper="Signals are visible for review once loaded from the backend."
              />

              <ScoreBar
                label="Execution Isolation"
                value={100}
                tone="success"
                helper="This monitor does not trigger order submission."
              />

              <ScoreBar
                label="Promotion Requirement"
                value={100}
                tone="warning"
                helper="Signals must pass promotion and dry-run gates before future execution paths."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Recommended workflow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review signal quality, compare with performance history, then
                use the promotion gate before considering shadow-live or testnet
                validation.
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Debug"
            title="Raw live signal payload"
            description="First 10 signal records shown for backend compatibility inspection."
          />

          <div className="p-5 sm:p-6">
            <JsonPreview data={signals.slice(0, 10)} />
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}