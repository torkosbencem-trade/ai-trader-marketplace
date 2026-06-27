"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAsRole } from "../../lib/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  function continueToApp() {
    setWorking(true);
    // Local demo session only (localStorage + cookies). No roles are surfaced;
    // real authentication is not built yet.
    signInAsRole("investor");
    window.dispatchEvent(new Event("ai-trader-session-change"));
    setMessage("Signed in. Redirecting...");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 150);
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20 lg:px-8">
        <div className="mb-4 inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
          Demo sign-in
        </div>

        <h1 className="text-4xl font-semibold tracking-tight">
          Sign in to StrataOS
        </h1>

        <p className="mt-4 text-sm leading-7 text-zinc-400">
          This is a local demo sign-in (localStorage and cookies) that prepares
          the app for a real identity provider. No account is required during the
          pilot — continue to explore the stress-test tool.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <button
            onClick={continueToApp}
            disabled={working}
            className="w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? "Signing in..." : "Continue"}
          </button>

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {message}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs leading-5 text-zinc-500">
          Demo only. Production will use server-side sessions and a real identity
          provider. This is not investment advice.
        </p>

        <Link
          href="/"
          className="mt-6 text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to home
        </Link>
      </section>
    </main>
  );
}
