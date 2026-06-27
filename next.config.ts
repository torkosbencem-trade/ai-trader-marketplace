import type { NextConfig } from "next";

// Old "verified marketplace / trading-engine / allocation / pricing" surfaces.
// The code is kept (nothing is deleted), but these routes are no longer part of
// the public product direction (StrataOS = backtest stress-testing). Redirects
// are checked before the filesystem, so a direct visit lands on the neutral
// /parked placeholder instead of the old content. Temporary (307) — these may be
// revived or removed as the pivot settles.
//
// Public surface kept reachable: / , /stress-test, /parked, /login, /auth.
const parkedRoutePrefixes = [
  // marketplace / allocation / admin / execution / portfolio
  "marketplace",
  "strategy-builder",
  "admin",
  "allocation-requests",
  "allocation",
  "execution",
  "execution-audit",
  "portfolio",
  "system",
  // trading-engine demo + signals
  "signals",
  "live-signals",
  "shadow-live",
  "test-runs",
  "promotion",
  "promotion-audit",
  "deploy",
  "performance",
  "dashboard",
  "strategies",
  // pricing / monetization
  "pricing",
  "subscription",
  // old role-based entry, account & status surfaces
  "workspace",
  "risk-check",
  "readiness",
  "project-status",
  "demo",
  "access",
  "onboarding",
  "profile",
];

const nextConfig: NextConfig = {
  async redirects() {
    return parkedRoutePrefixes.map((prefix) => ({
      source: `/${prefix}/:path*`,
      destination: "/parked",
      permanent: false,
    }));
  },
};

export default nextConfig;
