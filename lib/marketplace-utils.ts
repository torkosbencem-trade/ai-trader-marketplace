export type AnyRecord = Record<string, unknown>;

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;

  return Math.min(max, Math.max(min, value));
}

export function resolveSettled<T>(
  result: PromiseSettledResult<T>,
  fallback: unknown,
): T {
  return result.status === "fulfilled" ? result.value : (fallback as T);
}

function readPath(source: AnyRecord, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (!isRecord(current)) return undefined;

    current = current[part];
  }

  return current;
}

export function getValue<T = unknown>(
  source: AnyRecord | null | undefined,
  keys: string[],
  fallback: T,
): T {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = key.includes(".") ? readPath(source, key) : source[key];

    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return fallback;
}

export function getString(
  source: AnyRecord | null | undefined,
  keys: string[],
  fallback = "—",
): string {
  const value: unknown = getValue(source, keys, fallback);

  if (typeof value === "string") {
    return value.trim() ? value : fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

export function getNumber(
  source: AnyRecord | null | undefined,
  keys: string[],
  fallback = 0,
): number {
  const value: unknown = getValue(source, keys, fallback);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function getBoolean(
  source: AnyRecord | null | undefined,
  keys: string[],
  fallback = false,
): boolean {
  const value: unknown = getValue(source, keys, fallback);

  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return fallback;
}

export function normalizeObject(
  source: unknown,
  keys: string[] = [],
): AnyRecord {
  if (!isRecord(source)) return {};

  for (const key of keys) {
    const value = source[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return source;
}

export function normalizeConfig(source: unknown): AnyRecord {
  const data = normalizeObject(source, ["config", "data", "result"]);

  return {
    emergency_stop: getBoolean(data, ["emergency_stop", "emergencyStop"], false),
    max_order_usdt: getNumber(data, ["max_order_usdt", "maxOrderUsdt"], 100),
    max_risk_percent: getNumber(data, ["max_risk_percent", "maxRiskPercent"], 1),
    tv_confirmation_required: getBoolean(
      data,
      ["tv_confirmation_required", "tvConfirmationRequired"],
      false,
    ),
    strategy_guard_required: getBoolean(
      data,
      ["strategy_guard_required", "strategyGuardRequired"],
      false,
    ),
    shadow_live_enabled: getBoolean(
      data,
      ["shadow_live_enabled", "shadowLiveEnabled", "enabled"],
      false,
    ),
    ...data,
  };
}

export function normalizeExecutionStatus(source: unknown): AnyRecord {
  const data = normalizeObject(source, ["execution", "status", "data", "result"]);

  return {
    dry_run_only: getBoolean(data, ["dry_run_only", "dryRunOnly"], true),
    real_order_sent: getBoolean(data, ["real_order_sent", "realOrderSent"], false),
    network_request_sent: getBoolean(
      data,
      ["network_request_sent", "networkRequestSent"],
      false,
    ),
    binance_order_sent: getBoolean(
      data,
      ["binance_order_sent", "binanceOrderSent"],
      false,
    ),
    mode: getString(data, ["mode", "execution_mode", "executionMode"], "DRY_RUN_ONLY"),
    ...data,
  };
}

export function normalizePerformance(source: unknown): AnyRecord {
  const data = normalizeObject(source, ["performance", "summary", "data", "result"]);

  return {
    total_pnl: getNumber(data, ["total_pnl", "pnl", "net_pnl", "profit"], 0),
    pnl: getNumber(data, ["pnl", "total_pnl", "net_pnl", "profit"], 0),
    net_pnl: getNumber(data, ["net_pnl", "total_pnl", "pnl", "profit"], 0),
    win_rate: getNumber(data, ["win_rate", "winRate", "success_rate", "accuracy"], 0),
    total_trades: getNumber(data, ["total_trades", "trades", "trade_count"], 0),
    trades: getNumber(data, ["trades", "total_trades", "trade_count"], 0),
    ...data,
  };
}

export function normalizeArray<T = AnyRecord>(source: unknown): T[] {
  if (Array.isArray(source)) return source as T[];

  if (isRecord(source)) {
    for (const key of ["items", "data", "results", "signals", "strategies", "trades", "runs", "logs"]) {
      const value = source[key];

      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
}

export function normalizePercent(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  if (!Number.isFinite(numeric)) return 0;

  if (Math.abs(numeric) <= 1) {
    return numeric * 100;
  }

  return numeric;
}

export function formatPercent(value: unknown, digits = 1): string {
  const percent = normalizePercent(value);

  return `${percent.toFixed(digits)}%`;
}

export function formatInteger(value: unknown): string {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  return Number.isFinite(numeric)
    ? Math.round(numeric).toLocaleString("en-US")
    : "0";
}

export function formatMoney(value: unknown): string {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  if (!Number.isFinite(numeric)) return "$0.00";

  const sign = numeric < 0 ? "-" : "";

  return `${sign}$${Math.abs(numeric).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAbsoluteMoney(value: unknown): string {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  if (!Number.isFinite(numeric)) return "$0.00";

  return `$${Math.abs(numeric).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function getSideTone(side: unknown): Tone {
  const normalized = String(side ?? "").toLowerCase();

  if (["buy", "long"].includes(normalized)) return "success";
  if (["sell", "short"].includes(normalized)) return "danger";

  return "neutral";
}

export function getStatusTone(status: unknown): Tone {
  const normalized = String(status ?? "").toLowerCase();

  if (["ok", "success", "healthy", "running", "active", "passed"].includes(normalized)) {
    return "success";
  }

  if (["warning", "pending", "review"].includes(normalized)) {
    return "warning";
  }

  if (["error", "failed", "danger", "blocked"].includes(normalized)) {
    return "danger";
  }

  return "neutral";
}

export function slugify(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeDecodeURIComponent(value: unknown): string {
  const text = String(value ?? "");

  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export function titleFromSlug(value: unknown): string {
  const decoded = safeDecodeURIComponent(value);

  return decoded
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getRiskTone(risk: unknown): Tone {
  const normalized = String(risk ?? "").toLowerCase();

  if (["low", "safe", "conservative"].includes(normalized)) {
    return "success";
  }

  if (["medium", "moderate", "review"].includes(normalized)) {
    return "warning";
  }

  if (["high", "danger", "risky", "blocked"].includes(normalized)) {
    return "danger";
  }

  return "neutral";
}

export function getStrategySlug(strategy: unknown): string {
  const data = normalizeObject(strategy);

  const explicitSlug = getString(data, ["slug"], "");

  if (explicitSlug) {
    return slugify(explicitSlug);
  }

  const name = getString(data, ["name", "strategy_name", "title"], "");

  if (name) {
    return slugify(name);
  }

  const id = getString(data, ["id", "strategy_id"], "");

  if (id) {
    return slugify(id);
  }

  return "unknown-strategy";
}

export function hasUsableStrategyData(strategy: unknown): boolean {
  const data = normalizeObject(strategy);

  return Boolean(
    getString(data, ["name", "strategy_name", "title"], "") ||
      getString(data, ["id", "strategy_id"], "") ||
      getString(data, ["slug"], ""),
  );
}

export function normalizeStrategies(source: unknown): AnyRecord[] {
  const rows = normalizeArray<AnyRecord>(source);

  return rows.map((row, index) => {
    const strategy = normalizeObject(row);
    const name = getString(
      strategy,
      ["name", "strategy_name", "title"],
      `Strategy ${index + 1}`,
    );

    return {
      ...strategy,
      id: getString(strategy, ["id", "strategy_id"], slugify(name)),
      name,
      slug: getStrategySlug(strategy),
      risk: getString(strategy, ["risk", "risk_tier", "riskTier"], "unknown"),
    };
  });
}

export function normalizeSignals(source: unknown): AnyRecord[] {
  const rows = normalizeArray<AnyRecord>(source);

  return rows.map((row, index) => {
    const signal = normalizeObject(row);

    return {
      ...signal,
      id: getString(signal, ["id", "signal_id"], `signal-${index + 1}`),
      symbol: getString(signal, ["symbol"], "—"),
      side: getString(signal, ["side", "direction"], "—"),
      status: getString(signal, ["status"], "unknown"),
      confidence: getNumber(signal, ["confidence", "score"], 0),
      timestamp: getString(signal, ["timestamp", "created_at"], "—"),
    };
  });
}

export function getConfidenceTone(confidence: unknown): Tone {
  const value = normalizePercent(confidence);

  if (value >= 70) return "success";
  if (value >= 45) return "warning";
  if (value > 0) return "danger";

  return "neutral";
}

export function normalizeTrades(source: unknown): AnyRecord[] {
  const rows = normalizeArray<AnyRecord>(source);

  return rows.map((row, index) => {
    const trade = normalizeObject(row);

    return {
      ...trade,
      id: getString(trade, ["id", "trade_id"], `trade-${index + 1}`),
      symbol: getString(trade, ["symbol"], "—"),
      side: getString(trade, ["side", "direction"], "—"),
      status: getString(trade, ["status"], "simulated"),
      pnl: getNumber(trade, ["pnl", "profit", "net_pnl"], 0),
      win_rate: getNumber(trade, ["win_rate", "winRate"], 0),
      confidence: getNumber(trade, ["confidence", "score"], 0),
      created_at: getString(trade, ["created_at", "timestamp", "time"], "—"),
      timestamp: getString(trade, ["timestamp", "created_at", "time"], "—"),
    };
  });
}

export function normalizeTestRuns(source: unknown): AnyRecord[] {
  const rows = normalizeArray<AnyRecord>(source);

  return rows.map((row, index) => {
    const run = normalizeObject(row);

    return {
      ...run,
      id: getString(run, ["id", "run_id", "test_run_id"], `run-${index + 1}`),
      strategy: getString(run, ["strategy", "strategy_name", "name"], "Unknown strategy"),
      status: getString(run, ["status", "state"], "unknown"),
      symbol: getString(run, ["symbol"], "—"),
      total_pnl: getNumber(run, ["total_pnl", "pnl", "net_pnl", "profit"], 0),
      pnl: getNumber(run, ["pnl", "total_pnl", "net_pnl", "profit"], 0),
      win_rate: getNumber(run, ["win_rate", "winRate", "success_rate"], 0),
      total_trades: getNumber(run, ["total_trades", "trades", "trade_count"], 0),
      trades: getNumber(run, ["trades", "total_trades", "trade_count"], 0),
      started_at: getString(run, ["started_at", "created_at", "timestamp"], "—"),
      created_at: getString(run, ["created_at", "started_at", "timestamp"], "—"),
    };
  });
}

export function normalizeLogs(source: unknown): AnyRecord[] {
  const rows = normalizeArray<AnyRecord>(source);

  return rows.map((row, index) => {
    const log = normalizeObject(row);

    return {
      ...log,
      id: getString(log, ["id", "log_id"], `log-${index + 1}`),
      level: getString(log, ["level", "severity", "status"], "info"),
      message: getString(log, ["message", "detail", "description"], "—"),
      created_at: getString(log, ["created_at", "timestamp", "time"], "—"),
      timestamp: getString(log, ["timestamp", "created_at", "time"], "—"),
    };
  });
}

export function normalizeActiveRun(source: unknown): AnyRecord {
  const runs = normalizeTestRuns(source);

  const active = runs.find((run) => {
    const status = getString(run, ["status", "state"], "").toLowerCase();

    return ["active", "running", "pending", "in_progress"].includes(status);
  });

  return active ?? runs[0] ?? {};
}
