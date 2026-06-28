import { describe, it, expect } from "vitest";
import {
  equityCollapseSvg,
  contributionSvg,
  reportCardSvg,
  CHART_THEME,
} from "@/lib/red-flags/charts";
import type { ParsedBacktestMetrics, BacktestTrade } from "@/lib/backtest-parser";
import type { RedFlagSummary } from "@/lib/red-flags/summary";

function metricsFrom(returns: number[]): ParsedBacktestMetrics {
  const tradeRecords: BacktestTrade[] = returns.map((r, i) => ({
    index: i,
    return: r,
    timestamp: null,
    symbol: null,
    side: null,
  }));
  return {
    detectedRows: returns.length,
    trades: returns.length,
    winRate: 0,
    totalReturn: 0,
    averageReturn: 0,
    maxDrawdown: 0,
    sharpe: 0,
    sharpeRaw: 0,
    parserMode: "json",
    equitySeries: [],
    drawdownSeries: [],
    tradeRecords,
  };
}

function baseSummary(overrides: Partial<RedFlagSummary> = {}): RedFlagSummary {
  return {
    overallSeverity: "none",
    headline: "",
    flags: [],
    moduleResults: {
      outlier: { status: "ok", severity: "none" },
      isOos: { status: "ok", severity: "none" },
    },
    confidence: {
      level: "high",
      tradeCount: 40,
      hasTimestamps: true,
      orderingBasis: "chronological",
      zeroReturnTradeCount: 0,
      reasons: [],
    },
    suggestedQuestions: [],
    notes: [],
    details: { outlier: null, isOos: null },
    ...overrides,
  };
}

// A realistic outlier sub-result (the "concentrated" Test A shape).
const outlierDetails = {
  tradeCount: 9,
  baselineTotalReturn: 100,
  baselineSharpe: 0,
  levels: [
    { level: 1, removedCount: 1, computed: true, totalReturnAfter: 40, sharpeAfter: 0, totalReturnDropPct: 60, pnlSharePct: 60, proportionalSharePct: 11.11, concentrationRatio: 5.4, flipsToNonPositive: false },
    { level: 5, removedCount: 5, computed: true, totalReturnAfter: 20, sharpeAfter: 0, totalReturnDropPct: 80, pnlSharePct: 80, proportionalSharePct: 55.56, concentrationRatio: 1.44, flipsToNonPositive: false },
  ],
  severity: "high",
  flags: [],
  suggestedQuestions: [],
  notes: [],
};

function noNonFinite(svg: string): void {
  expect(svg.includes("NaN")).toBe(false);
  expect(svg.includes("Infinity")).toBe(false);
}

const NORMAL = [60, 5, 5, 5, 5, 5, 5, 5, 5, -4];

describe("charts — normal fixtures produce valid SVG", () => {
  it("equityCollapseSvg returns an <svg> with both curves, no NaN/Infinity", () => {
    const svg = equityCollapseSvg(metricsFrom(NORMAL), null, { isSample: true });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('data-curve="full"');
    expect(svg).toContain('data-curve="without-top-5"');
    expect(svg).toContain("illustrative example");
    noNonFinite(svg);
  });

  it("contributionSvg returns an <svg>, no NaN/Infinity", () => {
    const svg = contributionSvg(NORMAL);
    expect(svg.startsWith("<svg")).toBe(true);
    noNonFinite(svg);
  });

  it("reportCardSvg returns an <svg>, no NaN/Infinity", () => {
    const summary = baseSummary({
      overallSeverity: "high",
      details: { outlier: outlierDetails, isOos: null },
    });
    const svg = reportCardSvg(summary, {
      totalReturn: 100,
      winRate: 62.4,
      rawSharpe: 0.7,
      maxDrawdown: 1,
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("@StrataOSS");
    noNonFinite(svg);
  });
});

describe("equityCollapseSvg — fewer than 6 trades", () => {
  it("omits the red (without-top-5) curve and notes it, no throw", () => {
    const svg = equityCollapseSvg(metricsFrom([1, 2, 3]), null);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('data-curve="full"');
    expect(svg).not.toContain('data-curve="without-top-5"');
    expect(svg.toLowerCase()).toContain("fewer than 6 trades");
    noNonFinite(svg);
  });
});

describe("contributionSvg — top-trade share callout", () => {
  it("computes biggest / sum-of-positive-returns for a known fixture", () => {
    // [60, 5x8] -> sumPositive = 100, biggest = 60 -> 60%
    const svg = contributionSvg([60, 5, 5, 5, 5, 5, 5, 5, 5]);
    expect(svg).toContain("1 trade = 60% of all profit");
    noNonFinite(svg);
  });
});

describe("reportCardSvg — verdict color by severity", () => {
  it("high severity uses the red verdict color", () => {
    const svg = reportCardSvg(
      baseSummary({ overallSeverity: "high" }),
      { totalReturn: 10, winRate: 50 }
    );
    expect(svg).toContain(`data-verdict-color="${CHART_THEME.red}"`);
  });

  it("none severity uses the green verdict color", () => {
    const svg = reportCardSvg(
      baseSummary({ overallSeverity: "none" }),
      { totalReturn: 10, winRate: 50 }
    );
    expect(svg).toContain(`data-verdict-color="${CHART_THEME.green}"`);
  });
});

describe("charts — empty / degenerate input", () => {
  it("all three produce valid SVG with no NaN/Infinity and no throw", () => {
    const e = equityCollapseSvg(metricsFrom([]), null);
    const c = contributionSvg([]);
    const r = reportCardSvg(
      baseSummary({
        confidence: {
          level: "low",
          tradeCount: 0,
          hasTimestamps: false,
          orderingBasis: "file-order",
          zeroReturnTradeCount: 0,
          reasons: ["no trades"],
        },
      }),
      { totalReturn: 0, winRate: 0 }
    );
    for (const svg of [e, c, r]) {
      expect(svg.startsWith("<svg")).toBe(true);
      noNonFinite(svg);
    }
  });
});
