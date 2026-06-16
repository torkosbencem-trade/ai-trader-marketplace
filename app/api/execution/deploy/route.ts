import { NextResponse } from "next/server";
import { addDeployment, appendAuditEvent } from "../../../../lib/platform-repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const riskState = body.riskState ?? "Unknown";
    const mode = body.deploymentMode ?? "Paper";

    if (riskState === "Blocked") {
      await appendAuditEvent({
        type: "execution-deployment",
        title: "Deployment blocked",
        detail: "Deployment was blocked by the risk engine.",
        actor: "execution-system",
        metadata: {
          allocationRequestId: body.allocationRequestId ?? null,
          strategyId: body.strategyId ?? "unknown",
          strategyName: body.strategyName ?? "unknown",
          investorEmail: body.investorEmail ?? null,
          riskState,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Deployment blocked by risk engine.",
          data: {
            allocationRequestId: body.allocationRequestId ?? null,
            strategyId: body.strategyId ?? "unknown",
            riskState,
            checkedAt: new Date().toISOString(),
          },
        },
        {
          status: 403,
        }
      );
    }

    const deployment = await addDeployment({
      allocationRequestId: body.allocationRequestId ?? null,
      strategyId: body.strategyId ?? "alpha-pulse",
      strategyName: body.strategyName ?? "Unknown strategy",
      investorEmail: body.investorEmail ?? null,
      requestedCapital: Number(body.requestedCapital ?? 0),
      broker: body.broker ?? "Alpaca",
      deploymentMode: mode === "Live" ? "Live" : "Paper",
      riskState,
      maxAllocation: Number(body.maxAllocation ?? 0),
      maxDrawdown: Number(body.maxDrawdown ?? 0),
      dailyLossLimit: Number(body.dailyLossLimit ?? 0),
    });

    await appendAuditEvent({
      type: "execution-deployment",
      title: "Deployment package prepared",
      detail: `${deployment.strategyName} deployment package prepared for ${deployment.investorEmail ?? "investor"}.`,
      actor: "execution-system",
      metadata: deployment,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Deployment package prepared and saved to portfolio.",
        data: deployment,
        meta: {
          workflow: "execution-deployment",
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
        error: "Invalid deployment payload.",
      },
      {
        status: 400,
      }
    );
  }
}