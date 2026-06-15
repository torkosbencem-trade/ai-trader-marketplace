"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateShadowLiveConfig,
  type ShadowLiveConfig,
} from "@/lib/api";

type ShadowLiveConfigPanelProps = {
  initialConfig: ShadowLiveConfig;
};

export function ShadowLiveConfigPanel({
  initialConfig,
}: ShadowLiveConfigPanelProps) {
  const router = useRouter();

  const [maxOrderUsdt, setMaxOrderUsdt] = useState(
    initialConfig.max_order_usdt
  );
  const [maxRiskPercent, setMaxRiskPercent] = useState(
    initialConfig.max_risk_percent
  );
  const [tvConfirmationRequired, setTvConfirmationRequired] = useState(
    initialConfig.tv_confirmation_required
  );
  const [strategyGuardRequired, setStrategyGuardRequired] = useState(
    initialConfig.strategy_guard_required
  );
  const [emergencyStop, setEmergencyStop] = useState(
    initialConfig.emergency_stop
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    try {
      setLoading(true);
      setMessage("");

      await updateShadowLiveConfig({
        max_order_usdt: Number(maxOrderUsdt),
        max_risk_percent: Number(maxRiskPercent),
        tv_confirmation_required: tvConfirmationRequired,
        strategy_guard_required: strategyGuardRequired,
        emergency_stop: emergencyStop,
        updated_at: initialConfig.updated_at,
      });

      setMessage("Shadow Live config saved.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Could not save Shadow Live config.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6">
      <div className="mb-5">
        <div className="mb-3 inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
          SAFETY CONFIG
        </div>

        <h2 className="text-xl font-bold text-emerald-300">
          Shadow Live Safety Config
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Control simulated execution limits before moving toward Binance
          testnet.
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">
            Max Order USDT
          </label>
          <input
            type="number"
            value={maxOrderUsdt}
            onChange={(event) => setMaxOrderUsdt(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Max Risk Percent
          </label>
          <input
            type="number"
            step="0.01"
            value={maxRiskPercent}
            onChange={(event) => setMaxRiskPercent(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          <span>Require TradingView Confirmation</span>
          <input
            type="checkbox"
            checked={Boolean(tvConfirmationRequired)}
            onChange={(event) =>
              setTvConfirmationRequired(event.target.checked)
            }
            className="h-5 w-5"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          <span>Require Strategy Guard</span>
          <input
            type="checkbox"
            checked={Boolean(strategyGuardRequired)}
            onChange={(event) =>
              setStrategyGuardRequired(event.target.checked)
            }
            className="h-5 w-5"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 text-sm text-red-300">
          <span>Emergency Stop</span>
          <input
            type="checkbox"
            checked={Boolean(emergencyStop)}
            onChange={(event) => setEmergencyStop(event.target.checked)}
            className="h-5 w-5"
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-400/20 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Safety Config"}
      </button>

      {message ? (
        <p className="mt-4 text-sm text-slate-300">{message}</p>
      ) : null}

      {initialConfig.updated_at ? (
        <p className="mt-3 text-xs text-slate-500">
          Last updated: {initialConfig.updated_at}
        </p>
      ) : null}
    </div>
  );
}

