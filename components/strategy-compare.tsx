"use client";

import { useState } from "react";
import { SmallMetric } from "@/components/metric-card";

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
  mode: string;
  tp: string;
  sl: string;
  timeframe: string;
};

export function StrategyCompare({ strategies }: { strategies: Strategy[] }) {
  const [firstSlug, setFirstSlug] = useState(strategies[0]?.slug ?? "");
  const [secondSlug, setSecondSlug] = useState(strategies[1]?.slug ?? "");

  const firstStrategy = strategies.find((strategy) => strategy.slug === firstSlug);
  const secondStrategy = strategies.find((strategy) => strategy.slug === secondSlug);

  if (!firstStrategy || !secondStrategy) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold">Strategy Compare</h2>
        <p className="mt-1 text-sm text-slate-400">
          Compare two strategies side by side before subscribing or enabling alerts.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <select
          value={firstSlug}
          onChange={(event) => setFirstSlug(event.target.value)}
          className="min-h-11 rounded-xl border border-white/10 bg-[#070A12] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
        >
          {strategies.map((strategy) => (
            <option key={strategy.slug} value={strategy.slug}>
              {strategy.name}
            </option>
          ))}
        </select>

        <select
          value={secondSlug}
          onChange={(event) => setSecondSlug(event.target.value)}
          className="min-h-11 rounded-xl border border-white/10 bg-[#070A12] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
        >
          {strategies.map((strategy) => (
            <option key={strategy.slug} value={strategy.slug}>
              {strategy.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CompareCard strategy={firstStrategy} />
        <CompareCard strategy={secondStrategy} />
      </div>
    </div>
  );
}

function CompareCard({
  strategy,
}: {
  strategy: {
    name: string;
    status: string;
    winrate: string;
    profitFactor: string;
    expectancy: string;
    drawdown: string;
    trades: number;
    risk: string;
    mode: string;
    tp: string;
    sl: string;
    timeframe: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#070A12] p-5">
      <div className="mb-4">
        <div className="text-lg font-bold">{strategy.name}</div>
        <div className="mt-2 inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          {strategy.status}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SmallMetric label="Winrate" value={strategy.winrate} />
        <SmallMetric label="Profit Factor" value={strategy.profitFactor} />
        <SmallMetric label="Expectancy" value={strategy.expectancy} positive />
        <SmallMetric label="Drawdown" value={strategy.drawdown} />
        <SmallMetric label="Trades" value={String(strategy.trades)} />
        <SmallMetric label="Risk" value={strategy.risk} />
        <SmallMetric label="Mode" value={strategy.mode} />
        <SmallMetric label="Timeframe" value={strategy.timeframe} />
        <SmallMetric label="TP" value={strategy.tp} positive />
        <SmallMetric label="SL" value={strategy.sl} />
      </div>
    </div>
  );
}