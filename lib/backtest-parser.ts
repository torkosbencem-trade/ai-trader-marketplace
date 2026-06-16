export type ParsedBacktestMetrics = {
  detectedRows: number;
  trades: number;
  winRate: number;
  totalReturn: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpe: number;
  parserMode: "csv" | "json" | "fallback";
  equitySeries: number[];
  drawdownSeries: number[];
};

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

function calculateMetrics(
  returns: number[],
  parserMode: ParsedBacktestMetrics["parserMode"]
): ParsedBacktestMetrics {
  const cleanReturns = returns.filter((value) => Number.isFinite(value));
  const trades = cleanReturns.length;

  if (trades === 0) {
    return {
      detectedRows: 0,
      trades: 0,
      winRate: 0,
      totalReturn: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpe: 0,
      parserMode: "fallback",
      equitySeries: [100, 100, 100, 100, 100, 100],
      drawdownSeries: [0, 0, 0, 0, 0, 0],
    };
  }

  const wins = cleanReturns.filter((value) => value > 0).length;
  const winRate = (wins / trades) * 100;
  const totalReturn = cleanReturns.reduce((sum, value) => sum + value, 0);
  const averageReturn = totalReturn / trades;

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
    }, 0) / trades;

  const volatility = Math.sqrt(variance);
  const sharpe =
    volatility > 0 ? (averageReturn / volatility) * Math.sqrt(12) : 0;

  return {
    detectedRows: trades,
    trades,
    winRate: Number(winRate.toFixed(1)),
    totalReturn: Number(totalReturn.toFixed(2)),
    averageReturn: Number(averageReturn.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    sharpe: Number(Math.max(Math.min(sharpe, 4), 0).toFixed(2)),
    parserMode,
    equitySeries,
    drawdownSeries,
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

      const returns = rows
        .map((row: unknown) => {
          if (typeof row === "number" || typeof row === "string") {
            return toNumber(row);
          }

          if (row && typeof row === "object") {
            const record = row as Record<string, unknown>;

            return toNumber(
              record.return ??
                record.returns ??
                record.pnl ??
                record.pnlPercent ??
                record.pnl_percent ??
                record.percent ??
                record.profit ??
                record.profitPercent ??
                record.profit_percent
            );
          }

          return 0;
        })
        .filter((value: number) => value !== 0);

      return calculateMetrics(returns, "json");
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

  const returnIndex = headers.findIndex((header) =>
    [
      "return",
      "returns",
      "return_%",
      "return%",
      "return_percent",
      "pnl",
      "pnl_%",
      "pnl%",
      "pnl_percent",
      "profit",
      "profit_%",
      "profit%",
      "profit_percent",
      "percent",
    ].includes(header)
  );

  if (returnIndex === -1) {
    return calculateMetrics([], "fallback");
  }

  const returns = lines
    .slice(1)
    .map((line) => {
      const cells = line.split(delimiter);
      return toNumber(cells[returnIndex]);
    })
    .filter((value) => value !== 0);

  return calculateMetrics(returns, "csv");
}