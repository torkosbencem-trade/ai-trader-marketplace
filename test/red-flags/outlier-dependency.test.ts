import { describe, it, expect } from "vitest";
import {
  analyzeOutlierDependency,
  CONCENTRATION_RATIO_HIGH,
  CONCENTRATION_RATIO_MEDIUM,
  DEFAULT_OUTLIER_LEVELS,
  type OutlierDependencyResult,
} from "@/lib/red-flags/outlier-dependency";

function lvl(result: OutlierDependencyResult, level: number) {
  const found = result.levels.find((l) => l.level === level);
  if (!found) {
    throw new Error(`level ${level} not present in result`);
  }
  return found;
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

describe("analyzeOutlierDependency — exported config", () => {
  it("exposes tunable thresholds and default levels", () => {
    expect(CONCENTRATION_RATIO_HIGH).toBe(3.0);
    expect(CONCENTRATION_RATIO_MEDIUM).toBe(2.0);
    expect(DEFAULT_OUTLIER_LEVELS).toEqual([1, 3, 5, 10]);
  });
});

describe("Test A — concentrated (one dominant trade)", () => {
  const result = analyzeOutlierDependency([60, 5, 5, 5, 5, 5, 5, 5, 5]);

  it("reports baseline", () => {
    expect(result.tradeCount).toBe(9);
    expect(result.baselineTotalReturn).toBeCloseTo(100, 3);
  });

  it("level 1: best trade carries 60% of P&L (5.4x its share) → high", () => {
    const l = lvl(result, 1);
    expect(l.computed).toBe(true);
    expect(l.removedCount).toBe(1);
    expect(l.totalReturnAfter).toBeCloseTo(40, 3);
    expect(l.totalReturnDropPct).toBeCloseTo(60, 3);
    expect(l.pnlSharePct).toBeCloseTo(60, 3);
    expect(l.proportionalSharePct).toBeCloseTo(11.111, 3);
    expect(l.concentrationRatio).toBeCloseTo(5.4, 3);
    expect(l.flipsToNonPositive).toBe(false);
  });

  it("level 3: ratio ~2.1 → medium", () => {
    const l = lvl(result, 3);
    expect(l.totalReturnAfter).toBeCloseTo(30, 3);
    expect(l.totalReturnDropPct).toBeCloseTo(70, 3);
    expect(l.pnlSharePct).toBeCloseTo(70, 3);
    expect(l.proportionalSharePct).toBeCloseTo(33.333, 3);
    expect(l.concentrationRatio).toBeCloseTo(2.1, 3);
  });

  it("level 5: ratio ~1.44 (not flagged)", () => {
    const l = lvl(result, 5);
    expect(l.totalReturnAfter).toBeCloseTo(20, 3);
    expect(l.totalReturnDropPct).toBeCloseTo(80, 3);
    expect(l.pnlSharePct).toBeCloseTo(80, 3);
    expect(l.proportionalSharePct).toBeCloseTo(55.556, 3);
    expect(l.concentrationRatio).toBeCloseTo(1.44, 3);
    expect(result.flags.find((f) => f.level === 5)).toBeUndefined();
  });

  it("level 10: skipped (10 >= 9 trades)", () => {
    const l = lvl(result, 10);
    expect(l.computed).toBe(false);
    expect(l.skipReason).toBe("insufficient trades");
    expect(l.removedCount).toBe(0);
    expect(l.totalReturnAfter).toBeNull();
    expect(l.sharpeAfter).toBeNull();
    expect(l.concentrationRatio).toBeNull();
  });

  it("overall severity high + suggested question", () => {
    expect(result.severity).toBe("high");
    expect(result.suggestedQuestions).toContain(
      "Does the edge survive if your best 3 trades are excluded?"
    );
    expectAllFinite(result);
  });
});

describe("Test B — uniform (proves NO false positive)", () => {
  const result = analyzeOutlierDependency([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);

  it("reports baseline", () => {
    expect(result.tradeCount).toBe(10);
    expect(result.baselineTotalReturn).toBeCloseTo(20, 3);
  });

  it("level 1: 10% drop but ratio 1.0", () => {
    const l = lvl(result, 1);
    expect(l.totalReturnDropPct).toBeCloseTo(10, 3);
    expect(l.pnlSharePct).toBeCloseTo(10, 3);
    expect(l.proportionalSharePct).toBeCloseTo(10, 3);
    expect(l.concentrationRatio).toBeCloseTo(1.0, 3);
  });

  it("level 3: 30% drop but ratio 1.0", () => {
    const l = lvl(result, 3);
    expect(l.totalReturnDropPct).toBeCloseTo(30, 3);
    expect(l.concentrationRatio).toBeCloseTo(1.0, 3);
  });

  it("level 5: naive 50% drop but ratio 1.0 → NO flag", () => {
    const l = lvl(result, 5);
    expect(l.totalReturnDropPct).toBeCloseTo(50, 3);
    expect(l.concentrationRatio).toBeCloseTo(1.0, 3);
  });

  it("level 10 skipped, overall severity none, no flags", () => {
    expect(lvl(result, 10).computed).toBe(false);
    expect(result.severity).toBe("none");
    expect(result.flags).toHaveLength(0);
    expect(result.suggestedQuestions).toHaveLength(0);
    expectAllFinite(result);
  });
});

describe("Test C — non-positive baseline", () => {
  const result = analyzeOutlierDependency([10, -5, -5, -3]);

  it("reports negative baseline", () => {
    expect(result.tradeCount).toBe(4);
    expect(result.baselineTotalReturn).toBeCloseTo(-3, 3);
  });

  it("level 1: absolute still computed, all concentration fields null", () => {
    const l = lvl(result, 1);
    expect(l.computed).toBe(true);
    expect(l.totalReturnAfter).toBeCloseTo(-13, 3);
    expect(l.sharpeAfter).not.toBeNull();
    expect(l.pnlSharePct).toBeNull();
    expect(l.proportionalSharePct).toBeNull();
    expect(l.concentrationRatio).toBeNull();
    expect(l.totalReturnDropPct).toBeNull();
    expect(l.flipsToNonPositive).toBe(false);
  });

  it("level 3: absolute computed, ratio null", () => {
    const l = lvl(result, 3);
    expect(l.computed).toBe(true);
    expect(l.totalReturnAfter).toBeCloseTo(-5, 3);
    expect(l.concentrationRatio).toBeNull();
  });

  it("level 5 skipped (5 >= 4)", () => {
    expect(lvl(result, 5).computed).toBe(false);
  });

  it("severity low + data-quality note", () => {
    expect(result.severity).toBe("low");
    expect(result.notes).toContain(
      "baseline total return non-positive; concentration not computed"
    );
    expectAllFinite(result);
  });
});

describe("Test D — flips to non-positive", () => {
  const result = analyzeOutlierDependency([30, 1, 1, -2, -2]);

  it("reports baseline", () => {
    expect(result.tradeCount).toBe(5);
    expect(result.baselineTotalReturn).toBeCloseTo(28, 3);
  });

  it("level 3: removing top 3 flips total to -4 → high", () => {
    const l = lvl(result, 3);
    expect(l.computed).toBe(true);
    expect(l.removedCount).toBe(3);
    expect(l.totalReturnAfter).toBeCloseTo(-4, 3);
    expect(l.flipsToNonPositive).toBe(true);
  });

  it("level 1: single best trade already flips total to -2 → high", () => {
    const l = lvl(result, 1);
    expect(l.totalReturnAfter).toBeCloseTo(-2, 3);
    expect(l.flipsToNonPositive).toBe(true);
  });

  it("overall severity high", () => {
    expect(result.severity).toBe("high");
    expectAllFinite(result);
  });
});

describe("Test E — tiny sample", () => {
  const result = analyzeOutlierDependency([5, 3]);

  it("level 1 computed, larger levels skipped, no crash", () => {
    expect(result.tradeCount).toBe(2);
    const l1 = lvl(result, 1);
    expect(l1.computed).toBe(true);
    expect(l1.totalReturnAfter).toBeCloseTo(3, 3);
    expect(lvl(result, 3).computed).toBe(false);
    expect(lvl(result, 5).computed).toBe(false);
    expect(lvl(result, 10).computed).toBe(false);
    expect(result.severity).toBe("none");
    expectAllFinite(result);
  });
});

describe("Test F — empty input", () => {
  const result = analyzeOutlierDependency([]);

  it("well-formed, all levels skipped, severity none, no NaN/Infinity", () => {
    expect(result.tradeCount).toBe(0);
    expect(result.baselineTotalReturn).toBe(0);
    expect(result.baselineSharpe).toBe(0);
    expect(result.severity).toBe("none");
    expect(result.notes).toContain("no trades");
    for (const l of result.levels) {
      expect(l.computed).toBe(false);
      expect(l.removedCount).toBe(0);
      expect(l.totalReturnAfter).toBeNull();
    }
    expectAllFinite(result);
  });
});
