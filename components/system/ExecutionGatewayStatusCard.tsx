"use client";

import { useEffect, useState } from "react";

import { getExecutionGatewayStatus } from "@/lib/api";

type AnyRecord = Record<string, unknown>;

function isObject(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(source: unknown, key: string, fallback = "—") {
  if (!isObject(source)) return fallback;
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getBoolean(source: unknown, key: string, fallback = false) {
  if (!isObject(source)) return fallback;
  const value = source[key];
  return value === true ? true : value === false ? false : fallback;
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={[
        "rounded-full border px-3 py-1 text-xs font-semibold",
        ok
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-rose-400/30 bg-rose-400/10 text-rose-200",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

export function ExecutionGatewayStatusCard() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadGatewayStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await getExecutionGatewayStatus();
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Execution gateway status request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGatewayStatus();
  }, []);

  const gateway = getString(data, "gateway");
  const executionEngine = getString(data, "execution_engine");
  const message = getString(data, "message");

  const gatewayAvailable = getBoolean(data, "gateway_available");
  const dryRunOnly = getBoolean(data, "dry_run_only");
  const realOrderSent = getBoolean(data, "real_order_sent");
  const networkRequestSent = getBoolean(data, "network_request_sent");
  const binanceOrderSent = getBoolean(data, "binance_order_sent");
  const auditLogging = getBoolean(data, "audit_logging");

  const safe =
    gatewayAvailable &&
    gateway === "DRY_RUN_EXCHANGE_GATEWAY" &&
    executionEngine === "dry_run_only" &&
    dryRunOnly &&
    !realOrderSent &&
    !networkRequestSent &&
    !binanceOrderSent &&
    auditLogging;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Execution Gateway
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Dry-run exchange gateway status
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            System-level confirmation that execution remains simulated and no
            exchange request is sent.
          </p>
        </div>

        <button
          type="button"
          onClick={loadGatewayStatus}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge label={safe ? "Gateway safe" : "Gateway unsafe"} ok={safe} />
            <Badge label={`gateway: ${gateway}`} ok={gateway === "DRY_RUN_EXCHANGE_GATEWAY"} />
            <Badge label={`engine: ${executionEngine}`} ok={executionEngine === "dry_run_only"} />
            <Badge label={`dry_run_only: ${String(dryRunOnly)}`} ok={dryRunOnly} />
            <Badge label={`real_order_sent: ${String(realOrderSent)}`} ok={!realOrderSent} />
            <Badge label={`network_request_sent: ${String(networkRequestSent)}`} ok={!networkRequestSent} />
            <Badge label={`binance_order_sent: ${String(binanceOrderSent)}`} ok={!binanceOrderSent} />
            <Badge label={`audit_logging: ${String(auditLogging)}`} ok={auditLogging} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            {message}
          </div>
        </>
      )}
    </section>
  );
}