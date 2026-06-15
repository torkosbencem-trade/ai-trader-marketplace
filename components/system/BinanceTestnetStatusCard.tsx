"use client";

import { useEffect, useState } from "react";

import { getBinanceTestnetStatus } from "@/lib/api";
import {
  Card,
  CardHeader,
  JsonPreview,
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

function getBoolean(data: unknown, key: string, fallback = false) {
  if (!isObject(data)) return fallback;

  const value = data[key];

  if (value === true) return true;
  if (value === false) return false;

  return fallback;
}

function getStatusTone(data: unknown): Tone {
  const status = getString(data, "status", "unknown");
  const publicPingOk = getBoolean(data, "public_ping_ok");
  const serverTimeOk = getBoolean(data, "server_time_ok");
  const realOrderSent = getBoolean(data, "real_order_sent");
  const binanceOrderSent = getBoolean(data, "binance_order_sent");

  if (realOrderSent || binanceOrderSent) return "danger";
  if (status === "ok" && publicPingOk && serverTimeOk) return "success";
  if (status === "warning") return "warning";

  return "neutral";
}

function SafetyRow({
  label,
  value,
  safeWhen,
}: {
  label: string;
  value: boolean;
  safeWhen: boolean;
}) {
  const safe = value === safeWhen;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>

      <StatusPill
        label={String(value)}
        tone={safe ? "success" : "danger"}
      />
    </div>
  );
}

export function BinanceTestnetStatusCard() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await getBinanceTestnetStatus();
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Binance Testnet status.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  const status = getString(data, "status", loading ? "loading" : "unknown");
  const mode = getString(data, "mode", "—");
  const baseUrl = getString(data, "base_url", "—");
  const message = getString(data, "message", "—");

  const enabled = getBoolean(data, "enabled");
  const publicPingOk = getBoolean(data, "public_ping_ok");
  const serverTimeOk = getBoolean(data, "server_time_ok");
  const accountAccessible = getBoolean(data, "account_accessible");
  const mainnetEnabled = getBoolean(data, "mainnet_enabled");
  const orderEndpointEnabled = getBoolean(data, "order_endpoint_enabled");
  const realOrderSent = getBoolean(data, "real_order_sent");
  const binanceOrderSent = getBoolean(data, "binance_order_sent");
  const testnetNetworkRequestSent = getBoolean(
    data,
    "testnet_network_request_sent",
  );

  return (
    <Card>
      <CardHeader
        eyebrow="Binance"
        title="Binance Testnet Status"
        description="Read-only Spot Testnet preflight. No order endpoint is enabled."
        action={
          <StatusPill
            label={loading ? "Loading" : status}
            tone={getStatusTone(data)}
          />
        }
      />

      <div className="space-y-5 p-6">
        {error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100/70">
            Mode
          </p>

          <p className="mt-2 break-all text-sm font-semibold text-sky-100">
            {mode}
          </p>

          <p className="mt-3 break-all text-xs text-sky-100/70">
            {baseUrl}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SafetyRow label="Testnet enabled" value={enabled} safeWhen={true} />
          <SafetyRow label="Public ping OK" value={publicPingOk} safeWhen={true} />
          <SafetyRow label="Server time OK" value={serverTimeOk} safeWhen={true} />
          <SafetyRow
            label="Account accessible"
            value={accountAccessible}
            safeWhen={true}
          />
          <SafetyRow
            label="Mainnet enabled"
            value={mainnetEnabled}
            safeWhen={false}
          />
          <SafetyRow
            label="Order endpoint enabled"
            value={orderEndpointEnabled}
            safeWhen={false}
          />
          <SafetyRow
            label="Real order sent"
            value={realOrderSent}
            safeWhen={false}
          />
          <SafetyRow
            label="Binance order sent"
            value={binanceOrderSent}
            safeWhen={false}
          />
          <SafetyRow
            label="Testnet network request"
            value={testnetNetworkRequestSent}
            safeWhen={true}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Message
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {message}
          </p>
        </div>

        {data ? <JsonPreview data={data} /> : null}

        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {loading ? "Refreshing..." : "Refresh Binance Testnet Status"}
        </button>
      </div>
    </Card>
  );
}