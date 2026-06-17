import { NextResponse } from "next/server";
import { appendAuditEvent } from "../../../../lib/platform-repository";
import {
  getCurrentPortfolioRiskMode,
  isPortfolioRiskMode,
  type PortfolioRiskMode,
} from "../../../../lib/portfolio-risk-mode";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const portfolioId = url.searchParams.get("portfolioId") ?? "demo-investor-001";

  const currentRiskMode = await getCurrentPortfolioRiskMode(portfolioId);

  return NextResponse.json({
    success: true,
    data: currentRiskMode,
    meta: {
      workflow: "portfolio-risk-mode",
      source: currentRiskMode.source,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isPortfolioRiskMode(body.riskMode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid risk mode. Use Normal, Reduced or Paused.",
        },
        {
          status: 400,
        }
      );
    }

    const riskMode = body.riskMode as PortfolioRiskMode;

    const event = {
      portfolioId: body.portfolioId ?? "demo-investor-001",
      riskMode,
      requestedBy: body.requestedBy ?? "demo-user",
      auditRequired: true,
      updatedAt: new Date().toISOString(),
    };

    await appendAuditEvent({
      type: "portfolio-risk-mode",
      title: "Portfolio risk mode changed",
      detail: `Portfolio risk mode changed to ${riskMode}.`,
      actor: body.requestedBy ?? "demo-user",
      metadata: event,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Portfolio risk mode changed to ${riskMode}.`,
        data: event,
        meta: {
          workflow: "portfolio-risk-mode",
          source: "repository",
        },
      },
      {
        status: 201,
      }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid portfolio risk payload.",
      },
      {
        status: 400,
      }
    );
  }
}