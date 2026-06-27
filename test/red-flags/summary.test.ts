import { describe, it, expect } from "vitest";
import {
  analyzeRedFlags,
  MIN_TRADES_FOR_CONFIDENCE,
  LOW_CONFIDENCE_TRADE_COUNT,
  ZERO_RETURN_RATIO_THRESHOLD,
  MAX_SUGGESTED_QUESTIONS,
  type RedFlagSummary,
} from "@/lib/red-flags/summary";
import type { ParsedBacktestMetrics, BacktestTrade } from "@/lib/backtest-parser";

// Valid, strictly-ascending ISO timestamps (avoids invalid YYYY-01-40 dates).
function ts(i: number): string {
  return new Date(Date.UTC(2024, 0, 1) + i * 86400000).toISOString();
}

function trade(ret: number, timestamp: string | null, index = 0): BacktestTrade {
  return { index, return: ret, timestamp, symbol: null, side: null };
}

// Minimal metrics carrying only what the summary consumes (tradeRecords).
function makeMetrics(records: BacktestTrade[]): ParsedBacktestMetrics {
  return {
    detectedRows: records.length,
    trades: records.length,
    winRate: 0,
    totalReturn: 0,
    averageReturn: 0,
    maxDrawdown: 0,
    sharpe: 0,
    sharpeRaw: 0,
    parserMode: "json",
    equitySeries: [],
    drawdownSeries: [],
    tradeRecords: records,
  };
}

function expectAllFinite(value: unknown): void {
  if (typeof value === "number") {
    expect(Number.isFinite(value)).toBe(true);
  } else if (Array.isArray(value)) {
    value.forEach(expectAllFinite);
  } else if (value && typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      expectAllFinite((value as Record<string, unknown>)[key]);
    }
  }
}

describe("analyzeRedFlags — exported config", () => {
  it("exposes tunable confidence constants", () => {
    expect(MIN_TRADES_FOR_CONFIDENCE).toBe(30);
    expect(LOW_CONFIDENCE_TRADE_COUNT).toBe(10);
    expect(ZERO_RETURN_RATIO_THRESHOLD).toBeCloseTo(0.1, 5);
    expect(MAX_SUGGESTED_QUESTIONS).toBe(8);
  });
});

describe("Test 1 — concentrated triggers high via outlier", () => {
  const records = [60, 5, 5, 5, 5, 5, 5, 5, 5].map((r, i) => trade(r, null, i));
  const result = analyzeRedFlags(makeMetrics(records));

  it("overall high comes from the outlier module", () => {
    expect(result.moduleResults.outlier.status).toBe("ok");
    expect(result.moduleResults.outlier.severity).toBe("high");
    expect(result.overallSeverity).toBe("high");
    const outlierHigh = result.flags.find(
      (f) => f.module === "outlier" && f.severity === "high"
    );
    expect(outlierHigh).toBeDefined();
  });

  it("confidence is low (9 trades, no timestamps)", () => {
    expect(result.confidence.level).toBe("low");
    expect(result.confidence.tradeCount).toBe(9);
    expect(result.confidence.hasTimestamps).toBe(false);
    expect(result.confidence.reasons.some((r) => /small sample/i.test(r))).toBe(true);
    expect(result.confidence.reasons.some((r) => /timestamp/i.test(r))).toBe(true);
  });

  it("headline mentions high risk; no NaN/Infinity", () => {
    expect(result.headline).toMatch(/high risk/i);
    expectAllFinite(result);
  });
});

describe("Test 2 — OOS degradation triggers high via isOos", () => {
  const records = [5, 5, 5, 5, 5, 5, 1, 1, 1, -4].map((r, i) =>
    trade(r, ts(i), i)
  );
  const result = analyzeRedFlags(makeMetrics(records));

  it("overall high comes from the isOos module, outlier is none", () => {
    expect(result.moduleResults.isOos.status).toBe("ok");
    expect(result.moduleResults.isOos.severity).toBe("high");
    expect(result.moduleResults.outlier.severity).toBe("none");
    expect(result.overallSeverity).toBe("high");
    const isOosFlag = result.flags.find((f) => f.module === "isOos");
    expect(isOosFlag).toBeDefined();
  });

  it("ordering basis is chronological; headline mentions high risk", () => {
    expect(result.confidence.orderingBasis).toBe("chronological");
    expect(result.headline).toMatch(/high risk/i);
    expectAllFinite(result);
  });
});

describe("Test 3 — clean + high confidence", () => {
  const records = Array.from({ length: 40 }, (_, i) => trade(2, ts(i), i));
  const result = analyzeRedFlags(makeMetrics(records));

  it("no flags, high confidence, confident headline", () => {
    expect(result.overallSeverity).toBe("none");
    expect(result.confidence.level).toBe("high");
    expect(result.confidence.tradeCount).toBe(40);
    expect(result.confidence.hasTimestamps).toBe(true);
    expect(result.confidence.zeroReturnTradeCount).toBe(0);
    expect(result.headline).toMatch(/no red flags/i);
    expect(result.headline).toMatch(/confiden/i);
    expectAllFinite(result);
  });
});

describe("Test 4 — clean BUT low confidence", () => {
  const records = Array.from({ length: 8 }, (_, i) => trade(2, ts(i), i));
  const result = analyzeRedFlags(makeMetrics(records));

  it("no flags but headline conveys low confidence (not a clean bill)", () => {
    expect(result.overallSeverity).toBe("none");
    expect(result.confidence.level).toBe("low");
    expect(result.headline).toMatch(/low confidence/i);
    expectAllFinite(result);
  });
});

describe("Test 5 — data-quality smell", () => {
  // 40 trades, every 5th is exactly 0.0 (8 of them), rest +2, all timestamped.
  const records = Array.from({ length: 40 }, (_, i) =>
    trade(i % 5 === 4 ? 0 : 2, ts(i), i)
  );
  const result = analyzeRedFlags(makeMetrics(records));

  it("zero-return ratio caps confidence at medium with the blank/garbage reason", () => {
    expect(result.confidence.zeroReturnTradeCount).toBe(8);
    expect(result.confidence.level).toBe("medium");
    expect(result.confidence.reasons.some((r) => /blank\/garbage/i.test(r))).toBe(true);
    expectAllFinite(result);
  });
});

describe("Test 6 — module-errored isolation", () => {
  const records = [5, 5, 5, 5, 5, 5, 1, 1, 1, -4].map((r, i) =>
    trade(r, ts(i), i)
  );
  const thrower = () => {
    throw new Error("injected outlier failure");
  };
  const result = analyzeRedFlags(makeMetrics(records), {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyzeOutlierFn: thrower as any,
  });

  it("errored module is isolated, excluded from overall, NOT treated as none", () => {
    expect(result.moduleResults.outlier.status).toBe("errored");
    expect(result.moduleResults.outlier.error).toBeTruthy();
    expect(result.moduleResults.outlier.severity).toBeUndefined();
    expect(result.moduleResults.isOos.status).toBe("ok");
    expect(result.moduleResults.isOos.severity).toBe("high");
    expect(result.overallSeverity).toBe("high"); // from isOos only
    expect(result.notes.some((n) => /outlier/i.test(n))).toBe(true);
    expect(result.details.outlier).toBeNull();
    expectAllFinite(result);
  });
});

describe("Test 8 — huge finite returns never leak Infinity (round4 overflow guard)", () => {
  // One astronomically large but FINITE return (e.g. a notional accidentally
  // placed in a percent column) must not overflow to Infinity in details.
  const records: BacktestTrade[] = [
    trade(2e305, ts(0), 0),
    ...Array.from({ length: 9 }, (_, i) => trade(1, ts(i + 1), i + 1)),
  ];
  const result = analyzeRedFlags(makeMetrics(records));

  it("does not throw and emits no Infinity anywhere (incl. details)", () => {
    const outlier = result.details.outlier as { baselineTotalReturn: number };
    expect(Number.isFinite(outlier.baselineTotalReturn)).toBe(true);
    expectAllFinite(result);
  });
});

describe("Test 9 — a DI module returning non-array collections is errored, not thrown", () => {
  const records = [5, 5, 5, 5, 5, 5, 1, 1, 1, -4].map((r, i) =>
    trade(r, ts(i), i)
  );
  // Valid severity but garbage collections (would crash a naive spread).
  const malformed = () =>
    ({
      severity: "high",
      flags: "not-an-array",
      notes: 5,
      suggestedQuestions: {},
    });
  const result = analyzeRedFlags(makeMetrics(records), {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyzeOutlierFn: malformed as any,
  });

  it("treats the malformed module as errored and never throws", () => {
    expect(result.moduleResults.outlier.status).toBe("errored");
    expect(result.moduleResults.outlier.severity).toBeUndefined();
    expect(result.moduleResults.isOos.status).toBe("ok");
    expect(result.overallSeverity).toBe("high"); // from isOos only
    expect(result.details.outlier).toBeNull();
    expectAllFinite(result);
  });
});

describe("Test 7 — empty backtest", () => {
  const result: RedFlagSummary = analyzeRedFlags(makeMetrics([]));

  it("no throw, severity none, low confidence, no-data headline, no NaN/Infinity", () => {
    expect(result.overallSeverity).toBe("none");
    expect(result.confidence.level).toBe("low");
    expect(result.confidence.tradeCount).toBe(0);
    expect(result.headline).toMatch(/no data|no trades/i);
    expectAllFinite(result);
  });
});
