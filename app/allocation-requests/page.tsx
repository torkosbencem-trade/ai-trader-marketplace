"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReviewStatus = "Pending" | "Approved" | "Rejected";

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

const tabs: Array<"All" | ReviewStatus> = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
];

export default function AllocationRequestsPage() {
  const [requests, setRequests] = useState<AllocationRequest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | ReviewStatus>("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/allocation-requests", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load allocation requests.");
      }

      const loadedRequests = (payload.data ?? []) as AllocationRequest[];

      setRequests(loadedRequests);

      if (loadedRequests.length > 0) {
        setSelectedId((current) =>
          loadedRequests.some((request) => request.id === current)
            ? current
            : loadedRequests[0].id
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load allocation requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (activeTab === "All") {
      return requests;
    }

    return requests.filter((request) => request.status === activeTab);
  }, [requests, activeTab]);

  const selectedRequest =
    requests.find((request) => request.id === selectedId) ?? requests[0];

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected"
  ).length;

  const totalCapital = requests.reduce(
    (sum, request) => sum + Number(request.requestedCapital ?? 0),
    0
  );

  async function updateStatus(id: string, status: ReviewStatus) {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/allocation-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reviewer: "execution-reviewer",
          reason: `Allocation request moved to ${status}.`,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Allocation review update failed.");
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, status } : request
        )
      );

      setMessage(payload.message ?? `Allocation request updated to ${status}.`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Allocation review update failed."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Allocation request review
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Review investor access before execution.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Approve or reject investor allocation requests before they move
                into execution preparation. Every decision is stored in the audit
                log.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur md:grid-cols-4">
              <Metric label="Pending" value={String(pendingCount)} />
              <Metric label="Approved" value={String(approvedCount)} />
              <Metric label="Rejected" value={String(rejectedCount)} />
              <Metric
                label="Requested capital"
                value={`$${Math.round(totalCapital / 1000)}K`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_430px] lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-zinc-500">Request queue</p>
              <h2 className="mt-1 text-2xl font-semibold">
                Investor allocation pipeline
              </h2>

              <p className="mt-2 text-xs text-zinc-600">
                {loading
                  ? "Loading allocation requests..."
                  : "Loaded from /api/allocation-requests."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadRequests}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Refresh
              </button>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-4 py-2 text-sm transition ${
                      activeTab === tab
                        ? "bg-emerald-400 text-black"
                        : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-4">
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                onClick={() => setSelectedId(request.id)}
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

                      <span className={statusClass(request.status)}>
                        {request.status}
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
                      label="Risk ack."
                      value={request.riskAcknowledgement ? "Yes" : "No"}
                    />
                    <SmallMetric
                      label="Created"
                      value={new Date(request.createdAt).toLocaleDateString()}
                    />
                    <SmallMetric
                      label="Strategy ID"
                      value={request.strategyId.slice(0, 12)}
                    />
                  </div>
                </div>
              </button>
            ))}

            {!loading && filteredRequests.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center">
                <p className="text-lg font-medium">No allocation requests</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Submit an allocation request from a marketplace strategy
                  report first.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          {selectedRequest ? (
            <>
              <p className="text-sm text-zinc-500">Selected request</p>

              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">
                    {selectedRequest.strategyName}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {selectedRequest.investorEmail}
                  </p>
                </div>

                <span className={statusClass(selectedRequest.status)}>
                  {selectedRequest.status}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <Row label="Request ID" value={selectedRequest.id} />
                <Row label="Strategy ID" value={selectedRequest.strategyId} />
                <Row
                  label="Requested capital"
                  value={`$${Number(
                    selectedRequest.requestedCapital
                  ).toLocaleString()}`}
                />
                <Row label="Time horizon" value={selectedRequest.timeHorizon} />
                <Row
                  label="Risk acknowledgement"
                  value={selectedRequest.riskAcknowledgement ? "Accepted" : "Missing"}
                />
                <Row
                  label="Created"
                  value={new Date(selectedRequest.createdAt).toLocaleString()}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-medium text-zinc-300">
                  Review checklist
                </p>

                <div className="mt-4 space-y-4">
                  <ChecklistItem
                    title="Investor email available"
                    active={selectedRequest.investorEmail.includes("@")}
                  />
                  <ChecklistItem
                    title="Capital amount submitted"
                    active={selectedRequest.requestedCapital > 0}
                  />
                  <ChecklistItem
                    title="Risk acknowledgement accepted"
                    active={selectedRequest.riskAcknowledgement}
                  />
                  <ChecklistItem
                    title="Strategy reference available"
                    active={Boolean(selectedRequest.strategyId)}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateStatus(selectedRequest.id, "Approved")}
                  className="rounded-2xl bg-emerald-400 px-4 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Approve
                </button>

                <button
                  onClick={() => updateStatus(selectedRequest.id, "Rejected")}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  Reject
                </button>
              </div>

              <button
                onClick={() => updateStatus(selectedRequest.id, "Pending")}
                className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                Move back to pending
              </button>

              <Link
                href={`/marketplace/${selectedRequest.strategyId}`}
                className="mt-6 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                Open strategy report
              </Link>

              <Link
                href="/execution"
                className="mt-3 block rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Open execution center
              </Link>

              <Link
                href="/system/audit"
                className="mt-3 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]"
              >
                View audit log
              </Link>
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              Select an allocation request to review.
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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

function ChecklistItem({ title, active }: { title: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
          active
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
        }`}
      >
        {active ? "✓" : "!"}
      </div>

      <p className={active ? "text-sm text-zinc-200" : "text-sm text-amber-300"}>
        {title}
      </p>
    </div>
  );
}

function statusClass(status: ReviewStatus) {
  if (status === "Approved") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300";
  }

  if (status === "Pending") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300";
  }

  return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300";
}