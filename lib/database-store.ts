import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "./supabase-server";
import type {
  AuditEvent,
  ParsedMetrics,
  ReviewStatus,
  StoredAllocationRequest,
  StoredDeployment,
  StoredSubmission,
} from "./server-store";

type StrategySubmissionRow = {
  id: string;
  status: ReviewStatus;
  name: string;
  asset_class: string;
  timeframe: string;
  risk_profile: string;
  max_drawdown: number | null;
  monthly_target: number | null;
  file_name: string | null;
  parsed_metrics: ParsedMetrics | null;
  received_at: string;
  updated_at: string | null;
};

type AllocationRequestRow = {
  id: string;
  strategy_id: string;
  strategy_name: string;
  investor_email: string;
  requested_capital: number;
  risk_acknowledgement: boolean;
  time_horizon: string;
  notes: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string | null;
};

type DeploymentRow = {
  id: string;
  allocation_request_id: string | null;
  strategy_id: string;
  strategy_name: string;
  investor_email: string | null;
  requested_capital: number;
  broker: string;
  deployment_mode: "Paper" | "Live";
  risk_state: string;
  max_allocation: number;
  max_drawdown: number;
  daily_loss_limit: number;
  status: "Prepared" | "Active" | "Paused";
  created_at: string;
  updated_at: string | null;
};

type AuditEventRow = {
  id: string;
  type: string;
  title: string;
  detail: string;
  actor: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function databaseStoreAvailable() {
  return hasSupabaseServerConfig();
}

function mapSubmission(row: StrategySubmissionRow): StoredSubmission {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    assetClass: row.asset_class,
    timeframe: row.timeframe,
    riskProfile: row.risk_profile,
    maxDrawdown: row.max_drawdown,
    monthlyTarget: row.monthly_target,
    fileName: row.file_name,
    parsedMetrics: row.parsed_metrics,
    receivedAt: row.received_at,
    updatedAt: row.updated_at,
  };
}

function mapAllocationRequest(row: AllocationRequestRow): StoredAllocationRequest {
  return {
    id: row.id,
    strategyId: row.strategy_id,
    strategyName: row.strategy_name,
    investorEmail: row.investor_email,
    requestedCapital: Number(row.requested_capital),
    riskAcknowledgement: row.risk_acknowledgement,
    timeHorizon: row.time_horizon,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDeployment(row: DeploymentRow): StoredDeployment {
  return {
    id: row.id,
    allocationRequestId: row.allocation_request_id,
    strategyId: row.strategy_id,
    strategyName: row.strategy_name,
    investorEmail: row.investor_email,
    requestedCapital: Number(row.requested_capital),
    broker: row.broker,
    deploymentMode: row.deployment_mode,
    riskState: row.risk_state,
    maxAllocation: Number(row.max_allocation),
    maxDrawdown: Number(row.max_drawdown),
    dailyLossLimit: Number(row.daily_loss_limit),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail,
    actor: row.actor,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listStrategySubmissions() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("strategy_submissions")
    .select("*")
    .order("received_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as StrategySubmissionRow[]).map(mapSubmission);
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
  const supabase = createSupabaseServerClient();

  const parsedMetrics = payload.parsedMetrics ?? null;

  const row = {
    id: `submission-${Date.now()}`,
    status: "Pending" as ReviewStatus,
    name: payload.strategyName ?? payload.name ?? "Untitled Strategy",
    asset_class: payload.assetClass ?? "Unknown",
    timeframe: payload.timeframe ?? "Unknown",
    risk_profile: payload.riskProfile ?? "Unknown",
    max_drawdown:
      parsedMetrics?.maxDrawdown ?? Number(payload.maxDrawdown ?? 0) ?? null,
    monthly_target:
      parsedMetrics?.totalReturn ?? Number(payload.monthlyTarget ?? 0) ?? null,
    file_name: payload.fileName ?? null,
    parsed_metrics: parsedMetrics,
    received_at: new Date().toISOString(),
    updated_at: null,
  };

  const { data, error } = await supabase
    .from("strategy_submissions")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await appendAuditEvent({
    type: "strategy-submission",
    title: "Strategy submitted",
    detail: `${row.name} was submitted for admin review.`,
    actor: "strategy-creator",
    metadata: {
      submissionId: row.id,
      status: row.status,
      assetClass: row.asset_class,
      timeframe: row.timeframe,
      fileName: row.file_name,
      parsedMetrics,
    },
  });

  return mapSubmission(data as StrategySubmissionRow);
}

export async function updateStoredSubmissionStatus(
  id: string,
  status: ReviewStatus,
  actor = "demo-admin",
  reason: string | null = null
) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("strategy_submissions")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  const updatedSubmission = data
    ? mapSubmission(data as StrategySubmissionRow)
    : null;

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

export async function listAllocationRequests() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("allocation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as AllocationRequestRow[]).map(mapAllocationRequest);
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
  const supabase = createSupabaseServerClient();

  const row = {
    id: `allocation-${Date.now()}`,
    strategy_id: payload.strategyId,
    strategy_name: payload.strategyName,
    investor_email: payload.investorEmail,
    requested_capital: Number(payload.requestedCapital),
    risk_acknowledgement: payload.riskAcknowledgement,
    time_horizon: payload.timeHorizon,
    notes: payload.notes ?? null,
    status: "Pending" as ReviewStatus,
    created_at: new Date().toISOString(),
    updated_at: null,
  };

  const { data, error } = await supabase
    .from("allocation_requests")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await appendAuditEvent({
    type: "allocation-request",
    title: "Allocation access requested",
    detail: `${payload.investorEmail} requested allocation access for ${payload.strategyName}.`,
    actor: "investor",
    metadata: {
      allocationRequestId: row.id,
      strategyId: row.strategy_id,
      strategyName: row.strategy_name,
      requestedCapital: row.requested_capital,
      timeHorizon: row.time_horizon,
      riskAcknowledgement: row.risk_acknowledgement,
      status: row.status,
    },
  });

  return mapAllocationRequest(data as AllocationRequestRow);
}

export async function updateAllocationRequestStatus(
  id: string,
  status: ReviewStatus,
  actor = "execution-reviewer",
  reason: string | null = null
) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("allocation_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  const updatedRequest = data
    ? mapAllocationRequest(data as AllocationRequestRow)
    : null;

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

export async function listDeployments() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DeploymentRow[]).map(mapDeployment);
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
  const supabase = createSupabaseServerClient();

  const row = {
    id: `deployment-${Date.now()}`,
    allocation_request_id: payload.allocationRequestId ?? null,
    strategy_id: payload.strategyId,
    strategy_name: payload.strategyName,
    investor_email: payload.investorEmail ?? null,
    requested_capital: Number(payload.requestedCapital ?? 0),
    broker: payload.broker,
    deployment_mode: payload.deploymentMode,
    risk_state: payload.riskState,
    max_allocation: Number(payload.maxAllocation ?? 0),
    max_drawdown: Number(payload.maxDrawdown ?? 0),
    daily_loss_limit: Number(payload.dailyLossLimit ?? 0),
    status: "Prepared" as const,
    created_at: new Date().toISOString(),
    updated_at: null,
  };

  const { data, error } = await supabase
    .from("deployments")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const deployment = mapDeployment(data as DeploymentRow);

  await appendAuditEvent({
    type: "deployment-created",
    title: "Deployment saved",
    detail: `${deployment.strategyName} deployment was saved as a portfolio allocation.`,
    actor: "execution-system",
    metadata: deployment,
  });

  return deployment;
}

export async function listAuditEvents() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AuditEventRow[]).map(mapAuditEvent);
}

export async function appendAuditEvent(
  event: Omit<AuditEvent, "id" | "createdAt">
) {
  const supabase = createSupabaseServerClient();

  const row = {
    id: `audit-${Date.now()}`,
    type: event.type,
    title: event.title,
    detail: event.detail,
    actor: event.actor,
    metadata: event.metadata ?? null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("audit_events")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapAuditEvent(data as AuditEventRow);
}