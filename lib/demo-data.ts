export const demoStrategies = [
  {
    id: "trend-pulse-ai",
    slug: "trend-pulse-ai",
    name: "Trend Pulse AI",
    description:
      "Momentum-based AI strategy designed to detect trend continuation setups on liquid crypto pairs.",
    risk_level: "Moderate",
    win_rate: 0.624,
    total_pnl: 842.35,
    total_trades: 86,
    subscribers: 128,
    created_at: new Date().toISOString(),
  },
  {
    id: "mean-reversion-pro",
    slug: "mean-reversion-pro",
    name: "Mean Reversion Pro",
    description:
      "Short-term mean reversion strategy focused on overextended price moves and controlled pullback entries.",
    risk_level: "Low",
    win_rate: 0.587,
    total_pnl: 421.92,
    total_trades: 64,
    subscribers: 91,
    created_at: new Date().toISOString(),
  },
  {
    id: "breakout-sentinel",
    slug: "breakout-sentinel",
    name: "Breakout Sentinel",
    description:
      "Breakout validation strategy monitoring volatility expansion, volume confirmation and continuation pressure.",
    risk_level: "High",
    win_rate: 0.541,
    total_pnl: 1264.18,
    total_trades: 73,
    subscribers: 156,
    created_at: new Date().toISOString(),
  },
];

export const demoSignals = [
  {
    id: "sig-btc-trend-pulse-1",
    symbol: "BTCUSDT",
    side: "BUY",
    action: "BUY",
    strategy_name: "Trend Pulse AI",
    strategy_slug: "trend-pulse-ai",
    confidence: 0.78,
    timeframe: "1h",
    entry: 68450,
    stop_loss: 67120,
    take_profit: 70480,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "sig-eth-mean-reversion-1",
    symbol: "ETHUSDT",
    side: "LONG",
    action: "LONG",
    strategy_name: "Mean Reversion Pro",
    strategy_slug: "mean-reversion-pro",
    confidence: 0.71,
    timeframe: "4h",
    entry: 3520,
    stop_loss: 3440,
    take_profit: 3665,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "sig-sol-breakout-1",
    symbol: "SOLUSDT",
    side: "BUY",
    action: "BUY",
    strategy_name: "Breakout Sentinel",
    strategy_slug: "breakout-sentinel",
    confidence: 0.66,
    timeframe: "1h",
    entry: 168.4,
    stop_loss: 161.2,
    take_profit: 181.5,
    status: "watch",
    created_at: new Date().toISOString(),
  },
  {
    id: "sig-bnb-trend-pulse-1",
    symbol: "BNBUSDT",
    side: "SELL",
    action: "SELL",
    strategy_name: "Trend Pulse AI",
    strategy_slug: "trend-pulse-ai",
    confidence: 0.52,
    timeframe: "15m",
    entry: 598,
    stop_loss: 612,
    take_profit: 572,
    status: "active",
    created_at: new Date().toISOString(),
  },
];

export const demoPerformance = {
  total_pnl: 2528.45,
  pnl: 2528.45,
  net_pnl: 2528.45,
  win_rate: 0.593,
  total_trades: 223,
  trades: 223,
};

export const demoTestRuns = [
  {
    id: "run-trend-pulse-demo",
    run_id: "run-trend-pulse-demo",
    strategy_name: "Trend Pulse AI",
    strategy: "Trend Pulse AI",
    strategy_slug: "trend-pulse-ai",
    symbol: "BTCUSDT",
    timeframe: "1h",
    status: "COMPLETED",
    pnl: 184.62,
    win_rate: 0.61,
    trades: 18,
    started_at: new Date().toISOString(),
  },
  {
    id: "run-mean-reversion-demo",
    run_id: "run-mean-reversion-demo",
    strategy_name: "Mean Reversion Pro",
    strategy: "Mean Reversion Pro",
    strategy_slug: "mean-reversion-pro",
    symbol: "ETHUSDT",
    timeframe: "4h",
    status: "COMPLETED",
    pnl: 93.24,
    win_rate: 0.58,
    trades: 12,
    started_at: new Date().toISOString(),
  },
];

export const demoTestRunPerformance = {
  total_pnl: 277.86,
  pnl: 277.86,
  net_pnl: 277.86,
  win_rate: 0.596,
  total_trades: 30,
  trades: 30,
};

export const demoShadowTrades = [
  {
    id: "shadow-btc-demo-1",
    trade_id: "shadow-btc-demo-1",
    symbol: "BTCUSDT",
    side: "BUY",
    strategy_name: "Trend Pulse AI",
    strategy_slug: "trend-pulse-ai",
    pnl: 42.8,
    real_order_sent: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "shadow-eth-demo-1",
    trade_id: "shadow-eth-demo-1",
    symbol: "ETHUSDT",
    side: "LONG",
    strategy_name: "Mean Reversion Pro",
    strategy_slug: "mean-reversion-pro",
    pnl: 18.4,
    real_order_sent: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "shadow-sol-demo-1",
    trade_id: "shadow-sol-demo-1",
    symbol: "SOLUSDT",
    side: "BUY",
    strategy_name: "Breakout Sentinel",
    strategy_slug: "breakout-sentinel",
    pnl: -11.2,
    real_order_sent: false,
    created_at: new Date().toISOString(),
  },
];

export const demoShadowLogs = [
  {
    id: "shadow-log-1",
    level: "INFO",
    message: "Shadow Live evaluation completed in simulation mode.",
    created_at: new Date().toISOString(),
  },
  {
    id: "shadow-log-2",
    level: "SUCCESS",
    message: "No real order routing detected during latest simulation cycle.",
    created_at: new Date().toISOString(),
  },
  {
    id: "shadow-log-3",
    level: "WARN",
    message: "Breakout Sentinel requires additional validation before promotion.",
    created_at: new Date().toISOString(),
  },
];

export const demoShadowPerformance = {
  total_pnl: 50.0,
  pnl: 50.0,
  net_pnl: 50.0,
  win_rate: 0.667,
  total_trades: 3,
  trades: 3,
};

export const demoShadowConfig = {
  emergency_stop: false,
  max_order_usdt: 100,
  max_risk_percent: 1,
};

export const demoExecutionStatus = {
  mode: "DRY_RUN_ONLY",
  execution_mode: "DRY_RUN_ONLY",
  dry_run_only: true,
  dry_run: true,
  real_order_sent: false,
};

export const demoBackendHealth = {
  status: "ok",
  message: "Frontend demo fallback active or backend healthy.",
};

export function isEmptyPayload(value: unknown): boolean {
  if (value === null || value === undefined) return true;

  if (Array.isArray(value)) return value.length === 0;

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    const keys = Object.keys(record);

    if (keys.length === 0) return true;

    const arrayLikeKeys = [
      "strategies",
      "signals",
      "items",
      "data",
      "results",
      "test_runs",
      "testRuns",
      "runs",
      "trades",
      "logs",
    ];

    for (const key of arrayLikeKeys) {
      const candidate = record[key];

      if (Array.isArray(candidate)) {
        return candidate.length === 0;
      }
    }
  }

  return false;
}

export function withDemoFallback<T>(value: T, fallback: T): T {
  return isEmptyPayload(value) ? fallback : value;
}