// Outlier Dependency Analysis — a "red flag" module.
//
// Given per-trade returns, it removes the top 1 / 3 / 5 / 10 trades (ranked by
// return, descending) and measures how much of the result depended on those
// few trades. The primary flag metric is the CONCENTRATION RATIO, not a naive
// "drop% after removing top N": removing 5 of 10 equal trades drops 50% of
// return with zero real concentration, so drop% alone false-positives on
// uniform data. The concentration ratio normalizes the P&L share by the
// proportional share, so uniform data lands at ~1.0 (no flag).
//
// This module depends only on the array of returns (callers pass
// `metrics.tradeRecords.map((t) => t.return)`), keeping the dependency honest.

export type Severity = "none" | "low" | "medium" | "high";

export type OutlierLevelResult = {
  level: number; // requested: 1, 3, 5, 10
  removedCount: number; // actual removed; 0 if skipped
  computed: boolean; // false if level skipped
  skipReason?: string;
  totalReturnAfter: number | null;
  sharpeAfter: number | null; // RAW Sharpe (mean/popStddev, unclamped, no √12)
  totalReturnDropPct: number | null; // relative context
  pnlSharePct: number | null;
  proportionalSharePct: number | null;
  concentrationRatio: number | null;
  flipsToNonPositive: boolean; // baseline > 0 but totalReturnAfter <= 0
};

export type OutlierFlag = {
  severity: Severity;
  message: string;
  level?: number;
};

export type OutlierDependencyResult = {
  tradeCount: number;
  baselineTotalReturn: number;
  baselineSharpe: number; // raw
  levels: OutlierLevelResult[];
  severity: Severity; // max across levels
  flags: OutlierFlag[];
  suggestedQuestions: string[];
  notes: string[]; // data-quality notes
};

export type OutlierOptions = {
  levels?: number[];
  concentrationRatioHigh?: number;
  concentrationRatioMedium?: number;
};

export const DEFAULT_OUTLIER_LEVELS = [1, 3, 5, 10];
export const CONCENTRATION_RATIO_HIGH = 3.0;
export const CONCENTRATION_RATIO_MEDIUM = 2.0;

const SEVERITY_RANK: Record<Severity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function maxSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

// Round to 4 dp; normalize -0 to 0 and guard against non-finite values leaking
// into the output (rule: never emit NaN or Infinity).
function round4(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const rounded = Math.round(value * 1e4) / 1e4;
  // Guard the multiply/round overflow: a finite value above ~1.8e304 makes
  // value * 1e4 overflow to ±Infinity. Keep the (finite) input rather than
  // emit a non-finite number.
  if (!Number.isFinite(rounded)) {
    return value;
  }
  return rounded === 0 ? 0 : rounded;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

// Raw Sharpe: mean / population standard deviation. No annualization, no
// clamping — same convention as the backtest parser's `sharpeRaw`. Returns 0
// when undefined (empty input or zero variance) so callers never see
// NaN / Infinity.
function rawSharpe(values: number[]): number {
  const n = values.length;
  if (n === 0) {
    return 0;
  }
  const mean = sum(values) / n;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) * (value - mean), 0) / n;
  const stddev = Math.sqrt(variance);
  return stddev > 0 ? mean / stddev : 0;
}

function skippedLevel(level: number): OutlierLevelResult {
  return {
    level,
    removedCount: 0,
    computed: false,
    skipReason: "insufficient trades",
    totalReturnAfter: null,
    sharpeAfter: null,
    totalReturnDropPct: null,
    pnlSharePct: null,
    proportionalSharePct: null,
    concentrationRatio: null,
    flipsToNonPositive: false,
  };
}

// The severity a single computed level contributes (positive baseline only;
// non-positive baselines are handled separately and capped at "low").
function levelSeverity(
  level: OutlierLevelResult,
  highThreshold: number,
  mediumThreshold: number
): Severity {
  if (!level.computed) {
    return "none";
  }
  if (level.flipsToNonPositive) {
    return "high";
  }
  if (level.concentrationRatio == null) {
    return "none";
  }
  if (level.concentrationRatio >= highThreshold) {
    return "high";
  }
  if (level.concentrationRatio >= mediumThreshold) {
    return "medium";
  }
  return "none";
}

export function analyzeOutlierDependency(
  returns: number[],
  options: OutlierOptions = {}
): OutlierDependencyResult {
  const levelsRequested = options.levels ?? DEFAULT_OUTLIER_LEVELS;
  const highThreshold =
    options.concentrationRatioHigh ?? CONCENTRATION_RATIO_HIGH;
  const mediumThreshold =
    options.concentrationRatioMedium ?? CONCENTRATION_RATIO_MEDIUM;

  // Only finite returns participate — defends against accidental NaN/Infinity
  // in the input so they can never propagate into the output.
  const cleanReturns = returns.filter((value) => Number.isFinite(value));
  const tradeCount = cleanReturns.length;

  // Raw (unrounded) baseline drives all decisions; we round only at output to
  // avoid compounding rounding error through the math.
  const rawBaseline = sum(cleanReturns);
  const baselinePositive = rawBaseline > 0;

  const baselineTotalReturn = round4(rawBaseline);
  const baselineSharpe = round4(rawSharpe(cleanReturns));

  // Descending sort by return; the "top N" are the N largest.
  const sortedDesc = [...cleanReturns].sort((a, b) => b - a);

  const levels: OutlierLevelResult[] = levelsRequested.map((level) => {
    // Cannot remove all (or more than all) trades.
    if (tradeCount === 0 || level >= tradeCount) {
      return skippedLevel(level);
    }

    const removedSum = sum(sortedDesc.slice(0, level));
    const remaining = sortedDesc.slice(level);

    const afterRaw = rawBaseline - removedSum;
    const totalReturnAfter = round4(afterRaw);
    const sharpeAfter = round4(rawSharpe(remaining));

    const flipsToNonPositive = baselinePositive && afterRaw <= 0;

    // Relative / concentration measures need a positive baseline to be
    // meaningful — you cannot take a "share" of a non-positive total.
    let totalReturnDropPct: number | null = null;
    let pnlSharePct: number | null = null;
    let proportionalSharePct: number | null = null;
    let concentrationRatio: number | null = null;

    if (baselinePositive) {
      const pnlShareRaw = (removedSum / rawBaseline) * 100;
      const proportionalShareRaw = (level / tradeCount) * 100;

      totalReturnDropPct = round4(((rawBaseline - afterRaw) / rawBaseline) * 100);
      pnlSharePct = round4(pnlShareRaw);
      proportionalSharePct = round4(proportionalShareRaw);
      concentrationRatio =
        proportionalShareRaw > 0
          ? round4(pnlShareRaw / proportionalShareRaw)
          : null;
    }

    return {
      level,
      removedCount: level,
      computed: true,
      totalReturnAfter,
      sharpeAfter,
      totalReturnDropPct,
      pnlSharePct,
      proportionalSharePct,
      concentrationRatio,
      flipsToNonPositive,
    };
  });

  const notes: string[] = [];
  const flags: OutlierFlag[] = [];

  if (tradeCount === 0) {
    notes.push("no trades");
  } else if (!baselinePositive) {
    notes.push("baseline total return non-positive; concentration not computed");
  }

  // Overall severity:
  //   empty            → "none"
  //   non-positive base → "low" (concentration unassessable; mild caution)
  //   positive base     → max of per-level contributions (none/medium/high)
  let severity: Severity = "none";

  if (tradeCount === 0) {
    severity = "none";
  } else if (!baselinePositive) {
    severity = "low";
    flags.push({
      severity: "low",
      message:
        "Baseline total return is non-positive; concentration ratios could not be computed.",
    });
  } else {
    for (const level of levels) {
      const contribution = levelSeverity(level, highThreshold, mediumThreshold);
      severity = maxSeverity(severity, contribution);

      if (!level.computed) {
        continue;
      }

      if (level.flipsToNonPositive) {
        flags.push({
          severity: "high",
          level: level.level,
          message: `Removing the top ${level.removedCount} trade(s) flips total return from positive to non-positive.`,
        });
        continue;
      }

      if (contribution === "high" || contribution === "medium") {
        flags.push({
          severity: contribution,
          level: level.level,
          message: `Top ${level.removedCount} trade(s) produced ${level.pnlSharePct}% of total P&L — ${level.concentrationRatio}x their proportional share.`,
        });
      }
    }
  }

  // Suggested questions for the eventual report narrative.
  const suggestedQuestions: string[] = [];
  const concentrationFlagged = flags.some(
    (flag) => flag.severity === "high" || flag.severity === "medium"
  );
  const anyFlip = levels.some((level) => level.flipsToNonPositive);

  if (concentrationFlagged) {
    suggestedQuestions.push(
      "Does the edge survive if your best 3 trades are excluded?"
    );
    suggestedQuestions.push(
      "How much of the total return comes from the single largest trade?"
    );
  }
  if (anyFlip) {
    suggestedQuestions.push(
      "Is the strategy still profitable after removing its most extreme winners?"
    );
  }

  return {
    tradeCount,
    baselineTotalReturn,
    baselineSharpe,
    levels,
    severity,
    flags,
    suggestedQuestions,
    notes,
  };
}
