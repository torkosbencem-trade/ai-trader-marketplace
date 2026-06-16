import { NextResponse } from "next/server";
import { strategies } from "../../../lib/strategies";
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
};

function mapRisk(maxDrawdown: number) {
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

function estimateWinRate(risk: string) {
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

function mapApprovedSubmissionToMarketplaceStrategy(submission: {
  id: string;
  name: string;
  assetClass: string;
  timeframe: string;
  riskProfile: string;
  maxDrawdown: string | number | null;
  monthlyTarget: string | number | null;
  fileName: string | null;
  receivedAt: string;
  parsedMetrics?: ParsedMetrics | null;
}) {
  const parsedMetrics = submission.parsedMetrics ?? null;

  const drawdown = Number(
    parsedMetrics?.maxDrawdown ?? submission.maxDrawdown ?? 0
  );

  const monthlyReturn = Number(
    parsedMetrics?.totalReturn ?? submission.monthlyTarget ?? 0
  );

  const risk = mapRisk(drawdown);

  const sharpe = Number(
    parsedMetrics?.sharpe ?? estimateSharpe(monthlyReturn, drawdown)
  );

  const winRate = Number(parsedMetrics?.winRate ?? estimateWinRate(risk));
  const trades = Number(parsedMetrics?.trades ?? estimateTrades(submission.timeframe));

  return {
    id: submission.id,
    name: submission.name,
    manager: "Submitted via Strategy Builder",
    category: "Creator Submission",
    risk,
    monthlyReturn,
    drawdown,
    sharpe,
    winRate,
    trades,
    capital: "$100K+",
    markets: [submission.assetClass],
    description: parsedMetrics
      ? "Approved creator-submitted strategy using parsed CSV/JSON backtest metrics from the Strategy Builder workflow."
      : "Approved creator-submitted strategy. Metrics shown are validation-preview values until broker evidence parsing is connected.",
    status: "Verified",
    source: "file-store",
    timeframe: submission.timeframe,
    riskProfile: submission.riskProfile,
    fileName: submission.fileName,
    approvedFromSubmission: true,
    receivedAt: submission.receivedAt,
    validationState: parsedMetrics
      ? `Parsed ${parsedMetrics.parserMode.toUpperCase()} evidence`
      : "Approved preview",
    parsedMetrics,
  };
}

export async function GET() {
  const submissions = await listStrategySubmissions();

  const approvedSubmissions = submissions
    .filter((submission) => submission.status === "Approved")
    .map(mapApprovedSubmissionToMarketplaceStrategy);

  const demoStrategies = strategies.map((strategy) => ({
    ...strategy,
    source: "demo",
    approvedFromSubmission: false,
    validationState: "Verified demo",
    parsedMetrics: null,
  }));

  return NextResponse.json({
    data: [...approvedSubmissions, ...demoStrategies],
    meta: {
      count: approvedSubmissions.length + demoStrategies.length,
      approvedSubmissions: approvedSubmissions.length,
      demoStrategies: demoStrategies.length,
      source: "marketplace-api",
      timestamp: new Date().toISOString(),
    },
  });
}