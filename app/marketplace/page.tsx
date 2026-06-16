"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RiskLevel = "Low" | "Medium" | "High";
type StrategyStatus = "Live" | "Verified" | "Research";

type MarketplaceStrategy = {
  id: string;
  name: string;
  manager: string;
  category: string;
  risk: RiskLevel;
  monthlyReturn: number;
  drawdown: number;
  sharpe: number;
  winRate: number;
  trades: number;
  capital: string;
  markets: string[];
  description: string;
  status: StrategyStatus;
  source?: "demo" | "file-store";
  approvedFromSubmission?: boolean;
};

const fallbackStrategies: MarketplaceStrategy[] = [];

function riskClass(risk: RiskLevel) {
  if (risk === "Low") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (risk === "Medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function statusClass(status: StrategyStatus) {
  if (status === "Verified") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (status === "Live") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
}

export default function MarketplacePage() {
  const [strategies, setStrategies] =
    useState<MarketplaceStrategy[]>(fallbackStrategies);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState<"All" | RiskLevel>("All");
  const [selectedStrategy, setSelectedStrategy] =
    useState<MarketplaceStrategy | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadMarketplace() {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/marketplace", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load marketplace.");
      }

      const loadedStrategies = payload.data ?? [];

      setStrategies(loadedStrategies);
      setSelectedStrategy((current) => current ?? loadedStrategies[0] ?? null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load marketplace."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarketplace();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(strategies.map((strategy) => strategy.category))
    );

    return ["All", ...unique];
  }, [strategies]);

  const filteredStrategies = useMemo(() => {
    return strategies.filter((strategy) => {
      const categoryMatch =
        selectedCategory === "All" || strategy.category === selectedCategory;

      const riskMatch = selectedRisk === "All" || strategy.risk === selectedRisk;

      return categoryMatch && riskMatch;
    });
  }, [strategies, selectedCategory, selectedRisk]);

  useEffect(() => {
    if (
      selectedStrategy &&
      !filteredStrategies.some((strategy) => strategy.id === selectedStrategy.id)
    ) {
      setSelectedStrategy(filteredStrategies[0] ?? null);
    }
  }, [filteredStrategies, selectedStrategy]);

  const approvedCount = strategies.filter(
    (strategy) => strategy.source === "file-store"
  ).length;

  const topSharpe =
    strategies.length > 0
      ? Math.max(...strategies.map((strategy) => strategy.sharpe || 0))
      : 0;

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Institutional strategy marketplace
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Discover, compare and deploy trading systems.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
                Browse verified systematic strategies with transparent
                performance, risk metrics, market coverage and allocation
                requirements. Approved creator submissions now appear here after
                Admin Review.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <HeaderMetric label="Strategies" value={String(strategies.length)} />
              <HeaderMetric label="Approved live" value={String(approvedCount)} />
              <HeaderMetric label="Top Sharpe" value={topSharpe.toFixed(2)} />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-300">
                Filter strategies
              </p>
              <p className="text-xs text-zinc-500">
                Live marketplace data is loaded from /api/marketplace.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <button
                onClick={loadMarketplace}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Refresh
              </button>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0B0F17] px-4 py-3 text-sm text-white outline-none"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedRisk}
                onChange={(event) =>
                  setSelectedRisk(event.target.value as "All" | RiskLevel)
                }
                className="rounded-xl border border-white/10 bg-[#0B0F17] px-4 py-3 text-sm text-white outline-none"
              >
                {["All", "Low", "Medium", "High"].map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </div>
          </div>

          {loadError && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {loadError}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="grid gap-4">
          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-lg font-medium">Loading marketplace...</p>
              <p className="mt-2 text-sm text-zinc-500">
                Fetching approved strategies and demo listings.
              </p>
            </div>
          )}

          {!loading &&
            filteredStrategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                className={`rounded-3xl border p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                  selectedStrategy?.id === strategy.id
                    ? "border-emerald-400/40 bg-emerald-400/[0.04]"
                    : "border-white/10 bg-white/[0.025]"
                }`}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-white">
                        {strategy.name}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${statusClass(
                          strategy.status
                        )}`}
                      >
                        {strategy.status}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${riskClass(
                          strategy.risk
                        )}`}
                      >
                        {strategy.risk} risk
                      </span>

                      {strategy.source === "file-store" && (
                        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                          Approved creator strategy
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      {strategy.manager}
                    </p>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                      {strategy.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {strategy.markets.map((market) => (
                        <span
                          key={market}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
                        >
                          {market}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-[260px] grid-cols-2 gap-3">
                    <Metric
                      label="Monthly return"
                      value={`${strategy.monthlyReturn}%`}
                    />
                    <Metric
                      label="Max drawdown"
                      value={`${strategy.drawdown}%`}
                    />
                    <Metric
                      label="Sharpe"
                      value={
                        strategy.sharpe > 0 ? strategy.sharpe.toFixed(2) : "Pending"
                      }
                    />
                    <Metric
                      label="Win rate"
                      value={
                        strategy.winRate > 0 ? `${strategy.winRate}%` : "Pending"
                      }
                    />
                  </div>
                </div>
              </button>
            ))}

          {!loading && filteredStrategies.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-lg font-medium">No strategies found</p>
              <p className="mt-2 text-sm text-zinc-500">
                Approve a Strategy Builder submission in Admin Review, then refresh
                the marketplace.
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          {selectedStrategy ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Selected strategy</p>
                  <h3 className="mt-1 text-2xl font-semibold">
                    {selectedStrategy.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {selectedStrategy.manager}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs ${statusClass(
                    selectedStrategy.status
                  )}`}
                >
                  {selectedStrategy.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Metric
                  label="Monthly return"
                  value={`${selectedStrategy.monthlyReturn}%`}
                  large
                />
                <Metric
                  label="Max drawdown"
                  value={`${selectedStrategy.drawdown}%`}
                  large
                />
                <Metric
                  label="Sharpe ratio"
                  value={
                    selectedStrategy.sharpe > 0
                      ? selectedStrategy.sharpe.toFixed(2)
                      : "Pending"
                  }
                  large
                />
                <Metric
                  label="Total trades"
                  value={
                    selectedStrategy.trades > 0
                      ? selectedStrategy.trades.toLocaleString()
                      : "Pending"
                  }
                  large
                />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-zinc-300">
                  Allocation profile
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Category" value={selectedStrategy.category} />
                  <Row label="Risk level" value={selectedStrategy.risk} />
                  <Row label="Min. capital" value={selectedStrategy.capital} />
                  <Row
                    label="Source"
                    value={
                      selectedStrategy.source === "file-store"
                        ? "Approved submission"
                        : "Demo strategy"
                    }
                  />
                </div>
              </div>

              <Link
                href={`/marketplace/${selectedStrategy.id}`}
                className="mt-6 block w-full rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                View full performance report
              </Link>

              <Link
                href={`/allocation/${selectedStrategy.id}`}
                className="mt-3 block w-full rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                Request allocation access
              </Link>

              <p className="mt-4 text-xs leading-5 text-zinc-600">
                Approved creator strategies are loaded from file-store after Admin
                Review. Production should validate broker evidence and execution
                logs before investor allocation.
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Select a strategy to view details.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-2 font-semibold text-white ${
          large ? "text-2xl" : "text-lg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}