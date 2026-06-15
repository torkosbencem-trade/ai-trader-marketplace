"use client";

import { useState } from "react";
import { submitDryRunOrder, type DryRunOrderResult } from "@/lib/api";

export function DryRunOrderPanel() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState("BUY");
  const [entryPrice, setEntryPrice] = useState(63850);
  const [orderUsdt, setOrderUsdt] = useState(25);
  const [riskPercent, setRiskPercent] = useState(0.1);
  const [takeProfitPercent, setTakeProfitPercent] = useState(0.2);
  const [stopLossPercent, setStopLossPercent] = useState(0.2);
  const [tvConfirmed, setTvConfirmed] = useState(true);
  const [strategyGuardPassed, setStrategyGuardPassed] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DryRunOrderResult | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    try {
      setLoading(true);
      setMessage("");
      setResult(null);

      const response = await submitDryRunOrder({
        secret: "my_super_secret_key_123",
        symbol,
        side,
        entry_price: Number(entryPrice),
        order_usdt: Number(orderUsdt),
        risk_percent: Number(riskPercent),
        take_profit_percent: Number(takeProfitPercent),
        stop_loss_percent: Number(stopLossPercent),
        tv_confirmed: tvConfirmed,
        strategy_guard_passed: strategyGuardPassed,
      });

      setResult(response);
    } catch (error) {
      console.error(error);
      setMessage("Could not submit dry-run order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6">
      <div className="mb-5">
        <div className="mb-3 inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
          DRY RUN ORDER
        </div>

        <h2 className="text-xl font-bold text-emerald-300">
          Execution Preview
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Preview a simulated order without sending anything to Binance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-300">Symbol</label>
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">Side</label>
          <select
            value={side}
            onChange={(event) => setSide(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Entry Price
          </label>
          <input
            type="number"
            value={entryPrice}
            onChange={(event) => setEntryPrice(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Order USDT
          </label>
          <input
            type="number"
            value={orderUsdt}
            onChange={(event) => setOrderUsdt(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Risk Percent
          </label>
          <input
            type="number"
            step="0.01"
            value={riskPercent}
            onChange={(event) => setRiskPercent(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Take Profit %
          </label>
          <input
            type="number"
            step="0.01"
            value={takeProfitPercent}
            onChange={(event) =>
              setTakeProfitPercent(Number(event.target.value))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Stop Loss %
          </label>
          <input
            type="number"
            step="0.01"
            value={stopLossPercent}
            onChange={(event) => setStopLossPercent(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div className="grid gap-3">
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <span>TV Confirmed</span>
            <input
              type="checkbox"
              checked={tvConfirmed}
              onChange={(event) => setTvConfirmed(event.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <span>Strategy Guard Passed</span>
            <input
              type="checkbox"
              checked={strategyGuardPassed}
              onChange={(event) =>
                setStrategyGuardPassed(event.target.checked)
              }
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-400/20 disabled:opacity-50"
      >
        {loading ? "Checking..." : "Preview Dry Run Order"}
      </button>

      {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}

      {result ? (
        <div
          className={`mt-5 rounded-2xl border p-5 ${
            result.allowed
              ? "border-emerald-400/20 bg-emerald-400/[0.04]"
              : "border-red-400/20 bg-red-400/[0.04]"
          }`}
        >
          <div
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              result.allowed
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-red-400/10 text-red-300"
            }`}
          >
            {result.status}
          </div>

          <p className="mt-3 text-sm text-slate-300">
  {typeof result.reason === "string"
    ? result.reason
    : "No rejection reason returned."}
</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Quantity Preview</div>
              <div className="mt-1 text-lg font-bold">
                {result.quantity_preview !== undefined && result.quantity_preview !== null
  ? String(result.quantity_preview)
  : "â€”"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Real Order Sent</div>
              <div className="mt-1 text-lg font-bold">
                {String(result.real_order_sent)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Take Profit Price</div>
              <div className="mt-1 text-lg font-bold text-emerald-300">
              {result.take_profit_price !== undefined && result.take_profit_price !== null
  ? String(result.take_profit_price)
  : "â€”"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Stop Loss Price</div>
              <div className="mt-1 text-lg font-bold text-red-300">
                {result.stop_loss_price !== undefined && result.stop_loss_price !== null
  ? String(result.stop_loss_price)
  : "â€”"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
