// In-Sample / Out-of-Sample (IS/OOS) Split — a "red flag" module.
//
// Splits the trade series into an in-sample (earlier) and out-of-sample (later)
// portion and measures whether the edge degrades out of sample — the classic
// overfitting tell.
//
// Unlike the outlier module, this needs per-trade RECORDS, not just returns:
// the ordering basis depends on timestamps. Callers pass
// `metrics.tradeRecords.map((t) => ({ return: t.return, timestamp: t.timestamp }))`.

export type Severity = "none" | "low" | "medium" | "high";

export type TradeInput = {
  return: number;
  timestamp: string | null;
};

export type SegmentMetrics = {
  count: number;
  totalReturn: number;
  averageReturn: number;
  winRate: number;
  rawSharpe: number;
};

export type IsOosFlag = {
  severity: string;
  message: string;
};

export type IsOosSplitResult = {
  tradeCount: number;
  orderingBasis: "chronological" | "file-order";
  computed: boolean;
  skipReason?: string;
  splitFraction: number;
  isSegment: SegmentMetrics | null;
  oosSegment: SegmentMetrics | null;
  avgReturnDeltaPct: number | null;
  sharpeDelta: number | null;
  winRateDelta: number | null;
  oosWentNegative: boolean;
  severity: Severity;
  flags: IsOosFlag[];
  suggestedQuestions: string[];
  notes: string[];
};

export type IsOosOptions = {
  fraction?: number;
  minSegmentTrades?: number;
};

export const DEFAULT_IS_FRACTION = 0.7;

// Pilot-stage compromise: 3 trades per segment is the bare minimum that lets a
// 70/30 split of ~10 trades be evaluated at all. It is statistically weak —
// production use should raise this to 5+ (a 70/30 split then needs ~17 trades).
export const MIN_SEGMENT_TRADES = 3;

export const AVG_RETURN_DELTA_HIGH_PCT = -50;
export const AVG_RETURN_DELTA_MEDIUM_PCT = -25;

const NOTE_NO_TIMESTAMPS =
  "no timestamps; OOS split based on file order only (weaker guarantee).";
const NOTE_PARTIAL_TIMESTAMPS =
  "mixed/partial timestamps; using file order — OOS split is weaker without reliable timestamps.";
const NOTE_NO_TRADES = "no trades";

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
// when undefined (empty input or zero variance).
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

function isValidTimestamp(timestamp: string | null): boolean {
  if (timestamp === null || timestamp === "") {
    return false;
  }
  return !Number.isNaN(new Date(timestamp).getTime());
}

// Returns the per-trade returns in evaluation order, plus the ordering basis
// and any data-quality note about that basis.
//   - all trades timestamped  -> sort ascending by time ("chronological")
//   - some but not all         -> file order (a partial sort is worse), note
//   - none                     -> file order, note
function determineOrder(trades: TradeInput[]): {
  orderedReturns: number[];
  orderingBasis: "chronological" | "file-order";
  note: string | null;
} {
  const validCount = trades.filter((t) => isValidTimestamp(t.timestamp)).length;

  if (trades.length > 0 && validCount === trades.length) {
    const ordered = [...trades].sort(
      (a, b) =>
        new Date(a.timestamp as string).getTime() -
        new Date(b.timestamp as string).getTime()
    );
    return {
      orderedReturns: ordered.map((t) => t.return),
      orderingBasis: "chronological",
      note: null,
    };
  }

  // File-order fallback (preserves the array order exactly).
  const note =
    validCount > 0 ? NOTE_PARTIAL_TIMESTAMPS : NOTE_NO_TIMESTAMPS;

  return {
    orderedReturns: trades.map((t) => t.return),
    orderingBasis: "file-order",
    note,
  };
}

function segmentMetrics(returns: number[]): SegmentMetrics | null {
  const count = returns.length;
  if (count === 0) {
    return null;
  }
  const totalReturn = sum(returns);
  const wins = returns.filter((value) => value > 0).length;
  return {
    count,
    totalReturn: round4(totalReturn),
    averageReturn: round4(totalReturn / count),
    winRate: round4((wins / count) * 100),
    rawSharpe: round4(rawSharpe(returns)),
  };
}

export function analyzeIsOosSplit(
  trades: TradeInput[],
  options: IsOosOptions = {}
): IsOosSplitResult {
  // Defensive option handling so the public API upholds the "never emit
  // NaN/Infinity" invariant even under misuse:
  //  - a non-finite fraction falls back to the default;
  //  - minSegmentTrades is floored at 1 (and defaulted on non-finite) so a
  //    "computed" split can never contain an empty segment, which would
  //    otherwise divide by zero internally.
  const fraction =
    typeof options.fraction === "number" && Number.isFinite(options.fraction)
      ? options.fraction
      : DEFAULT_IS_FRACTION;
  const minSegmentTrades = Number.isFinite(options.minSegmentTrades)
    ? Math.max(1, Math.floor(options.minSegmentTrades as number))
    : MIN_SEGMENT_TRADES;

  // Only finite returns participate — defends against NaN/Infinity in input.
  const cleanTrades = trades.filter((t) => Number.isFinite(t.return));
  const tradeCount = cleanTrades.length;

  const notes: string[] = [];
  const flags: IsOosFlag[] = [];
  const suggestedQuestions: string[] = [];

  // Empty is its own well-formed terminal state (severity "none", not "low").
  if (tradeCount === 0) {
    notes.push(NOTE_NO_TRADES);
    return {
      tradeCount: 0,
      orderingBasis: "file-order",
      computed: false,
      skipReason: NOTE_NO_TRADES,
      splitFraction: fraction,
      isSegment: null,
      oosSegment: null,
      avgReturnDeltaPct: null,
      sharpeDelta: null,
      winRateDelta: null,
      oosWentNegative: false,
      severity: "none",
      flags,
      suggestedQuestions,
      notes,
    };
  }

  const { orderedReturns, orderingBasis, note } = determineOrder(cleanTrades);
  if (note) {
    notes.push(note);
  }

  // Clamp to [0, tradeCount] so counts stay consistent with the slices and can
  // never go negative on an out-of-range fraction.
  const isCount = Math.min(
    tradeCount,
    Math.max(0, Math.floor(tradeCount * fraction))
  );
  const oosCount = tradeCount - isCount;

  const isReturns = orderedReturns.slice(0, isCount);
  const oosReturns = orderedReturns.slice(isCount);

  // Segments are always reported (counts + metrics) when non-empty, even if the
  // split is too small to trust — so callers still see the counts.
  const isSegment = segmentMetrics(isReturns);
  const oosSegment = segmentMetrics(oosReturns);

  // OR guard: skip if EITHER segment is too small (statistically correct).
  const computed = isCount >= minSegmentTrades && oosCount >= minSegmentTrades;

  if (!computed) {
    flags.push({
      severity: "low",
      message: `Sample too small for a reliable IS/OOS split: ${isCount} in-sample / ${oosCount} out-of-sample (need >= ${minSegmentTrades} each).`,
    });

    return {
      tradeCount,
      orderingBasis,
      computed: false,
      skipReason: `segment below minimum size (need >= ${minSegmentTrades} trades per segment)`,
      splitFraction: fraction,
      isSegment,
      oosSegment,
      avgReturnDeltaPct: null,
      sharpeDelta: null,
      winRateDelta: null,
      oosWentNegative: false,
      severity: "low",
      flags,
      suggestedQuestions,
      notes,
    };
  }

  // Computed path — both segments are present and adequately sized.
  const isAvg = sum(isReturns) / isReturns.length;
  const oosAvg = sum(oosReturns) / oosReturns.length;
  const isSharpe = rawSharpe(isReturns);
  const oosSharpe = rawSharpe(oosReturns);
  const isWinRate = (isReturns.filter((v) => v > 0).length / isReturns.length) * 100;
  const oosWinRate =
    (oosReturns.filter((v) => v > 0).length / oosReturns.length) * 100;

  // Relative degradation needs a non-zero IS average to divide by.
  const avgReturnDeltaPct =
    isAvg !== 0
      ? round4(((oosAvg - isAvg) / Math.abs(isAvg)) * 100)
      : null;
  const sharpeDelta = round4(oosSharpe - isSharpe);
  const winRateDelta = round4(oosWinRate - isWinRate);
  const oosWentNegative = isAvg > 0 && oosAvg <= 0;

  // Severity.
  let severity: Severity = "none";
  if (oosWentNegative) {
    severity = "high";
    flags.push({
      severity: "high",
      message: `Out-of-sample average return turned non-positive (${round4(
        oosAvg
      )}) while in-sample was positive (${round4(
        isAvg
      )}) — the edge does not persist out of sample.`,
    });
  } else if (
    avgReturnDeltaPct !== null &&
    avgReturnDeltaPct <= AVG_RETURN_DELTA_HIGH_PCT
  ) {
    severity = "high";
    flags.push({
      severity: "high",
      message: `Out-of-sample average return degraded ${avgReturnDeltaPct}% versus in-sample (>= 50% drop).`,
    });
  } else if (
    avgReturnDeltaPct !== null &&
    avgReturnDeltaPct <= AVG_RETURN_DELTA_MEDIUM_PCT
  ) {
    severity = "medium";
    flags.push({
      severity: "medium",
      message: `Out-of-sample average return degraded ${avgReturnDeltaPct}% versus in-sample (>= 25% drop).`,
    });
  }

  if (severity === "high" || severity === "medium") {
    suggestedQuestions.push(
      "Does the edge survive on the most recent out-of-sample trades it wasn't fit to?"
    );
    suggestedQuestions.push(
      "Was any parameter tuned using data from the out-of-sample period?"
    );
  }
  if (oosWentNegative) {
    suggestedQuestions.push(
      "Why does the average return turn negative out of sample?"
    );
  }

  return {
    tradeCount,
    orderingBasis,
    computed: true,
    splitFraction: fraction,
    isSegment,
    oosSegment,
    avgReturnDeltaPct,
    sharpeDelta,
    winRateDelta,
    oosWentNegative,
    severity,
    flags,
    suggestedQuestions,
    notes,
  };
}
