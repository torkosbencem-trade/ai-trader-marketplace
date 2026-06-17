export type UserRiskProfile =
  | "not_set"
  | "conservative"
  | "balanced"
  | "aggressive"
  | "professional";

export type StrategyRiskLevel = "Low" | "Medium" | "High";

export type CompatibilityTone = "good" | "warn" | "danger" | "neutral";

export type RiskCompatibilityResult = {
  label: string;
  tone: CompatibilityTone;
  score: number;
  message: string;
  userRiskProfile: UserRiskProfile;
  strategyRiskLevel: StrategyRiskLevel;
  allocationGuidance: string;
  executionGuidance: string;
};

const strategyRiskWeight: Record<StrategyRiskLevel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

const userRiskCapacity: Record<UserRiskProfile, number> = {
  not_set: 0,
  conservative: 1,
  balanced: 2,
  aggressive: 3,
  professional: 3,
};

export function normalizeUserRiskProfile(value: unknown): UserRiskProfile {
  if (
    value === "conservative" ||
    value === "balanced" ||
    value === "aggressive" ||
    value === "professional"
  ) {
    return value;
  }

  return "not_set";
}

export function normalizeStrategyRiskLevel(value: unknown): StrategyRiskLevel {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }

  return "Medium";
}

export function getRiskCompatibility(
  userRiskProfileInput: unknown,
  strategyRiskLevelInput: unknown
): RiskCompatibilityResult {
  const userRiskProfile = normalizeUserRiskProfile(userRiskProfileInput);
  const strategyRiskLevel = normalizeStrategyRiskLevel(strategyRiskLevelInput);

  if (userRiskProfile === "not_set") {
    return {
      label: "Risk profile missing",
      tone: "neutral",
      score: 0,
      userRiskProfile,
      strategyRiskLevel,
      message:
        "Complete onboarding before using strategy risk compatibility checks.",
      allocationGuidance:
        "Do not request allocation until the investor risk profile is completed.",
      executionGuidance:
        "Execution should remain disabled until onboarding and risk profile setup are completed.",
    };
  }

  if (userRiskProfile === "professional") {
    return {
      label: "Professional review",
      tone: "good",
      score: 92,
      userRiskProfile,
      strategyRiskLevel,
      message:
        "Professional profile can review all listed strategy risk levels, but allocation limits and execution controls still apply.",
      allocationGuidance:
        "Allocation may proceed after normal strategy, capital and drawdown checks.",
      executionGuidance:
        "Execution can proceed only after Risk Firewall checks are passed.",
    };
  }

  const userCapacity = userRiskCapacity[userRiskProfile];
  const strategyWeight = strategyRiskWeight[strategyRiskLevel];

  if (strategyWeight <= userCapacity) {
    return {
      label: "Aligned",
      tone: "good",
      score: strategyRiskLevel === "Low" ? 95 : 84,
      userRiskProfile,
      strategyRiskLevel,
      message:
        "This strategy risk level is aligned with the selected investor risk profile.",
      allocationGuidance:
        "Allocation request can proceed with standard risk review.",
      executionGuidance:
        "Execution may proceed later if strategy status, allocation caps and portfolio limits are valid.",
    };
  }

  if (strategyWeight === userCapacity + 1) {
    return {
      label: "Caution",
      tone: "warn",
      score: 58,
      userRiskProfile,
      strategyRiskLevel,
      message:
        "This strategy is slightly above the selected investor risk profile.",
      allocationGuidance:
        "Use smaller allocation size or paper-only review before committing capital.",
      executionGuidance:
        "Execution should require an additional confirmation and stricter allocation limits.",
    };
  }

  return {
    label: "Not aligned",
    tone: "danger",
    score: 32,
    userRiskProfile,
    strategyRiskLevel,
    message:
      "This strategy risk level is too high for the selected investor risk profile.",
    allocationGuidance:
      "Allocation should be blocked or require admin override after manual review.",
    executionGuidance:
      "Execution should be blocked by the Risk Firewall.",
  };
}