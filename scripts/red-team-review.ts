// Red-Team Backtest Review — manual-pilot CLI.
//
// Reads a backtest file, parses it, runs the full red-flag analysis ONCE, and
// emits three artifacts from that single analysis: a human-readable text report
// (stdout + .txt), a Markdown report (.md), and raw JSON (.json).
//
// Usage:
//   npx tsx scripts/red-team-review.ts <path-to-backtest.csv|json> [--out <dir>] [--name "Strategy Name"]
//
// Dependency-light: Node built-ins + the existing libs only. This file lives in
// scripts/ and is excluded from the Next build.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { parseBacktestText } from "../lib/backtest-parser";
import type { ParsedBacktestMetrics } from "../lib/backtest-parser";
import { analyzeRedFlags } from "../lib/red-flags/summary";
import type { RedFlagSummary } from "../lib/red-flags/summary";
import type { OutlierDependencyResult } from "../lib/red-flags/outlier-dependency";
import type { IsOosSplitResult } from "../lib/red-flags/is-oos-split";

export type ReviewInput = {
  content: string;
  fileName: string; // basename — drives parser (extension) and slug
  sourceFile?: string; // display path; defaults to fileName
  strategyName?: string; // defaults to fileName
  analyzedAt: string; // ISO timestamp (injected for determinism/testability)
};

export type ReportEnvelope = {
  strategyName: string;
  sourceFile: string;
  analyzedAt: string;
  parserMode: ParsedBacktestMetrics["parserMode"];
  tradeCount: number;
  parserMetrics: {
    totalReturn: number;
    rawSharpe: number;
    maxDrawdown: number;
    winRate: number;
  };
  summary: RedFlagSummary;
};

export type ReviewResult = {
  envelope: ReportEnvelope;
  text: string;
  markdown: string;
  json: string;
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtNum(value: unknown, digits = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  return value.toFixed(digits);
}

function sevLabel(severity: string): string {
  return severity.toUpperCase();
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/\.[a-z0-9]+$/i, "") // drop extension
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "review"
  );
}

// Escape a value for a Markdown table cell.
function mdCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

// ---------------------------------------------------------------------------
// Pull the "most damning" sub-results from the single summary (no re-analysis).
// ---------------------------------------------------------------------------

function topThreeConcentration(
  summary: RedFlagSummary
): { ratio: number; share: number } | null {
  if (summary.moduleResults.outlier.status !== "ok") return null;
  const outlier = summary.details.outlier as OutlierDependencyResult | null;
  const level3 = outlier?.levels?.find((level) => level.level === 3);
  if (
    !level3 ||
    !level3.computed ||
    level3.concentrationRatio == null ||
    level3.pnlSharePct == null
  ) {
    return null;
  }
  return { ratio: level3.concentrationRatio, share: level3.pnlSharePct };
}

function oosVsInSample(
  summary: RedFlagSummary
): { isAvg: number; oosAvg: number } | null {
  if (summary.moduleResults.isOos.status !== "ok") return null;
  const isOos = summary.details.isOos as IsOosSplitResult | null;
  if (!isOos || !isOos.computed || !isOos.isSegment || !isOos.oosSegment) {
    return null;
  }
  return {
    isAvg: isOos.isSegment.averageReturn,
    oosAvg: isOos.oosSegment.averageReturn,
  };
}

const DISCLAIMER =
  "This is a stress test of a backtest, not investment advice or a guarantee of future performance.";

// ---------------------------------------------------------------------------
// Human-readable text report
// ---------------------------------------------------------------------------

function buildTextReport(envelope: ReportEnvelope): string {
  const { summary } = envelope;
  const confidence = summary.confidence;
  const lines: string[] = [];
  const rule = "=".repeat(70);
  const thin = "-".repeat(70);

  lines.push(rule);
  lines.push(" RED-TEAM BACKTEST REVIEW");
  lines.push(rule);
  lines.push(` Strategy:    ${envelope.strategyName}`);
  lines.push(` Source file: ${envelope.sourceFile}`);
  lines.push(` Trades:      ${envelope.tradeCount}`);
  lines.push(` Parser mode: ${envelope.parserMode}`);
  lines.push(` Analyzed at: ${envelope.analyzedAt}`);
  lines.push("");

  // Unrecognized-format guard surfaced plainly.
  if (envelope.parserMode === "fallback" && envelope.tradeCount === 0) {
    lines.push(thin);
    lines.push(" FILE FORMAT NOT RECOGNIZED");
    lines.push(thin);
    lines.push(" 0 trades were parsed from this file.");
    lines.push(
      " Expected a CSV with a return/pnl/profit column (header row), or a JSON"
    );
    lines.push(
      " array of numbers / objects with a return|pnl|profit field per trade."
    );
    lines.push("");
  }

  lines.push(thin);
  lines.push(" VERDICT");
  lines.push(thin);
  lines.push(` Overall severity: ${sevLabel(summary.overallSeverity)}`);
  lines.push(` ${summary.headline}`);
  lines.push("");
  lines.push(` Confidence: ${sevLabel(confidence.level)}`);
  if (confidence.reasons.length > 0) {
    for (const reason of confidence.reasons) {
      lines.push(`   - ${reason}`);
    }
  } else {
    lines.push("   - no data-quality concerns");
  }
  if (summary.overallSeverity === "none" && confidence.level !== "high") {
    lines.push("");
    lines.push(
      ` *** CAUTION: "No red flags" at ${sevLabel(
        confidence.level
      )} confidence is NOT a clean bill of health.`
    );
    lines.push("     The sample/data is too thin to trust this result. ***");
  }
  lines.push("");

  lines.push(thin);
  lines.push(" RED FLAGS");
  lines.push(thin);
  if (summary.flags.length === 0) {
    lines.push(" No red flags were detected by any module.");
  } else {
    for (const flag of summary.flags) {
      const tag = `[${sevLabel(flag.severity)}]`.padEnd(9);
      lines.push(` ${tag} (${flag.module}) ${flag.message}`);
    }
  }
  lines.push("");

  lines.push(thin);
  lines.push(" DATA QUALITY");
  lines.push(thin);
  lines.push(` Trades:             ${confidence.tradeCount}`);
  lines.push(` Timestamps present: ${confidence.hasTimestamps ? "yes" : "no"}`);
  lines.push(` Ordering basis:     ${confidence.orderingBasis}`);
  lines.push(` Zero-return trades: ${confidence.zeroReturnTradeCount}`);
  if (summary.notes.length > 0) {
    lines.push(" Notes:");
    for (const note of summary.notes) {
      lines.push(`   - ${note}`);
    }
  }
  lines.push("");

  lines.push(thin);
  lines.push(" KEY METRICS");
  lines.push(thin);
  lines.push(` Total return:  ${fmtNum(envelope.parserMetrics.totalReturn)}`);
  lines.push(` Raw Sharpe:    ${fmtNum(envelope.parserMetrics.rawSharpe)}`);
  lines.push(` Max drawdown:  ${fmtNum(envelope.parserMetrics.maxDrawdown)}`);
  lines.push(` Win rate:      ${fmtNum(envelope.parserMetrics.winRate)}%`);
  const concentration = topThreeConcentration(summary);
  if (concentration) {
    lines.push(
      ` Top-3 P&L concentration: ${fmtNum(
        concentration.ratio
      )}x proportional share (${fmtNum(concentration.share)}% of total P&L)`
    );
  }
  const oos = oosVsInSample(summary);
  if (oos) {
    lines.push(
      ` OOS vs IS avg return:    ${fmtNum(oos.oosAvg)} (out-of-sample) vs ${fmtNum(
        oos.isAvg
      )} (in-sample)`
    );
  }
  lines.push("");

  lines.push(thin);
  lines.push(" QUESTIONS A REVIEWER WOULD ASK");
  lines.push(thin);
  if (summary.suggestedQuestions.length === 0) {
    lines.push(" (none)");
  } else {
    summary.suggestedQuestions.forEach((question, index) => {
      lines.push(` ${index + 1}. ${question}`);
    });
  }
  lines.push("");

  lines.push(thin);
  lines.push(` ${DISCLAIMER}`);
  lines.push(rule);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Markdown report
// ---------------------------------------------------------------------------

function buildMarkdownReport(envelope: ReportEnvelope): string {
  const { summary } = envelope;
  const confidence = summary.confidence;
  const out: string[] = [];

  out.push(`# Red-Team Backtest Review — ${envelope.strategyName}`);
  out.push("");
  out.push(
    `**Source:** \`${envelope.sourceFile}\` · **Trades:** ${envelope.tradeCount} · ` +
      `**Parser:** ${envelope.parserMode} · **Analyzed:** ${envelope.analyzedAt}`
  );
  out.push("");

  if (envelope.parserMode === "fallback" && envelope.tradeCount === 0) {
    out.push(
      "> **File format not recognized — 0 trades parsed.** Expected a CSV with a " +
        "`return`/`pnl`/`profit` column, or a JSON array of numbers / objects with a " +
        "`return`|`pnl`|`profit` field."
    );
    out.push("");
  }

  out.push("## Verdict");
  out.push("");
  out.push(`**Overall severity: ${sevLabel(summary.overallSeverity)}**`);
  out.push("");
  out.push(`> ${summary.headline}`);
  out.push("");
  out.push(`**Confidence: ${sevLabel(confidence.level)}**`);
  out.push("");
  if (confidence.reasons.length > 0) {
    for (const reason of confidence.reasons) {
      out.push(`- ${reason}`);
    }
  } else {
    out.push("- no data-quality concerns");
  }
  if (summary.overallSeverity === "none" && confidence.level !== "high") {
    out.push("");
    out.push(
      `> ⚠ **Caution:** "No red flags" at ${sevLabel(
        confidence.level
      )} confidence is **not** a clean bill of health — the sample/data is too thin to trust.`
    );
  }
  out.push("");

  out.push("## Red Flags");
  out.push("");
  if (summary.flags.length === 0) {
    out.push("No red flags were detected by any module.");
  } else {
    out.push("| Severity | Module | Finding |");
    out.push("| --- | --- | --- |");
    for (const flag of summary.flags) {
      out.push(
        `| ${sevLabel(flag.severity)} | ${flag.module} | ${mdCell(flag.message)} |`
      );
    }
  }
  out.push("");

  out.push("## Data Quality");
  out.push("");
  out.push("| Field | Value |");
  out.push("| --- | --- |");
  out.push(`| Trades | ${confidence.tradeCount} |`);
  out.push(`| Timestamps present | ${confidence.hasTimestamps ? "yes" : "no"} |`);
  out.push(`| Ordering basis | ${confidence.orderingBasis} |`);
  out.push(`| Zero-return trades | ${confidence.zeroReturnTradeCount} |`);
  out.push("");
  if (summary.notes.length > 0) {
    out.push("Notes:");
    out.push("");
    for (const note of summary.notes) {
      out.push(`- ${mdCell(note)}`);
    }
    out.push("");
  }

  out.push("## Key Metrics");
  out.push("");
  out.push("| Metric | Value |");
  out.push("| --- | --- |");
  out.push(`| Total return | ${fmtNum(envelope.parserMetrics.totalReturn)} |`);
  out.push(`| Raw Sharpe | ${fmtNum(envelope.parserMetrics.rawSharpe)} |`);
  out.push(`| Max drawdown | ${fmtNum(envelope.parserMetrics.maxDrawdown)} |`);
  out.push(`| Win rate | ${fmtNum(envelope.parserMetrics.winRate)}% |`);
  const concentration = topThreeConcentration(summary);
  if (concentration) {
    out.push(
      `| Top-3 P&L concentration | ${fmtNum(
        concentration.ratio
      )}x proportional share (${fmtNum(concentration.share)}% of P&L) |`
    );
  }
  const oos = oosVsInSample(summary);
  if (oos) {
    out.push(
      `| OOS vs IS avg return | ${fmtNum(oos.oosAvg)} vs ${fmtNum(oos.isAvg)} |`
    );
  }
  out.push("");

  out.push("## Questions a Reviewer Would Ask");
  out.push("");
  if (summary.suggestedQuestions.length === 0) {
    out.push("_(none)_");
  } else {
    summary.suggestedQuestions.forEach((question, index) => {
      out.push(`${index + 1}. ${question}`);
    });
  }
  out.push("");

  out.push("---");
  out.push(`_${DISCLAIMER}_`);
  out.push("");

  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Core: parse + analyze ONCE, build all three formats from the single summary.
// ---------------------------------------------------------------------------

export function runReview(input: ReviewInput): ReviewResult {
  const parsed = parseBacktestText(input.fileName, input.content);
  const summary = analyzeRedFlags(parsed);

  const envelope: ReportEnvelope = {
    strategyName: input.strategyName ?? input.fileName,
    sourceFile: input.sourceFile ?? input.fileName,
    analyzedAt: input.analyzedAt,
    parserMode: parsed.parserMode,
    tradeCount: parsed.tradeRecords.length,
    parserMetrics: {
      totalReturn: parsed.totalReturn,
      rawSharpe: parsed.sharpeRaw,
      maxDrawdown: parsed.maxDrawdown,
      winRate: parsed.winRate,
    },
    summary,
  };

  return {
    envelope,
    text: buildTextReport(envelope),
    markdown: buildMarkdownReport(envelope),
    json: JSON.stringify(envelope, null, 2),
  };
}

// ---------------------------------------------------------------------------
// CLI wrapper (thin: argv, fs, stdout/stderr, exit codes). Not run on import.
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  file?: string;
  out: string;
  name?: string;
} {
  const args = argv.slice(2);
  let file: string | undefined;
  let out = "./red-team-output";
  let name: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--out") {
      out = args[++i] ?? out;
    } else if (arg === "--name") {
      name = args[++i];
    } else if (!arg.startsWith("--") && file === undefined) {
      file = arg;
    }
  }
  return { file, out, name };
}

export function main(argv: string[]): number {
  const { file, out, name } = parseArgs(argv);

  if (!file) {
    process.stderr.write(
      "Usage: npx tsx scripts/red-team-review.ts <path-to-backtest.csv|json> [--out <dir>] [--name \"Strategy Name\"]\n"
    );
    return 2;
  }

  let content: string;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch (error) {
    process.stderr.write(
      `Error: could not read file "${file}": ${
        error instanceof Error ? error.message : String(error)
      }\n`
    );
    return 2;
  }

  const fileName = path.basename(file);
  const strategyName = name ?? fileName;
  const analyzedAt = new Date().toISOString();

  let review: ReviewResult;
  try {
    review = runReview({
      content,
      fileName,
      sourceFile: file,
      strategyName,
      analyzedAt,
    });
  } catch (error) {
    process.stderr.write(
      `Error: analysis failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`
    );
    return 1;
  }

  // Unrecognized format -> helpful stderr + non-zero, no output files written.
  if (
    review.envelope.parserMode === "fallback" &&
    review.envelope.tradeCount === 0
  ) {
    process.stderr.write(
      `Error: 0 trades parsed from "${file}" — the file format was not recognized.\n` +
        "Expected a CSV with a return/pnl/profit column (header row), or a JSON " +
        "array of numbers / objects with a return|pnl|profit field per trade.\n"
    );
    return 3;
  }

  const slug = slugify(strategyName);
  try {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, `${slug}.txt`), review.text, "utf8");
    fs.writeFileSync(path.join(out, `${slug}.md`), review.markdown, "utf8");
    fs.writeFileSync(path.join(out, `${slug}.json`), review.json, "utf8");
  } catch (error) {
    process.stderr.write(
      `Error: could not write outputs to "${out}": ${
        error instanceof Error ? error.message : String(error)
      }\n`
    );
    return 1;
  }

  process.stdout.write(review.text + "\n");
  process.stdout.write(
    `\nReports written to ${out}/: ${slug}.txt, ${slug}.md, ${slug}.json\n`
  );
  return 0;
}

function isDirectRun(): boolean {
  try {
    const entry = process.argv[1];
    if (!entry) return false;
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  process.exit(main(process.argv));
}
