import { BinanceTestnetStatusCard } from "@/components/system/BinanceTestnetStatusCard";
import { ExecutionGatewayStatusCard } from "@/components/system/ExecutionGatewayStatusCard";
import {
  Card,
  CardHeader,
  MetricCard,
  PageHero,
  PremiumPageShell,
  PrimaryLink,
  SafetyNotice,
  SecondaryLink,
  SectionLabel,
  StatusPill,
} from "@/components/ui/PremiumUI";

const safetyMetrics = [
  {
    label: "Mainnet Routing",
    value: "Locked",
    helper: "Production exchange order routing must remain disabled.",
    tone: "danger" as const,
  },
  {
    label: "Execution Gateway",
    value: "Dry Run",
    helper: "Orders are simulated through the protected gateway layer.",
    tone: "success" as const,
  },
  {
    label: "Binance Testnet",
    value: "Read-only",
    helper: "Only connectivity and preflight checks are allowed.",
    tone: "info" as const,
  },
  {
    label: "Audit Trail",
    value: "Enabled",
    helper: "Gateway and promotion decisions can be reviewed.",
    tone: "neutral" as const,
  },
];

const safetyRules = [
  {
    title: "No mainnet order path",
    status: "Required",
    tone: "danger" as const,
    description:
      "The platform must not expose a production exchange order submission path until explicit safety promotion exists.",
  },
  {
    title: "Dry-run execution first",
    status: "Active",
    tone: "success" as const,
    description:
      "Execution requests should produce simulated order results with real_order_sent=false and network_request_sent=false.",
  },
  {
    title: "Testnet is not live trading",
    status: "Read-only",
    tone: "info" as const,
    description:
      "Binance Testnet status checks are allowed, but testnet order placement should stay disabled at this phase.",
  },
  {
    title: "Promotion gate required",
    status: "Guarded",
    tone: "warning" as const,
    description:
      "Strategies should only progress after risk, validation and audit checks confirm eligibility.",
  },
];

export default function SystemPage() {
  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Safety Center", tone: "info" },
            { label: "Dry Run Only", tone: "success" },
            { label: "Mainnet Locked", tone: "danger" },
            { label: "Audit Enabled", tone: "neutral" },
          ]}
          title="System Safety Center"
          description="Central control surface for execution safety, gateway status, backend health and Binance Testnet preflight checks. This page should make it immediately clear whether the platform is protected before any signal or strategy is reviewed."
          actions={
            <>
              <PrimaryLink href="/execution">Execution Panel</PrimaryLink>
              <SecondaryLink href="/execution-audit" tone="neutral">
                Audit Log
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {safetyMetrics.map((metric) => (
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
          title="Mainnet protection must remain active"
          tone="warning"
          description="This system is currently designed for validation, dry-run execution and read-only Binance Testnet preflight. Do not enable real exchange order routing until the backend safety suite, promotion gate and manual approval process are explicitly extended for that purpose."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ExecutionGatewayStatusCard />
          <BinanceTestnetStatusCard />
        </div>

        <Card>
          <CardHeader
            eyebrow="Safety Rules"
            title="Execution control requirements"
            description="These rules define the expected operating posture for the current system stage."
          />

          <div className="divide-y divide-slate-800/80">
            {safetyRules.map((rule) => (
              <div
                key={rule.title}
                className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-slate-50">
                      {rule.title}
                    </h3>

                    <StatusPill label={rule.status} tone={rule.tone} />
                  </div>

                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
                    {rule.description}
                  </p>
                </div>

                <SecondaryLink href="/project-status" tone="neutral">
                  Review
                </SecondaryLink>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionLabel>Current operating posture</SectionLabel>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <StatusPill label="Allowed" tone="success" />
              <h3 className="mt-4 text-base font-semibold text-slate-50">
                Research and validation
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Signals, strategy metrics, test runs and promotion checks may be
                reviewed inside the platform.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <StatusPill label="Allowed" tone="info" />
              <h3 className="mt-4 text-base font-semibold text-slate-50">
                Read-only exchange checks
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Binance Testnet public ping, server time and credential
                preflight status may be inspected.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <StatusPill label="Blocked" tone="danger" />
              <h3 className="mt-4 text-base font-semibold text-slate-50">
                Real order execution
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Mainnet and real exchange order submission must remain blocked
                in the current release stage.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}