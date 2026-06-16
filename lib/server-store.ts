import { promises as fs } from "fs";
import path from "path";

export type ReviewStatus = "Pending" | "Approved" | "Rejected";

export type ParsedMetrics = {
  detectedRows: number;
  trades: number;
  winRate: number;
  totalReturn: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpe: number;
  parserMode: "csv" | "json" | "fallback";
  equitySeries?: number[];
  drawdownSeries?: number[];
};

export type StoredSubmission = {
  id: string;
  status: ReviewStatus;
  name: string;
  assetClass: string;
  timeframe: string;
  riskProfile: string;
  maxDrawdown: string | number | null;
  monthlyTarget: string | number | null;
  fileName: string | null;
  receivedAt: string;
  updatedAt: string | null;
  parsedMetrics?: ParsedMetrics | null;
};

export type StoredAllocationRequest = {
  id: string;
  strategyId: string;
  strategyName: string;
  investorEmail: string;
  requestedCapital: number;
  riskAcknowledgement: boolean;
  timeHorizon: string;
  notes: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string | null;
};

export type StoredDeployment = {
  id: string;
  allocationRequestId: string | null;
  strategyId: string;
  strategyName: string;
  investorEmail: string | null;
  requestedCapital: number;
  broker: string;
  deploymentMode: "Paper" | "Live";
  riskState: string;
  maxAllocation: number;
  maxDrawdown: number;
  dailyLossLimit: number;
  status: "Prepared" | "Active" | "Paused";
  createdAt: string;
  updatedAt: string | null;
};

export type AuditEvent = {
  id: string;
  type: string;
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

const dataDir = path.join(process.cwd(), "data");

async function ensureDataFile(fileName: string, fallback: unknown) {
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, fileName);

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }

  return filePath;
}

async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = await ensureDataFile(fileName, fallback);

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(fileName: string, data: T) {
  const filePath = await ensureDataFile(fileName, []);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function listStrategySubmissions() {
  return readJsonFile<StoredSubmission[]>("strategy-submissions.json", []);
}

export async function listAllocationRequests() {
  return readJsonFile<StoredAllocationRequest[]>("allocation-requests.json", []);
}

export async function listDeployments() {
  return readJsonFile<StoredDeployment[]>("deployments.json", []);
}

export async function listAuditEvents() {
  return readJsonFile<AuditEvent[]>("audit-log.json", []);
}

export async function appendAuditEvent(
  event: Omit<AuditEvent, "id" | "createdAt">
) {
  const current = await listAuditEvents();

  const auditEvent: AuditEvent = {
    id: `audit-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...event,
  };

  const next = [auditEvent, ...current].slice(0, 200);

  await writeJsonFile("audit-log.json", next);

  return auditEvent;
}

export async function addStrategySubmission(payload: {
  strategyName?: string;
  name?: string;
  assetClass?: string;
  timeframe?: string;
  riskProfile?: string;
  maxDrawdown?: string | number | null;
  monthlyTarget?: string | number | null;
  fileName?: string | null;
  parsedMetrics?: ParsedMetrics | null;
}) {
  const current = await listStrategySubmissions();

  const submission: StoredSubmission = {
    id: `submission-${Date.now()}`,
    status: "Pending",
    name: payload.strategyName ?? payload.name ?? "Untitled Strategy",
    assetClass: payload.assetClass ?? "Unknown",
    timeframe: payload.timeframe ?? "Unknown",
    riskProfile: payload.riskProfile ?? "Unknown",
    maxDrawdown: payload.parsedMetrics?.maxDrawdown ?? payload.maxDrawdown ?? null,
    monthlyTarget: payload.parsedMetrics?.totalReturn ?? payload.monthlyTarget ?? null,
    fileName: payload.fileName ?? null,
    parsedMetrics: payload.parsedMetrics ?? null,
    receivedAt: new Date().toISOString(),
    updatedAt: null,
  };

  await writeJsonFile("strategy-submissions.json", [
    submission,
    ...current,
  ]);

  await appendAuditEvent({
    type: "strategy-submission",
    title: "Strategy submitted",
    detail: `${submission.name} was submitted for admin review.`,
    actor: "strategy-creator",
    metadata: {
      submissionId: submission.id,
      status: submission.status,
      assetClass: submission.assetClass,
      timeframe: submission.timeframe,
      fileName: submission.fileName,
      parsedMetrics: submission.parsedMetrics,
    },
  });

  return submission;
}

export async function updateStoredSubmissionStatus(
  id: string,
  status: ReviewStatus,
  actor = "demo-admin",
  reason: string | null = null
) {
  const current = await listStrategySubmissions();

  let updatedSubmission: StoredSubmission | null = null;

  const next = current.map((submission) => {
    if (submission.id !== id) {
      return submission;
    }

    updatedSubmission = {
      ...submission,
      status,
      updatedAt: new Date().toISOString(),
    };

    return updatedSubmission;
  });

  await writeJsonFile("strategy-submissions.json", next);

  await appendAuditEvent({
    type: "admin-review",
    title: "Submission status changed",
    detail: `Submission ${id} changed to ${status}.`,
    actor,
    metadata: {
      submissionId: id,
      status,
      reason,
      persisted: Boolean(updatedSubmission),
    },
  });

  return updatedSubmission;
}

export async function addAllocationRequest(payload: {
  strategyId: string;
  strategyName: string;
  investorEmail: string;
  requestedCapital: number;
  riskAcknowledgement: boolean;
  timeHorizon: string;
  notes?: string | null;
}) {
  const current = await listAllocationRequests();

  const allocationRequest: StoredAllocationRequest = {
    id: `allocation-${Date.now()}`,
    strategyId: payload.strategyId,
    strategyName: payload.strategyName,
    investorEmail: payload.investorEmail,
    requestedCapital: payload.requestedCapital,
    riskAcknowledgement: payload.riskAcknowledgement,
    timeHorizon: payload.timeHorizon,
    notes: payload.notes ?? null,
    status: "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };

  await writeJsonFile("allocation-requests.json", [
    allocationRequest,
    ...current,
  ]);

  await appendAuditEvent({
    type: "allocation-request",
    title: "Allocation access requested",
    detail: `${payload.investorEmail} requested allocation access for ${payload.strategyName}.`,
    actor: "investor",
    metadata: {
      allocationRequestId: allocationRequest.id,
      strategyId: allocationRequest.strategyId,
      strategyName: allocationRequest.strategyName,
      requestedCapital: allocationRequest.requestedCapital,
      timeHorizon: allocationRequest.timeHorizon,
      riskAcknowledgement: allocationRequest.riskAcknowledgement,
      status: allocationRequest.status,
    },
  });

  return allocationRequest;
}

export async function updateAllocationRequestStatus(
  id: string,
  status: ReviewStatus,
  actor = "execution-reviewer",
  reason: string | null = null
) {
  const current = await listAllocationRequests();

  const existingRequest =
    current.find((request) => request.id === id) ?? null;

  const updatedRequest: StoredAllocationRequest | null = existingRequest
    ? {
        ...existingRequest,
        status,
        updatedAt: new Date().toISOString(),
      }
    : null;

  const next = current.map((request) =>
    request.id === id && updatedRequest ? updatedRequest : request
  );

  await writeJsonFile("allocation-requests.json", next);

  await appendAuditEvent({
    type: "allocation-review",
    title: "Allocation request reviewed",
    detail: `Allocation request ${id} changed to ${status}.`,
    actor,
    metadata: {
      allocationRequestId: id,
      status,
      reason,
      persisted: Boolean(updatedRequest),
      strategyId: updatedRequest ? updatedRequest.strategyId : null,
      strategyName: updatedRequest ? updatedRequest.strategyName : null,
      investorEmail: updatedRequest ? updatedRequest.investorEmail : null,
      requestedCapital: updatedRequest ? updatedRequest.requestedCapital : null,
    },
  });

  return updatedRequest;
}
export async function addDeployment(payload: {
  allocationRequestId?: string | null;
  strategyId: string;
  strategyName: string;
  investorEmail?: string | null;
  requestedCapital?: number;
  broker: string;
  deploymentMode: "Paper" | "Live";
  riskState: string;
  maxAllocation: number;
  maxDrawdown: number;
  dailyLossLimit: number;
}) {
  const current = await listDeployments();

  const deployment: StoredDeployment = {
    id: `deployment-${Date.now()}`,
    allocationRequestId: payload.allocationRequestId ?? null,
    strategyId: payload.strategyId,
    strategyName: payload.strategyName,
    investorEmail: payload.investorEmail ?? null,
    requestedCapital: Number(payload.requestedCapital ?? 0),
    broker: payload.broker,
    deploymentMode: payload.deploymentMode,
    riskState: payload.riskState,
    maxAllocation: Number(payload.maxAllocation ?? 0),
    maxDrawdown: Number(payload.maxDrawdown ?? 0),
    dailyLossLimit: Number(payload.dailyLossLimit ?? 0),
    status: "Prepared",
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };

  await writeJsonFile("deployments.json", [deployment, ...current]);

  await appendAuditEvent({
    type: "deployment-created",
    title: "Deployment saved",
    detail: `${deployment.strategyName} deployment was saved as a portfolio allocation.`,
    actor: "execution-system",
    metadata: deployment,
  });

  return deployment;
}