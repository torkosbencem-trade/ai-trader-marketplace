import {
  Card,
  CardHeader,
  MetricCard,
  PageHero,
  PremiumPageShell,
  PrimaryLink,
  SafetyNotice,
  ScoreBar,
  SecondaryLink,
  SectionLabel,
  StatusPill,
} from "@/components/ui/PremiumUI";

const systemMetrics = [
  {
    label: "Execution Mode",
    value: "Dry Run",
    helper: "No real orders are allowed from the current execution path.",
    tone: "success" as const,
  },
  {
    label: "Mainnet",
    value: "Locked",
    helper: "Production exchange order routing remains disabled.",
    tone: "danger" as const,
  },
  {
    label: "Testnet",
    value: "Read-only",
    helper: "Binance Testnet connectivity is limited to preflight checks.",
    tone: "info" as const,
  },
  {
    label: "Audit Layer",
    value: "Enabled",
    helper: "Execution and promotion decisions are recorded for review.",
    tone: "neutral" as const,
  },
];

const workflow = [
  {
    step: "01",
    title: "Research Intake",
    description:
      "Collect research, market context, thesis notes and external signal sources before a strategy is allowed into validation.",
    status: "Controlled",
    tone: "info" as const,
  },
  {
    step: "02",
    title: "Signal Validation",
    description:
      "Normalize strategy output, confidence, symbol, side, timeframe and risk data into a consistent signal model.",
    status: "Active",
    tone: "success" as const,
  },
  {
    step: "03",
    title: "Promotion Gate",
    description:
      "Evaluate whether a strategy can move from research to shadow-live or testnet based on risk and performance checks.",
    status: "Guarded",
    tone: "warning" as const,
  },
  {
    step: "04",
    title: "Execution Safety",
    description:
      "Keep all order flow behind dry-run, audit and exchange-gateway controls until explicit safety promotion.",
    status: "Protected",
    tone: "success" as const,
  },
];

const quickAccess = [
  {
    title: "System Safety",
    description: "Inspect backend health, gateway mode and Binance Testnet preflight status.",
    href: "/system",
    label: "Open System",
  },
  {
    title: "Signals",
    description: "Review normalized marketplace and live strategy signal output.",
    href: "/signals",
    label: "Open Signals",
  },
  {
    title: "Promotion Gate",
    description: "Evaluate whether a strategy is eligible for shadow-live or testnet validation.",
    href: "/promotion",
    label: "Open Gate",
  },
  {
    title: "Execution Audit",
    description: "Review dry-run and safety-related execution audit events.",
    href: "/execution-audit",
    label: "Open Audit",
  },
];

export default function HomePage() {
  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Dry Run Only", tone: "success" },
            { label: "Mainnet Locked", tone: "danger" },
            { label: "Binance Testnet Read-only", tone: "info" },
            { label: "Audit Enabled", tone: "neutral" },
          ]}
          title="AI Trader Control Center"
          description="Institutional-style strategy validation, signal review and execution-safety dashboard. Built for research-driven trading workflows where every strategy must pass risk, audit and promotion gates before any live exposure."
          actions={
            <>
              <PrimaryLink href="/dashboard">Open Dashboard</PrimaryLink>
              <SecondaryLink href="/system" tone="info">
                System Status
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {systemMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
              tone={metric.tone}
            />
          ))}
        </div>

        <SafetyNotice
          title="Execution protection is active"
          tone="warning"
          description="This interface is currently configured for dry-run execution and read-only Binance Testnet checks. Mainnet order routing remains locked and should stay disabled until a separate safety promotion process is completed."
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader
              eyebrow="Validation Pipeline"
              title="Strategy lifecycle"
              description="A clean workflow for moving ideas from research to validated strategy candidates without bypassing safety controls."
            />

            <div className="divide-y divide-slate-800/80">
              {workflow.map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[72px_1fr_auto] lg:items-start"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 text-sm font-semibold text-slate-400">
                    {item.step}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-50">
                        {item.title}
                      </h3>
                      <StatusPill label={item.status} tone={item.tone} />
                    </div>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <SecondaryLink href="/project-status" tone="neutral">
                    Details
                  </SecondaryLink>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionLabel>System Confidence</SectionLabel>

            <div className="mt-5 space-y-4">
              <ScoreBar
                label="Execution Safety"
                value={96}
                tone="success"
                helper="Dry-run and mainnet-lock assumptions are enforced by the current gateway model."
              />

              <ScoreBar
                label="Strategy Promotion Readiness"
                value={74}
                tone="warning"
                helper="Promotion is available, but each strategy still requires separate validation."
              />

              <ScoreBar
                label="Exchange Integration"
                value={42}
                tone="info"
                helper="Binance Testnet is connected for read-only preflight checks, not order routing."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Current operating posture
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The platform is positioned as a validation terminal first:
                research, signals, test runs, promotion checks, audit trails and
                protected execution simulation.
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Quick Access"
            title="Operational modules"
            description="Jump directly into the areas that matter for validation, monitoring and safety review."
          />

          <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-4">
            {quickAccess.map((item) => (
              <div
                key={item.href}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
              >
                <h3 className="text-base font-semibold text-slate-50">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-20 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <div className="mt-5">
                  <SecondaryLink href={item.href} tone="neutral">
                    {item.label}
                  </SecondaryLink>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}