import { describe, it, expect } from "vitest";
import {
  analyzeIsOosSplit,
  DEFAULT_IS_FRACTION,
  MIN_SEGMENT_TRADES,
  AVG_RETURN_DELTA_HIGH_PCT,
  AVG_RETURN_DELTA_MEDIUM_PCT,
  type TradeInput,
  type IsOosSplitResult,
} from "@/lib/red-flags/is-oos-split";

// Exact note strings (asserted as literals so the test verifies the real text,
// including the em dash in the partial-timestamps note).
const NOTE_NO_TIMESTAMPS =
  "no timestamps; OOS split based on file order only (weaker guarantee).";
const NOTE_PARTIAL_TIMESTAMPS =
  "mixed/partial timestamps; using file order — OOS split is weaker without reliable timestamps.";
const NOTE_NO_TRADES = "no trades";

function day(n: number): string {
  return `2024-01-${String(n).padStart(2, "0")}T00:00:00Z`;
}

// Recursively assert no NaN / Infinity leaks anywhere in the result.
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

// Returns in chronological order: six +5s, three +1s, one -4.
const RETURNS_DEGRADING = [5, 5, 5, 5, 5, 5, 1, 1, 1, -4];

describe("analyzeIsOosSplit — exported config", () => {
  it("exposes tunable thresholds and the (pilot) min segment size", () => {
    expect(DEFAULT_IS_FRACTION).toBeCloseTo(0.7, 5);
    expect(MIN_SEGMENT_TRADES).toBe(3);
    expect(AVG_RETURN_DELTA_HIGH_PCT).toBe(-50);
    expect(AVG_RETURN_DELTA_MEDIUM_PCT).toBe(-25);
  });
});

describe("Test A — clean chronological degradation", () => {
  const trades: TradeInput[] = RETURNS_DEGRADING.map((r, i) => ({
    return: r,
    timestamp: day(i + 1),
  }));
  const result = analyzeIsOosSplit(trades);

  it("orders chronologically and splits 7 / 3", () => {
    expect(result.tradeCount).toBe(10);
    expect(result.orderingBasis).toBe("chronological");
    expect(result.computed).toBe(true);
    expect(result.splitFraction).toBeCloseTo(0.7, 5);
    expect(result.isSegment).not.toBeNull();
    expect(result.oosSegment).not.toBeNull();
    expect(result.isSegment!.count).toBe(7);
    expect(result.oosSegment!.count).toBe(3);
  });

  it("computes segment metrics", () => {
    expect(result.isSegment!.totalReturn).toBeCloseTo(31, 3);
    expect(result.oosSegment!.totalReturn).toBeCloseTo(-2, 3);
    expect(result.isSegment!.averageReturn).toBeCloseTo(4.4286, 3);
    expect(result.oosSegment!.averageReturn).toBeCloseTo(-0.6667, 3);
    expect(result.isSegment!.winRate).toBeCloseTo(100, 3);
    expect(result.oosSegment!.winRate).toBeCloseTo(66.6667, 3);
  });

  it("flags OOS going negative as high", () => {
    expect(result.oosWentNegative).toBe(true);
    expect(result.avgReturnDeltaPct).not.toBeNull();
    expect(result.avgReturnDeltaPct!).toBeLessThanOrEqual(-50);
    expect(result.severity).toBe("high");
    expect(result.suggestedQuestions.length).toBeGreaterThan(0);
    expectAllFinite(result);
  });
});

describe("Test B — timestamps out of file order (chronological sort happens)", () => {
  // Same (timestamp -> return) pairs as Test A, but the ARRAY order is shuffled.
  const shuffled: TradeInput[] = [
    { return: -4, timestamp: day(10) },
    { return: 5, timestamp: day(3) },
    { return: 1, timestamp: day(7) },
    { return: 5, timestamp: day(1) },
    { return: 1, timestamp: day(9) },
    { return: 5, timestamp: day(5) },
    { return: 5, timestamp: day(2) },
    { return: 1, timestamp: day(8) },
    { return: 5, timestamp: day(4) },
    { return: 5, timestamp: day(6) },
  ];
  const result = analyzeIsOosSplit(shuffled);

  // Reference result built from the already-in-order trades.
  const ordered: TradeInput[] = RETURNS_DEGRADING.map((r, i) => ({
    return: r,
    timestamp: day(i + 1),
  }));
  const reference = analyzeIsOosSplit(ordered);

  it("produces a result IDENTICAL to the time-ordered input", () => {
    expect(result.orderingBasis).toBe("chronological");
    expect(result).toStrictEqual(reference);
  });

  it("matches the Test A oracle exactly", () => {
    expect(result.isSegment!.averageReturn).toBeCloseTo(4.4286, 3);
    expect(result.oosSegment!.averageReturn).toBeCloseTo(-0.6667, 3);
    expect(result.oosWentNegative).toBe(true);
    expect(result.severity).toBe("high");
    expectAllFinite(result);
  });
});

describe("Test C — no timestamps -> file order", () => {
  const trades: TradeInput[] = RETURNS_DEGRADING.map((r) => ({
    return: r,
    timestamp: null,
  }));
  const result = analyzeIsOosSplit(trades);

  it("falls back to file order with the weak-guarantee note", () => {
    expect(result.orderingBasis).toBe("file-order");
    expect(result.notes).toContain(NOTE_NO_TIMESTAMPS);
  });

  it("still computes the same split math and flags high", () => {
    expect(result.severity).toBe("high");
    expect(result.oosWentNegative).toBe(true);
    expect(result.isSegment!.averageReturn).toBeCloseTo(4.4286, 3);
    expect(result.oosSegment!.averageReturn).toBeCloseTo(-0.6667, 3);
    expectAllFinite(result);
  });
});

describe("Test D — partial timestamps -> file-order fallback (NO half-sort)", () => {
  const trades: TradeInput[] = RETURNS_DEGRADING.map((r, i) => ({
    return: r,
    timestamp: i < 3 ? day(i + 1) : null,
  }));
  const result = analyzeIsOosSplit(trades);

  it("uses file order and emits the mixed-timestamps note", () => {
    expect(result.orderingBasis).toBe("file-order");
    expect(result.notes).toContain(NOTE_PARTIAL_TIMESTAMPS);
    expect(result.severity).toBe("high");
    expectAllFinite(result);
  });
});

describe("Test E — stable strategy, no flag", () => {
  const trades: TradeInput[] = Array.from({ length: 10 }, (_, i) => ({
    return: 3,
    timestamp: day(i + 1),
  }));
  const result = analyzeIsOosSplit(trades);

  it("no degradation -> severity none", () => {
    expect(result.orderingBasis).toBe("chronological");
    expect(result.computed).toBe(true);
    expect(result.isSegment!.averageReturn).toBeCloseTo(3, 3);
    expect(result.oosSegment!.averageReturn).toBeCloseTo(3, 3);
    expect(result.avgReturnDeltaPct).toBeCloseTo(0, 3);
    expect(result.oosWentNegative).toBe(false);
    expect(result.severity).toBe("none");
    expect(result.suggestedQuestions).toHaveLength(0);
    expectAllFinite(result);
  });
});

describe("Test F — tiny sample non-computable", () => {
  const trades: TradeInput[] = Array.from({ length: 6 }, (_, i) => ({
    return: 3,
    timestamp: day(i + 1),
  }));
  const result = analyzeIsOosSplit(trades);

  it("skips (OOS=2 < 3) but still reports counts", () => {
    expect(result.tradeCount).toBe(6);
    expect(result.computed).toBe(false);
    expect(result.skipReason).toBeTruthy();
    expect(result.severity).toBe("low");
    expect(result.isSegment!.count).toBe(4);
    expect(result.oosSegment!.count).toBe(2);
    expect(result.avgReturnDeltaPct).toBeNull();
    expect(result.oosWentNegative).toBe(false);
    expectAllFinite(result);
  });
});

describe("Test H — degenerate options stay finite (hardening)", () => {
  const tenTrades: TradeInput[] = Array.from({ length: 10 }, (_, i) => ({
    return: 5,
    timestamp: day(i + 1),
  }));

  it("fraction=1 / minSegmentTrades=0 -> not computed, empty OOS is null, no NaN", () => {
    const result = analyzeIsOosSplit(tenTrades, {
      fraction: 1,
      minSegmentTrades: 0,
    });
    expect(result.computed).toBe(false);
    expect(result.oosSegment).toBeNull();
    expect(result.severity).toBe("low");
    expectAllFinite(result);
  });

  it("non-finite fraction falls back to a finite split fraction", () => {
    const result = analyzeIsOosSplit(tenTrades, { fraction: Number.NaN });
    expect(Number.isFinite(result.splitFraction)).toBe(true);
    expect(result.computed).toBe(true);
    expectAllFinite(result);
  });
});

describe("Test G — empty input", () => {
  const result: IsOosSplitResult = analyzeIsOosSplit([]);

  it("well-formed, non-computable, severity none, no NaN/Infinity", () => {
    expect(result.tradeCount).toBe(0);
    expect(result.computed).toBe(false);
    expect(result.severity).toBe("none");
    expect(result.notes).toContain(NOTE_NO_TRADES);
    expect(result.isSegment).toBeNull();
    expect(result.oosSegment).toBeNull();
    expect(result.avgReturnDeltaPct).toBeNull();
    expect(result.sharpeDelta).toBeNull();
    expect(result.winRateDelta).toBeNull();
    expect(result.oosWentNegative).toBe(false);
    expectAllFinite(result);
  });
});
