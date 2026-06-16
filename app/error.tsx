"use client";

import { useEffect } from "react";

import {
  Card,
  JsonPreview,
  PageHero,
  PremiumPageShell,
  PrimaryLink,
  SafetyNotice,
  SecondaryLink,
  StatusPill,
} from "@/components/ui/PremiumUI";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AI Trader page error:", error);
  }, [error]);

  const debugData = {
    message: error.message || "Unknown frontend runtime error.",
    digest: error.digest ?? null,
  };

  return (
    <PremiumPageShell>
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className="w-full max-w-4xl">
          <PageHero
            pills={[
              { label: "Runtime Error", tone: "danger" },
              { label: "Recovery Available", tone: "warning" },
              { label: "Safety Layer Unchanged", tone: "success" },
            ]}
            title="Something went wrong."
            description="The page failed while loading. You can retry the route, return to the dashboard, or continue from the marketplace."
            actions={
              <>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
                >
                  Retry Page
                </button>

                <PrimaryLink href="/dashboard">Dashboard</PrimaryLink>

                <SecondaryLink href="/" tone="info">
                  Marketplace
                </SecondaryLink>
              </>
            }
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Recovery
                    </p>

                    <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
                      Recommended Actions
                    </h2>
                  </div>

                  <StatusPill label="Frontend" tone="warning" />
                </div>
              </div>

              <div className="space-y-3 p-6">
                <SafetyNotice
                  title="Try the route again"
                  description="Use Retry Page first. If the issue came from a temporary API or render failure, the page may recover immediately."
                  tone="info"
                />

                <SafetyNotice
                  title="Return to Dashboard"
                  description="The dashboard gives the quickest overview of backend health, execution state and validation status."
                  tone="success"
                />

                <SafetyNotice
                  title="Check terminal error if it repeats"
                  description="If this page keeps failing, copy the full red terminal error into chat."
                  tone="warning"
                />
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Debug
                    </p>

                    <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
                      Error Details
                    </h2>
                  </div>

                  <StatusPill label="Visible in Dev" tone="danger" />
                </div>
              </div>

              <div className="p-6">
                <JsonPreview data={debugData} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PremiumPageShell>
  );
}