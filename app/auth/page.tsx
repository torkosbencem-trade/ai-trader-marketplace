"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../lib/supabase-browser";

type UserRole = "investor" | "creator" | "admin";
type AuthMode = "signin" | "signup";

const roles: Array<{
  value: UserRole;
  label: string;
  description: string;
}> = [
  {
    value: "investor",
    label: "Investor",
    description: "Browse strategies, request allocation and monitor portfolio.",
  },
  {
    value: "creator",
    label: "Strategy Creator",
    description: "Submit strategy evidence and prepare marketplace listings.",
  },
  {
    value: "admin",
    label: "Admin / Operator",
    description: "Review submissions, allocations, execution and audit data.",
  },
];

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<UserRole>("investor");
  const [email, setEmail] = useState("investor.demo@aitrader.local");
  const [password, setPassword] = useState("DemoPassword123!");
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(true);

  const configured = hasSupabaseBrowserConfig();

  const selectedRole = useMemo(
    () => roles.find((item) => item.value === role) ?? roles[0],
    [role]
  );

  function getClient() {
    return createSupabaseBrowserClient();
  }

  async function loadSession() {
    setLoading(true);
    setError("");

    try {
      if (!configured) {
        setSession(null);
        return;
      }

      const supabase = getClient();
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      setSession(data.session ?? null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load auth session."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();

    if (!configured) {
      return;
    }

    const supabase = getClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  async function handleSubmit() {
    setWorking(true);
    setMessage("");
    setError("");

    try {
      if (!configured) {
        throw new Error(
          "Supabase browser auth is not configured. Add NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }

      const supabase = getClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              display_name: selectedRole.label,
            },
          },
        });

        if (error) {
          throw error;
        }

        setSession(data.session ?? null);
        setMessage(
          data.session
            ? "Account created and signed in."
            : "Account created. If email confirmation is enabled, confirm the email before signing in."
        );

        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setSession(data.session ?? null);
      setMessage("Signed in with Supabase Auth.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Auth action failed.");
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    setWorking(true);
    setMessage("");
    setError("");

    try {
      if (!configured) {
        throw new Error("Supabase browser auth is not configured.");
      }

      const supabase = getClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      setMessage("Signed out.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign out failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Supabase Auth
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Real authentication foundation for the trading platform.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                This is the first Supabase Auth integration layer. It validates
                signup, signin, session detection and signout without enabling
                route-blocking middleware yet.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/workspace"
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Open workspace
                </Link>

                <Link
                  href="/system/storage"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Storage status
                </Link>

                <Link
                  href="/api/auth/status"
                  className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Auth API status
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Auth status</p>

              <p className="mt-3 text-3xl font-semibold">
                {loading
                  ? "Loading..."
                  : session
                  ? "Signed in"
                  : configured
                  ? "Ready"
                  : "Missing config"}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Row
                  label="Browser config"
                  value={configured ? "Configured" : "Missing anon key"}
                />
                <Row
                  label="Session"
                  value={session ? "Active" : "No active session"}
                />
                <Row
                  label="Route protection"
                  value="Not enabled yet"
                />
              </div>

              {!configured && (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-6 text-amber-300">
                  Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and Vercel
                  Environment Variables.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <div className="flex rounded-2xl border border-white/10 bg-black/20 p-2">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === "signin"
                  ? "bg-emerald-400 text-black"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              Sign in
            </button>

            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-emerald-400 text-black"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-400">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-400">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
              />
            </label>

            {mode === "signup" && (
              <div>
                <p className="mb-3 text-sm text-zinc-400">Initial role</p>
                <div className="grid gap-3">
                  {roles.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setRole(item.value)}
                      className={`rounded-2xl border p-4 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                        role === item.value
                          ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={working || !email || !password}
              className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working
                ? "Working..."
                : mode === "signup"
                ? "Create Supabase account"
                : "Sign in with Supabase"}
            </button>

            {session && (
              <button
                onClick={signOut}
                disabled={working}
                className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                Sign out
              </button>
            )}

            {message && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Current session</p>

          {session ? (
            <>
              <h3 className="mt-1 text-2xl font-semibold">
                {session.user.email}
              </h3>

              <div className="mt-6 space-y-3 text-sm">
                <Row label="User ID" value={session.user.id} />
                <Row
                  label="Role metadata"
                  value={
                    typeof session.user.user_metadata?.role === "string"
                      ? session.user.user_metadata.role
                      : "not set"
                  }
                />
                <Row
                  label="Provider"
                  value={session.user.app_metadata?.provider ?? "email"}
                />
                <Row
                  label="Expires"
                  value={
                    session.expires_at
                      ? new Date(session.expires_at * 1000).toLocaleString()
                      : "unknown"
                  }
                />
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-1 text-2xl font-semibold">No active session</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Create a test user or sign in with an existing Supabase Auth
                account.
              </p>
            </>
          )}

          <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
            <p className="text-sm font-medium text-blue-300">
              Phase 1 boundary
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              This validates real auth, but does not yet protect routes. Route
              protection should be added later with server-side sessions and
              careful middleware testing.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              href="/demo"
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
            >
              <p className="text-sm font-semibold text-white">Demo Center</p>
              <p className="mt-2 font-mono text-xs text-emerald-300">/demo</p>
            </Link>

            <Link
              href="/system/demo-data"
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
            >
              <p className="text-sm font-semibold text-white">
                Demo Data Center
              </p>
              <p className="mt-2 font-mono text-xs text-emerald-300">
                /system/demo-data
              </p>
            </Link>
          </div>
        </aside>
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