import { SignalCard } from "./signal-card"
import type { Signal } from "@/lib/api"

type SignalFeedProps = {
  signals: Signal[]
}

export function SignalFeed({ signals }: SignalFeedProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
        <h2 className="text-lg font-semibold text-white">Live Signal Feed</h2>

        <p className="mt-3 text-sm text-slate-400">
          No live signals yet. Waiting for TradingView alerts or backend data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {signals.map((signal, index) => (
        <SignalCard
          key={String(signal.id ?? `${signal.symbol}-${signal.side}-${String(signal.entry ?? "—")}-${index}`)}
          signal={signal}
        />
      ))}
    </div>
  )
}
