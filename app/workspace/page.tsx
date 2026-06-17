"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  created_at: string;
  updated_at: string | null;
};

type WorkspaceAction = {
  title: string;
  description: string;
  href: string;
  badge: string;
};

const workspaceActions: Record<UserRole, WorkspaceAction[]> = {
  investor: [
    {
      title: "Marketplace",
      description: "Browse verified strategy reports and compare opportunities.",
      href: "/marketplace",
      badge: "Discover",
    },
    {
      title: "Portfolio",
      description: "Review current allocations, exposure and risk status.",
      href: "/portfolio",
      badge: "Monitor",
    },
    {
      title: "Demo Center",
      description: "Walk through the full investor workflow with sample data.",
      href: "/demo",
      badge: "Demo",
    },
    {
      title: "Profile",
      description: "Check your Supabase profile and platform role.",
      href: "/profile",
      badge: "Account",
    },
  ],
  creator: [
    {
      title: "Strategy Builder",
      description: "Upload backtest evidence and prepare a strategy submission.",
      href: "/strategy-builder",
      badge: "Create",
    },
    {
      title: "Marketplace",
      description: "See how published strategies appear to investors.",
      href: "/marketplace",
      badge: "Publish",
    },
    {
      title: "Demo Center",
      description: "Review the platform flow from strategy to allocation.",
      href: "/demo",
      badge: "Demo",
    },
    {
      title: "Profile",
      description: "Check your creator profile and platform role.",
      href: "/profile",
      badge: "Account",
    },
  ],
  admin: [
    {
      title: "Admin Review",
      description: "Review submitted strategies and approve or reject listings.",
      href: "/admin",
      badge: "Review",
    },
    {
      title: "Allocation Requests",
      description: "Approve investor allocation requests before execution.",
      href: "/allocation-requests",
      badge: "Allocate",
    },
    {
      title: "Execution Center",
      description: "Prepare deployment packages and execution records.",
      href: "/execution",
      badge: "Execute",
    },
    {
      title: "Storage Status",
      description: "Check database/file-store mode and repository health.",
      href: "/system/storage",
      badge: "System",
    },
    {
      title: "Demo Data Center",
      description: "Seed or reset the current demo workflow data.",
      href: "/system/demo-data",
      badge: "Data",
    },
    {
      title: "Audit Log",
      description: "Review platform events and operational history.",
      href: "/system/audit",
      badge: "Audit",
    },
  ],
};

const roleDescriptions: Record<UserRole, string> = {
  investor:
    "Investor workspace focused on strategy discovery, allocation requests and portfolio monitoring.",
  creator:
    "Creator workspace focused on uploading strategy evidence and preparing marketplace-ready listings.",
  admin:
    "Admin workspace focused on review, allocation, execution, system status and audit operations.",
};

export default function WorkspacePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadedUserIdRef = useRef<string | null>(null);
  const configured = hasSupabaseBrowserConfig();

  const activeRole: UserRole = profile?.role ?? "investor";

  const actions = useMemo(() => {
    return workspaceActions[activeRole];
  }, [activeRole]);

  async function fetchProfile(activeSession: Session) {
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
  }

  async function loadInitialWorkspace() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!configured) {
        setSession(null);
        setProfile(null);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const activeSession = data.session ?? null;
      setSession(activeSession);

      if (!activeSession) {
        setProfile(null);
        loadedUserIdRef.current = null;
        return;
      }

      loadedUserIdRef.current = activeSession.user.id;
      await fetchProfile(activeSession);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Workspace load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function syncProfile() {
    setSyncing(true);
    setMessage("");
    setError("");

    try {
      if (!configured) {
        throw new Error("Supabase browser config is missing.");
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const activeSession = data.session;

      if (!activeSession) {
        throw new Error("No active session.");
      }

      const metadataRole =
        typeof activeSession.user.user_metadata?.role === "string"
          ? activeSession.user.user_metadata.role
          : "investor";

      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        body: JSON.stringify({
          role: metadataRole,
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

      setSession(activeSession);
      setProfile(payload.data);
      loadedUserIdRef.current = activeSession.user.id;
      setMessage("Profile synced. Workspace updated.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Profile sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function signOut() {
    setMessage("");
    setError("");

    try {
      if (!configured) {
        throw new Error("Supabase browser config is missing.");
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      setProfile(null);
      loadedUserIdRef.current = null;
      setMessage("Signed out.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign out failed.");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function boot() {
      if (!mounted) {
        return;
      }

      await loadInitialWorkspace();
    }

    boot();

    if (!configured) {
      return () => {
        mounted = false;
      };
    }

    const supabase = createSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        loadedUserIdRef.current = null;
        return;
      }

      if (loadedUserIdRef.current === nextSession.user.id) {
        return;
      }

      loadedUserIdRef.current = nextSession.user.id;
      fetchProfile(nextSession).catch((error) => {
        setError(
          error instanceof Error ? error.message : "Profile lookup failed."
        );
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Role-aware Workspace
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Your StrataOS command center.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                The workspace adapts to your Supabase profile role. Investors,
                creators and admins see different operational paths.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth"
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Auth
                </Link>

                <Link
                  href="/profile"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Profile
                </Link>

                <button
                  onClick={syncProfile}
                  disabled={!session || syncing}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {syncing ? "Syncing..." : "Sync profile"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Current access</p>

              <p className="mt-3 text-3xl font-semibold">
                {loading
                  ? "Loading..."
                  : profile
                  ? activeRole
                  : session
                  ? "Profile missing"
                  : "Not signed in"}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Row label="Config" value={configured ? "Ready" : "Missing"} />
                <Row label="Session" value={session ? "Active" : "Missing"} />
                <Row label="Profile" value={profile ? "Loaded" : "Missing"} />
                <Row label="Role" value={profile?.role ?? "not assigned"} />
              </div>

              {session && (
                <button
                  onClick={signOut}
                  className="mt-5 w-full rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Sign out
                </button>
              )}

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

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {!session && (
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
            <p className="text-lg font-semibold text-amber-300">
              Sign in required
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Sign in through Supabase Auth to load your role-aware workspace.
            </p>

            <Link
              href="/auth"
              className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Go to Auth
            </Link>
          </div>
        )}

        {session && !profile && !loading && (
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.06] p-6">
            <p className="text-lg font-semibold text-blue-300">
              Session found, profile not synced yet
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Sync your profile once to create the matching profiles table row.
            </p>

            <button
              onClick={syncProfile}
              disabled={syncing}
              className="mt-5 rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync profile"}
            </button>
          </div>
        )}

        {profile && (
          <>
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div>
                  <p className="text-sm text-zinc-500">Workspace mode</p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    {activeRole.toUpperCase()} dashboard
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
                    {roleDescriptions[activeRole]}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs text-zinc-500">Signed in as</p>
                  <p className="mt-2 truncate text-lg font-semibold">
                    {profile.email}
                  </p>
                  <p className="mt-3 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                    role: {profile.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-emerald-400/40 hover:bg-white/[0.055]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xl font-semibold">{action.title}</p>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {action.badge}
                    </span>
                  </div>

                  <p className="mt-4 min-h-[48px] text-sm leading-6 text-zinc-500">
                    {action.description}
                  </p>

                  <p className="mt-6 font-mono text-xs text-emerald-300 transition group-hover:text-emerald-200">
                    {action.href}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/[0.06] p-6">
              <p className="text-sm font-semibold text-blue-300">
                Next security phase
              </p>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-400">
                This page changes the user interface based on profile role. The
                next step is server-side API protection, so restricted actions
                cannot be executed by unauthorized users.
              </p>
            </div>
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
      <span className="max-w-[220px] truncate text-right font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}