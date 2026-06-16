export type Strategy = {
  slug: string
  name: string
  status: string
  winrate: string
  profitFactor: string
  expectancy: string
  drawdown: string
  trades: number
  risk: string
  mode: string
  tp: string
  sl: string
  timeframe: string
  description: string
  rules: string[]
  strengths: string[]
  weaknesses: string[]
}

export type Signal = {
  id: number | string
  symbol: string
  side: "BUY" | "SELL" | string
  strategy: string
  entry: string
  tp: string
  sl: string
  confidence: string
  status: string
  riskStatus: string
  guardStatus: string
  mode: string
  timestamp: string
  timeframe: string
}

export const strategies: Strategy[] = [
  {
    slug: "scalp-ai-tv-confirmed",
    name: "Scalp AI + TV Confirmed",
    status: "Paper Tested",
    winrate: "56%",
    profitFactor: "1.42",
    expectancy: "+0.04%",
    drawdown: "-2.8%",
    trades: 430,
    risk: "Medium",
    mode: "FINAL_PLUS_TV_CONFIRMED",
    tp: "0.2%",
    sl: "0.2%",
    timeframe: "5m - 15m",
    description:
      "Short-term AI scalping strategy using AI signal quality, TradingView confirmation, price deviation validation, cooldown, and Strategy Guard filtering.",
    rules: [
      "AI Final Decision must be ENTER TRADE",
      "TradingView confirmation must match the AI signal",
      "TV price deviation must stay below 0.5%",
      "Strategy Guard must allow the setup",
      "Only one open trade is allowed",
      "Cooldown must be ready before opening a new trade",
    ],
    strengths: [
      "Fast signal validation",
      "Strict confirmation layer",
      "Good for active BTC/ETH markets",
    ],
    weaknesses: [
      "Can be noisy in sideways markets",
      "Needs enough trade sample before live usage",
      "Sensitive to spread and fees",
    ],
  },
  {
    slug: "balanced-btc-trend",
    name: "Balanced BTC Trend",
    status: "Testnet Ready",
    winrate: "49%",
    profitFactor: "1.68",
    expectancy: "+0.09%",
    drawdown: "-3.4%",
    trades: 290,
    risk: "Low-Medium",
    mode: "FINAL_ONLY",
    tp: "0.6%",
    sl: "0.4%",
    timeframe: "15m - 1h",
    description:
      "Balanced trend-following strategy designed to avoid excessive noise and capture cleaner directional moves.",
    rules: [
      "AI signal must align with market direction",
      "Final Decision must be ENTER TRADE",
      "Risk/reward must be acceptable",
      "Cooldown must be ready",
      "Strategy Guard should not block the setup",
    ],
    strengths: [
      "Cleaner than very short scalping",
      "Better average reward potential",
      "Less sensitive to small price noise",
    ],
    weaknesses: [
      "Fewer signals",
      "Can enter late in fast moves",
      "Needs larger sample size",
    ],
  },
  {
    slug: "swing-ai-guarded",
    name: "Swing AI Guarded",
    status: "Shadow Live",
    winrate: "43%",
    profitFactor: "1.91",
    expectancy: "+0.14%",
    drawdown: "-5.2%",
    trades: 120,
    risk: "High",
    mode: "FINAL_PLUS_GUARD",
    tp: "1.5%",
    sl: "0.7%",
    timeframe: "1h - 4h",
    description:
      "Higher reward strategy designed for larger moves, using stricter guard logic and wider take-profit targets.",
    rules: [
      "AI signal must show strong directional conviction",
      "Final Decision must be ENTER TRADE",
      "Strategy Guard must allow the setup",
      "Volatility must be acceptable",
      "Risk must stay within account limits",
    ],
    strengths: [
      "Higher expectancy potential",
      "Better reward-to-risk profile",
      "Useful for stronger market trends",
    ],
    weaknesses: [
      "Higher drawdown risk",
      "Lower winrate",
      "Slower feedback cycle",
    ],
  },
]

export const signals: Signal[] = [
  {
    id: 1,
    symbol: "BTCUSDT",
    side: "BUY",
    strategy: "Scalp AI + TV Confirmed",
    entry: "63850.00",
    tp: "63977.70",
    sl: "63722.30",
    confidence: "87%",
    status: "TV Confirmed",
    riskStatus: "Allowed",
    guardStatus: "Passed",
    mode: "Paper",
    timestamp: "2026-06-14 12:34:00",
    timeframe: "5m",
  },
  {
    id: 2,
    symbol: "ETHUSDT",
    side: "SELL",
    strategy: "Balanced BTC Trend",
    entry: "3140.00",
    tp: "3121.00",
    sl: "3153.00",
    confidence: "74%",
    status: "Waiting",
    riskStatus: "Pending",
    guardStatus: "Pending",
    mode: "Paper",
    timestamp: "2026-06-14 12:38:00",
    timeframe: "15m",
  },
]