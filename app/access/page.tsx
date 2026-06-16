"use client";

import Link from "next/link";
import { roleLabels, rolePermissions, signInAsRole, type UserRole } from "../../lib/auth-session";

const roles: UserRole[] = ["investor", "creator", "admin"];

export default function AccessPage() {
  function enter(role: UserRole) {
    const session = signInAsRole(role);
    window.dispatchEvent(new Event("ai-trader-session-change"));
    window.location.href =
      role === "admin"
        ? "/admin"
        : role === "creator"
        ? "/strategy-builder"
        : "/portfolio";
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
          Access portal
        </div>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
          Select a demo role to enter the platform.
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
          This page now uses the same local demo session layer as /login.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <p className="text-sm text-zinc-500">Role</p>
              <h2 className="mt-1 text-2xl font-semibold">{roleLabels[role]}</h2>

              <div className="mt-5 space-y-3">
                {rolePermissions[role].slice(0, 3).map((permission) => (
                  <p
                    key={permission}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400"
                  >
                    {permission}
                  </p>
                ))}
              </div>

              <button
                onClick={() => enter(role)}
                className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Continue as {roleLabels[role]}
              </button>
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="mt-8 inline-flex rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
        >
          Open full login page
        </Link>
      </section>
    </main>
  );
}