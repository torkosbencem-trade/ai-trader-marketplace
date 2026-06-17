import { NextResponse } from "next/server";
import {
  addDeployment,
  appendAuditEvent,
  listAllocationRequests,
} from "../../../../lib/platform-repository";
import { resolveStrategyRisk } from "../../../../lib/strategy-risk-resolver";

type FirewallCheck = {
  passed: boolean;
  code: string;
  message: string;
};

function fail(code: string, message: string): FirewallCheck {
  return {
    passed: false,
    code,
    message,
  };
}

function pass(message: string): FirewallCheck {
  return {
    passed: true,
    code: "passed",
    message,
  };
}

async function runExecutionFirewall(body: Record<string, unknown>) {
  const riskState = String(body.riskState ?? "Unknown");
  const deploymentMode = String(body.deploymentMode ?? "Paper");
  const strategyId = String(body.strategyId ?? "");
  const requestedCapital = Number(body.requestedCapital ?? 0);
  const maxAllocation = Number(body.maxAllocation ?? 0);
  const allocationRequestId =
    typeof body.allocationRequestId === "string" && body.allocationRequestId
      ? body.allocationRequestId
      : null;

  const checks: FirewallCheck[] = [];

  if (!strategyId) {
    checks.push(fail("missing_strategy", "Strategy ID is required."));
  }

  if (riskState === "Blocked") {
    checks.push(fail("risk_state_blocked", "Deployment was blocked by the risk engine."));
  }

  if (!Number.isFinite(requestedCapital) || requestedCapital <= 0) {
    checks.push(fail("invalid_requested_capital", "Requested capital must be a positive number."));
  }

  if (!Number.isFinite(maxAllocation) || maxAllocation <= 0) {
    checks.push(fail("invalid_max_allocation", "Max allocation must be a positive number."));
  }

  if (
    Number.isFinite(requestedCapital) &&
    Number.isFinite(maxAllocation) &&
    maxAllocation > 0 &&
    requestedCapital > maxAllocation
  ) {
    checks.push(
      fail(
        "allocation_limit_exceeded",
        "Requested capital exceeds max allocation limit."
      )
    );
  }

  if (deploymentMode === "Live") {
    checks.push(
      fail(
        "live_disabled",
        "Live deployment is disabled. Only Paper deployment is currently allowed."
      )
    );
  }

  const resolvedStrategy = strategyId ? await resolveStrategyRisk(strategyId) : null;

  if (!resolvedStrategy) {
    checks.push(
      fail(
        "strategy_not_found",
        "Strategy was not found or is not approved for execution."
      )
    );
  }

  let allocationRequest = null;

  if (allocationRequestId) {
    const allocationRequests = await listAllocationRequests();

    allocationRequest =
      allocationRequests.find((item) => item.id === allocationRequestId) ?? null;

    if (!allocationRequest) {
      checks.push(
        fail(
          "allocation_request_not_found",
          "Allocation request was not found."
        )
      );
    } else if (allocationRequest.status !== "Approved") {
      checks.push(
        fail(
          "allocation_request_not_approved",
          "Allocation request must be Approved before deployment."
        )
      );
    }
  }

  if (checks.length === 0) {
    checks.push(pass("Execution firewall checks passed."));
  }

  const blocked = checks.some((check) => !check.passed);

  return {
    blocked,
    checks,
    resolvedStrategy,
    allocationRequest,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const firewall = await runExecutionFirewall(body);

    if (firewall.blocked) {
      await appendAuditEvent({
        type: "execution-deployment",
        title: "Deployment blocked by Execution Firewall",
        detail: "Deployment was blocked before package creation.",
        actor: "execution-firewall",
        metadata: {
          allocationRequestId: body.allocationRequestId ?? null,
          strategyId: body.strategyId ?? "unknown",
          strategyName: body.strategyName ?? "unknown",
          investorEmail: body.investorEmail ?? null,
          requestedCapital: body.requestedCapital ?? null,
          maxAllocation: body.maxAllocation ?? null,
          deploymentMode: body.deploymentMode ?? "Paper",
          riskState: body.riskState ?? "Unknown",
          checks: firewall.checks,
          resolvedStrategy: firewall.resolvedStrategy,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Deployment blocked by Execution Firewall.",
          data: {
            allocationRequestId: body.allocationRequestId ?? null,
            strategyId: body.strategyId ?? "unknown",
            checkedAt: new Date().toISOString(),
            checks: firewall.checks,
            strategy: firewall.resolvedStrategy,
          },
        },
        {
          status: 403,
        }
      );
    }

    const riskState = body.riskState ?? "Unknown";
    const mode = body.deploymentMode ?? "Paper";

    const deployment = await addDeployment({
      allocationRequestId: body.allocationRequestId ?? null,
      strategyId: body.strategyId ?? "alpha-pulse",
      strategyName:
        body.strategyName ??
        firewall.resolvedStrategy?.name ??
        "Unknown strategy",
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
      detail: `${deployment.strategyName} deployment package prepared for ${
        deployment.investorEmail ?? "investor"
      }.`,
      actor: "execution-system",
      metadata: {
        deployment,
        firewallChecks: firewall.checks,
        resolvedStrategy: firewall.resolvedStrategy,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Deployment package prepared and saved to portfolio.",
        data: deployment,
        meta: {
          workflow: "execution-deployment",
          source: "repository",
          firewallChecks: firewall.checks,
          strategy: firewall.resolvedStrategy,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Invalid deployment payload.",
      },
      {
        status: 400,
      }
    );
  }
}