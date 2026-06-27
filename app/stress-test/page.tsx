import Link from "next/link";

export const metadata = {
  title: "Stress test — StrataOS",
  description:
    "Upload a backtest and get a red-flag stress-test report. Early access.",
};

export default function StressTestPage() {
  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="mx-auto max-w-3xl px-6 py-24 lg:px-8">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
          Coming soon · early access
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
          Backtest stress test
        </h1>

        <p className="mt-5 text-base leading-8 text-zinc-400">
          The upload experience is in pilot. Soon you will be able to bring a
          backtest — a CSV or JSON of trades — and get a red-flag report:
          outlier dependency, in-sample / out-of-sample decay, a data-quality
          confidence signal, and one overall verdict that keeps the WHY.
        </p>

        <p className="mt-5 text-base leading-8 text-zinc-400">
          The analysis engine already runs today from a small command-line tool;
          the web upload is what we are validating with early pilots.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-2xl border border-white/10 px-6 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            Back to home
          </Link>
          <Link
            href="/#how-it-works"
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/20 hover:text-emerald-200"
          >
            See how it works
          </Link>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-xs leading-6 text-zinc-500">
          This is a stress test of a backtest, not investment advice or a
          guarantee of future performance.
        </p>
      </section>
    </main>
  );
}
