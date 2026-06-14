"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { GatewayStatusPanel } from "@/components/execution/GatewayStatusPanel";
import {
  getExecutionStatus,
  submitDryRunOrder,
} from "@/lib/api";
import {
  Card,
  CardHeader,
  Field,
  JsonPreview,
  MetricCard,
  PageHero,
  PremiumPageShell,
  SafetyNotice,
  StatusPill,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

function isObject(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getBoolean(source: unknown, key: string, fallback = false) {
  if (!isObject(source)) return fallback;
  return source[key] === true ? true : source[key] === false ? false : fallback;
}

function getString(source: unknown, key: string, fallback = "—") {
  if (!isObject(source)) return fallback;
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

const executionInputClassName =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50 focus:bg-sky-400/5";

export default function ExecutionPage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState("BUY");
  const [notionalUsdt, setNotionalUsdt] = useState("10");
  const [orderType, setOrderType] = useState("MARKET");
  const [source, setSource] = useState("frontend_manual_test");

  const [executionStatus, setExecutionStatus] = useState<unknown>(null);
  const [dryRunResponse, setDryRunResponse] = useState<unknown>(null);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadExecutionStatus() {
    setLoadingStatus(true);
    setError(null);

    try {
      const response = await getExecutionStatus();
      setExecutionStatus(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Execution status request failed."
      );
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    loadExecutionStatus();
  }, []);

  const statusMode = getString(executionStatus, "mode", "DRY_RUN_ONLY");
  const dryRunOnly = getBoolean(executionStatus, "dry_run_only", true);
  const realOrderSent = getBoolean(executionStatus, "real_order_sent", false);
  const emergencyStop = getBoolean(executionStatus, "emergency_stop", false);

  const parsedNotional = useMemo(() => {
    const value = Number(notionalUsdt);
    return Number.isFinite(value) ? value : 0;
  }, [notionalUsdt]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        symbol: symbol.trim().toUpperCase(),
        side,
        notional_usdt: parsedNotional,
        order_type: orderType,
        source: source.trim() || "frontend_manual_test",
      };

      const response = await submitDryRunOrder(payload);
      setDryRunResponse(response);
      await loadExecutionStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Dry-run order submission failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumPageShell>
      <PageHero
        pills={[
          { label: "Execution", tone: "info" },
          { label: "Dry Run Only", tone: "success" },
          { label: realOrderSent ? "Real Order Detected" : "No Real Orders", tone: realOrderSent ? "danger" : "success" },
        ]}
        title="Execution Control"
        description="Protected dry-run order testing. Accepted orders must pass the safety gate, route through the dry-run exchange gateway, and never send real exchange requests."
        actions={
          <button
            type="button"
            onClick={loadExecutionStatus}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:border-sky-400/40 hover:bg-sky-400/10"
          >
            Refresh Status
          </button>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <SafetyNotice
        title="Real orders are blocked"
        description="This screen is for dry-run execution validation only. The backend response must keep real_order_sent=false, network_request_sent=false, and binance_order_sent=false."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Execution Mode"
          value={statusMode}
          helper="Backend-reported execution mode"
          tone={statusMode === "DRY_RUN_ONLY" ? "success" : "warning"}
        />
        <MetricCard
          label="Dry Run Only"
          value={String(dryRunOnly)}
          helper="Must remain true"
          tone={dryRunOnly ? "success" : "danger"}
        />
        <MetricCard
          label="Real Orders Sent"
          value={String(realOrderSent)}
          helper="Must remain false"
          tone={realOrderSent ? "danger" : "success"}
        />
        <MetricCard
          label="Emergency Stop"
          value={String(emergencyStop)}
          helper="Runtime safety flag"
          tone={emergencyStop ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader
            eyebrow="Manual Test"
            title="Submit Dry-Run Order"
            description="Send a protected simulated order to /execution/dry-run-order."
            action={
              <StatusPill
                label={submitting ? "Submitting" : "Ready"}
                tone={submitting ? "warning" : "success"}
              />
            }
          />

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <Field label="Symbol" helper="Example: BTCUSDT">
              <input
                className={executionInputClassName}
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="BTCUSDT"
              />
            </Field>

            <Field label="Side" helper="BUY or SELL">
              <select
                className={executionInputClassName}
                value={side}
                onChange={(event) => setSide(event.target.value)}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </Field>

            <Field label="Notional USDT" helper="Keep this small for safety tests.">
              <input
                className={executionInputClassName}
                type="number"
                min="0"
                step="1"
                value={notionalUsdt}
                onChange={(event) => setNotionalUsdt(event.target.value)}
                placeholder="10"
              />
            </Field>

            <Field label="Order Type" helper="Currently tested as MARKET.">
              <select
                className={executionInputClassName}
                value={orderType}
                onChange={(event) => setOrderType(event.target.value)}
              >
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
              </select>
            </Field>

            <Field label="Source" helper="Audit label for this manual test.">
              <input
                className={executionInputClassName}
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="frontend_manual_test"
              />
            </Field>

            <button
              type="submit"
              disabled={submitting || parsedNotional <= 0}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {submitting ? "Submitting dry-run order..." : "Submit Dry-Run Order"}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Backend Status"
            title="Execution Safety State"
            description="Raw execution status returned by the backend."
            action={
              <StatusPill
                label={loadingStatus ? "Loading" : "Loaded"}
                tone={loadingStatus ? "warning" : "success"}
              />
            }
          />

          <div className="p-6">
            {executionStatus ? (
              <JsonPreview data={executionStatus} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm leading-6 text-slate-400">
                Execution status has not loaded yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          eyebrow="Dry-Run Response"
          title="Gateway Validation Result"
          description="Latest backend response after submitting a dry-run order."
        />

        <div className="p-6">
          {dryRunResponse ? (
            <>
              <GatewayStatusPanel result={dryRunResponse} />
              <JsonPreview data={dryRunResponse} />
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm leading-6 text-slate-400">
              No dry-run order has been submitted from this session yet.
            </div>
          )}
        </div>
      </Card>
    </PremiumPageShell>
  );
}