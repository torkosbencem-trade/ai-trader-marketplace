import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "../../../../lib/supabase-server";

type DemoAction = "seed" | "reset";

const now = () => new Date().toISOString();

const parsedMetrics = {
  detectedRows: 20,
  trades: 20,
  winRate: 75,
  totalReturn: 17.4,
  averageReturn: 0.87,
  maxDrawdown: 2.16,
  sharpe: 2.41,
  parserMode: "csv" as const,
  equitySeries: [
    100, 101.4, 100.89, 103.11, 104.04, 103.21, 104.96, 105.59, 105.17,
    107.9, 109.19, 108.43, 110.49, 111.37, 113.04, 112.36, 114.72, 115.52,
    117.02, 115.97, 118.75,
  ],
  drawdownSeries: [
    0, 0, -0.5, 0, 0, -0.8, 0, 0, -0.4, 0, 0, -0.7, 0, 0, 0, -0.6, 0, 0,
    0, -0.9, 0,
  ],
};

const demoSubmission = {
  id: "submission-demo-alpha",
  status: "Approved",
  name: "Institutional Alpha Demo",
  assetClass: "Multi-Asset",
  timeframe: "1h",
  riskProfile: "Balanced",
  maxDrawdown: parsedMetrics.maxDrawdown,
  monthlyTarget: parsedMetrics.totalReturn,
  fileName: "demo-alpha-backtest.csv",
  parsedMetrics,
  receivedAt: now(),
  updatedAt: now(),
};

const demoAllocationRequest = {
  id: "allocation-demo-alpha",
  strategyId: "submission-demo-alpha",
  strategyName: "Institutional Alpha Demo",
  investorEmail: "investor.demo@aitrader.local",
  requestedCapital: 125000,
  riskAcknowledgement: true,
  timeHorizon: "6-12 months",
  notes: "Demo allocation request generated for investor walkthrough.",
  status: "Approved",
  createdAt: now(),
  updatedAt: now(),
};

const demoDeployment = {
  id: "deployment-demo-alpha",
  allocationRequestId: "allocation-demo-alpha",
  strategyId: "submission-demo-alpha",
  strategyName: "Institutional Alpha Demo",
  investorEmail: "investor.demo@aitrader.local",
  requestedCapital: 125000,
  broker: "Alpaca",
  deploymentMode: "Paper",
  riskState: "Passed",
  maxAllocation: 50000,
  maxDrawdown: 8,
  dailyLossLimit: 2.5,
  status: "Prepared",
  createdAt: now(),
  updatedAt: null,
};

function demoAuditEvents() {
  const createdAt = now();

  return [
    {
      id: "audit-demo-deployment",
      type: "deployment-created",
      title: "Demo deployment saved",
      detail:
        "Institutional Alpha Demo deployment was saved as a portfolio allocation.",
      actor: "demo-system",
      metadata: demoDeployment,
      createdAt,
    },
    {
      id: "audit-demo-execution",
      type: "execution-deployment",
      title: "Demo deployment package prepared",
      detail:
        "Institutional Alpha Demo deployment package prepared for investor.demo@aitrader.local.",
      actor: "execution-system",
      metadata: demoDeployment,
      createdAt,
    },
    {
      id: "audit-demo-allocation",
      type: "allocation-review",
      title: "Demo allocation request approved",
      detail: "Demo allocation request changed to Approved.",
      actor: "demo-admin",
      metadata: demoAllocationRequest,
      createdAt,
    },
    {
      id: "audit-demo-submission",
      type: "admin-review",
      title: "Demo strategy approved",
      detail: "Institutional Alpha Demo was approved for marketplace publication.",
      actor: "demo-admin",
      metadata: demoSubmission,
      createdAt,
    },
  ];
}

function toSubmissionRow() {
  return {
    id: demoSubmission.id,
    status: demoSubmission.status,
    name: demoSubmission.name,
    asset_class: demoSubmission.assetClass,
    timeframe: demoSubmission.timeframe,
    risk_profile: demoSubmission.riskProfile,
    max_drawdown: demoSubmission.maxDrawdown,
    monthly_target: demoSubmission.monthlyTarget,
    file_name: demoSubmission.fileName,
    parsed_metrics: demoSubmission.parsedMetrics,
    received_at: demoSubmission.receivedAt,
    updated_at: demoSubmission.updatedAt,
  };
}

function toAllocationRow() {
  return {
    id: demoAllocationRequest.id,
    strategy_id: demoAllocationRequest.strategyId,
    strategy_name: demoAllocationRequest.strategyName,
    investor_email: demoAllocationRequest.investorEmail,
    requested_capital: demoAllocationRequest.requestedCapital,
    risk_acknowledgement: demoAllocationRequest.riskAcknowledgement,
    time_horizon: demoAllocationRequest.timeHorizon,
    notes: demoAllocationRequest.notes,
    status: demoAllocationRequest.status,
    created_at: demoAllocationRequest.createdAt,
    updated_at: demoAllocationRequest.updatedAt,
  };
}

function toDeploymentRow() {
  return {
    id: demoDeployment.id,
    allocation_request_id: demoDeployment.allocationRequestId,
    strategy_id: demoDeployment.strategyId,
    strategy_name: demoDeployment.strategyName,
    investor_email: demoDeployment.investorEmail,
    requested_capital: demoDeployment.requestedCapital,
    broker: demoDeployment.broker,
    deployment_mode: demoDeployment.deploymentMode,
    risk_state: demoDeployment.riskState,
    max_allocation: demoDeployment.maxAllocation,
    max_drawdown: demoDeployment.maxDrawdown,
    daily_loss_limit: demoDeployment.dailyLossLimit,
    status: demoDeployment.status,
    created_at: demoDeployment.createdAt,
    updated_at: demoDeployment.updatedAt,
  };
}

function toAuditRows() {
  return demoAuditEvents().map((event) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    detail: event.detail,
    actor: event.actor,
    metadata: event.metadata,
    created_at: event.createdAt,
  }));
}

async function resetSupabaseDemoData() {
  const supabase = createSupabaseServerClient();

  const tables = [
    "audit_events",
    "deployments",
    "allocation_requests",
    "strategy_submissions",
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "__keep__");

    if (error) {
      throw error;
    }
  }
}

async function seedSupabaseDemoData() {
  const supabase = createSupabaseServerClient();

  await resetSupabaseDemoData();

  const submission = await supabase
    .from("strategy_submissions")
    .insert(toSubmissionRow());

  if (submission.error) {
    throw submission.error;
  }

  const allocation = await supabase
    .from("allocation_requests")
    .insert(toAllocationRow());

  if (allocation.error) {
    throw allocation.error;
  }

  const deployment = await supabase.from("deployments").insert(toDeploymentRow());

  if (deployment.error) {
    throw deployment.error;
  }

  const audit = await supabase.from("audit_events").insert(toAuditRows());

  if (audit.error) {
    throw audit.error;
  }
}

async function writeJsonFile(fileName: string, data: unknown) {
  const dataDir = path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, fileName),
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

async function resetFileStoreDemoData() {
  await writeJsonFile("strategy-submissions.json", []);
  await writeJsonFile("allocation-requests.json", []);
  await writeJsonFile("deployments.json", []);
  await writeJsonFile("audit-log.json", []);
}

async function seedFileStoreDemoData() {
  await writeJsonFile("strategy-submissions.json", [demoSubmission]);
  await writeJsonFile("allocation-requests.json", [demoAllocationRequest]);
  await writeJsonFile("deployments.json", [demoDeployment]);
  await writeJsonFile("audit-log.json", demoAuditEvents());
}

export async function GET() {
  const provider =
    process.env.STORAGE_PROVIDER === "database" && hasSupabaseServerConfig()
      ? "database"
      : "file-store";

  return NextResponse.json({
    data: {
      provider,
      actions: ["seed", "reset"],
      seedCreates: {
        strategySubmissions: 1,
        allocationRequests: 1,
        deployments: 1,
        auditEvents: 4,
      },
      warning:
        "Reset clears demo tables used by this MVP. Use only for controlled demos.",
      timestamp: now(),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: DemoAction };
    const action = body.action;

    if (action !== "seed" && action !== "reset") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Use seed or reset.",
        },
        {
          status: 400,
        }
      );
    }

    const useDatabase =
      process.env.STORAGE_PROVIDER === "database" && hasSupabaseServerConfig();

    if (action === "reset") {
      if (useDatabase) {
        await resetSupabaseDemoData();
      } else {
        await resetFileStoreDemoData();
      }

      return NextResponse.json({
        success: true,
        message: "Demo data reset completed.",
        data: {
          provider: useDatabase ? "database" : "file-store",
          action,
          timestamp: now(),
        },
      });
    }

    if (useDatabase) {
      await seedSupabaseDemoData();
    } else {
      await seedFileStoreDemoData();
    }

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully.",
      data: {
        provider: useDatabase ? "database" : "file-store",
        action,
        created: {
          strategySubmissions: 1,
          allocationRequests: 1,
          deployments: 1,
          auditEvents: 4,
        },
        timestamp: now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Demo data action failed.",
      },
      {
        status: 500,
      }
    );
  }
}