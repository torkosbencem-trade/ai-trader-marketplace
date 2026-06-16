import { NextResponse } from "next/server";
import { appendAuditEvent } from "../../../../lib/platform-repository";

type RiskMode = "Normal" | "Reduced" | "Paused";

function isValidRiskMode(value: unknown): value is RiskMode {
  return value === "Normal" || value === "Reduced" || value === "Paused";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isValidRiskMode(body.riskMode)) {
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

    const event = {
      portfolioId: body.portfolioId ?? "demo-investor-001",
      riskMode: body.riskMode,
      requestedBy: body.requestedBy ?? "demo-user",
      auditRequired: true,
      updatedAt: new Date().toISOString(),
    };

    await appendAuditEvent({
      type: "portfolio-risk-mode",
      title: "Portfolio risk mode changed",
      detail: `Portfolio risk mode changed to ${body.riskMode}.`,
      actor: body.requestedBy ?? "demo-user",
      metadata: event,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Portfolio risk mode changed to ${body.riskMode}.`,
        data: event,
        meta: {
          workflow: "portfolio-risk-mode",
          source: "file-store",
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