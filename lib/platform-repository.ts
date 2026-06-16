import {
  addAllocationRequest as fileAddAllocationRequest,
  addDeployment as fileAddDeployment,
  addStrategySubmission as fileAddStrategySubmission,
  appendAuditEvent as fileAppendAuditEvent,
  listAllocationRequests as fileListAllocationRequests,
  listAuditEvents as fileListAuditEvents,
  listDeployments as fileListDeployments,
  listStrategySubmissions as fileListStrategySubmissions,
  updateAllocationRequestStatus as fileUpdateAllocationRequestStatus,
  updateStoredSubmissionStatus as fileUpdateStoredSubmissionStatus,
} from "./server-store";
import { strategies } from "./strategies";

export type {
  AuditEvent,
  ParsedMetrics,
  ReviewStatus,
  StoredAllocationRequest,
  StoredDeployment,
  StoredSubmission,
} from "./server-store";

export type StorageProvider = "file-store" | "database";

export const configuredStorageProvider =
  process.env.STORAGE_PROVIDER === "database" ? "database" : "file-store";

export const activeStorageProvider: StorageProvider = "file-store";

export const repositoryName = "AI Trader Repository";

export async function listStrategySubmissions() {
  return fileListStrategySubmissions();
}

export async function addStrategySubmission(
  payload: Parameters<typeof fileAddStrategySubmission>[0]
) {
  return fileAddStrategySubmission(payload);
}

export async function updateStoredSubmissionStatus(
  ...args: Parameters<typeof fileUpdateStoredSubmissionStatus>
) {
  return fileUpdateStoredSubmissionStatus(...args);
}

export async function listAllocationRequests() {
  return fileListAllocationRequests();
}

export async function addAllocationRequest(
  payload: Parameters<typeof fileAddAllocationRequest>[0]
) {
  return fileAddAllocationRequest(payload);
}

export async function updateAllocationRequestStatus(
  ...args: Parameters<typeof fileUpdateAllocationRequestStatus>
) {
  return fileUpdateAllocationRequestStatus(...args);
}

export async function listDeployments() {
  return fileListDeployments();
}

export async function addDeployment(payload: Parameters<typeof fileAddDeployment>[0]) {
  return fileAddDeployment(payload);
}

export async function listAuditEvents() {
  return fileListAuditEvents();
}

export async function appendAuditEvent(
  payload: Parameters<typeof fileAppendAuditEvent>[0]
) {
  return fileAppendAuditEvent(payload);
}

export async function getRepositoryStatus() {
  const [
    submissions,
    allocationRequests,
    deployments,
    auditEvents,
  ] = await Promise.all([
    listStrategySubmissions(),
    listAllocationRequests(),
    listDeployments(),
    listAuditEvents(),
  ]);

  return {
    repositoryName,
    configuredStorageProvider,
    activeStorageProvider,
    databaseConnected: false,
    migrationReady: true,
    collections: {
      staticStrategies: strategies.length,
      strategySubmissions: submissions.length,
      allocationRequests: allocationRequests.length,
      deployments: deployments.length,
      auditEvents: auditEvents.length,
    },
    migrationTargets: [
      {
        table: "users",
        status: "planned",
        purpose: "Investor, creator and admin accounts.",
      },
      {
        table: "strategy_submissions",
        status: "ready-to-map",
        purpose: "Creator submitted strategy packages and parsed metrics.",
      },
      {
        table: "allocation_requests",
        status: "ready-to-map",
        purpose: "Investor allocation intent and review status.",
      },
      {
        table: "deployments",
        status: "ready-to-map",
        purpose: "Execution-prepared portfolio allocations.",
      },
      {
        table: "audit_events",
        status: "ready-to-map",
        purpose: "Immutable operational event history.",
      },
    ],
    nextRecommendedProvider: "PostgreSQL via Supabase or Neon",
    timestamp: new Date().toISOString(),
  };
}