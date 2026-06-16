import Link from "next/link";
import { SmallMetric } from "./metric-card";

type Strategy = {
  slug: string;
  name: string;
  status: string;
  winrate: string;
  profitFactor: string;
  expectancy: string;
  drawdown: string;
  trades: number;
  risk: string;
};

export function StrategyCard({ strategy }: { strategy: Strategy }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="text-xl font-bold">{strategy.name}</div>
          <div className="mt-2 inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            {strategy.status}
          </div>
        </div>

        <Link
          href={`/strategies/${strategy.slug}`}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
        >
          View Strategy
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <SmallMetric label="Winrate" value={strategy.winrate} />
        <SmallMetric label="Profit Factor" value={strategy.profitFactor} />
        <SmallMetric label="Expectancy" value={strategy.expectancy} positive />
        <SmallMetric label="Drawdown" value={strategy.drawdown} />
        <SmallMetric label="Trades" value={String(strategy.trades)} />
        <SmallMetric label="Risk" value={strategy.risk} />
      </div>
    </div>
  );
}