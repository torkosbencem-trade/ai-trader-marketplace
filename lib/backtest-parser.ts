export type BacktestTrade = {
  index: number;
  return: number;
  timestamp: string | null;
  symbol: string | null;
  side: "long" | "short" | null;
};

export type ParsedBacktestMetrics = {
  detectedRows: number;
  trades: number;
  winRate: number;
  totalReturn: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpe: number;
  sharpeRaw: number;
  parserMode: "csv" | "json" | "fallback";
  equitySeries: number[];
  drawdownSeries: number[];
  tradeRecords: BacktestTrade[];
};

// Candidate column headers / JSON object keys, matched tolerantly (case- and
// underscore-insensitive). Array order defines precedence when several match.
const RETURN_HEADERS = [
  "return",
  "returns",
  "return_%",
  "return%",
  "return_percent",
  "return_pct",
  "pnl",
  "pnl_%",
  "pnl%",
  "pnl_percent",
  "pnl_pct",
  "profit",
  "profit_%",
  "profit%",
  "profit_percent",
  "profit_pct",
  "percent",
  "pct",
];

const TIMESTAMP_HEADERS = [
  "date",
  "time",
  "datetime",
  "timestamp",
  "entry_time",
  "exit_time",
  "close_time",
  "opened_at",
  "closed_at",
];

const SYMBOL_HEADERS = ["symbol", "ticker", "instrument", "pair", "asset"];

const SIDE_HEADERS = ["side", "direction", "type"];

function normalizeText(text: string) {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const cleaned = value
    .replace("%", "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "")
    .trim();

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

// Normalize a header / key for tolerant matching: lowercase, drop underscores.
function normalizeKey(value: string) {
  return value.toLowerCase().replace(/_/g, "");
}

// Strip surrounding quotes and whitespace from a raw cell/value.
function cleanCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim().replace(/^"+|"+$/g, "").trim();
}

// Parse a date/time cell or value into an ISO 8601 string, or null when absent
// or unparseable. Pure integer values are treated as epoch timestamps
// (>= 1e12 -> milliseconds, >= 1e9 -> seconds); smaller integers such as a bare
// YYYYMMDD or year are ambiguous, so we decline (null) rather than guess.
function toIsoTimestamp(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value >= 1e12) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    if (value >= 1e9) {
      const date = new Date(value * 1000);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    return null;
  }

  const text = cleanCell(value);
  if (!text) {
    return null;
  }

  if (/^-?\d+$/.test(text)) {
    return toIsoTimestamp(Number(text));
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Clean a symbol / ticker cell or value, or null if absent.
function toSymbol(value: unknown): string | null {
  const text = cleanCell(value);
  return text ? text : null;
}

// Map a side / direction value to "long" | "short", or null if unrecognized.
// Only buy/long and sell/short are recognized; anything else (e.g. an order
// "type" of limit/market) yields null.
function toSide(value: unknown): "long" | "short" | null {
  const text = cleanCell(value).toLowerCase();
  if (text === "buy" || text === "long") {
    return "long";
  }
  if (text === "sell" || text === "short") {
    return "short";
  }
  return null;
}

// First present candidate key in a JSON row object, matched tolerantly.
function pickFromRecord(
  record: Record<string, unknown>,
  candidates: string[]
): unknown {
  const normalized = new Map<string, unknown>();
  for (const [key, value] of Object.entries(record)) {
    const norm = normalizeKey(key);
    if (!normalized.has(norm)) {
      normalized.set(norm, value);
    }
  }
  for (const candidate of candidates) {
    const value = normalized.get(normalizeKey(candidate));
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
}

function calculateMetrics(
  trades: BacktestTrade[],
  parserMode: ParsedBacktestMetrics["parserMode"]
): ParsedBacktestMetrics {
  // Bug fix (a): break-even (0%) trades are NO LONGER dropped — every parsed
  // trade counts. We still guard against non-finite returns (which toNumber
  // never actually produces) so the math stays safe.
  const cleanTrades = trades.filter((trade) => Number.isFinite(trade.return));
  const cleanReturns = cleanTrades.map((trade) => trade.return);
  const tradeCount = cleanReturns.length;

  if (tradeCount === 0) {
    return {
      detectedRows: 0,
      trades: 0,
      winRate: 0,
      totalReturn: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpe: 0,
      sharpeRaw: 0,
      parserMode: "fallback",
      equitySeries: [100, 100, 100, 100, 100, 100],
      drawdownSeries: [0, 0, 0, 0, 0, 0],
      tradeRecords: [],
    };
  }

  // A 0% trade is not a win.
  const wins = cleanReturns.filter((value) => value > 0).length;
  const winRate = (wins / tradeCount) * 100;
  const totalReturn = cleanReturns.reduce((sum, value) => sum + value, 0);
  const averageReturn = totalReturn / tradeCount;

  let equity = 100;
  let peak = 100;
  let maxDrawdown = 0;

  const equitySeries: number[] = [100];
  const drawdownSeries: number[] = [0];

  for (const value of cleanReturns) {
    equity = equity * (1 + value / 100);
    peak = Math.max(peak, equity);

    const drawdown = ((peak - equity) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);

    equitySeries.push(Number(equity.toFixed(2)));
    drawdownSeries.push(Number((-drawdown).toFixed(2)));
  }

  const variance =
    cleanReturns.reduce((sum, value) => {
      return sum + Math.pow(value - averageReturn, 2);
    }, 0) / tradeCount;

  const volatility = Math.sqrt(variance);

  // Existing Sharpe, UNCHANGED: annualized by sqrt(12) and clamped to [0, 4].
  const sharpe =
    volatility > 0 ? (averageReturn / volatility) * Math.sqrt(12) : 0;

  // Bug fix (b): raw per-trade Sharpe = mean / population stddev of trade
  // returns, with NO sqrt(12) annualization and NO clamping, so suspiciously
  // high values stay visible (they are themselves a red flag).
  const sharpeRaw = volatility > 0 ? averageReturn / volatility : 0;

  return {
    detectedRows: tradeCount,
    trades: tradeCount,
    winRate: Number(winRate.toFixed(1)),
    totalReturn: Number(totalReturn.toFixed(2)),
    averageReturn: Number(averageReturn.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    sharpe: Number(Math.max(Math.min(sharpe, 4), 0).toFixed(2)),
    sharpeRaw: Number(sharpeRaw.toFixed(4)),
    parserMode,
    equitySeries,
    drawdownSeries,
    tradeRecords: cleanTrades,
  };
}

export function parseBacktestText(
  fileName: string,
  rawText: string
): ParsedBacktestMetrics {
  const lowerName = fileName.toLowerCase();
  const text = normalizeText(rawText);

  if (lowerName.endsWith(".json")) {
    try {
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed)
        ? parsed
        : parsed.trades ?? parsed.returns ?? [];

      // Behavior change: previously rows whose return parsed to 0 were filtered
      // out. Now every row becomes a trade record (see bug fix (a)).
      const trades: BacktestTrade[] = (rows as unknown[]).map((row, index) => {
        if (typeof row === "number" || typeof row === "string") {
          return {
            index,
            return: toNumber(row),
            timestamp: null,
            symbol: null,
            side: null,
          };
        }

        if (row && typeof row === "object") {
          const record = row as Record<string, unknown>;

          return {
            index,
            // Return extraction kept identical to the previous implementation.
            return: toNumber(
              record.return ??
                record.returns ??
                record.pnl ??
                record.pnlPercent ??
                record.pnl_percent ??
                record.percent ??
                record.profit ??
                record.profitPercent ??
                record.profit_percent
            ),
            timestamp: toIsoTimestamp(pickFromRecord(record, TIMESTAMP_HEADERS)),
            symbol: toSymbol(pickFromRecord(record, SYMBOL_HEADERS)),
            side: toSide(pickFromRecord(record, SIDE_HEADERS)),
          };
        }

        return {
          index,
          return: 0,
          timestamp: null,
          symbol: null,
          side: null,
        };
      });

      return calculateMetrics(trades, "json");
    } catch {
      return calculateMetrics([], "fallback");
    }
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return calculateMetrics([], "fallback");
  }

  const delimiter =
    lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";

  const headers = lines[0]
    .split(delimiter)
    .map((header) =>
      header
        .trim()
        .toLowerCase()
        .replace(/^\uFEFF/, "")
        .replace(/"/g, "")
        .replace(/\s+/g, "_")
    );

  const findHeaderIndex = (candidates: string[]) =>
    headers.findIndex((header) => candidates.includes(header));

  const returnIndex = findHeaderIndex(RETURN_HEADERS);

  if (returnIndex === -1) {
    return calculateMetrics([], "fallback");
  }

  const timestampIndex = findHeaderIndex(TIMESTAMP_HEADERS);
  const symbolIndex = findHeaderIndex(SYMBOL_HEADERS);
  const sideIndex = findHeaderIndex(SIDE_HEADERS);

  // Behavior change: previously rows whose return parsed to 0 were filtered
  // out. Now every data row becomes a trade record (see bug fix (a)).
  const trades: BacktestTrade[] = lines.slice(1).map((line, index) => {
    const cells = line.split(delimiter);
    const cellAt = (cellIndex: number) =>
      cellIndex === -1 ? null : cells[cellIndex];

    return {
      index,
      return: toNumber(cells[returnIndex]),
      timestamp: toIsoTimestamp(cellAt(timestampIndex)),
      symbol: toSymbol(cellAt(symbolIndex)),
      side: toSide(cellAt(sideIndex)),
    };
  });

  return calculateMetrics(trades, "csv");
}
