import {
  Card,
  PageHero,
  PremiumPageShell,
  PrimaryLink,
  SafetyNotice,
  SecondaryLink,
  StatusPill,
} from "@/components/ui/PremiumUI";

export default function NotFoundPage() {
  return (
    <PremiumPageShell>
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className="w-full max-w-4xl">
          <PageHero
            pills={[
              { label: "404", tone: "warning" },
              { label: "Route Not Found", tone: "neutral" },
              { label: "Safety Unaffected", tone: "success" },
            ]}
            title="This route is not available."
            description="The requested page does not exist in the AI Trader Marketplace. Return to the validation cockpit or continue with marketplace discovery."
            actions={
              <>
                <PrimaryLink href="/dashboard">Dashboard</PrimaryLink>

                <SecondaryLink href="/" tone="info">
                  Marketplace
                </SecondaryLink>

                <SecondaryLink href="/signals" tone="success">
                  Live Signals
                </SecondaryLink>
              </>
            }
          />

          <Card className="mt-6 overflow-hidden">
            <div className="grid gap-4 p-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <StatusPill label="Dashboard" tone="info" />

                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Return to the control center and review system status.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <StatusPill label="Marketplace" tone="warning" />

                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Continue browsing strategy candidates and validation flows.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <StatusPill label="Signals" tone="success" />

                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Review current signal candidates before Test Runs.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 p-6">
              <SafetyNotice
                title="Navigation errors do not affect trading safety"
                description="The system remains validation-first and dry-run only. A missing page does not change backend safety configuration or execution mode."
                tone="success"
              />
            </div>
          </Card>
        </div>
      </div>
    </PremiumPageShell>
  );
}