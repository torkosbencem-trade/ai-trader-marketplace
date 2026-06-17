import { NextResponse } from "next/server";
import { appendAuditEvent } from "../../../../lib/platform-repository";
import {
  getCurrentPortfolioRiskMode,
  isPortfolioRiskMode,
  type PortfolioRiskMode,
} from "../../../../lib/portfolio-risk-mode";
import { requireAdminRequest } from "../../../../lib/server-admin-guard";

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
    const admin = await requireAdminRequest(request);

    if (!admin.ok) {
      return NextResponse.json(
        {
          success: false,
          error: admin.error,
        },
        {
          status: admin.status,
        }
      );
    }

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
      requestedBy: admin.email ?? body.requestedBy ?? "admin",
      auditRequired: true,
      updatedAt: new Date().toISOString(),
    };

    await appendAuditEvent({
      type: "portfolio-risk-mode",
      title: "Portfolio risk mode changed",
      detail: `Portfolio risk mode changed to ${riskMode}.`,
      actor: admin.email ?? body.requestedBy ?? "admin",
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
          adminSource: admin.adminSource,
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