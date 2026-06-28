// Pure SVG chart generators for the red-flag review. Data in -> SVG string out.
// No fs, no canvas, no external deps. Every coordinate is finiteness-guarded so
// a degenerate dataset yields a valid (if sparse) SVG, never NaN/Infinity.
//
// Reads the analysis modules' OUTPUTS only — it does not touch their logic.

import type { ParsedBacktestMetrics } from "../backtest-parser";
import type { RedFlagSummary } from "./summary";
import type { OutlierDependencyResult } from "./outlier-dependency";

export const CHART_THEME = {
  bg: "#0a0e14",
  panel: "#0f1620",
  green: "#22d36a",
  cyan: "#3bc5ff",
  red: "#ff4d5e",
  grey: "#5b6776",
  text: "#e7edf4",
  subtle: "#9aa7b5",
  grid: "#1b2430",
  amber: "#f5b342",
  mutedGreen: "#2a6e47",
} as const;

export type ChartOptions = { isSample?: boolean };

export type ReportCardMetrics = {
  totalReturn: number;
  winRate: number;
  rawSharpe?: number;
  maxDrawdown?: number;
};

const T = CHART_THEME;
const W = 1000;
const H = 620;
const FONT =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// --- primitives ------------------------------------------------------------

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function round2(value: number): number {
  const v = finite(value);
  const r = Math.round(v * 100) / 100;
  return Number.isFinite(r) ? r : 0;
}

function fmtNum(value: unknown, digits = 1): string {
  return finite(value).toFixed(digits);
}

function fmtSigned(value: unknown, digits = 1): string {
  const v = finite(value);
  const s = v.toFixed(digits);
  return v > 0 ? `+${s}` : s;
}

// Compact percent: whole number when clean, else one decimal.
function fmtPct(value: unknown): string {
  const r = Math.round(finite(value) * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

// Linear scale guarded against zero-range / non-finite domains (no NaN out).
function linScale(
  dMin: number,
  dMax: number,
  rMin: number,
  rMax: number
): (v: number) => number {
  if (!Number.isFinite(dMin) || !Number.isFinite(dMax) || dMax === dMin) {
    const mid = (rMin + rMax) / 2;
    return () => mid;
  }
  return (v: number) => {
    if (!Number.isFinite(v)) return rMin;
    return rMin + ((v - dMin) / (dMax - dMin)) * (rMax - rMin);
  };
}

function svgOpen(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ` +
    `width="${W}" height="${H}" font-family="${FONT}">` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="${T.bg}"/>`
  );
}

// Watermark (all charts), illustrative tag (sample only), handle (report card).
function chrome(isSample: boolean, handle = false): string {
  let s =
    `<text x="${W - 18}" y="${H - 16}" text-anchor="end" font-size="13" ` +
    `fill="${T.subtle}">StrataOS &#183; Backtest Red-Flag Intelligence</text>`;
  if (handle) {
    s += `<text x="18" y="${H - 16}" font-size="13" fill="${T.subtle}">@StrataOSS</text>`;
  }
  if (isSample) {
    s +=
      `<rect x="${W - 174}" y="14" width="156" height="24" rx="6" fill="none" ` +
      `stroke="${T.grey}"/>` +
      `<text x="${W - 96}" y="30" text-anchor="middle" font-size="12" ` +
      `fill="${T.grey}">illustrative example</text>`;
  }
  return s;
}

function title(text: string): string {
  return `<text x="56" y="52" font-size="30" font-weight="700" fill="${T.text}">${esc(text)}</text>`;
}

// --- equity helpers --------------------------------------------------------

function equityCurve(returns: number[]): number[] {
  const points = [100];
  let equity = 100;
  for (const r of returns) {
    equity = equity * (1 + finite(r) / 100);
    if (!Number.isFinite(equity)) {
      equity = points[points.length - 1]; // guard overflow on extreme returns
    }
    points.push(round2(equity));
  }
  return points;
}

function removeTopN(returns: number[], n: number): number[] {
  const order = returns
    .map((_, i) => i)
    .sort((a, b) => returns[b] - returns[a]);
  const remove = new Set(order.slice(0, n));
  return returns.filter((_, i) => !remove.has(i));
}

// --- chart 1: equity collapse ----------------------------------------------

export function equityCollapseSvg(
  metrics: ParsedBacktestMetrics,
  outlierDetails: OutlierDependencyResult | null,
  options: ChartOptions = {}
): string {
  void outlierDetails; // accepted for signature parity; equity is recomputed
  const isSample = Boolean(options.isSample);

  const records = Array.isArray(metrics?.tradeRecords) ? metrics.tradeRecords : [];
  const returns = records
    .map((r) => finite(r?.return))
    .filter((r) => Number.isFinite(r));

  const provided = Array.isArray(metrics?.equitySeries)
    ? metrics.equitySeries.filter((v) => Number.isFinite(v))
    : [];
  const fullSeries = provided.length >= 2 ? provided : equityCurve(returns);
  const canRemove5 = returns.length >= 6;
  const withoutSeries = canRemove5 ? equityCurve(removeTopN(returns, 5)) : null;

  const padL = 72;
  const padR = 110;
  const padT = 96;
  const padB = 72;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const allVals = [...fullSeries, ...(withoutSeries ?? []), 100];
  const yMin = Math.min(...allVals);
  const yMax = Math.max(...allVals);
  const yScale = linScale(yMin, yMax, padT + plotH, padT);
  const xOf = (i: number, len: number) =>
    linScale(0, Math.max(1, len - 1), padL, padL + plotW)(i);

  const polyline = (series: number[], color: string, marker: string) => {
    const pts = series
      .map((v, i) => `${round2(xOf(i, series.length))},${round2(yScale(v))}`)
      .join(" ");
    return (
      `<polyline ${marker} points="${pts}" fill="none" stroke="${color}" ` +
      `stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`
    );
  };

  const y100 = round2(yScale(100));
  const fullFinal = fullSeries[fullSeries.length - 1] ?? 100;

  let inner = svgOpen();
  inner += `<rect x="${padL - 28}" y="${padT - 36}" width="${plotW + padR + 4}" height="${plotH + 60}" rx="14" fill="${T.panel}"/>`;
  inner += title("Same backtest. Minus its 5 best trades.");
  inner += `<line x1="${padL}" y1="${y100}" x2="${padL + plotW}" y2="${y100}" stroke="${T.grid}" stroke-width="1.5" stroke-dasharray="5 5"/>`;
  inner += `<text x="${padL - 10}" y="${round2(y100 + 4)}" text-anchor="end" font-size="12" fill="${T.subtle}">100</text>`;
  inner += polyline(fullSeries, T.green, 'data-curve="full"');
  inner += `<text x="${padL + plotW + 10}" y="${round2(yScale(fullFinal) - 8)}" font-size="16" font-weight="700" fill="${T.green}">${esc(fmtSigned(fullFinal - 100))}%</text>`;
  inner += `<text x="${padL + plotW + 10}" y="${round2(yScale(fullFinal) + 10)}" font-size="11" fill="${T.subtle}">full</text>`;

  if (withoutSeries) {
    inner += polyline(withoutSeries, T.red, 'data-curve="without-top-5"');
    const wFinal = withoutSeries[withoutSeries.length - 1] ?? 100;
    inner += `<text x="${padL + plotW + 10}" y="${round2(yScale(wFinal) - 8)}" font-size="16" font-weight="700" fill="${T.red}">${esc(fmtSigned(wFinal - 100))}%</text>`;
    inner += `<text x="${padL + plotW + 10}" y="${round2(yScale(wFinal) + 10)}" font-size="11" fill="${T.subtle}">minus top 5</text>`;
  } else {
    inner += `<text x="56" y="${padT + plotH + 40}" font-size="14" fill="${T.subtle}">Fewer than 6 trades — cannot remove the top 5; showing the full curve only.</text>`;
  }

  inner += chrome(isSample, false);
  inner += "</svg>";
  return inner;
}

// --- chart 2: per-trade contribution ---------------------------------------

export function contributionSvg(
  tradeReturns: number[],
  options: ChartOptions = {}
): string {
  const isSample = Boolean(options.isSample);
  const all = (Array.isArray(tradeReturns) ? tradeReturns : [])
    .map((r) => finite(r))
    .filter((r) => Number.isFinite(r));
  const sorted = [...all].sort((a, b) => b - a);
  const n = sorted.length;

  const sumPositive = sorted
    .filter((r) => r > 0)
    .reduce((sum, r) => sum + r, 0);
  const biggest = n > 0 ? sorted[0] : 0;
  const topShare = sumPositive > 0 ? (biggest / sumPositive) * 100 : 0;
  const highConcentration = n >= 2 && biggest > 0 && topShare >= 40;

  const padL = 60;
  const padR = 48;
  const padT = 110;
  const padB = 80;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const posMax = Math.max(0, ...sorted);
  const negMin = Math.min(0, ...sorted);
  const yScale = linScale(negMin, posMax, padT + plotH, padT);
  const yZero = round2(yScale(0));
  const slot = n > 0 ? plotW / n : plotW;
  const barW = Math.max(1, Math.min(42, slot * 0.7));

  let inner = svgOpen();
  inner += `<rect x="${padL - 28}" y="${padT - 50}" width="${plotW + 60}" height="${plotH + 74}" rx="14" fill="${T.panel}"/>`;
  inner += title(
    highConcentration
      ? "One trade carried the whole thing."
      : "Per-trade returns, best to worst."
  );
  inner += `<line x1="${padL}" y1="${yZero}" x2="${padL + plotW}" y2="${yZero}" stroke="${T.grid}" stroke-width="1.5"/>`;

  sorted.forEach((r, i) => {
    const cx = padL + slot * (i + 0.5);
    const xb = round2(cx - barW / 2);
    const yv = round2(yScale(r));
    const yTop = round2(Math.min(yZero, yv));
    const hb = round2(Math.abs(yv - yZero));
    let color: string;
    if (i === 0 && biggest > 0) color = T.cyan;
    else if (i < 5 && r > 0) color = T.green;
    else if (r > 0) color = T.mutedGreen;
    else color = T.red;
    inner += `<rect x="${xb}" y="${yTop}" width="${round2(barW)}" height="${hb}" fill="${color}" rx="2"/>`;
  });

  if (n > 0 && sumPositive > 0 && biggest > 0) {
    const cxText = round2(Math.min(padL + slot * 0.5, padL + plotW - 300));
    inner += `<text x="${cxText}" y="${padT - 16}" font-size="18" font-weight="700" fill="${T.cyan}">1 trade = ${esc(fmtPct(topShare))}% of all profit</text>`;
  }
  if (n === 0) {
    inner += `<text x="56" y="${round2(padT + plotH / 2)}" font-size="16" fill="${T.subtle}">No trades to chart.</text>`;
  }

  inner += chrome(isSample, false);
  inner += "</svg>";
  return inner;
}

// --- chart 3: report card --------------------------------------------------

function isSeverity(v: unknown): v is "none" | "low" | "medium" | "high" {
  return v === "none" || v === "low" || v === "medium" || v === "high";
}

function findLevel(
  outlier: OutlierDependencyResult | null,
  level: number
): { computed: boolean; pnlSharePct: number | null; totalReturnAfter: number | null } | null {
  if (!outlier || !Array.isArray(outlier.levels)) return null;
  return (outlier.levels.find((l) => l && l.level === level) ??
    null) as never;
}

export function reportCardSvg(
  summary: RedFlagSummary,
  parserMetrics: ReportCardMetrics,
  options: ChartOptions = {}
): string {
  const isSample = Boolean(options.isSample);

  const severity = isSeverity(summary?.overallSeverity)
    ? summary.overallSeverity
    : "none";
  const verdictColor =
    severity === "high" ? T.red : severity === "medium" ? T.amber : T.green;

  const confidence = summary?.confidence;
  const confLevel =
    confidence && ["high", "medium", "low"].includes(confidence.level)
      ? confidence.level
      : "low";
  const confColor =
    confLevel === "high" ? T.green : confLevel === "medium" ? T.amber : T.red;

  const outlier = (summary?.details?.outlier ?? null) as OutlierDependencyResult | null;
  const outlierOk = summary?.moduleResults?.outlier?.status === "ok";
  const level1 = outlierOk ? findLevel(outlier, 1) : null;
  const level5 = outlierOk ? findLevel(outlier, 5) : null;
  const topShare =
    level1 && level1.computed && level1.pnlSharePct != null
      ? level1.pnlSharePct
      : null;
  const afterTop5 =
    level5 && level5.computed && level5.totalReturnAfter != null
      ? level5.totalReturnAfter
      : null;
  const tradeCount = finite(confidence?.tradeCount);

  const section = (label: string, y: number) =>
    `<text x="64" y="${y}" font-size="14" font-weight="700" letter-spacing="1.5" fill="${T.subtle}">${esc(label)}</text>`;
  const row = (label: string, value: string, y: number) =>
    `<text x="64" y="${y}" font-size="17" fill="${T.text}">${esc(label)}</text>` +
    `<text x="${W - 64}" y="${y}" text-anchor="end" font-size="17" font-weight="700" fill="${T.text}">${esc(value)}</text>`;

  let inner = svgOpen();
  inner += `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="18" fill="${T.panel}"/>`;
  inner += `<text x="64" y="94" font-size="28" font-weight="700" fill="${T.text}">StrataOS / Backtest Red-Flag Report</text>`;

  // verdict pill (top-right)
  const pillW = 150;
  const pillX = W - 64 - pillW;
  inner += `<rect data-verdict-color="${verdictColor}" x="${pillX}" y="64" width="${pillW}" height="40" rx="20" fill="${verdictColor}"/>`;
  inner += `<text x="${pillX + pillW / 2}" y="90" text-anchor="middle" font-size="16" font-weight="700" fill="${T.bg}">${esc(severity.toUpperCase())}</text>`;

  let y = 156;
  inner += section("WHAT IT LOOKED LIKE", y);
  y += 32;
  inner += row("Win rate", `${fmtNum(parserMetrics?.winRate)}%`, y);
  y += 32;
  inner += row("Total return", `${fmtSigned(parserMetrics?.totalReturn)}%`, y);
  y += 54;

  inner += section("WHAT THE STRESS TEST FOUND", y);
  y += 32;
  if (topShare != null) {
    inner += row("Top trade share of total P&L", `${fmtPct(topShare)}%`, y);
    y += 32;
  }
  if (afterTop5 != null) {
    inner += row(
      "Return after removing top 5 trades",
      `${fmtSigned(afterTop5)}%`,
      y
    );
    y += 32;
  }
  inner += row("Sample size", `${Math.round(tradeCount)} trades`, y);
  y += 54;

  inner += section("CONFIDENCE", y);
  y += 14;
  inner += `<rect x="64" y="${y}" width="118" height="34" rx="17" fill="${confColor}"/>`;
  inner += `<text x="123" y="${y + 23}" text-anchor="middle" font-size="15" font-weight="700" fill="${T.bg}">${esc(confLevel.toUpperCase())}</text>`;
  const reasons = Array.isArray(confidence?.reasons)
    ? confidence.reasons.slice(0, 3)
    : [];
  reasons.forEach((reason, i) => {
    inner += `<text x="200" y="${y + 23 + i * 22}" font-size="14" fill="${T.subtle}">${esc(reason)}</text>`;
  });

  // footer
  inner += `<text x="64" y="${H - 60}" font-size="13" fill="${T.subtle}">A stress test of a backtest — not investment advice, not a guarantee of future performance.</text>`;
  inner += `<text x="${W - 64}" y="${H - 60}" text-anchor="end" font-size="13" font-weight="700" fill="${T.subtle}">@StrataOSS</text>`;
  inner += chrome(isSample, false);
  inner += "</svg>";
  return inner;
}
