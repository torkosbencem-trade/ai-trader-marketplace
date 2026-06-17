import { listAuditEvents } from "./platform-repository";

export type PortfolioRiskMode = "Normal" | "Reduced" | "Paused";

export function isPortfolioRiskMode(value: unknown): value is PortfolioRiskMode {
  return value === "Normal" || value === "Reduced" || value === "Paused";
}

export async function getCurrentPortfolioRiskMode(
  portfolioId = "demo-investor-001"
): Promise<{
  portfolioId: string;
  riskMode: PortfolioRiskMode;
  source: "audit-log" | "default";
  updatedAt: string | null;
}> {
  const auditEvents = await listAuditEvents();

  const latestRiskModeEvent = auditEvents
    .filter((event) => event.type === "portfolio-risk-mode")
    .find((event) => {
      const metadata = event.metadata as
        | {
            portfolioId?: string;
            riskMode?: string;
            updatedAt?: string;
          }
        | null
        | undefined;

      return metadata?.portfolioId === portfolioId;
    });

  const metadata = latestRiskModeEvent?.metadata as
    | {
        portfolioId?: string;
        riskMode?: string;
        updatedAt?: string;
      }
    | null
    | undefined;

  if (isPortfolioRiskMode(metadata?.riskMode)) {
    return {
      portfolioId,
      riskMode: metadata.riskMode,
      source: "audit-log",
      updatedAt: metadata.updatedAt ?? latestRiskModeEvent?.createdAt ?? null,
    };
  }

  return {
    portfolioId,
    riskMode: "Normal",
    source: "default",
    updatedAt: null,
  };
}