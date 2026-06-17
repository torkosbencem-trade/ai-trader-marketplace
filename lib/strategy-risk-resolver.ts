import { getStrategy } from "./strategies";
import { listStrategySubmissions } from "./platform-repository";
import {
  normalizeStrategyRiskLevel,
  type StrategyRiskLevel,
} from "./risk-compatibility";

export type ResolvedStrategyRisk = {
  id: string;
  name: string;
  risk: StrategyRiskLevel;
  category: string;
  source: "demo" | "approved-submission";
  maxDrawdown: number | null;
};

export function mapDrawdownToRisk(maxDrawdown: number): StrategyRiskLevel {
  if (maxDrawdown > 15) {
    return "High";
  }

  if (maxDrawdown <= 5) {
    return "Low";
  }

  return "Medium";
}

export async function resolveStrategyRisk(
  strategyId: string
): Promise<ResolvedStrategyRisk | null> {
  const staticStrategy = getStrategy(strategyId);

  if (staticStrategy) {
    return {
      id: staticStrategy.id,
      name: staticStrategy.name,
      risk: normalizeStrategyRiskLevel(staticStrategy.risk),
      category: staticStrategy.category,
      source: "demo",
      maxDrawdown: null,
    };
  }

  const submissions = await listStrategySubmissions();

  const submission = submissions.find(
    (item) => item.id === strategyId && item.status === "Approved"
  );

  if (!submission) {
    return null;
  }

  const maxDrawdown = Number(
    submission.parsedMetrics?.maxDrawdown ?? submission.maxDrawdown ?? 0
  );

  return {
    id: submission.id,
    name: submission.name,
    risk: mapDrawdownToRisk(maxDrawdown),
    category: "Creator Submission",
    source: "approved-submission",
    maxDrawdown,
  };
}