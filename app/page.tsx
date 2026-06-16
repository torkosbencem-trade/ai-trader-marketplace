import Link from "next/link";

const audiences = [
  {
    title: "For investors",
    description:
      "Discover verified systematic strategies, compare risk metrics and monitor deployed allocations from one portfolio dashboard.",
    href: "/marketplace",
    cta: "Explore strategies",
  },
  {
    title: "For strategy creators",
    description:
      "Upload backtests, define risk limits, pass admin review and publish trading systems into a governed marketplace.",
    href: "/strategy-builder",
    cta: "Submit strategy",
  },
  {
    title: "For institutions",
    description:
      "Operate an internal or white-label strategy marketplace with admin review, execution controls and governance workflows.",
    href: "/admin",
    cta: "Open governance",
  },
];

const workflow = [
  {
    step: "01",
    title: "Upload or select strategy",
    text: "Investors browse verified systems while creators submit models through the Strategy Builder workflow.",
  },
  {
    step: "02",
    title: "Validate risk and evidence",
    text: "Drawdown, return profile, broker evidence, documentation and compliance fields are checked before deployment.",
  },
  {
    step: "03",
    title: "Approve marketplace access",
    text: "Admin review controls which strategies become visible, approved or rejected inside the marketplace.",
  },
  {
    step: "04",
    title: "Monitor allocation health",
    text: "Portfolio monitoring tracks capital, exposure, PnL, drawdown and risk interventions after allocation.",
  },
];

const platformModules = [
  {
    title: "Marketplace",
    value: "Strategy discovery",
    href: "/marketplace",
  },
  {
    title: "Portfolio",
    value: "Risk monitoring",
    href: "/portfolio",
  },
  {
    title: "Execution",
    value: "Broker readiness",
    href: "/execution",
  },
  {
    title: "Pricing",
    value: "SaaS model",
    href: "/pricing",
  },
];

const proofPoints = [
  "Strategy marketplace with risk and return comparison",
  "Detailed performance report pages with equity and drawdown charts",
  "Strategy onboarding workflow for creators",
  "Execution center with broker and deployment controls",
  "Portfolio monitor with exposure and allocation health",
  "Admin review console for governance and approval",
  "Pricing model for investors, creators and institutions",
  "Responsive SaaS-style navigation shell",
];

const terminalLines = [
  {
    label: "broker.session",
    value: "connected",
    tone: "good",
  },
  {
    label: "risk.engine",
    value: "limits verified",
    tone: "good",
  },
  {
    label: "alpha-pulse",
    value: "paper deployment ready",
    tone: "good",
  },
  {
    label: "breakline-x",
    value: "exposure reduced",
    tone: "warn",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.20),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.05),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_460px] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 backdrop-blur">
                AI trading marketplace infrastructure
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold tracking-tight md:text-7xl">
                The operating system for systematic trading strategies.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-400 md:text-lg">
                AI Trader is a professional platform concept for discovering,
                validating, approving and monitoring algorithmic trading
                strategies through a governed marketplace and execution workflow.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/marketplace"
                  className="rounded-2xl bg-emerald-400 px-6 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Explore marketplace
                </Link>

                <Link
                  href="/strategy-builder"
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/20 hover:text-emerald-200"
                >
                  Upload strategy
                </Link>

                <Link
                  href="/pricing"
                  className="rounded-2xl border border-white/10 px-6 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  View pricing
                </Link>
              </div>

              <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
                <HeroMetric label="Platform modules" value="8" />
                <HeroMetric label="Demo strategies" value="5" />
                <HeroMetric label="Top Sharpe" value="2.18" />
                <HeroMetric label="Governance" value="Admin" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#080C14]/90 p-4 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-600">
                      Live control layer
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Allocation health
                    </h2>
                  </div>

                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Operational
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MiniPanel label="Capital" value="$500K" />
                  <MiniPanel label="Open PnL" value="+$42.2K" positive />
                  <MiniPanel label="Risk" value="Normal" positive />
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-[#05070D] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Portfolio equity</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        +8.44% monthly
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      Indexed
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3">
                    <svg
                      viewBox="0 0 420 150"
                      className="h-[150px] w-full"
                      role="img"
                      aria-label="Portfolio equity preview"
                    >
                      <path
                        d="M 10 120 H 410"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                      />
                      <path
                        d="M 10 80 H 410"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                      />
                      <path
                        d="M 10 40 H 410"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                      />
                      <path
                        d="M 10 118 L 48 110 L 86 96 L 124 101 L 162 78 L 200 70 L 238 58 L 276 64 L 314 42 L 352 35 L 390 22 L 410 18"
                        fill="none"
                        stroke="rgb(52,211,153)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 10 118 L 48 110 L 86 96 L 124 101 L 162 78 L 200 70 L 238 58 L 276 64 L 314 42 L 352 35 L 390 22 L 410 18 L 410 140 L 10 140 Z"
                        fill="rgba(52,211,153,0.08)"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <StatusRow
                    name="Alpha Pulse"
                    status="Running"
                    exposure="72%"
                    progress="88%"
                  />
                  <StatusRow
                    name="Delta Grid"
                    status="Running"
                    exposure="44%"
                    progress="74%"
                  />
                  <StatusRow
                    name="Breakline X"
                    status="Reduced"
                    exposure="61%"
                    progress="61%"
                    warning
                  />
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#020409] p-4 font-mono">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>

                  <p className="text-xs text-zinc-600">execution.log</p>
                </div>

                <div className="mt-4 space-y-3">
                  {terminalLines.map((line) => (
                    <TerminalLine
                      key={line.label}
                      label={line.label}
                      value={line.value}
                      tone={line.tone}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm font-medium text-amber-300">
                  Production boundary
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  Live trading requires regulated legal structure, broker
                  authorization, server-side risk controls and immutable audit
                  logging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-5 md:grid-cols-4">
          {platformModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
            >
              <p className="text-sm text-zinc-500">{module.title}</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {module.value}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-3 lg:px-8">
        {audiences.map((audience) => (
          <Link
            key={audience.title}
            href={audience.href}
            className="group rounded-3xl border border-white/10 bg-white/[0.035] p-7 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg font-semibold text-emerald-300">
              →
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-white">
              {audience.title}
            </h2>

            <p className="mt-4 text-sm leading-7 text-zinc-500">
              {audience.description}
            </p>

            <p className="mt-7 text-sm font-medium text-emerald-300">
              {audience.cta}
            </p>
          </Link>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
          <p className="text-sm text-zinc-500">Platform workflow</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            From strategy idea to governed allocation.
          </h2>

          <p className="mt-5 text-sm leading-7 text-zinc-500">
            The platform is structured around a real marketplace lifecycle:
            strategy submission, risk review, publication, allocation and
            continuous monitoring.
          </p>

          <div className="mt-7 grid gap-3">
            <Link
              href="/strategy-builder"
              className="rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Start with Strategy Builder
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Review governance console
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {workflow.map((item) => (
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

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_390px] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
          <p className="text-sm text-zinc-500">Current build</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            What the platform already includes
          </h2>

          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {proofPoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-xs text-emerald-300">
                  ✓
                </div>
                <p className="text-sm leading-5 text-zinc-400">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
          <p className="text-sm text-zinc-500">Next engineering layer</p>
          <h3 className="mt-2 text-2xl font-semibold">Move from demo to product</h3>

          <div className="mt-6 space-y-4">
            <NextStep title="Database" text="Persist strategies, users, submissions, approvals and portfolio records." />
            <NextStep title="Authentication" text="Add investor, creator and admin user roles with protected routes." />
            <NextStep title="API layer" text="Connect forms, approvals and portfolio actions to server-side endpoints." />
            <NextStep title="Broker integrations" text="Add secure OAuth, read-only positions and eventually controlled execution." />
          </div>

          <Link
            href="/pricing"
            className="mt-7 block rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/20 hover:text-emerald-200"
          >
            Review business model
          </Link>
        </aside>
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

function MiniPanel({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-lg font-semibold ${
          positive ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  name,
  status,
  exposure,
  progress,
  warning = false,
}: {
  name: string;
  status: string;
  exposure: string;
  progress: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className={warning ? "mt-1 text-xs text-amber-300" : "mt-1 text-xs text-emerald-300"}>
            {status}
          </p>
        </div>

        <p className="text-sm font-semibold text-zinc-300">{exposure}</p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={warning ? "h-full rounded-full bg-amber-400" : "h-full rounded-full bg-emerald-400"}
          style={{ width: progress }}
        />
      </div>
    </div>
  );
}

function TerminalLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-zinc-600">
        {">"} {label}
      </span>

      <span className={tone === "warn" ? "text-amber-300" : "text-emerald-300"}>
        {value}
      </span>
    </div>
  );
}

function NextStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  );
}