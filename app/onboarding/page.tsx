"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../lib/supabase-browser";

type RiskProfile = "conservative" | "balanced" | "aggressive" | "professional";

type Profile = {
  id: string;
  email: string;
  role: string;
  status: string;
  plan: string;
  risk_profile: string;
  onboarding_completed: boolean;
  verification_level: number;
};

const riskProfiles: Array<{
  value: RiskProfile;
  title: string;
  subtitle: string;
  description: string;
  maxDrawdown: string;
  allocationStyle: string;
}> = [
  {
    value: "conservative",
    title: "Conservative",
    subtitle: "Lower risk, slower decisions",
    description:
      "You prefer lower volatility, smaller allocation sizes and stronger risk warnings before taking action.",
    maxDrawdown: "Low tolerance",
    allocationStyle: "Small allocations",
  },
  {
    value: "balanced",
    title: "Balanced",
    subtitle: "Moderate risk, diversified approach",
    description:
      "You are open to systematic strategies, but want a balanced mix of return potential and drawdown control.",
    maxDrawdown: "Medium tolerance",
    allocationStyle: "Diversified allocations",
  },
  {
    value: "aggressive",
    title: "Aggressive",
    subtitle: "Higher risk, higher volatility tolerance",
    description:
      "You accept larger drawdowns and more volatility in exchange for higher potential upside.",
    maxDrawdown: "High tolerance",
    allocationStyle: "Larger allocations",
  },
  {
    value: "professional",
    title: "Professional",
    subtitle: "Advanced user / operator profile",
    description:
      "You understand trading risk, strategy evidence, portfolio exposure and execution constraints.",
    maxDrawdown: "Custom tolerance",
    allocationStyle: "Advanced allocation control",
  },
];

export default function OnboardingPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskProfile>("balanced");
  const [experience, setExperience] = useState("some");
  const [goal, setGoal] = useState("evaluate_strategies");
  const [capitalRange, setCapitalRange] = useState("under_10k");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const configured = hasSupabaseBrowserConfig();

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!configured) {
        throw new Error("Supabase browser config is missing.");
      }

      const supabase = createSupabaseBrowserClient();
      const activeSession = (await supabase.auth.getSession()).data.session ?? null;

      setSession(activeSession);

      if (!activeSession) {
        setProfile(null);
        return;
      }

      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Profile lookup failed.");
      }

      setProfile(payload.data ?? null);

      if (
        payload.data?.risk_profile &&
        payload.data.risk_profile !== "not_set"
      ) {
        setSelectedRisk(payload.data.risk_profile);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Onboarding load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveOnboarding() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!configured) {
        throw new Error("Supabase browser config is missing.");
      }

      const supabase = createSupabaseBrowserClient();
      const activeSession = (await supabase.auth.getSession()).data.session;

      if (!activeSession) {
        throw new Error("No active session.");
      }

      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        body: JSON.stringify({
          role:
            typeof activeSession.user.user_metadata?.role === "string"
              ? activeSession.user.user_metadata.role
              : profile?.role ?? "investor",
          displayName:
            typeof activeSession.user.user_metadata?.display_name === "string"
              ? activeSession.user.user_metadata.display_name
              : activeSession.user.email,
          riskProfile: selectedRisk,
          onboardingCompleted: true,
          verificationLevel:
            profile?.role === "admin"
              ? 5
              : Math.max(profile?.verification_level ?? 0, 1),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Onboarding save failed.");
      }

      setProfile(payload.data);
      setMessage("Onboarding completed. Risk profile saved.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Onboarding save failed.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const selected = riskProfiles.find((item) => item.value === selectedRisk) ?? riskProfiles[1];

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_440px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Investor Onboarding
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Set your risk profile before strategy allocation.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                This is the first layer of user suitability. Later, StrataOS can
                compare your risk profile against strategy drawdown, allocation
                size and execution readiness.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Open profile
                </Link>

                <Link
                  href="/workspace"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Workspace
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Onboarding status</p>

              <p className="mt-3 text-3xl font-semibold">
                {loading
                  ? "Loading..."
                  : profile?.onboarding_completed
                  ? "Completed"
                  : session
                  ? "Not completed"
                  : "Not signed in"}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Row label="Session" value={session ? "Active" : "Missing"} />
                <Row label="Role" value={profile?.role ?? "unknown"} />
                <Row
                  label="Risk profile"
                  value={profile?.risk_profile ?? "not_set"}
                />
                <Row
                  label="Verification"
                  value={`${profile?.verification_level ?? 0}/5`}
                />
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300">
                  {message}
                </div>
              )}

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
        {!session && !loading ? (
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-6 lg:col-span-2">
            <p className="text-lg font-semibold text-amber-300">
              Sign in required
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Sign in before completing onboarding.
            </p>
            <Link
              href="/auth"
              className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Go to Auth
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <p className="text-sm text-zinc-500">Step 1</p>
              <h2 className="mt-1 text-2xl font-semibold">
                Choose your risk profile
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {riskProfiles.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedRisk(item.value)}
                    className={`rounded-3xl border p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                      selectedRisk === item.value
                        ? "border-emerald-400/40 bg-emerald-400/[0.07]"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-lg font-semibold">{item.title}</p>
                      {selectedRisk === item.value && (
                        <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{item.subtitle}</p>
                    <p className="mt-4 text-xs leading-5 text-zinc-500">
                      {item.description}
                    </p>
                    <div className="mt-5 grid gap-2 text-xs text-zinc-400">
                      <Row label="Drawdown" value={item.maxDrawdown} />
                      <Row label="Allocation" value={item.allocationStyle} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm text-zinc-400">
                    Experience
                  </span>
                  <select
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="some">Some experience</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-zinc-400">
                    Main goal
                  </span>
                  <select
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
                  >
                    <option value="evaluate_strategies">Evaluate strategies</option>
                    <option value="paper_trading">Paper trading</option>
                    <option value="portfolio_builder">Portfolio builder</option>
                    <option value="own_trading">Own trading cockpit</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-zinc-400">
                    Capital range
                  </span>
                  <select
                    value={capitalRange}
                    onChange={(event) => setCapitalRange(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
                  >
                    <option value="under_10k">Under 10k</option>
                    <option value="10k_50k">10k - 50k</option>
                    <option value="50k_250k">50k - 250k</option>
                    <option value="250k_plus">250k+</option>
                  </select>
                </label>
              </div>

              <button
                onClick={saveOnboarding}
                disabled={!session || saving}
                className="mt-8 rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Complete onboarding"}
              </button>
            </div>

            <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
              <p className="text-sm text-zinc-500">Selected profile</p>
              <h3 className="mt-1 text-2xl font-semibold">{selected.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {selected.description}
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <Row label="Experience" value={experience} />
                <Row label="Goal" value={goal} />
                <Row label="Capital" value={capitalRange} />
              </div>

              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
                <p className="text-sm font-medium text-blue-300">
                  Why this matters
                </p>
                <p className="mt-3 text-xs leading-5 text-zinc-500">
                  Later, high-risk strategies can be flagged when they do not
                  match your selected profile.
                </p>
              </div>
            </aside>
          </>
        )}
      </section>
    </main>
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