"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "../lib/supabase-browser";

type CompatibilityTone = "good" | "warn" | "danger" | "neutral";

type CompatibilityPayload = {
  strategy: {
    id: string;
    name: string;
    risk: "Low" | "Medium" | "High";
    category?: string;
  };
  profile: {
    id: string;
    email: string;
    role: string;
    risk_profile: string;
    onboarding_completed: boolean;
    verification_level: number;
  } | null;
  compatibility: {
    label: string;
    tone: CompatibilityTone;
    score: number;
    message: string;
    userRiskProfile: string;
    strategyRiskLevel: string;
    allocationGuidance: string;
    executionGuidance: string;
  };
};

function toneClasses(tone: CompatibilityTone) {
  if (tone === "good") {
    return {
      wrapper: "border-emerald-400/30 bg-emerald-400/[0.08]",
      text: "text-emerald-300",
      button: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }

  if (tone === "warn") {
    return {
      wrapper: "border-amber-400/30 bg-amber-400/[0.08]",
      text: "text-amber-300",
      button: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    };
  }

  if (tone === "danger") {
    return {
      wrapper: "border-red-400/30 bg-red-400/[0.08]",
      text: "text-red-300",
      button: "border-red-400/30 bg-red-400/10 text-red-300",
    };
  }

  return {
    wrapper: "border-blue-400/30 bg-blue-400/[0.08]",
    text: "text-blue-300",
    button: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  };
}

export function RiskCompatibilityCard({ strategyId }: { strategyId: string }) {
  const [payload, setPayload] = useState<CompatibilityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCompatibility() {
    setLoading(true);
    setError("");

    try {
      const headers: Record<string, string> = {};

      if (hasSupabaseBrowserConfig()) {
        const supabase = createSupabaseBrowserClient();
        const session = (await supabase.auth.getSession()).data.session;

        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(
        `/api/risk/compatibility?strategyId=${encodeURIComponent(strategyId)}`,
        {
          headers,
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Risk compatibility check failed.");
      }

      setPayload(data.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Risk compatibility check failed."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompatibility();
  }, [strategyId]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <p className="text-sm text-zinc-500">Risk compatibility</p>
        <p className="mt-2 text-xl font-semibold text-white">Loading check...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.06] p-6">
        <p className="text-sm font-semibold text-red-300">
          Risk compatibility unavailable
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!payload) {
    return null;
  }

  const tone = toneClasses(payload.compatibility.tone);

  return (
    <div className={`rounded-3xl border p-6 ${tone.wrapper}`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-zinc-300">
              Risk Compatibility
            </p>

            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.button}`}>
              {payload.compatibility.label}
            </span>
          </div>

          <h2 className={`mt-4 text-3xl font-semibold ${tone.text}`}>
            {payload.compatibility.score}/100
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
            {payload.compatibility.message}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoBlock
              label="Allocation guidance"
              value={payload.compatibility.allocationGuidance}
            />
            <InfoBlock
              label="Execution guidance"
              value={payload.compatibility.executionGuidance}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs text-zinc-500">Profile check</p>

          <div className="mt-4 space-y-3 text-sm">
            <Row
              label="User risk"
              value={payload.compatibility.userRiskProfile}
            />
            <Row
              label="Strategy risk"
              value={payload.compatibility.strategyRiskLevel}
            />
            <Row
              label="Onboarding"
              value={
                payload.profile?.onboarding_completed
                  ? "completed"
                  : "not completed"
              }
            />
          </div>

          <a
            href="/onboarding"
            className="mt-5 block rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/[0.05]"
          >
            Update risk profile
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[150px] truncate text-right font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}