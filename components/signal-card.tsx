import type { Signal } from "@/lib/api"

type SignalCardProps = {
  signal: Signal
}

export function SignalCard({ signal }: SignalCardProps) {
  const isBuy = signal.side === "BUY"

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-cyan-950/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {String(signal.symbol ?? "—")}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                isBuy
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              }`}
            >
              {String(signal.side ?? "—")}
            </span>

            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
              {String(signal.status ?? "—")}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            {String(signal.strategy ?? "Unknown strategy")}
          </p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>ID: {String(signal.id ?? "—")}</span>
            <span>â€˘</span>
            <span>TF: {String(signal.timeframe ?? "—")}</span>
            <span>â€˘</span>
            <span>{String(signal.timestamp ?? "—")}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">Confidence</p>
          <p className="text-lg font-semibold text-cyan-300">
            {String(signal.confidence ?? "—")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Entry</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {String(signal.entry ?? "—")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Take Profit</p>
          <p className="mt-1 text-sm font-semibold text-emerald-400">
            {String(signal.tp ?? "—")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Stop Loss</p>
          <p className="mt-1 text-sm font-semibold text-rose-400">
            {String(signal.sl ?? "—")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">Risk</p>
          <p className="mt-1 font-medium text-slate-200">
            {String(signal.riskStatus ?? "—")}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">Guard</p>
          <p className="mt-1 font-medium text-slate-200">
            {String(signal.guardStatus ?? "—")}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">Mode</p>
          <p className="mt-1 font-medium text-slate-200">
            {String(signal.mode ?? "—")}
          </p>
        </div>
      </div>
    </div>
  )
}





