export type RiskLevel = "Low" | "Medium" | "High";

export type StrategyCategory =
  | "Momentum"
  | "Mean Reversion"
  | "Breakout"
  | "Macro"
  | "Scalping";

export type StrategyStatus = "Live" | "Verified" | "Research";

export type Strategy = {
  id: string;
  name: string;
  manager: string;
  category: StrategyCategory;
  risk: RiskLevel;
  monthlyReturn: number;
  drawdown: number;
  sharpe: number;
  winRate: number;
  trades: number;
  capital: string;
  markets: string[];
  description: string;
  status: StrategyStatus;
  equity: number[];
  drawdownSeries: number[];
};

export const strategies: Strategy[] = [
  {
    id: "alpha-pulse",
    name: "Alpha Pulse",
    manager: "NorthBridge Quant",
    category: "Momentum",
    risk: "Medium",
    monthlyReturn: 8.4,
    drawdown: 6.2,
    sharpe: 2.18,
    winRate: 63,
    trades: 418,
    capital: "$250K+",
    markets: ["BTC", "ETH", "NASDAQ"],
    description:
      "Trend-following strategy for liquid markets with adaptive position sizing and strict drawdown control.",
    status: "Verified",
    equity: [100, 103, 106, 104, 109, 113, 117, 115, 121, 126, 130, 138],
    drawdownSeries: [0, -1.2, -0.8, -3.6, -1.1, -0.6, -2.4, -4.7, -1.8, -1.2, -0.7, -0.3],
  },
  {
    id: "delta-grid",
    name: "Delta Grid",
    manager: "Aster Capital Systems",
    category: "Mean Reversion",
    risk: "Low",
    monthlyReturn: 4.7,
    drawdown: 3.1,
    sharpe: 1.76,
    winRate: 71,
    trades: 1260,
    capital: "$100K+",
    markets: ["EURUSD", "GBPUSD", "Gold"],
    description:
      "Conservative mean-reversion model focused on liquid FX and metals markets with frequent smaller trades.",
    status: "Live",
    equity: [100, 101, 102.5, 103.2, 105, 106.4, 107.8, 108.1, 110, 111.6, 113, 115],
    drawdownSeries: [0, -0.6, -0.4, -1.1, -0.8, -1.7, -0.9, -2.8, -0.7, -0.4, -1.2, -0.5],
  },
  {
    id: "breakline-x",
    name: "Breakline X",
    manager: "Vektor Labs",
    category: "Breakout",
    risk: "High",
    monthlyReturn: 13.9,
    drawdown: 11.8,
    sharpe: 1.92,
    winRate: 52,
    trades: 286,
    capital: "$500K+",
    markets: ["NASDAQ", "S&P 500", "BTC"],
    description:
      "Volatility breakout strategy for aggressive allocations using liquidity filters and dynamic exits.",
    status: "Verified",
    equity: [100, 108, 115, 109, 124, 119, 133, 128, 141, 155, 148, 169],
    drawdownSeries: [0, -2.4, -1.1, -8.6, -2.2, -7.9, -3.5, -11.8, -4.1, -2.3, -9.4, -1.7],
  },
  {
    id: "macro-shift",
    name: "Macro Shift",
    manager: "Helix Research Desk",
    category: "Macro",
    risk: "Medium",
    monthlyReturn: 6.1,
    drawdown: 5.4,
    sharpe: 1.64,
    winRate: 58,
    trades: 142,
    capital: "$1M+",
    markets: ["Bonds", "Gold", "S&P 500"],
    description:
      "Slower-moving macro system reacting to volatility regimes, rates, commodities and equity index trends.",
    status: "Research",
    equity: [100, 101, 99, 104, 107, 106, 111, 113, 112, 116, 120, 124],
    drawdownSeries: [0, -0.7, -3.4, -1.2, -0.8, -2.1, -0.5, -1.4, -3.9, -1.1, -0.9, -0.6],
  },
  {
    id: "micro-edge",
    name: "Micro Edge",
    manager: "Obsidian Execution",
    category: "Scalping",
    risk: "High",
    monthlyReturn: 11.2,
    drawdown: 9.7,
    sharpe: 1.88,
    winRate: 55,
    trades: 3420,
    capital: "$300K+",
    markets: ["BTC", "ETH", "SOL"],
    description:
      "Intraday crypto execution model with tight risk limits, fast exposure rotation and high trade frequency.",
    status: "Live",
    equity: [100, 106, 103, 111, 118, 114, 126, 122, 135, 131, 145, 157],
    drawdownSeries: [0, -1.9, -5.4, -1.6, -0.9, -6.8, -2.3, -9.7, -3.1, -7.5, -2.8, -1.2],
  },
];

export const categories: Array<"All" | StrategyCategory> = [
  "All",
  "Momentum",
  "Mean Reversion",
  "Breakout",
  "Macro",
  "Scalping",
];

export const risks: Array<"All" | RiskLevel> = ["All", "Low", "Medium", "High"];

export function getStrategy(id: string) {
  return strategies.find((strategy) => strategy.id === id);
}
