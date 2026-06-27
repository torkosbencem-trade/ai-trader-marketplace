"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("StrataOS page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-20 lg:px-8">
        <div className="inline-flex w-fit rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300">
          Something went wrong
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
          This page failed to load.
        </h1>

        <p className="mt-5 text-base leading-8 text-zinc-400">
          You can retry the page, or head back to the home page.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-emerald-400 px-6 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-white/10 px-6 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            Go to home
          </Link>
        </div>

        {error?.digest && (
          <p className="mt-8 font-mono text-xs text-zinc-600">
            ref: {error.digest}
          </p>
        )}
      </section>
    </main>
  );
}
