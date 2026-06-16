"use client";

import { useEffect, useMemo, useState } from "react";

import { getSignals, type Signal } from "@/lib/api";
import {
  Card,
  CardHeader,
  EmptyState,
  Field,
  JsonPreview,
  LoadingBlock,
  MetricCard,
  PageHero,
  PremiumPageShell,
  SafetyNotice,
  SecondaryLink,
  StatusPill,
  inputClassName,
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
    normalized.includes("approved")
  ) {
    return "success";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("watch") ||
    normalized.includes("review")
  ) {
    return "warning";
  }

  if (
    normalized.includes("blocked") ||
    normalized.includes("rejected") ||
    normalized.includes("invalid") ||
    normalized.includes("failed")
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

function SignalTableRow({ signal }: { signal: SignalRecord }) {
  const id = getValue(signal, ["id", "signal_id"], "—");
  const strategy = getValue(signal, ["strategy_name", "strategy", "strategy_id"], "Unknown");
  const symbol = getValue(signal, ["symbol"], "—").toUpperCase();
  const side = getValue(signal, ["side", "direction"], "—").toUpperCase();
  const status = getValue(signal, ["status"], "Review");
  const timeframe = getValue(signal, ["timeframe"], "—");
  const entry = formatPrice(getValue(signal, ["entry", "entry_price", "price"], "—"));
  const stop = formatPrice(getValue(signal, ["stop_loss_price", "stop_loss", "stop", "sl"], "—"));
  const target = formatPrice(
    getValue(signal, ["take_profit_price", "take_profit", "target", "tp"], "—"),
  );
  const confidence = getNumberValue(signal, ["confidence", "score"]);
  const timestamp = getValue(signal, ["created_at", "timestamp"], "—");

  return (
    <tr className="border-b border-slate-800/70 transition hover:bg-slate-950/70">
      <td className="px-4 py-4 align-top">
        <div>
          <p className="font-mono text-xs text-slate-500">{id}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{strategy}</p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <p className="text-sm font-semibold text-slate-50">{symbol}</p>
        <p className="mt-1 text-xs text-slate-500">{timeframe}</p>
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={side} tone={getSideTone(side)} />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={status} tone={getStatusTone(status)} />
      </td>

      <td className="px-4 py-4 align-top text-sm text-slate-300">{entry}</td>
      <td className="px-4 py-4 align-top text-sm text-slate-300">{stop}</td>
      <td className="px-4 py-4 align-top text-sm text-slate-300">{target}</td>

      <td className="px-4 py-4 align-top">
        <StatusPill
          label={formatConfidence(confidence)}
          tone={getConfidenceTone(confidence)}
        />
      </td>

      <td className="px-4 py-4 align-top text-xs text-slate-500">{timestamp}</td>
    </tr>
  );
}

function SignalMobileCard({ signal }: { signal: SignalRecord }) {
  const strategy = getValue(signal, ["strategy_name", "strategy", "strategy_id"], "Unknown");
  const symbol = getValue(signal, ["symbol"], "—").toUpperCase();
  const side = getValue(signal, ["side", "direction"], "—").toUpperCase();
  const status = getValue(signal, ["status"], "Review");
  const confidence = getNumberValue(signal, ["confidence", "score"]);
  const entry = formatPrice(getValue(signal, ["entry", "entry_price", "price"], "—"));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-50">{symbol}</p>
          <p className="mt-1 text-xs text-slate-500">{strategy}</p>
        </div>

        <StatusPill label={side} tone={getSideTone(side)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-600">Status</p>
          <div className="mt-2">
            <StatusPill label={status} tone={getStatusTone(status)} />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
            Confidence
          </p>
          <div className="mt-2">
            <StatusPill
              label={formatConfidence(confidence)}
              tone={getConfidenceTone(confidence)}
            />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-600">Entry</p>
          <p className="mt-2 text-slate-200">{entry}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
            Timeframe
          </p>
          <p className="mt-2 text-slate-200">
            {getValue(signal, ["timeframe"], "—")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let mounted = true;

    async function loadSignals() {
      setLoading(true);
      setError(null);

      try {
        const response = await getSignals();
        if (!mounted) return;

        setSignals(Array.isArray(response) ? (response as SignalRecord[]) : []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load signals.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSignals();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredSignals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return signals.filter((signal) => {
      const symbol = getValue(signal, ["symbol"], "").toLowerCase();
      const strategy = getValue(
        signal,
        ["strategy_name", "strategy", "strategy_id"],
        "",
      ).toLowerCase();
      const side = getValue(signal, ["side", "direction"], "").toUpperCase();
      const status = getValue(signal, ["status"], "").toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        symbol.includes(normalizedQuery) ||
        strategy.includes(normalizedQuery);

      const matchesSide = sideFilter === "ALL" || side.includes(sideFilter);
      const matchesStatus =
        statusFilter === "ALL" || status.includes(statusFilter.toLowerCase());

      return matchesQuery && matchesSide && matchesStatus;
    });
  }, [signals, query, sideFilter, statusFilter]);

  const activeCount = signals.filter((signal) =>
    getValue(signal, ["status"], "").toLowerCase().includes("active"),
  ).length;

  const buyCount = signals.filter((signal) => {
    const side = getValue(signal, ["side", "direction"], "").toUpperCase();
    return side.includes("BUY") || side.includes("LONG");
  }).length;

  const sellCount = signals.filter((signal) => {
    const side = getValue(signal, ["side", "direction"], "").toUpperCase();
    return side.includes("SELL") || side.includes("SHORT");
  }).length;

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Signal Review", tone: "info" },
            { label: "No Auto Execution", tone: "success" },
            { label: "Manual Validation Required", tone: "warning" },
          ]}
          title="Signal Review Center"
          description="Professional review surface for strategy signals. Signals can be inspected, filtered and validated here, but they do not trigger real exchange orders."
          actions={
            <>
              <SecondaryLink href="/live-signals" tone="info">
                Live Signals
              </SecondaryLink>
              <SecondaryLink href="/promotion" tone="neutral">
                Promotion Gate
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Signals"
            value={signals.length}
            helper="Loaded signal candidates."
            tone="info"
          />
          <MetricCard
            label="Active"
            value={activeCount}
            helper="Signals currently marked active."
            tone="success"
          />
          <MetricCard
            label="Buy / Long"
            value={buyCount}
            helper="Directional upside candidates."
            tone="success"
          />
          <MetricCard
            label="Sell / Short"
            value={sellCount}
            helper="Directional downside candidates."
            tone="danger"
          />
        </div>

        <SafetyNotice
          title="Signals are not orders"
          tone="warning"
          description="This page is for review and validation only. A signal must pass risk review, promotion gate checks and protected execution simulation before any future testnet or live execution path is considered."
        />

        <Card>
          <CardHeader
            eyebrow="Filters"
            title="Review workspace"
            description="Filter by symbol, strategy, direction and status before inspecting individual signal details."
          />

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_220px_220px]">
            <Field label="Search" helper="Symbol or strategy name">
              <input
                className={inputClassName()}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="BTCUSDT, ETHUSDT, strategy..."
              />
            </Field>

            <Field label="Side">
              <select
                className={inputClassName()}
                value={sideFilter}
                onChange={(event) => setSideFilter(event.target.value)}
              >
                <option value="ALL">All sides</option>
                <option value="BUY">Buy / Long</option>
                <option value="SELL">Sell / Short</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                className={inputClassName()}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="review">Review</option>
                <option value="blocked">Blocked</option>
              </select>
            </Field>
          </div>
        </Card>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <Card className="p-5 sm:p-6">
            <EmptyState
              title="Signals unavailable"
              description={error}
              label="Load Error"
              tone="danger"
            />
          </Card>
        ) : filteredSignals.length === 0 ? (
          <Card className="p-5 sm:p-6">
            <EmptyState
              title="No signals match the current filters"
              description="Try changing the search, side or status filters."
              label="No Results"
              tone="neutral"
            />
          </Card>
        ) : (
          <>
            <Card className="hidden overflow-hidden xl:block">
              <CardHeader
                eyebrow="Signals"
                title="Signal table"
                description={`${filteredSignals.length} signal(s) currently visible after filtering.`}
              />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Strategy
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Market
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Side
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Entry
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Stop
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Target
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Time
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSignals.map((signal, index) => (
                      <SignalTableRow
                        key={String(
                          signal.id ??
                            signal.signal_id ??
                            `${signal.symbol}-${signal.side}-${index}`,
                        )}
                        signal={signal}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid gap-4 xl:hidden">
              {filteredSignals.map((signal, index) => (
                <SignalMobileCard
                  key={String(
                    signal.id ??
                      signal.signal_id ??
                      `${signal.symbol}-${signal.side}-${index}`,
                  )}
                  signal={signal}
                />
              ))}
            </div>

            <Card>
              <CardHeader
                eyebrow="Raw Data"
                title="Filtered signal payload"
                description="Raw filtered signal data for debugging and backend compatibility checks."
              />

              <div className="p-5 sm:p-6">
                <JsonPreview data={filteredSignals.slice(0, 10)} />
              </div>
            </Card>
          </>
        )}
      </div>
    </PremiumPageShell>
  );
}