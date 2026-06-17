"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../lib/supabase-browser";

type RiskProfile = "not_set" | "conservative" | "balanced" | "aggressive" | "professional";
type StrategyRisk = "Low" | "Medium" | "High";

type Profile = {
  id: string;
  email: string;
  role: string;
  risk_profile: RiskProfile;
  onboarding_completed: boolean;
};

type Strategy = {
  id: string;
  name: string;
  category?: string;
  assetClass?: string;
  timeframe?: string;
  risk?: StrategyRisk;
  riskLevel?: StrategyRisk;
  riskProfile?: StrategyRisk;
  description?: string;
  monthlyTarget?: number;
  maxDrawdown?: number;
  totalReturn?: number;
  winRate?: number;
  sharpe?: number;
};

type Compatibility = {
  label: string;
  tone: "good" | "warn" | "danger" | "neutral";
  message: string;
  score: number;
};

const riskProfileLabels: Record<RiskProfile, string> = {
  not_set: "Not set",
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
  professional: "Professional",
};

const strategyRiskWeight: Record<StrategyRisk, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

const userRiskCapacity: Record<RiskProfile, number> = {
  not_set: 0,
  conservative: 1,
  balanced: 2,
  aggressive: 3,
  professional: 3,
};

function normalizeStrategyRisk(strategy: Strategy): StrategyRisk {
  const raw = strategy.risk ?? strategy.riskLevel ?? strategy.riskProfile ?? "Medium";

  if (raw === "Low" || raw === "Medium" || raw === "High") {
    return raw;
  }

  return "Medium";
}

function getCompatibility(profile: RiskProfile, strategyRisk: StrategyRisk): Compatibility {
  if (profile === "not_set") {
    return {
      label: "Risk profile missing",
      tone: "neutral",
      message: "Complete onboarding before using strategy risk compatibility.",
      score: 0,
    };
  }

  if (profile === "professional") {
    return {
      label: "Professional review",
      tone: "good",
      message: "This user profile can review all strategy risk levels, but risk limits still apply.",
      score: 92,
    };
  }

  const userCapacity = userRiskCapacity[profile];
  const strategyWeight = strategyRiskWeight[strategyRisk];

  if (strategyWeight <= userCapacity) {
    return {
      label: "Aligned",
      tone: "good",
      message: "This strategy risk level is aligned with the selected user profile.",
      score: strategyRisk === "Low" ? 95 : 84,
    };
  }

  if (strategyWeight === userCapacity + 1) {
    return {
      label: "Caution",
      tone: "warn",
      message: "This strategy is slightly above the selected user risk profile. Smaller allocation or paper-only review is recommended.",
      score: 58,
    };
  }

  return {
    label: "Not aligned",
    tone: "danger",
    message: "This strategy risk level is too high for the selected user profile.",
    score: 32,
  };
}

function toneClass(tone: Compatibility["tone"]) {
  if (tone === "good") {
    return "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300";
  }

  if (tone === "warn") {
    return "border-amber-400/30 bg-amber-400/[0.08] text-amber-300";
  }

  if (tone === "danger") {
    return "border-red-400/30 bg-red-400/[0.08] text-red-300";
  }

  return "border-blue-400/30 bg-blue-400/[0.08] text-blue-300";
}

export default function RiskCheckPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const configured = hasSupabaseBrowserConfig();

  const selectedStrategy = useMemo(() => {
    return strategies.find((strategy) => strategy.id === selectedStrategyId) ?? strategies[0] ?? null;
  }, [strategies, selectedStrategyId]);

  const activeRiskProfile: RiskProfile = profile?.risk_profile ?? "not_set";

  const selectedStrategyRisk = selectedStrategy
    ? normalizeStrategyRisk(selectedStrategy)
    : "Medium";

  const compatibility = getCompatibility(activeRiskProfile, selectedStrategyRisk);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      if (!configured) {
        throw new Error("Supabase browser config is missing.");
      }

      const supabase = createSupabaseBrowserClient();
      const activeSession = (await supabase.auth.getSession()).data.session ?? null;

      setSession(activeSession);

      if (activeSession) {
        const profileResponse = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${activeSession.access_token}`,
          },
          cache: "no-store",
        });

        const profilePayload = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profilePayload.error ?? "Profile lookup failed.");
        }

        setProfile(profilePayload.data ?? null);
      }

      const strategyResponse = await fetch("/api/strategies", {
        cache: "no-store",
      });

      const strategyPayload = await strategyResponse.json();

      if (!strategyResponse.ok) {
        throw new Error(strategyPayload.error ?? "Strategy lookup failed.");
      }

      const nextStrategies: Strategy[] = Array.isArray(strategyPayload.data)
        ? strategyPayload.data
        : Array.isArray(strategyPayload)
        ? strategyPayload
        : [];

      setStrategies(nextStrategies);

      if (nextStrategies.length > 0 && !selectedStrategyId) {
        setSelectedStrategyId(nextStrategies[0].id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Risk check failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const alignedCount = strategies.filter((strategy) => {
    const risk = normalizeStrategyRisk(strategy);
    const result = getCompatibility(activeRiskProfile, risk);
    return result.tone === "good";
  }).length;

  const cautionCount = strategies.filter((strategy) => {
    const risk = normalizeStrategyRisk(strategy);
    const result = getCompatibility(activeRiskProfile, risk);
    return result.tone === "warn";
  }).length;

  const blockedCount = strategies.filter((strategy) => {
    const risk = normalizeStrategyRisk(strategy);
    const result = getCompatibility(activeRiskProfile, risk);
    return result.tone === "danger";
  }).length;

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_450px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Risk Compatibility Center
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Match strategy risk against the user profile.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                StrataOS can now compare your onboarding risk profile with each
                strategy risk level before allocation or execution.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/onboarding"
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Set risk profile
                </Link>

                <Link
                  href="/marketplace"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Marketplace
                </Link>

                <button
                  onClick={loadData}
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Current user risk profile</p>

              <p className="mt-3 text-3xl font-semibold">
                {loading
                  ? "Loading..."
                  : session
                  ? riskProfileLabels[activeRiskProfile]
                  : "Not signed in"}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Row label="Session" value={session ? "Active" : "Missing"} />
                <Row label="Profile" value={profile ? "Loaded" : "Missing"} />
                <Row
                  label="Onboarding"
                  value={profile?.onboarding_completed ? "Completed" : "Not completed"}
                />
                <Row label="Strategies" value={String(strategies.length)} />
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Aligned" value={String(alignedCount)} />
            <Metric label="Caution" value={String(cautionCount)} />
            <Metric label="Not aligned" value={String(blockedCount)} />
          </div>

          <div className="mt-8">
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-400">
                Select strategy
              </span>
              <select
                value={selectedStrategyId}
                onChange={(event) => setSelectedStrategyId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
              >
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedStrategy ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Selected strategy</p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    {selectedStrategy.name}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                    {selectedStrategy.description ??
                      "Strategy risk is compared against the current user's onboarding profile."}
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-zinc-300">
                  Risk: {selectedStrategyRisk}
                </span>
              </div>

              <div className={`mt-6 rounded-2xl border p-5 ${toneClass(compatibility.tone)}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm opacity-80">Compatibility result</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {compatibility.label}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm opacity-80">Score</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {compatibility.score}/100
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 opacity-90">
                  {compatibility.message}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Metric
                  label="Asset class"
                  value={selectedStrategy.assetClass ?? "N/A"}
                />
                <Metric
                  label="Timeframe"
                  value={selectedStrategy.timeframe ?? "N/A"}
                />
                <Metric
                  label="Max drawdown"
                  value={
                    typeof selectedStrategy.maxDrawdown === "number"
                      ? `${selectedStrategy.maxDrawdown}%`
                      : "N/A"
                  }
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/marketplace/${selectedStrategy.id}`}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Open strategy report
                </Link>

                <Link
                  href="/onboarding"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Change risk profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
              <p className="text-lg font-semibold text-amber-300">
                No strategies loaded
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Seed demo data or check the /api/strategies endpoint.
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Risk policy</p>
          <h3 className="mt-1 text-2xl font-semibold">
            Compatibility rules
          </h3>

          <div className="mt-6 space-y-4 text-sm text-zinc-400">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Conservative</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Aligned with Low risk strategies. Medium and High require caution
                or are not aligned.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Balanced</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Aligned with Low and Medium risk strategies. High risk requires caution.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Aggressive / Professional</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Can review High risk strategies, but allocation limits and Risk
                Firewall checks still apply.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
            <p className="text-sm font-medium text-blue-300">
              Next step
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              The next implementation can show this warning directly inside each
              strategy report and allocation request page.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-3 truncate text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[180px] truncate text-right font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}