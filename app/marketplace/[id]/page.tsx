import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStrategy,
  strategies,
  type RiskLevel,
  type StrategyStatus,
} from "../../../lib/strategies";
import { listStrategySubmissions } from "../../../lib/platform-repository";

type ParsedMetrics = {
  detectedRows: number;
  trades: number;
  winRate: number;
  totalReturn: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpe: number;
  parserMode: "csv" | "json" | "fallback";
  equitySeries?: number[];
  drawdownSeries?: number[];
};

type ReportStrategy = {
  id: string;
  name: string;
  manager: string;
  category: string;
  risk: RiskLevel;
  monthlyReturn: number;
  drawdown: number;
  sharpe: number;
  winRate: number;
  trades: number;
  capital: string;
  markets: string[];
  description: string;
  status: StrategyStatus;
  equity: number[];
  drawdownSeries: number[];
  source?: "demo" | "file-store";
  parsedMetrics?: ParsedMetrics | null;
};

export function generateStaticParams() {
  return strategies.map((strategy) => ({
    id: strategy.id,
  }));
}

function mapRisk(maxDrawdown: number): RiskLevel {
  if (maxDrawdown > 15) {
    return "High";
  }

  if (maxDrawdown <= 5) {
    return "Low";
  }

  return "Medium";
}

function estimateSharpe(monthlyReturn: number, drawdown: number) {
  if (monthlyReturn <= 0 || drawdown <= 0) {
    return 1.25;
  }

  const raw = monthlyReturn / drawdown + 1.05;
  return Number(Math.min(Math.max(raw, 1.15), 2.35).toFixed(2));
}

function estimateWinRate(risk: RiskLevel) {
  if (risk === "Low") {
    return 67;
  }

  if (risk === "High") {
    return 54;
  }

  return 61;
}

function estimateTrades(timeframe: string) {
  if (timeframe === "1m" || timeframe === "5m") {
    return 920;
  }

  if (timeframe === "15m" || timeframe === "1h") {
    return 340;
  }

  if (timeframe === "4h") {
    return 180;
  }

  return 96;
}

function buildSmoothPreviewSeries(totalReturn: number) {
  const target = 100 + totalReturn;
  const points = 14;

  return Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1);
    const curve = Math.pow(progress, 1.25);
    const wave = Math.sin(progress * Math.PI * 3) * 0.8;

    return Number((100 + (target - 100) * curve + wave).toFixed(2));
  });
}

function buildPreviewDrawdownSeries(maxDrawdown: number) {
  const depth = Math.max(maxDrawdown, 0.4);

  return [
    0,
    -0.2,
    -0.5,
    -depth * 0.55,
    -depth * 0.25,
    -depth * 0.75,
    -depth * 0.4,
    -depth,
    -depth * 0.45,
    -depth * 0.3,
    -depth * 0.55,
    -depth * 0.2,
    -0.1,
    0,
  ].map((value) => Number(value.toFixed(2)));
}

async function getApprovedSubmissionStrategy(id: string) {
  const submissions = await listStrategySubmissions();

  const submission = submissions.find(
    (item) => item.id === id && item.status === "Approved"
  );

  if (!submission) {
    return null;
  }

  const parsedMetrics = submission.parsedMetrics ?? null;

  const drawdown = Number(
    parsedMetrics?.maxDrawdown ?? submission.maxDrawdown ?? 0
  );

  const monthlyReturn = Number(
    parsedMetrics?.totalReturn ?? submission.monthlyTarget ?? 0
  );

  const risk = mapRisk(drawdown);

  const equity =
    parsedMetrics?.equitySeries && parsedMetrics.equitySeries.length > 1
      ? parsedMetrics.equitySeries
      : buildSmoothPreviewSeries(monthlyReturn);

  const drawdownSeries =
    parsedMetrics?.drawdownSeries && parsedMetrics.drawdownSeries.length > 1
      ? parsedMetrics.drawdownSeries
      : buildPreviewDrawdownSeries(drawdown);

  return {
    id: submission.id,
    name: submission.name,
    manager: "Submitted via Strategy Builder",
    category: "Creator Submission",
    risk,
    monthlyReturn,
    drawdown,
    sharpe: Number(parsedMetrics?.sharpe ?? estimateSharpe(monthlyReturn, drawdown)),
    winRate: Number(parsedMetrics?.winRate ?? estimateWinRate(risk)),
    trades: Number(parsedMetrics?.trades ?? estimateTrades(submission.timeframe)),
    capital: "$100K+",
    markets: [submission.assetClass],
    description: parsedMetrics
      ? "This strategy was submitted through Strategy Builder, parsed from uploaded CSV/JSON backtest evidence, and approved by the Admin Review workflow."
      : "This strategy was submitted through Strategy Builder and approved by the Admin Review workflow. Metrics shown are validation-preview values until real broker or backtest evidence parsing is connected.",
    status: "Verified" as StrategyStatus,
    equity,
    drawdownSeries,
    source: "file-store",
    parsedMetrics,
  } satisfies ReportStrategy;
}

export default async function StrategyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const staticStrategy = getStrategy(id) as ReportStrategy | undefined;
  const strategy = staticStrategy ?? (await getApprovedSubmissionStrategy(id));

  if (!strategy) {
    notFound();
  }

  const equityPath = buildPath(strategy.equity, 720, 260, 24);
  const drawdownPath = buildPath(strategy.drawdownSeries, 720, 180, 24);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%)]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <Link
            href="/marketplace"
            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08]"
          >
            ← Back to marketplace
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${statusClass(
                    strategy.status
                  )}`}
                >
                  {strategy.status}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs ${riskClass(
                    strategy.risk
                  )}`}
                >
                  {strategy.risk} risk
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                  {strategy.category}
                </span>

                {strategy.source === "file-store" && (
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                    Approved creator strategy
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
                {strategy.name}
              </h1>

              <p className="mt-3 text-lg text-zinc-400">{strategy.manager}</p>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                {strategy.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-4 lg:min-w-[540px]">
              <Metric label="Total return" value={`${strategy.monthlyReturn}%`} />
              <Metric label="Max drawdown" value={`${strategy.drawdown}%`} />
              <Metric label="Sharpe" value={strategy.sharpe.toFixed(2)} />
              <Metric label="Win rate" value={`${strategy.winRate}%`} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Performance</p>
                <h2 className="mt-1 text-2xl font-semibold">Equity curve</h2>
              </div>

              <p className="text-sm text-zinc-500">
                {strategy.parsedMetrics?.equitySeries
                  ? "Built from uploaded CSV/JSON return series"
                  : "Indexed validation preview, starting at 100"}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
              <svg
                viewBox="0 0 720 260"
                className="h-[260px] w-full"
                role="img"
                aria-label="Equity curve"
              >
                <path d="M 24 220 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d="M 24 140 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d="M 24 60 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path
                  d={equityPath}
                  fill="none"
                  stroke="rgb(52,211,153)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Risk behaviour</p>
                <h2 className="mt-1 text-2xl font-semibold">Drawdown profile</h2>
              </div>

              <p className="text-sm text-zinc-500">
                Derived from return series where available
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
              <svg
                viewBox="0 0 720 180"
                className="h-[180px] w-full"
                role="img"
                aria-label="Drawdown chart"
              >
                <path d="M 24 40 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d="M 24 100 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d="M 24 150 H 696" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path
                  d={drawdownPath}
                  fill="none"
                  stroke="rgb(248,113,113)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Strategy notes</p>
            <h2 className="mt-1 text-2xl font-semibold">Marketplace publication</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <InfoCard
                title="Admin approval"
                text="This strategy became visible after approval through the Admin Review workflow."
              />
              <InfoCard
                title="Parsed evidence"
                text="The equity and drawdown charts use uploaded CSV/JSON return data when available."
              />
              <InfoCard
                title="Allocation readiness"
                text="Investor allocation should remain blocked until suitability, risk and broker checks are complete."
              />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Allocation summary</p>
          <h3 className="mt-1 text-2xl font-semibold">{strategy.name}</h3>

          <div className="mt-6 space-y-3 text-sm">
            <Row label="Manager" value={strategy.manager} />
            <Row label="Category" value={strategy.category} />
            <Row label="Risk level" value={strategy.risk} />
            <Row label="Min. capital" value={strategy.capital} />
            <Row label="Total trades" value={strategy.trades.toLocaleString()} />
            <Row label="Status" value={strategy.status} />
            <Row
              label="Evidence source"
              value={strategy.source === "file-store" ? "Parsed submission" : "Demo dataset"}
            />
          </div>

          {strategy.parsedMetrics && (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <p className="text-sm font-medium text-emerald-300">
                Parsed backtest evidence
              </p>

              <div className="mt-4 space-y-3 text-sm">
                <Row label="Parser mode" value={strategy.parsedMetrics.parserMode} />
                <Row label="Detected rows" value={String(strategy.parsedMetrics.detectedRows)} />
                <Row label="Average return" value={`${strategy.parsedMetrics.averageReturn}%`} />
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-medium text-zinc-300">Markets</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {strategy.markets.map((market) => (
                <span
                  key={market}
                  className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-zinc-300"
                >
                  {market}
                </span>
              ))}
            </div>
          </div>

          <Link
            href={`/allocation/${strategy.id}`}
            className="mt-6 block rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Request allocation access
          </Link>
        </aside>
      </section>
    </main>
  );
}

function buildPath(values: number[], width: number, height: number, padding: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x =
        padding + (index / (values.length - 1)) * (width - padding * 2);

      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function riskClass(risk: RiskLevel) {
  if (risk === "Low") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (risk === "Medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function statusClass(status: StrategyStatus) {
  if (status === "Verified") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (status === "Live") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p>
    </div>
  );
}