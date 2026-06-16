"use client";

import { useEffect, useMemo, useState } from "react";

import { getSignals, type Signal } from "@/lib/api";
import {
  CompactMetric,
  ControlBar,
  DataPanel,
  InspectorPanel,
  SplitView,
  StatusMatrix,
  TerminalBadge,
  TerminalButton,
  TerminalEmpty,
  TerminalHeader,
  TerminalInputClassName,
  TerminalJson,
  TerminalLink,
  TerminalPage,
  TerminalTable,
  TerminalTableHead,
  TerminalTd,
  TerminalTh,
  type TerminalTone,
} from "@/components/ui/TerminalUI";

type SignalRecord = Signal & Record<string, unknown>;

function getValue(source: SignalRecord | null, keys: string[], fallback = "—") {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
  }

  return fallback;
}

function getNumberValue(source: SignalRecord | null, keys: string[]) {
  if (!source) return null;

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

function getSideTone(side: string): TerminalTone {
  const normalized = side.toUpperCase();

  if (normalized.includes("BUY") || normalized.includes("LONG")) return "success";
  if (normalized.includes("SELL") || normalized.includes("SHORT")) return "danger";

  return "neutral";
}

function getStatusTone(status: string): TerminalTone {
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

function getConfidenceTone(confidence: number | null): TerminalTone {
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

function getSignalKey(signal: SignalRecord, index: number) {
  return String(
    signal.id ??
      signal.signal_id ??
      `${String(signal.symbol ?? "symbol")}-${String(
        signal.side ?? signal.direction ?? "side",
      )}-${index}`,
  );
}

function SignalRow({
  signal,
  index,
  selected,
  onSelect,
}: {
  signal: SignalRecord;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const strategy = getValue(
    signal,
    ["strategy_name", "strategy", "strategy_id"],
    "Unknown",
  );
  const symbol = getValue(signal, ["symbol"], "—").toUpperCase();
  const side = getValue(signal, ["side", "direction"], "—").toUpperCase();
  const status = getValue(signal, ["status"], "Review");
  const timeframe = getValue(signal, ["timeframe"], "—");
  const entry = formatPrice(
    getValue(signal, ["entry", "entry_price", "price"], "—"),
  );
  const confidence = getNumberValue(signal, ["confidence", "score"]);
  const created = getValue(signal, ["created_at", "timestamp"], "—");

  return (
    <tr
      className={
        selected
          ? "border-b border-sky-500/20 bg-sky-500/10"
          : "border-b border-slate-800/70 transition hover:bg-slate-950/70"
      }
    >
      <TerminalTd>
        <button type="button" onClick={onSelect} className="block text-left">
          <span className="font-mono text-[11px] text-slate-600">
            #{index + 1}
          </span>
          <span className="mt-1 block text-sm font-semibold text-slate-50">
            {symbol}
          </span>
          <span className="mt-1 block text-xs text-slate-600">{timeframe}</span>
        </button>
      </TerminalTd>

      <TerminalTd>
        <span className="block max-w-[260px] truncate text-sm font-medium text-slate-200">
          {strategy}
        </span>
      </TerminalTd>

      <TerminalTd>
        <TerminalBadge label={side} tone={getSideTone(side)} />
      </TerminalTd>

      <TerminalTd>
        <TerminalBadge label={status} tone={getStatusTone(status)} />
      </TerminalTd>

      <TerminalTd className="font-mono">{entry}</TerminalTd>

      <TerminalTd>
        <TerminalBadge
          label={formatConfidence(confidence)}
          tone={getConfidenceTone(confidence)}
        />
      </TerminalTd>

      <TerminalTd className="text-xs text-slate-600">{created}</TerminalTd>
    </tr>
  );
}

function SelectedSignalInspector({ signal }: { signal: SignalRecord | null }) {
  const symbol = getValue(signal, ["symbol"], "—").toUpperCase();
  const strategy = getValue(
    signal,
    ["strategy_name", "strategy", "strategy_id"],
    "Unknown",
  );
  const side = getValue(signal, ["side", "direction"], "—").toUpperCase();
  const status = getValue(signal, ["status"], "Review");
  const timeframe = getValue(signal, ["timeframe"], "—");
  const confidence = getNumberValue(signal, ["confidence", "score"]);

  const entry = formatPrice(
    getValue(signal, ["entry", "entry_price", "price"], "—"),
  );
  const stop = formatPrice(
    getValue(signal, ["stop_loss_price", "stop_loss", "stop", "sl"], "—"),
  );
  const target = formatPrice(
    getValue(signal, ["take_profit_price", "take_profit", "target", "tp"], "—"),
  );

  if (!signal) {
    return (
      <InspectorPanel eyebrow="Inspector" title="No Signal Selected">
        <TerminalEmpty
          title="No signal selected"
          description="Select a row from the signal table to inspect its details."
        />
      </InspectorPanel>
    );
  }

  return (
    <InspectorPanel eyebrow="Inspector" title="Selected Signal">
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-50">
              {symbol}
            </h2>
            <TerminalBadge label={side} tone={getSideTone(side)} />
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">{strategy}</p>
        </div>

        <StatusMatrix
          items={[
            {
              label: "Status",
              value: status,
              tone: getStatusTone(status),
              helper: "Signal lifecycle state.",
            },
            {
              label: "Confidence",
              value: formatConfidence(confidence),
              tone: getConfidenceTone(confidence),
              helper: "Strategy confidence or score.",
            },
            {
              label: "Timeframe",
              value: timeframe,
              tone: "neutral",
              helper: "Signal horizon.",
            },
            {
              label: "Execution",
              value: "Review only",
              tone: "success",
              helper: "No order is created from this view.",
            },
          ]}
        />

        <DataPanel title="Price Levels" noPadding>
          <div className="grid grid-cols-3 divide-x divide-slate-800">
            <div className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Entry
              </p>
              <p className="mt-2 font-mono text-sm text-slate-200">{entry}</p>
            </div>

            <div className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Stop
              </p>
              <p className="mt-2 font-mono text-sm text-slate-200">{stop}</p>
            </div>

            <div className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Target
              </p>
              <p className="mt-2 font-mono text-sm text-slate-200">{target}</p>
            </div>
          </div>
        </DataPanel>

        <DataPanel
          title="Decision Note"
          description="Signals are inputs to validation. They do not bypass promotion, risk or execution safety gates."
        >
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3 text-xs leading-5 text-amber-200">
            Manual review is required before shadow-live, testnet or any future
            execution workflow.
          </div>
        </DataPanel>

        <DataPanel title="Raw Signal">
          <TerminalJson data={signal} />
        </DataPanel>
      </div>
    </InspectorPanel>
  );
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  async function loadSignals() {
    setLoading(true);
    setError(null);

    try {
      const response = await getSignals();
      const loadedSignals = Array.isArray(response)
        ? (response as SignalRecord[])
        : [];

      setSignals(loadedSignals);

      if (loadedSignals.length > 0) {
        setSelectedKey((current) => current ?? getSignalKey(loadedSignals[0], 0));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signals.");
      setSignals([]);
      setSelectedKey(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignals();
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

  const selectedSignal = useMemo(() => {
    if (filteredSignals.length === 0) return null;

    const directMatch = filteredSignals.find(
      (signal, index) => getSignalKey(signal, index) === selectedKey,
    );

    return directMatch ?? filteredSignals[0] ?? null;
  }, [filteredSignals, selectedKey]);

  const selectedSignalKey = useMemo(() => {
    if (!selectedSignal) return null;
    const selectedIndex = filteredSignals.indexOf(selectedSignal);
    return getSignalKey(selectedSignal, selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredSignals, selectedSignal]);

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

  const highConfidenceCount = signals.filter((signal) => {
    const confidence = getNumberValue(signal, ["confidence", "score"]);
    return confidence !== null && confidence >= 70;
  }).length;

  return (
    <TerminalPage>
      <div className="space-y-5">
        <TerminalHeader
          eyebrow="Signal Intelligence"
          title="Signal Review Center"
          description="Compact review workspace for strategy-generated signal candidates. Signals remain validation inputs only; this page does not create exchange orders."
          meta={
            <>
              <TerminalBadge label="Review Only" tone="success" />
              <TerminalBadge label="No Auto Execution" tone="danger" />
              <TerminalBadge label="Promotion Required" tone="warning" />
            </>
          }
          actions={
            <>
              <TerminalButton onClick={loadSignals} disabled={loading}>
                {loading ? "Refreshing" : "Refresh"}
              </TerminalButton>

              <TerminalLink href="/promotion" tone="info">
                Promotion Gate
              </TerminalLink>
            </>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CompactMetric
            label="Signals"
            value={signals.length}
            helper="Loaded candidates"
            tone="info"
          />
          <CompactMetric
            label="Active"
            value={activeCount}
            helper="Currently active"
            tone="success"
          />
          <CompactMetric
            label="Buy / Long"
            value={buyCount}
            helper="Upside direction"
            tone="success"
          />
          <CompactMetric
            label="Sell / Short"
            value={sellCount}
            helper="Downside direction"
            tone="danger"
          />
        </div>

        <ControlBar>
          <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_180px_180px]">
            <input
              className={TerminalInputClassName()}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search symbol or strategy..."
            />

            <select
              className={TerminalInputClassName()}
              value={sideFilter}
              onChange={(event) => setSideFilter(event.target.value)}
            >
              <option value="ALL">All sides</option>
              <option value="BUY">Buy / Long</option>
              <option value="SELL">Sell / Short</option>
            </select>

            <select
              className={TerminalInputClassName()}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="review">Review</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <TerminalBadge
              label={`${filteredSignals.length} visible`}
              tone="neutral"
            />
            <TerminalBadge
              label={`${highConfidenceCount} high confidence`}
              tone={highConfidenceCount > 0 ? "warning" : "neutral"}
            />
          </div>
        </ControlBar>

        <SplitView
          left={
            <DataPanel
              eyebrow="Signals"
              title="Candidate Table"
              description="Select a row to inspect the normalized signal record."
              noPadding
            >
              {loading ? (
                <div className="p-4">
                  <TerminalEmpty
                    title="Loading signals"
                    description="Fetching signal candidates from the backend."
                    tone="info"
                  />
                </div>
              ) : error ? (
                <div className="p-4">
                  <TerminalEmpty
                    title="Signals unavailable"
                    description={error}
                    tone="danger"
                  />
                </div>
              ) : filteredSignals.length === 0 ? (
                <div className="p-4">
                  <TerminalEmpty
                    title="No matching signals"
                    description="Adjust the search, side or status filters."
                    tone="neutral"
                  />
                </div>
              ) : (
                <TerminalTable className="rounded-none border-0">
                  <TerminalTableHead>
                    <tr>
                      <TerminalTh>Market</TerminalTh>
                      <TerminalTh>Strategy</TerminalTh>
                      <TerminalTh>Side</TerminalTh>
                      <TerminalTh>Status</TerminalTh>
                      <TerminalTh>Entry</TerminalTh>
                      <TerminalTh>Confidence</TerminalTh>
                      <TerminalTh>Time</TerminalTh>
                    </tr>
                  </TerminalTableHead>

                  <tbody>
                    {filteredSignals.map((signal, index) => {
                      const key = getSignalKey(signal, index);

                      return (
                        <SignalRow
                          key={key}
                          signal={signal}
                          index={index}
                          selected={selectedSignalKey === key}
                          onSelect={() => setSelectedKey(key)}
                        />
                      );
                    })}
                  </tbody>
                </TerminalTable>
              )}
            </DataPanel>
          }
          right={<SelectedSignalInspector signal={selectedSignal} />}
        />

        <DataPanel
          eyebrow="Diagnostics"
          title="Filtered Payload"
          description="Debug-only payload preview. Keep this below the primary workflow, not as the main UI."
        >
          <TerminalJson data={filteredSignals.slice(0, 10)} />
        </DataPanel>
      </div>
    </TerminalPage>
  );
}
