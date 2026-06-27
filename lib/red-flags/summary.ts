// Red Flag Summary — orchestration layer.
//
// Runs the individual red-flag modules on one parsed backtest and aggregates
// their findings into a single readable verdict: an overall severity (the
// weakest-link MAX across modules), a flat severity-sorted flag list that keeps
// the WHY, a SEPARATE data-quality/confidence signal, and the merged reviewer
// questions. Robustness is a feature: a module that throws or returns garbage is
// recorded as "errored" and EXCLUDED from the verdict (never silently treated as
// "all clear"), and analyzeRedFlags never throws for any input.

import {
  analyzeOutlierDependency,
  type OutlierOptions,
  type OutlierDependencyResult,
} from "./outlier-dependency";
import {
  analyzeIsOosSplit,
  type IsOosOptions,
  type IsOosSplitResult,
  type TradeInput,
} from "./is-oos-split";
import type { ParsedBacktestMetrics, BacktestTrade } from "../backtest-parser";

export type Severity = "none" | "low" | "medium" | "high";
export type ConfidenceLevel = "high" | "medium" | "low";

export type SummaryFlag = {
  severity: Severity;
  module: string;
  message: string;
  level?: number;
};

export type ModuleResult = {
  status: "ok" | "errored";
  severity?: Severity;
  error?: string;
};

export type ConfidenceBlock = {
  level: ConfidenceLevel;
  tradeCount: number;
  hasTimestamps: boolean;
  orderingBasis: "chronological" | "file-order";
  zeroReturnTradeCount: number;
  reasons: string[];
};

export type RedFlagSummary = {
  overallSeverity: Severity;
  headline: string;
  flags: SummaryFlag[];
  moduleResults: { outlier: ModuleResult; isOos: ModuleResult };
  confidence: ConfidenceBlock;
  suggestedQuestions: string[];
  notes: string[];
  details: { outlier: unknown | null; isOos: unknown | null };
};

export type SummaryOptions = {
  outlier?: OutlierOptions;
  isOos?: IsOosOptions;
  // Dependency injection (testing / customization). Default to the real modules.
  analyzeOutlierFn?: (
    returns: number[],
    options?: OutlierOptions
  ) => OutlierDependencyResult;
  analyzeIsOosFn?: (
    trades: TradeInput[],
    options?: IsOosOptions
  ) => IsOosSplitResult;
};

export const MIN_TRADES_FOR_CONFIDENCE = 30;
export const LOW_CONFIDENCE_TRADE_COUNT = 10;
export const ZERO_RETURN_RATIO_THRESHOLD = 0.1;
export const MAX_SUGGESTED_QUESTIONS = 8;

const SEVERITY_RANK: Record<Severity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function isSeverity(value: unknown): value is Severity {
  return (
    value === "none" ||
    value === "low" ||
    value === "medium" ||
    value === "high"
  );
}

// MAX across the assessed module severities (weakest-link rule). Empty -> none.
function maxSeverity(values: Severity[]): Severity {
  return values.reduce<Severity>(
    (acc, value) => (SEVERITY_RANK[value] > SEVERITY_RANK[acc] ? value : acc),
    "none"
  );
}

// Lower (never raise) a confidence level toward a cap.
function capConfidence(
  current: ConfidenceLevel,
  cap: ConfidenceLevel
): ConfidenceLevel {
  return CONFIDENCE_RANK[cap] < CONFIDENCE_RANK[current] ? cap : current;
}

function getRecords(metrics: ParsedBacktestMetrics): BacktestTrade[] {
  const tradeRecords = (metrics as { tradeRecords?: unknown })?.tradeRecords;
  if (!Array.isArray(tradeRecords)) {
    return [];
  }
  return tradeRecords.filter(
    (record): record is BacktestTrade =>
      Boolean(record) && typeof record === "object"
  );
}

type ModuleRun<T> =
  | { status: "ok"; result: T; severity: Severity }
  | { status: "errored"; error: string };

// Run a module behind a try/catch and validate it returned a well-formed result
// (an object carrying a valid severity). Anything else -> "errored".
function runModule<T>(label: string, fn: () => T): ModuleRun<T> {
  try {
    const result = fn();
    if (!result || typeof result !== "object") {
      return {
        status: "errored",
        error: `${label} returned a malformed result (not an object).`,
      };
    }
    const candidate = result as Record<string, unknown>;
    const severity = candidate.severity;
    // A result is trusted only if it carries a valid severity AND its collection
    // fields are arrays (or absent). Garbage that happens to include a valid
    // severity is treated as errored, not silently trusted — this also upholds
    // the never-throw guarantee (a non-array flags/notes/questions would
    // otherwise crash collection downstream).
    const collectionsWellFormed = ["flags", "notes", "suggestedQuestions"].every(
      (key) => candidate[key] === undefined || Array.isArray(candidate[key])
    );
    if (!isSeverity(severity) || !collectionsWellFormed) {
      return {
        status: "errored",
        error: `${label} returned a malformed result (missing/invalid severity or non-array flags/notes/questions).`,
      };
    }
    return { status: "ok", result, severity };
  } catch (error) {
    return {
      status: "errored",
      error:
        error instanceof Error
          ? error.message
          : `${label} threw a non-Error value.`,
    };
  }
}

function computeConfidence(args: {
  tradeCount: number;
  hasTimestamps: boolean;
  zeroReturnTradeCount: number;
  orderingBasis: "chronological" | "file-order";
}): ConfidenceBlock {
  const { tradeCount, hasTimestamps, zeroReturnTradeCount, orderingBasis } =
    args;

  const reasons: string[] = [];
  let level: ConfidenceLevel = "high";

  if (tradeCount < LOW_CONFIDENCE_TRADE_COUNT) {
    level = capConfidence(level, "low");
    reasons.push(`only ${tradeCount} trades — very small sample`);
  } else if (tradeCount < MIN_TRADES_FOR_CONFIDENCE) {
    level = capConfidence(level, "medium");
    reasons.push(`only ${tradeCount} trades — small sample`);
  }

  if (!hasTimestamps) {
    level = capConfidence(level, "medium");
    reasons.push("no timestamps — OOS split weaker");
  }

  const zeroRatio = tradeCount > 0 ? zeroReturnTradeCount / tradeCount : 0;
  if (zeroRatio > ZERO_RETURN_RATIO_THRESHOLD) {
    level = capConfidence(level, "medium");
    reasons.push(
      `${zeroReturnTradeCount} of ${tradeCount} trades are exactly 0.00% — possible blank/garbage rows`
    );
  }

  return {
    level,
    tradeCount,
    hasTimestamps,
    orderingBasis,
    zeroReturnTradeCount,
    reasons,
  };
}

function buildHeadline(
  severity: Severity,
  confidence: ConfidenceBlock,
  assessedCount: number
): string {
  if (assessedCount === 0) {
    return "Could not assess: both red-flag checks failed to run.";
  }

  if (severity === "none") {
    if (confidence.tradeCount === 0) {
      return "No data: there are no trades to analyze, so no red flags could be assessed.";
    }
    if (confidence.level === "high") {
      return "No red flags detected, and high confidence in the result.";
    }
    if (confidence.level === "medium") {
      return "No red flags detected, but only medium confidence — interpret with some caution.";
    }
    return "No red flags detected, but low confidence — the sample is too small to trust.";
  }

  let base: string;
  if (severity === "high") {
    base =
      "High risk: this backtest has serious red flags that should be resolved before trading it live.";
  } else if (severity === "medium") {
    base =
      "Moderate risk: this backtest has red flags worth investigating before trading it live.";
  } else {
    base = "Low risk: only minor red flags or data-quality caveats were found.";
  }

  if (confidence.level !== "high") {
    base += ` Confidence in this assessment is ${confidence.level}.`;
  }
  return base;
}

function collectFlags(
  outlierRun: ModuleRun<OutlierDependencyResult>,
  isOosRun: ModuleRun<IsOosSplitResult>
): SummaryFlag[] {
  const flags: SummaryFlag[] = [];

  if (outlierRun.status === "ok") {
    for (const flag of outlierRun.result.flags ?? []) {
      const severity = isSeverity(flag.severity) ? flag.severity : "low";
      const summaryFlag: SummaryFlag = {
        severity,
        module: "outlier",
        message: String(flag.message ?? ""),
      };
      if (typeof flag.level === "number" && Number.isFinite(flag.level)) {
        summaryFlag.level = flag.level;
      }
      flags.push(summaryFlag);
    }
  }

  if (isOosRun.status === "ok") {
    for (const flag of isOosRun.result.flags ?? []) {
      const severity = isSeverity(flag.severity) ? flag.severity : "low";
      flags.push({
        severity,
        module: "isOos",
        message: String(flag.message ?? ""),
      });
    }
  }

  // Sort high -> low (stable for equal severities).
  flags.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  return flags;
}

export function analyzeRedFlags(
  metrics: ParsedBacktestMetrics,
  options: SummaryOptions = {}
): RedFlagSummary {
  const outlierFn = options.analyzeOutlierFn ?? analyzeOutlierDependency;
  const isOosFn = options.analyzeIsOosFn ?? analyzeIsOosSplit;

  const records = getRecords(metrics);

  // Confidence inputs are derived defensively from the records, independent of
  // whether either module succeeds.
  const returns = records.map((record) => record.return);
  const finiteReturns = returns.filter(
    (value) => typeof value === "number" && Number.isFinite(value)
  );
  const tradeCount = finiteReturns.length;
  const zeroReturnTradeCount = finiteReturns.filter(
    (value) => value === 0
  ).length;
  const hasTimestamps = records.some((record) => record.timestamp != null);

  const outlierRun = runModule("Outlier-dependency module", () =>
    outlierFn(returns, options.outlier)
  );
  const isOosRun = runModule("IS/OOS-split module", () =>
    isOosFn(
      records.map((record) => ({
        return: record.return,
        timestamp: record.timestamp ?? null,
      })),
      options.isOos
    )
  );

  const notes: string[] = [];
  if (outlierRun.status === "errored") {
    notes.push(
      `Outlier-dependency module failed and was excluded from the overall verdict: ${outlierRun.error}`
    );
  }
  if (isOosRun.status === "errored") {
    notes.push(
      `IS/OOS-split module failed and was excluded from the overall verdict: ${isOosRun.error}`
    );
  }

  const moduleResults = {
    outlier:
      outlierRun.status === "ok"
        ? { status: "ok" as const, severity: outlierRun.severity }
        : { status: "errored" as const, error: outlierRun.error },
    isOos:
      isOosRun.status === "ok"
        ? { status: "ok" as const, severity: isOosRun.severity }
        : { status: "errored" as const, error: isOosRun.error },
  };

  // Overall severity = MAX over the modules that actually ran (errored excluded).
  const assessed: Severity[] = [];
  if (outlierRun.status === "ok") assessed.push(outlierRun.severity);
  if (isOosRun.status === "ok") assessed.push(isOosRun.severity);
  const overallSeverity = maxSeverity(assessed);

  const flags = collectFlags(outlierRun, isOosRun);

  const orderingBasis: "chronological" | "file-order" =
    isOosRun.status === "ok" &&
    (isOosRun.result.orderingBasis === "chronological" ||
      isOosRun.result.orderingBasis === "file-order")
      ? isOosRun.result.orderingBasis
      : "file-order";

  const confidence = computeConfidence({
    tradeCount,
    hasTimestamps,
    zeroReturnTradeCount,
    orderingBasis,
  });

  const headline = buildHeadline(overallSeverity, confidence, assessed.length);

  // Merge + de-duplicate reviewer questions, capped.
  const mergedQuestions: string[] = [];
  if (outlierRun.status === "ok") {
    mergedQuestions.push(...(outlierRun.result.suggestedQuestions ?? []));
  }
  if (isOosRun.status === "ok") {
    mergedQuestions.push(...(isOosRun.result.suggestedQuestions ?? []));
  }
  const seenQuestions = new Set<string>();
  const suggestedQuestions: string[] = [];
  for (const question of mergedQuestions) {
    if (typeof question === "string" && !seenQuestions.has(question)) {
      seenQuestions.add(question);
      suggestedQuestions.push(question);
    }
  }

  // Surface module notes alongside any error notes (de-duplicated).
  const moduleNotes: string[] = [];
  if (outlierRun.status === "ok") {
    moduleNotes.push(...(outlierRun.result.notes ?? []));
  }
  if (isOosRun.status === "ok") {
    moduleNotes.push(...(isOosRun.result.notes ?? []));
  }
  for (const note of moduleNotes) {
    if (typeof note === "string" && !notes.includes(note)) {
      notes.push(note);
    }
  }

  return {
    overallSeverity,
    headline,
    flags,
    moduleResults,
    confidence,
    suggestedQuestions: suggestedQuestions.slice(0, MAX_SUGGESTED_QUESTIONS),
    notes,
    details: {
      outlier: outlierRun.status === "ok" ? outlierRun.result : null,
      isOos: isOosRun.status === "ok" ? isOosRun.result : null,
    },
  };
}
