import {
  Card,
  LoadingBlock,
  PremiumPageShell,
  StatusPill,
} from "@/components/ui/PremiumUI";

export default function LoadingPage() {
  return (
    <PremiumPageShell>
      <div className="space-y-6">
        <Card className="relative overflow-hidden p-7 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

          <div className="relative">
            <div className="mb-5 flex flex-wrap gap-2">
              <StatusPill label="Loading" tone="info" />
              <StatusPill label="AI Trader" tone="neutral" />
              <StatusPill label="Dry Run Only" tone="success" />
            </div>

            <div className="h-12 max-w-3xl animate-pulse rounded-2xl bg-white/10" />
            <div className="mt-5 h-5 max-w-2xl animate-pulse rounded-full bg-white/10" />
            <div className="mt-3 h-5 max-w-xl animate-pulse rounded-full bg-white/10" />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="h-12 w-full max-w-44 animate-pulse rounded-2xl bg-white/15" />
              <div className="h-12 w-full max-w-44 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-12 w-full max-w-44 animate-pulse rounded-2xl bg-white/10" />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LoadingBlock />
          <LoadingBlock />
          <LoadingBlock />
          <LoadingBlock />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <LoadingBlock className="h-96" />
          <LoadingBlock className="h-96" />
        </div>
      </div>
    </PremiumPageShell>
  );
}