import Link from "next/link";

const TAGLINE =
  "Not a stamp of approval. A stress test for systematic strategy backtests.";

const HERO_SUBHEAD =
  "StrataOS red-teams a systematic strategy's backtest and surfaces the red flags a tough reviewer would find — outlier dependency, out-of-sample decay, sample size and drawdown behavior. It is a stress test, not a stamp of approval, and not investment advice.";

const DISCLAIMER =
  "This is a stress test of a backtest, not investment advice or a guarantee of future performance.";

const heroMetrics = [
  { label: "Red-flag checks", value: "2" },
  { label: "Severity levels", value: "4" },
  { label: "Report formats", value: "3" },
  { label: "Stamp of approval", value: "No" },
];

const previewFlags = [
  { sev: "HIGH", text: "Outlier dependency — top trade is 31% of total P&L" },
  { sev: "HIGH", text: "OOS decay — average return turns negative out of sample" },
  { sev: "MED", text: "Sample size — only 18 trades, so confidence is low" },
];

const audiences = [
  {
    title: "For systematic traders",
    description:
      "Before you trade a backtest live, red-team it yourself. See how much of the edge rides on a handful of trades, and whether it survives on data it was never fit to.",
  },
  {
    title: "For mentors & communities",
    description:
      "Stress-test the backtests your members bring you. Turn a vague \"looks great\" into a concrete list of red flags and the exact questions a tough reviewer would ask.",
  },
];

const checks = [
  {
    name: "Outlier dependency analysis",
    text: "Measures how much of the return depends on the top 1 / 3 / 5 / 10 trades — using a concentration ratio, not a misleading naive drop%.",
  },
  {
    name: "In-sample / out-of-sample split",
    text: "Splits the trades chronologically and tests whether the edge decays out of sample — the classic overfitting tell.",
  },
  {
    name: "Data-quality & confidence signal",
    text: "Flags small samples, missing timestamps and suspicious zero-return rows, so \"all green on 12 trades\" never reads as a clean bill of health.",
  },
  {
    name: "Red-flag summary report",
    text: "One verdict — none / low / medium / high — that always keeps the WHY: every contributing flag, its source, and the reviewer questions it raises.",
  },
];

const steps = [
  {
    step: "01",
    title: "Bring your backtest",
    text: "A CSV or JSON of trades (per-trade returns, plus timestamps if you have them). Nothing is published to a marketplace.",
  },
  {
    step: "02",
    title: "We run the red-flag checks",
    text: "Outlier dependency, in-sample / out-of-sample decay and data-quality signals run over the trade series in a single pass.",
  },
  {
    step: "03",
    title: "You get a stress-test report",
    text: "An overall severity, every contributing flag with its reason, a confidence signal, and the questions a reviewer would ask next.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(248,113,113,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.05),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_460px] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 backdrop-blur">
                Backtest stress-testing · early access
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold tracking-tight md:text-7xl">
                Stress-test your backtest before you trust it.
              </h1>

              <p className="mt-5 max-w-3xl text-lg font-medium text-zinc-200">
                {TAGLINE}
              </p>

              <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-400">
                {HERO_SUBHEAD}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/stress-test"
                  className="rounded-2xl bg-emerald-400 px-6 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Stress-test a backtest
                </Link>

                <Link
                  href="/#how-it-works"
                  className="rounded-2xl border border-white/10 px-6 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  How it works
                </Link>
              </div>

              <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
                {heroMetrics.map((metric) => (
                  <HeroMetric
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                  />
                ))}
              </div>
            </div>

            <ReportPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-sm text-zinc-500">What it checks</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          The red flags a tough reviewer would look for.
        </h2>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {checks.map((check) => (
            <div
              key={check.name}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <p className="text-lg font-semibold text-white">{check.name}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {check.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-2 lg:px-8">
        {audiences.map((audience) => (
          <div
            key={audience.title}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-7"
          >
            <h2 className="text-2xl font-semibold text-white">
              {audience.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              {audience.description}
            </p>
          </div>
        ))}
      </section>

      <section
        id="how-it-works"
        className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8"
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
          <p className="text-sm text-zinc-500">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            From a backtest file to an honest red-flag report.
          </h2>

          <p className="mt-5 text-sm leading-7 text-zinc-500">
            StrataOS does not approve, rank or sell strategies. It runs a focused
            set of stress tests over your trade series and tells you where a
            backtest is fragile — and how confident you should be in that read.
          </p>

          <div className="mt-7 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm font-medium text-amber-300">
              What this is not
            </p>
            <p className="mt-2 text-xs leading-6 text-zinc-400">
              Not a marketplace, not allocation, not a stamp of approval, and not
              investment advice. A clean report is not a promise that a strategy
              will work — only that these particular red flags were not found.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
            >
              <div className="flex gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-sm font-semibold text-emerald-300">
                  {item.step}
                </div>

                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
          <p className="text-sm text-zinc-500">Honest status</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            This is an early tool, on purpose.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            Today StrataOS ships two red-flag checks (outlier dependency and an
            in-sample / out-of-sample split) plus a data-quality confidence
            signal, combined into a single report. The upload experience is in
            pilot — the analysis engine already runs from a small command-line
            tool. More checks will follow as the pilot validates what reviewers
            actually need.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/stress-test"
              className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/20 hover:text-emerald-200"
            >
              Get early access
            </Link>
          </div>

          <p className="mt-6 text-xs leading-6 text-zinc-500">{DISCLAIMER}</p>
        </div>
      </section>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#080C14]/90 p-4 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-600">
              Red-flag report
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Sample backtest
            </h2>
          </div>

          <div className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-300">
            Stress test
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
            Overall severity
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">HIGH</p>
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Serious red flags were found. Resolve them before trusting this
            backtest.
          </p>
        </div>

        <div className="mt-4 grid gap-2">
          {previewFlags.map((flag) => (
            <div
              key={flag.text}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                  flag.sev === "HIGH"
                    ? "bg-red-400/15 text-red-300"
                    : "bg-amber-400/15 text-amber-300"
                }`}
              >
                {flag.sev}
              </span>
              <span className="text-xs leading-5 text-zinc-300">
                {flag.text}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#05070D] p-4">
          <p className="text-xs text-zinc-500">Confidence</p>
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
            LOW — small sample
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#020409] p-4">
        <p className="text-xs leading-6 text-zinc-500">
          Not a stamp of approval — a stress test. A clean report is not a
          promise of future performance.
        </p>
      </div>
    </div>
  );
}
