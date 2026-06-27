import { describe, it, expect } from "vitest";
import { runReview } from "@/scripts/red-team-review";

const AT = "2026-06-27T00:00:00.000Z";

// A concentrated 9-trade backtest as a JSON array of returns (outlier Test A).
const CONCENTRATED = JSON.stringify([60, 5, 5, 5, 5, 5, 5, 5, 5]);

describe("red-team-review CLI core (runReview)", () => {
  it("concentrated backtest -> high verdict + well-formed JSON envelope", () => {
    const result = runReview({
      content: CONCENTRATED,
      fileName: "concentrated.json",
      strategyName: "Concentrated Demo",
      analyzedAt: AT,
    });

    expect(result.envelope.strategyName).toBe("Concentrated Demo");
    expect(result.envelope.tradeCount).toBe(9);
    expect(result.envelope.parserMode).toBe("json");
    expect(result.envelope.summary.overallSeverity).toBe("high");

    // JSON string is real, round-trips, and carries the envelope shape.
    const parsed = JSON.parse(result.json);
    expect(parsed.strategyName).toBe("Concentrated Demo");
    expect(parsed.tradeCount).toBe(9);
    expect(parsed.summary.overallSeverity).toBe("high");
    expect(parsed.analyzedAt).toBe(AT);
  });

  it("markdown contains the verdict headline and a red-flags section", () => {
    const result = runReview({
      content: CONCENTRATED,
      fileName: "concentrated.json",
      analyzedAt: AT,
    });

    expect(result.markdown).toContain(result.envelope.summary.headline);
    expect(result.markdown).toMatch(/##\s*red flags/i);
    expect(result.markdown).toMatch(/high risk/i);
  });

  it("malformed/empty input -> graceful 0 trades, not a throw", () => {
    const run = () =>
      runReview({
        content: "not,a,backtest\n",
        fileName: "bad.csv",
        analyzedAt: AT,
      });

    expect(run).not.toThrow();
    const result = run();
    expect(result.envelope.tradeCount).toBe(0);
    expect(result.envelope.parserMode).toBe("fallback");
    expect(result.text).toMatch(/0 trades|no trades|not recognized|format/i);
  });
});
