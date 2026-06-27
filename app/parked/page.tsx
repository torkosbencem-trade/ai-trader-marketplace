import Link from "next/link";

export const metadata = {
  title: "Not in current focus — StrataOS",
  description: "This area is not part of the current StrataOS focus.",
};

export default function ParkedPage() {
  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="mx-auto max-w-2xl px-6 py-24 lg:px-8">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
          Not in current focus
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
          This area is not part of the current focus.
        </h1>

        <p className="mt-5 text-base leading-8 text-zinc-400">
          StrataOS is focused on one thing right now: stress-testing systematic
          strategy backtests and surfacing red flags. The marketplace,
          allocation and admin features are not part of the current product
          direction and are not available here.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-2xl bg-emerald-400 px-6 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Go to home
          </Link>
          <Link
            href="/stress-test"
            className="rounded-2xl border border-white/10 px-6 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            Backtest stress test
          </Link>
        </div>
      </section>
    </main>
  );
}
