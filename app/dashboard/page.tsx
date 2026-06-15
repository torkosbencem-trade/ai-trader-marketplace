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

const dashboardMetrics = [
  {
    label: "Platform Mode",
    value: "Protected",
    helper: "All execution paths remain behind safety gates.",
    tone: "success" as const,
  },
  {
    label: "Order Routing",
    value: "Disabled",
    helper: "No production order route is currently enabled.",
    tone: "danger" as const,
  },
  {
    label: "Signal Layer",
    value: "Online",
    helper: "Signals can be reviewed, normalized and validated.",
    tone: "info" as const,
  },
  {
    label: "Promotion Gate",
    value: "Active",
    helper: "Strategies require eligibility checks before progression.",
    tone: "warning" as const,
  },
];

const operatingChecks = [
  {
    name: "Dry-run execution",
    state: "Enforced",
    tone: "success" as const,
    detail: "Execution requests are treated as simulation output.",
  },
  {
    name: "Mainnet exchange routing",
    state: "Locked",
    tone: "danger" as const,
    detail: "Production Binance order flow is not enabled.",
  },
  {
    name: "Binance Testnet",
    state: "Read-only",
    tone: "info" as const,
    detail: "Connectivity checks are allowed; order submission is not.",
  },
  {
    name: "Audit trail",
    state: "Enabled",
    tone: "neutral" as const,
    detail: "Execution and promotion decisions can be reviewed.",
  },
];

const modules = [
  {
    title: "Live Signals",
    description: "Monitor strategy output and signal candidates.",
    href: "/live-signals",
    tone: "info" as const,
  },
  {
    title: "Test Runs",
    description: "Review validation runs before any strategy promotion.",
    href: "/test-runs",
    tone: "neutral" as const,
  },
  {
    title: "Shadow Live",
    description: "Configure protected shadow-live behaviour.",
    href: "/shadow-live",
    tone: "warning" as const,
  },
  {
    title: "System",
    description: "Inspect backend, gateway and Binance testnet status.",
    href: "/system",
    tone: "success" as const,
  },
];

export default function DashboardPage() {
  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Control Center", tone: "info" },
            { label: "Dry Run Only", tone: "success" },
            { label: "Mainnet Locked", tone: "danger" },
          ]}
          title="Dashboard"
          description="Operational overview for strategy validation, signal monitoring and execution-safety control. This dashboard is designed to show what is active, what is blocked and what requires review."
          actions={
            <>
              <PrimaryLink href="/system">System Check</PrimaryLink>
              <SecondaryLink href="/execution" tone="neutral">
                Execution Panel
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric) => (
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
          title="Protected operating mode"
          tone="warning"
          description="The dashboard is intentionally safety-first. Signals, validations and testnet checks may be reviewed here, but real exchange execution remains disabled until a separate promotion process explicitly allows it."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader
              eyebrow="Operating Checks"
              title="Execution safety posture"
              description="Current assumptions that should remain visible before reviewing any strategy or signal."
            />

            <div className="divide-y divide-slate-800/80">
              {operatingChecks.map((check) => (
                <div
                  key={check.name}
                  className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-50">
                        {check.name}
                      </h3>
                      <StatusPill label={check.state} tone={check.tone} />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {check.detail}
                    </p>
                  </div>

                  <SecondaryLink href="/system" tone="neutral">
                    Inspect
                  </SecondaryLink>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionLabel>Readiness</SectionLabel>

            <div className="mt-5 space-y-4">
              <ScoreBar
                label="Safety Controls"
                value={96}
                tone="success"
                helper="Dry-run, audit and mainnet-lock posture is strong."
              />

              <ScoreBar
                label="Signal Validation"
                value={78}
                tone="info"
                helper="Signal review and strategy validation modules are available."
              />

              <ScoreBar
                label="Live Execution Readiness"
                value={18}
                tone="danger"
                helper="Live execution should remain blocked at this stage."
              />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Modules"
            title="Operational shortcuts"
            description="Fast access to the main validation and monitoring areas."
          />

          <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <div
                key={module.href}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-slate-50">
                    {module.title}
                  </h3>

                  <StatusPill label="Open" tone={module.tone} />
                </div>

                <p className="mt-3 min-h-16 text-sm leading-6 text-slate-500">
                  {module.description}
                </p>

                <div className="mt-5">
                  <SecondaryLink href={module.href} tone="neutral">
                    Go to module
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