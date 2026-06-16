"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearSession,
  getStoredSession,
  roleHome,
  roleLabels,
  rolePermissions,
  type DemoSession,
} from "../../lib/auth-session";

const quickLinks = {
  investor: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Audit trail", href: "/system/audit" },
  ],
  creator: [
    { label: "Strategy Builder", href: "/strategy-builder" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Audit trail", href: "/system/audit" },
  ],
  admin: [
    { label: "Admin Review", href: "/admin" },
    { label: "Allocation Review", href: "/allocation-requests" },
    { label: "Execution", href: "/execution" },
    { label: "Storage", href: "/system/storage" },
    { label: "Audit", href: "/system/audit" },
  ],
};

export default function WorkspacePage() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [deniedPath, setDeniedPath] = useState("");

  function loadSession() {
    setSession(getStoredSession());
  }

  useEffect(() => {
    loadSession();

    const params = new URLSearchParams(window.location.search);
    setDeniedPath(params.get("denied") ?? "");

    window.addEventListener("ai-trader-session-change", loadSession);
    window.addEventListener("storage", loadSession);

    return () => {
      window.removeEventListener("ai-trader-session-change", loadSession);
      window.removeEventListener("storage", loadSession);
    };
  }, []);

  function logout() {
    clearSession();
    setSession(null);
    window.dispatchEvent(new Event("ai-trader-session-change"));
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Role workspace
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Your platform workspace.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                The workspace adapts to the current demo role and gives access
                to the correct platform modules.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Current session</p>
              {session ? (
                <>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {roleLabels[session.role]}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">{session.email}</p>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Not signed in
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Choose a demo role to access protected modules.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-6">
          {deniedPath && (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
              <p className="text-sm font-medium text-amber-300">
                Access restricted
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Your current role cannot access{" "}
                <span className="font-mono text-zinc-300">{deniedPath}</span>.
                Switch role if you need access.
              </p>
            </div>
          )}

          {session ? (
            <>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <p className="text-sm text-zinc-500">Permissions</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {roleLabels[session.role]} capabilities
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {rolePermissions[session.role].map((permission) => (
                    <div
                      key={permission}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-xs font-bold text-emerald-300">
                          ✓
                        </span>
                        <p className="text-sm text-zinc-300">{permission}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <p className="text-sm text-zinc-500">Quick actions</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Open role modules
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {quickLinks[session.role].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
                    >
                      <p className="font-semibold text-white">{link.label}</p>
                      <p className="mt-2 font-mono text-xs text-emerald-300">
                        {link.href}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
              <p className="text-2xl font-semibold">No active session</p>
              <p className="mt-3 text-sm text-zinc-500">
                Sign in as investor, creator or admin to continue.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Go to login
              </Link>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          {session ? (
            <>
              <p className="text-sm text-zinc-500">Account</p>
              <h3 className="mt-1 text-2xl font-semibold">{session.name}</h3>

              <div className="mt-6 space-y-3 text-sm">
                <Row label="Role" value={roleLabels[session.role]} />
                <Row label="Email" value={session.email} />
                <Row label="Home" value={roleHome[session.role]} />
                <Row
                  label="Signed in"
                  value={new Date(session.createdAt).toLocaleString()}
                />
              </div>

              <Link
                href={roleHome[session.role]}
                className="mt-6 block rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Open role home
              </Link>

              <button
                onClick={logout}
                className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-500">Access</p>
              <h3 className="mt-1 text-2xl font-semibold">Choose role</h3>

              <Link
                href="/login"
                className="mt-6 block rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Login
              </Link>
            </>
          )}

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <p className="text-sm font-medium text-amber-300">
              Production note
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Replace this local role session with Supabase Auth or another
              production identity provider before real users.
            </p>
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