"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReviewStatus = "Pending" | "Approved" | "Rejected";
type DeploymentMode = "Paper" | "Live";

type FirewallCheck = {
  passed: boolean;
  code: string;
  message: string;
};

type AllocationRequest = {
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

const brokers = [
  {
    id: "alpaca",
    name: "Alpaca",
    type: "Equities / Paper",
    status: "Sandbox ready",
  },
  {
    id: "ibkr",
    name: "Interactive Brokers",
    type: "Multi-asset",
    status: "Connector planned",
  },
  {
    id: "binance",
    name: "Binance",
    type: "Crypto",
    status: "API planned",
  },
  {
    id: "oanda",
    name: "OANDA",
    type: "Forex",
    status: "API planned",
  },
];

export default function ExecutionPage() {
  const [requests, setRequests] = useState<AllocationRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedBrokerId, setSelectedBrokerId] = useState("alpaca");
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>("Paper");
  const [maxAllocation, setMaxAllocation] = useState("50000");
  const [maxDrawdown, setMaxDrawdown] = useState("8");
  const [dailyLossLimit, setDailyLossLimit] = useState("2.5");

  const [loading, setLoading] = useState(true);
  const [deploymentMessage, setDeploymentMessage] = useState("");
  const [deploymentError, setDeploymentError] = useState("");
  const [deploymentPayload, setDeploymentPayload] = useState("");
  const [firewallChecks, setFirewallChecks] = useState<FirewallCheck[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function loadApprovedRequests() {
    setLoading(true);
    setDeploymentError("");

    try {
      const response = await fetch("/api/allocation-requests", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load allocation requests.");
      }

      const approved = ((payload.data ?? []) as AllocationRequest[]).filter(
        (request) => request.status === "Approved"
      );

      setRequests(approved);

      if (approved.length > 0) {
        setSelectedRequestId((current) =>
          approved.some((request) => request.id === current)
            ? current
            : approved[0].id
        );
      }
    } catch (error) {
      setDeploymentError(
        error instanceof Error
          ? error.message
          : "Failed to load allocation requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovedRequests();
  }, []);

  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) ?? requests[0];

  const selectedBroker =
    brokers.find((broker) => broker.id === selectedBrokerId) ?? brokers[0];

  const riskState = useMemo(() => {
    if (!selectedRequest) {
      return "Blocked";
    }

    if (!selectedRequest.riskAcknowledgement) {
      return "Blocked";
    }

    if (deploymentMode === "Live") {
      return "Review";
    }

    if (Number(maxAllocation) < Number(selectedRequest.requestedCapital)) {
      return "Blocked";
    }

    if (Number(maxDrawdown) > 15 || Number(dailyLossLimit) > 5) {
      return "Review";
    }

    return "Passed";
  }, [
    selectedRequest,
    deploymentMode,
    maxAllocation,
    maxDrawdown,
    dailyLossLimit,
  ]);

  const executionFirewallPreview = useMemo<FirewallCheck[]>(() => {
    const checks: FirewallCheck[] = [];

    checks.push({
      passed: Boolean(selectedRequest),
      code: "allocation_selected",
      message: selectedRequest
        ? "Approved allocation request selected."
        : "No approved allocation request selected.",
    });

    checks.push({
      passed: selectedRequest?.status === "Approved",
      code: "allocation_approved",
      message:
        selectedRequest?.status === "Approved"
          ? "Allocation request is Approved."
          : "Allocation request must be Approved.",
    });

    checks.push({
      passed: Boolean(selectedRequest?.riskAcknowledgement),
      code: "risk_acknowledgement",
      message: selectedRequest?.riskAcknowledgement
        ? "Investor accepted risk acknowledgement."
        : "Risk acknowledgement is missing.",
    });

    checks.push({
      passed: deploymentMode === "Paper",
      code: "paper_only",
      message:
        deploymentMode === "Paper"
          ? "Paper deployment mode selected."
          : "Live deployment is disabled for now.",
    });

    checks.push({
      passed:
        Boolean(selectedRequest) &&
        Number(maxAllocation) >= Number(selectedRequest?.requestedCapital ?? 0),
      code: "allocation_limit",
      message:
        selectedRequest &&
        Number(maxAllocation) >= Number(selectedRequest.requestedCapital)
          ? "Max allocation covers requested capital."
          : "Max allocation must be greater than or equal to requested capital.",
    });

    checks.push({
      passed: Number(maxDrawdown) <= 15 && Number(dailyLossLimit) <= 5,
      code: "risk_guardrails",
      message:
        Number(maxDrawdown) <= 15 && Number(dailyLossLimit) <= 5
          ? "Drawdown and daily loss guardrails are within limits."
          : "Guardrails require additional review.",
    });

    return checks;
  }, [
    selectedRequest,
    deploymentMode,
    maxAllocation,
    maxDrawdown,
    dailyLossLimit,
  ]);

  const firewallBlocked = executionFirewallPreview.some(
    (check) => !check.passed
  );

  async function prepareDeployment() {
    if (!selectedRequest) {
      setDeploymentError("No approved allocation request selected.");
      return;
    }

    setSubmitting(true);
    setDeploymentMessage("");
    setDeploymentError("");
    setDeploymentPayload("");
    setFirewallChecks([]);

    try {
      const response = await fetch("/api/execution/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allocationRequestId: selectedRequest.id,
          strategyId: selectedRequest.strategyId,
          strategyName: selectedRequest.strategyName,
          investorEmail: selectedRequest.investorEmail,
          requestedCapital: selectedRequest.requestedCapital,
          broker: selectedBroker.name,
          deploymentMode,
          riskState,
          maxAllocation: Number(maxAllocation),
          maxDrawdown: Number(maxDrawdown),
          dailyLossLimit: Number(dailyLossLimit),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setFirewallChecks(payload.data?.checks ?? []);
        throw new Error(payload.error ?? "Deployment preparation failed.");
      }

      setDeploymentMessage(
        payload.message ?? "Deployment package prepared successfully."
      );

      setFirewallChecks(payload.meta?.firewallChecks ?? []);
      setDeploymentPayload(JSON.stringify(payload.data, null, 2));
    } catch (error) {
      setDeploymentError(
        error instanceof Error ? error.message : "Deployment preparation failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const totalApprovedCapital = requests.reduce(
    (sum, request) => sum + Number(request.requestedCapital ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Execution control center
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Prepare deployment from approved allocation requests.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Approved investor allocation requests can now move into the
                execution preparation workflow. This is still a controlled mock
                deployment layer, not live broker trading.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur md:grid-cols-4">
              <HeaderMetric label="Approved requests" value={String(requests.length)} />
              <HeaderMetric
                label="Capital queue"
                value={`$${Math.round(totalApprovedCapital / 1000)}K`}
              />
              <HeaderMetric label="Broker" value={selectedBroker.name} />
              <HeaderMetric label="Risk" value={riskState} positive={riskState === "Passed"} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_430px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Approved allocation queue</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Select request for execution
                </h2>
                <p className="mt-2 text-xs text-zinc-600">
                  Loaded from /api/allocation-requests where status is Approved.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={loadApprovedRequests}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  Refresh
                </button>

                <Link
                  href="/allocation-requests"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  Review requests
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {loading && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
                  <p className="text-sm text-zinc-400">
                    Loading approved allocation requests...
                  </p>
                </div>
              )}

              {!loading &&
                requests.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className={`rounded-3xl border p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                      selectedRequest?.id === request.id
                        ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-white">
                            {request.strategyName}
                          </h3>

                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                            Approved
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-500">
                          {request.investorEmail} · {request.timeHorizon}
                        </p>

                        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                          {request.notes || "No additional investor notes provided."}
                        </p>
                      </div>

                      <div className="grid min-w-[230px] grid-cols-2 gap-3">
                        <SmallMetric
                          label="Capital"
                          value={`$${Number(
                            request.requestedCapital
                          ).toLocaleString()}`}
                        />
                        <SmallMetric
                          label="Created"
                          value={new Date(request.createdAt).toLocaleDateString()}
                        />
                        <SmallMetric label="Risk ack." value="Accepted" />
                        <SmallMetric
                          label="Strategy ID"
                          value={request.strategyId.slice(0, 12)}
                        />
                      </div>
                    </div>
                  </button>
                ))}

              {!loading && requests.length === 0 && (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-8 text-center">
                  <p className="text-lg font-medium text-amber-300">
                    No approved allocation requests
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Approve an investor allocation request first, then refresh this page.
                  </p>
                  <Link
                    href="/allocation-requests"
                    className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    Open allocation review
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-zinc-500">Broker selection</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Deployment connector
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {brokers.map((broker) => (
                <button
                  key={broker.id}
                  onClick={() => setSelectedBrokerId(broker.id)}
                  className={`rounded-2xl border p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                    selectedBrokerId === broker.id
                      ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <p className="font-semibold text-white">{broker.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{broker.type}</p>
                  <p className="mt-4 text-xs text-emerald-300">
                    {broker.status}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Deployment package</p>

          {selectedRequest ? (
            <>
              <h3 className="mt-1 text-2xl font-semibold">
                {selectedRequest.strategyName}
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                {selectedRequest.investorEmail}
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <Row label="Allocation request" value={selectedRequest.id} />
                <Row label="Strategy ID" value={selectedRequest.strategyId} />
                <Row
                  label="Requested capital"
                  value={`$${Number(
                    selectedRequest.requestedCapital
                  ).toLocaleString()}`}
                />
                <Row label="Broker" value={selectedBroker.name} />
                <Row label="Risk state" value={riskState} />
              </div>

              <div className="mt-6 grid gap-4">
                <Field label="Deployment mode">
                  <select
                    value={deploymentMode}
                    onChange={(event) =>
                      setDeploymentMode(event.target.value as DeploymentMode)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#0B0F17] px-4 py-4 text-sm text-white outline-none"
                  >
                    <option>Paper</option>
                    <option>Live</option>
                  </select>
                </Field>

                <Field label="Max allocation">
                  <input
                    value={maxAllocation}
                    onChange={(event) => setMaxAllocation(event.target.value)}
                    type="number"
                    min="1"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Max drawdown guardrail (%)">
                  <input
                    value={maxDrawdown}
                    onChange={(event) => setMaxDrawdown(event.target.value)}
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Daily loss limit (%)">
                  <input
                    value={dailyLossLimit}
                    onChange={(event) => setDailyLossLimit(event.target.value)}
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
                  />
                </Field>
              </div>

              {riskState === "Review" && (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-6 text-amber-300">
                  This deployment requires extra review because live mode,
                  allocation size or guardrails exceed the default safe path.
                </div>
              )}

              {riskState === "Blocked" && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm leading-6 text-red-300">
                  Deployment is blocked until a valid approved allocation request
                  with risk acknowledgement is selected.
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Execution Firewall Preview
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Local pre-check before the API creates a deployment package.
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      firewallBlocked
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {firewallBlocked ? "Blocked" : "Passed"}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {executionFirewallPreview.map((check) => (
                    <div
                      key={check.code}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs"
                    >
                      <span
                        className={
                          check.passed ? "text-emerald-300" : "text-red-300"
                        }
                      >
                        {check.passed ? "✓" : "×"}
                      </span>
                      <span className="text-zinc-400">{check.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {firewallChecks.length > 0 && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-[#020409] p-4">
                  <p className="text-sm font-semibold text-white">
                    API Firewall Result
                  </p>
                  <div className="mt-4 space-y-2">
                    {firewallChecks.map((check) => (
                      <div
                        key={check.code}
                        className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs"
                      >
                        <span
                          className={
                            check.passed ? "text-emerald-300" : "text-red-300"
                          }
                        >
                          {check.passed ? "✓" : "×"}
                        </span>
                        <span className="text-zinc-400">{check.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={prepareDeployment}
                disabled={submitting || firewallBlocked}
                className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Preparing..." : "Prepare deployment package"}
              </button>

              {deploymentMessage && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300">
                  {deploymentMessage}
                </div>
              )}

              {deploymentError && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                  {deploymentError}
                </div>
              )}

              {deploymentPayload && (
                <pre className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#020409] p-4 text-xs leading-5 text-zinc-400">
                  {deploymentPayload}
                </pre>
              )}

              <Link
                href="/system/audit"
                className="mt-5 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]"
              >
                View audit log
              </Link>
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">
                No approved allocation request selected.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function HeaderMetric({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-xl font-semibold ${
          positive ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[220px] truncate text-right font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-zinc-400">{label}</span>
      {children}
    </label>
  );
}