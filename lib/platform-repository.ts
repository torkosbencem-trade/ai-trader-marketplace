import * as databaseStore from "./database-store";
import * as fileStore from "./server-store";
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

export const configuredStorageProvider: StorageProvider =
  process.env.STORAGE_PROVIDER === "database" ? "database" : "file-store";

export const activeStorageProvider: StorageProvider =
  configuredStorageProvider === "database" && databaseStore.databaseStoreAvailable()
    ? "database"
    : "file-store";

function store() {
  return activeStorageProvider === "database" ? databaseStore : fileStore;
}

export const repositoryName = "AI Trader Repository";

export async function listStrategySubmissions() {
  return store().listStrategySubmissions();
}

export async function addStrategySubmission(
  payload: Parameters<typeof fileStore.addStrategySubmission>[0]
) {
  return store().addStrategySubmission(payload);
}

export async function updateStoredSubmissionStatus(
  ...args: Parameters<typeof fileStore.updateStoredSubmissionStatus>
) {
  return store().updateStoredSubmissionStatus(...args);
}

export async function listAllocationRequests() {
  return store().listAllocationRequests();
}

export async function addAllocationRequest(
  payload: Parameters<typeof fileStore.addAllocationRequest>[0]
) {
  return store().addAllocationRequest(payload);
}

export async function updateAllocationRequestStatus(
  ...args: Parameters<typeof fileStore.updateAllocationRequestStatus>
) {
  return store().updateAllocationRequestStatus(...args);
}

export async function listDeployments() {
  return store().listDeployments();
}

export async function addDeployment(
  payload: Parameters<typeof fileStore.addDeployment>[0]
) {
  return store().addDeployment(payload);
}

export async function listAuditEvents() {
  return store().listAuditEvents();
}

export async function appendAuditEvent(
  payload: Parameters<typeof fileStore.appendAuditEvent>[0]
) {
  return store().appendAuditEvent(payload);
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
    databaseConnected: activeStorageProvider === "database",
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
    nextRecommendedProvider: "Supabase PostgreSQL",
    timestamp: new Date().toISOString(),
  };
}