"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../lib/supabase-browser";

type UserRole = "investor" | "creator" | "admin";

type Profile = {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  status: string;
  plan: string;
  subscription_status: string;
  risk_profile: string;
  onboarding_completed: boolean;
  verification_level: number;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string | null;
};

const roleLinks = {
  investor: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Workspace", href: "/workspace" },
  ],
  creator: [
    { label: "Strategy Builder", href: "/strategy-builder" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Workspace", href: "/workspace" },
  ],
  admin: [
    { label: "Admin Review", href: "/admin" },
    { label: "Allocation Review", href: "/allocation-requests" },
    { label: "Execution", href: "/execution" },
    { label: "Workspace", href: "/workspace" },
  ],
};

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "Profile lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function syncProfile() {
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
              : "investor",
          displayName:
            typeof activeSession.user.user_metadata?.display_name === "string"
              ? activeSession.user.user_metadata.display_name
              : activeSession.user.email,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Profile sync failed.");
      }

      setProfile(payload.data);
      setMessage("Profile synced successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Profile sync failed.");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const links = profile ? roleLinks[profile.role] : [];
  const readiness = profile
    ? Math.min(
        100,
        Math.round(
          ((profile.verification_level ?? 0) / 5) * 60 +
            (profile.onboarding_completed ? 25 : 0) +
            (profile.risk_profile !== "not_set" ? 15 : 0)
        )
      )
    : 0;

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Platform Profile
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Account, role, plan and readiness profile.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                This profile connects Supabase Auth with platform access,
                subscription state, onboarding status and risk preferences.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/workspace"
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Open workspace
                </Link>

                <button
                  onClick={syncProfile}
                  disabled={!session}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sync profile
                </button>

                <button
                  onClick={loadProfile}
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Profile status</p>

              <p className="mt-3 text-3xl font-semibold">
                {loading
                  ? "Loading..."
                  : profile
                  ? "Profile active"
                  : session
                  ? "Session without profile"
                  : "Not signed in"}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Row label="Session" value={session ? "Active" : "Missing"} />
                <Row label="Profile" value={profile ? "Found" : "Missing"} />
                <Row label="Role" value={profile?.role ?? "not assigned"} />
                <Row label="Status" value={profile?.status ?? "unknown"} />
                <Row label="Plan" value={profile?.plan ?? "not assigned"} />
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <p className="text-sm text-zinc-500">Profile record</p>
          <h2 className="mt-1 text-2xl font-semibold">Current user profile</h2>

          {profile ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Metric label="Email" value={profile.email} />
                <Metric label="Role" value={profile.role} />
                <Metric label="Status" value={profile.status} />
                <Metric label="Plan" value={profile.plan} />
                <Metric
                  label="Subscription"
                  value={profile.subscription_status}
                />
                <Metric label="Risk profile" value={profile.risk_profile} />
                <Metric
                  label="Onboarding"
                  value={profile.onboarding_completed ? "completed" : "not completed"}
                />
                <Metric
                  label="Verification level"
                  value={`${profile.verification_level}/5`}
                />
                <Metric
                  label="Last seen"
                  value={
                    profile.last_seen_at
                      ? new Date(profile.last_seen_at).toLocaleString()
                      : "N/A"
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">Account readiness</p>
                    <p className="mt-2 text-2xl font-semibold">{readiness}%</p>
                  </div>

                  <div className="h-3 w-44 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${readiness}%` }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  Readiness combines verification level, onboarding completion
                  and risk profile setup.
                </p>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
              <p className="text-sm font-medium text-amber-300">
                No profile loaded
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Sign in on the Auth page, then return here and sync the profile.
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Role workspace</p>
          <h3 className="mt-1 text-2xl font-semibold">
            {profile ? profile.role : "No role"}
          </h3>

          <div className="mt-6 grid gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-semibold text-white">{link.label}</p>
                <p className="mt-2 font-mono text-xs text-emerald-300">
                  {link.href}
                </p>
              </Link>
            ))}

            {!profile && (
              <Link
                href="/auth"
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-semibold text-white">Sign in</p>
                <p className="mt-2 font-mono text-xs text-emerald-300">
                  /auth
                </p>
              </Link>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
            <p className="text-sm font-medium text-blue-300">
              Next user phase
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              The next layer is onboarding: investors select risk profile,
              creators complete evidence checklist and admins manage user status.
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
      <span className="max-w-[220px] truncate text-right font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}