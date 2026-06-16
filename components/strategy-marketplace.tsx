"use client";

import { useState } from "react";
import { StrategyCard } from "@/components/strategy-card";

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
  description: string;
  rules: string[];
  strengths: string[];
  weaknesses: string[];
};

export function StrategyMarketplace({
  strategies,
}: {
  strategies: Strategy[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const statuses = ["All", ...Array.from(new Set(strategies.map((s) => s.status)))];
  const risks = ["All", ...Array.from(new Set(strategies.map((s) => s.risk)))];

  const filteredStrategies = strategies.filter((strategy) => {
    const matchesSearch =
      strategy.name.toLowerCase().includes(search.toLowerCase()) ||
      strategy.description.toLowerCase().includes(search.toLowerCase()) ||
      strategy.mode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || strategy.status === statusFilter;

    const matchesRisk = riskFilter === "All" || strategy.risk === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search strategies..."
          className="min-h-11 flex-1 rounded-xl border border-white/10 bg-[#070A12] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="min-h-11 rounded-xl border border-white/10 bg-[#070A12] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={riskFilter}
          onChange={(event) => setRiskFilter(event.target.value)}
          className="min-h-11 rounded-xl border border-white/10 bg-[#070A12] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
        >
          {risks.map((risk) => (
            <option key={risk} value={risk}>
              {risk}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 text-sm text-slate-400">
        Showing {filteredStrategies.length} of {strategies.length} strategies
      </div>

      <div className="grid gap-4">
        {filteredStrategies.map((strategy) => (
          <StrategyCard key={strategy.slug} strategy={strategy} />
        ))}

        {filteredStrategies.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-400">
            No strategies match your filters.
          </div>
        )}
      </div>
    </div>
  );
}