"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  roleHome,
  roleLabels,
  rolePermissions,
  signInAsRole,
  type UserRole,
} from "../../lib/auth-session";

const roles: UserRole[] = ["investor", "creator", "admin"];

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<UserRole>("investor");
  const [nextPath, setNextPath] = useState("/workspace");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") ?? "/workspace");
  }, []);

  function login(role: UserRole) {
    const session = signInAsRole(role);

    setMessage(`Signed in as ${roleLabels[role]}.`);

    const destination =
      nextPath && nextPath !== "/login" ? nextPath : roleHome[session.role];

    window.dispatchEvent(new Event("ai-trader-session-change"));

    setTimeout(() => {
      router.push(destination);
      router.refresh();
    }, 150);
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Demo authentication
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Sign in with a platform role.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                This is a local demo auth layer using localStorage and cookies.
                It prepares the app for Supabase Auth or another production
                identity provider.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Redirect after login</p>
              <p className="mt-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-emerald-300">
                {nextPath}
              </p>

              <p className="mt-4 text-xs leading-5 text-zinc-500">
                Protected routes now redirect here when no role session exists.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="grid gap-4">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`rounded-3xl border p-6 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                selectedRole === role
                  ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                  : "border-white/10 bg-white/[0.035]"
              }`}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Role</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    {roleLabels[role]}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    Demo account:{" "}
                    <span className="font-mono text-zinc-300">
                      {role}@aitrader.local
                    </span>
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedRole === role
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/[0.04] text-zinc-400"
                  }`}
                >
                  {selectedRole === role ? "Selected" : "Available"}
                </span>
              </div>

              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {rolePermissions[role].map((permission) => (
                  <div
                    key={permission}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400"
                  >
                    {permission}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Selected role</p>
          <h3 className="mt-1 text-2xl font-semibold">
            {roleLabels[selectedRole]}
          </h3>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Workspace destination
            </p>
            <p className="mt-3 font-mono text-sm text-emerald-300">
              {roleHome[selectedRole]}
            </p>
          </div>

          <button
            onClick={() => login(selectedRole)}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Continue as {roleLabels[selectedRole]}
          </button>

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {message}
            </div>
          )}

          <Link
            href="/workspace"
            className="mt-3 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/[0.05]"
          >
            Open workspace
          </Link>

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <p className="text-sm font-medium text-amber-300">
              Demo security note
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              This role system is for local MVP gating only. Production must use
              server-side sessions, encrypted secrets, database users and
              role-based authorization.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}