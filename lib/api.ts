import {
  demoBackendHealth,
  demoExecutionStatus,
  demoPerformance,
  demoShadowConfig,
  demoShadowLogs,
  demoShadowPerformance,
  demoShadowTrades,
  demoSignals,
  demoStrategies,
  demoTestRunPerformance,
  demoTestRuns,
  withDemoFallback,
} from "@/lib/demo-data";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const ENABLE_DEMO_FALLBACK =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK !== "false";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type JsonBody = Record<string, unknown> | unknown[] | null;

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: JsonBody;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const method = options.method ?? "GET";

  const response = await fetch(buildUrl(path), {
    method,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers ?? {}),
    },
    body:
      options.body !== undefined && options.body !== null
        ? JSON.stringify(options.body)
        : undefined,
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    const detail =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "detail" in data
          ? String((data as { detail: unknown }).detail)
          : `HTTP ${response.status}`;

    throw new Error(`${method} ${path} failed: ${detail}`);
  }

  return data as T;
}

async function apiFetchWithMethodFallback<T = unknown>(
  path: string,
  methods: HttpMethod[],
  body?: JsonBody
): Promise<T> {
  let lastError: unknown = null;

  for (const method of methods) {
    try {
      return await apiFetch<T>(path, { method, body });
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`${path} failed.`);
}

async function fetchOrDemo<T>(
  path: string,
  fallback: T,
  options: {
    method?: HttpMethod;
    body?: JsonBody;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  try {
    const data = await apiFetch<T>(path, options);

    if (!ENABLE_DEMO_FALLBACK) return data;

    return withDemoFallback(data, fallback);
  } catch (err) {
    if (!ENABLE_DEMO_FALLBACK) {
      throw err;
    }

    console.warn(`Using demo fallback for ${path}:`, err);

    return fallback;
  }
}

async function fetchWithMethodsOrDemo<T>(
  path: string,
  methods: HttpMethod[],
  fallback: T,
  body?: JsonBody
): Promise<T> {
  try {
    const data = await apiFetchWithMethodFallback<T>(path, methods, body);

    if (!ENABLE_DEMO_FALLBACK) return data;

    return withDemoFallback(data, fallback);
  } catch (err) {
    if (!ENABLE_DEMO_FALLBACK) {
      throw err;
    }

    console.warn(`Using demo fallback for ${path}:`, err);

    return fallback;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeArray(
  value: unknown,
  keys: string[] = []
): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(isObject);
  }

  if (isObject(value)) {
    for (const key of keys) {
      const candidate = value[key];

      if (Array.isArray(candidate)) {
        return candidate.filter(isObject);
      }
    }
  }

  return [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStringValue(
  source: Record<string, unknown>,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }

  return fallback;
}

function getStrategySlug(strategy: Record<string, unknown>): string {
  const explicitSlug = getStringValue(strategy, [
    "slug",
    "strategy_slug",
    "strategySlug",
    "id",
    "strategy_id",
  ]);

  if (explicitSlug) return slugify(explicitSlug);

  const name = getStringValue(strategy, [
    "name",
    "title",
    "strategy_name",
    "strategyName",
  ]);

  return slugify(name);
}

export async function getBackendHealth() {
  return fetchOrDemo("/health", demoBackendHealth);
}

export async function getStrategies() {
  return fetchOrDemo("/marketplace/strategies", demoStrategies);
}

export async function getStrategyBySlug(slug: string) {
  const safeSlug = encodeURIComponent(slug);

  try {
    const data = await apiFetch(`/marketplace/strategies/${safeSlug}`);

    if (!ENABLE_DEMO_FALLBACK) return data;

    if (data !== null && data !== undefined) {
      return data;
    }
  } catch {
    // fallback below
  }

  const strategiesResponse = await getStrategies();

  const strategies = normalizeArray(strategiesResponse, [
    "strategies",
    "items",
    "data",
    "results",
  ]);

  const normalizedSlug = slugify(slug);

  const found = strategies.find((strategy) => {
    const strategySlug = getStrategySlug(strategy);

    const nameSlug = slugify(
      getStringValue(strategy, [
        "name",
        "title",
        "strategy_name",
        "strategyName",
      ])
    );

    return strategySlug === normalizedSlug || nameSlug === normalizedSlug;
  });

  return found ?? null;
}

export async function getSignals() {
  return fetchOrDemo("/marketplace/signals", demoSignals);
}

export async function getPerformanceSummary() {
  return fetchOrDemo("/marketplace/performance", demoPerformance);
}

export async function getUserDashboardData() {
  const [strategiesResult, signalsResult, performanceResult] =
    await Promise.allSettled([
      getStrategies(),
      getSignals(),
      getPerformanceSummary(),
    ]);

  const strategies =
    strategiesResult.status === "fulfilled"
      ? normalizeArray(strategiesResult.value, [
          "strategies",
          "items",
          "data",
          "results",
        ])
      : demoStrategies;

  const signals =
    signalsResult.status === "fulfilled"
      ? normalizeArray(signalsResult.value, [
          "signals",
          "items",
          "data",
          "results",
        ])
      : demoSignals;

  const performance =
    performanceResult.status === "fulfilled"
      ? performanceResult.value
      : demoPerformance;

  return {
    strategies: strategies.length,
    total_strategies: strategies.length,
    signals: signals.length,
    total_signals: signals.length,
    performance,
  };
}

export async function getTestRuns() {
  return fetchOrDemo("/test-runs", demoTestRuns);
}

export async function getTestRunPerformance() {
  return fetchOrDemo("/test-runs/performance", demoTestRunPerformance);
}

export async function getActiveTestRun() {
  try {
    const runsResponse = await getTestRuns();

    const runs = normalizeArray(runsResponse, [
      "test_runs",
      "testRuns",
      "runs",
      "items",
      "data",
      "results",
    ]);

    const activeRun = runs.find((run) => {
      const status = getStringValue(run, ["status", "state"]).toLowerCase();

      return (
        status.includes("active") ||
        status.includes("running") ||
        status.includes("open") ||
        status === "started"
      );
    });

    return activeRun ?? null;
  } catch {
    return null;
  }
}

export async function startTestRun(payload: Record<string, unknown>) {
  return apiFetch("/test-runs/start", {
    method: "POST",
    body: payload,
  });
}

export async function endTestRun(runId?: string | number | null) {
  const body =
    runId !== undefined && runId !== null
      ? {
          run_id: runId,
          test_run_id: runId,
        }
      : {};

  return apiFetch("/test-runs/end", {
    method: "POST",
    body,
  });
}

export async function getShadowLiveTrades() {
  return fetchOrDemo("/shadow-live/trades", demoShadowTrades);
}

export async function getShadowLiveLogs() {
  return fetchOrDemo("/shadow-live/logs", demoShadowLogs);
}

export async function getShadowLivePerformance() {
  return fetchOrDemo("/shadow-live/performance", demoShadowPerformance);
}

export async function getShadowLiveConfig() {
  return fetchOrDemo("/shadow-live/config", demoShadowConfig);
}

export async function updateShadowLiveConfig(payload: Record<string, unknown>) {
  return fetchWithMethodsOrDemo(
    "/shadow-live/config",
    ["PATCH", "PUT", "POST"],
    {
      ...demoShadowConfig,
      ...payload,
      saved: true,
      demo_fallback: true,
    },
    payload
  );
}

export async function getExecutionStatus() {
  return fetchOrDemo("/execution/status", demoExecutionStatus);
}

export async function submitDryRunOrder(payload: Record<string, unknown>) {
  return fetchOrDemo(
    "/execution/dry-run-order",
    {
      accepted: true,
      dry_run: true,
      real_order_sent: false,
      demo_fallback: true,
      received_payload: payload,
    },
    {
      method: "POST",
      body: payload,
    }
  );
}

export async function closeTrade(payload: Record<string, unknown>) {
  return apiFetch("/close_trade", {
    method: "POST",
    body: payload,
  });
}

export async function evaluateShadowLive(payload: Record<string, unknown>) {
  return apiFetch("/shadow-live/evaluate", {
    method: "POST",
    body: payload,
  });
}

export async function sendTradingViewWebhook(payload: Record<string, unknown>) {
  return apiFetch("/tv-webhook", {
    method: "POST",
    body: payload,
  });
}

export async function sendGenericWebhook(payload: Record<string, unknown>) {
  return apiFetch("/webhook", {
    method: "POST",
    body: payload,
  });
}

export async function getStats() {
  return apiFetch("/stats");
}

export async function getExecutionGatewayStatus() {
  return apiFetch("/execution/gateway-status");
}

export async function evaluateStrategyPromotion(payload: Record<string, unknown>) {
  return apiFetch("/strategy-promotion/evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function evaluateAllStrategyPromotions(payload: Record<string, unknown> = {}) {
  return apiFetch("/strategy-promotion/evaluate-all", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}