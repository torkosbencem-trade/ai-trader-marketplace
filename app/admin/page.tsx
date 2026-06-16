"use client";

import { useEffect, useMemo, useState } from "react";

type ReviewStatus = "Pending" | "Approved" | "Rejected";
type RiskRating = "Low" | "Medium" | "High";

type ParsedMetrics = {
  detectedRows: number;
  trades: number;
  winRate: number;
  totalReturn: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpe: number;
  parserMode: "csv" | "json" | "fallback";
};

type Submission = {
  id: string;
  name: string;
  manager: string;
  submittedAt: string;
  assetClass: string;
  timeframe: string;
  monthlyReturn: number;
  maxDrawdown: number;
  sharpe: number;
  trades: number;
  risk: RiskRating;
  status: ReviewStatus;
  documentation: "Complete" | "Partial" | "Missing";
  brokerEvidence: "Verified" | "Uploaded" | "Missing";
  notes: string;
  source: "demo" | "file-store";
  parsedMetrics: ParsedMetrics | null;
};

type ApiSubmission = {
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

const initialSubmissions: Submission[] = [
  {
    id: "institutional-momentum-alpha",
    name: "Institutional Momentum Alpha",
    manager: "NorthBridge Quant",
    submittedAt: "2026-06-16",
    assetClass: "Crypto",
    timeframe: "1h",
    monthlyReturn: 7.8,
    maxDrawdown: 6.9,
    sharpe: 2.04,
    trades: 612,
    risk: "Medium",
    status: "Pending",
    documentation: "Complete",
    brokerEvidence: "Uploaded",
    notes:
      "Strong return profile. Requires broker statement verification before marketplace publication.",
    source: "demo",
    parsedMetrics: null,
  },
  {
    id: "fx-carry-grid",
    name: "FX Carry Grid",
    manager: "Aster Capital Systems",
    submittedAt: "2026-06-15",
    assetClass: "Forex",
    timeframe: "4h",
    monthlyReturn: 4.1,
    maxDrawdown: 3.7,
    sharpe: 1.61,
    trades: 1184,
    risk: "Low",
    status: "Approved",
    documentation: "Complete",
    brokerEvidence: "Verified",
    notes:
      "Conservative risk profile and stable execution history. Suitable for low-risk marketplace category.",
    source: "demo",
    parsedMetrics: null,
  },
  {
    id: "micro-volatility-sniper",
    name: "Micro Volatility Sniper",
    manager: "Obsidian Execution",
    submittedAt: "2026-06-14",
    assetClass: "Crypto",
    timeframe: "5m",
    monthlyReturn: 18.4,
    maxDrawdown: 19.2,
    sharpe: 1.22,
    trades: 8420,
    risk: "High",
    status: "Rejected",
    documentation: "Partial",
    brokerEvidence: "Missing",
    notes:
      "Risk profile is too aggressive. Missing broker evidence and drawdown exceeds current platform limit.",
    source: "demo",
    parsedMetrics: null,
  },
  {
    id: "macro-regime-shift",
    name: "Macro Regime Shift",
    manager: "Helix Research Desk",
    submittedAt: "2026-06-13",
    assetClass: "Multi-Asset",
    timeframe: "1D",
    monthlyReturn: 5.6,
    maxDrawdown: 5.1,
    sharpe: 1.73,
    trades: 188,
    risk: "Medium",
    status: "Pending",
    documentation: "Complete",
    brokerEvidence: "Uploaded",
    notes:
      "Good institutional-style strategy. Needs additional stress-test review across rate shock scenarios.",
    source: "demo",
    parsedMetrics: null,
  },
];

const tabs: Array<"All" | ReviewStatus> = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
];

function normalizeApiSubmission(item: ApiSubmission): Submission {
  const parsedMetrics = item.parsedMetrics ?? null;
  const maxDrawdown = parsedMetrics?.maxDrawdown ?? Number(item.maxDrawdown ?? 0);
  const monthlyReturn =
    parsedMetrics?.totalReturn ?? Number(item.monthlyTarget ?? 0);

  let risk: RiskRating = "Medium";

  if (maxDrawdown > 15) {
    risk = "High";
  } else if (maxDrawdown > 0 && maxDrawdown <= 5) {
    risk = "Low";
  }

  return {
    id: item.id,
    name: item.name,
    manager: "Submitted via Strategy Builder",
    submittedAt: item.receivedAt ? item.receivedAt.slice(0, 10) : "Unknown",
    assetClass: item.assetClass,
    timeframe: item.timeframe,
    monthlyReturn,
    maxDrawdown,
    sharpe: parsedMetrics?.sharpe ?? 0,
    trades: parsedMetrics?.trades ?? 0,
    risk,
    status: item.status,
    documentation: item.fileName ? "Complete" : "Partial",
    brokerEvidence: item.fileName ? "Uploaded" : "Missing",
    notes:
      parsedMetrics
        ? "Live file-store submission with parsed backtest metrics. Requires admin review, evidence validation and marketplace approval."
        : "Live file-store submission from Strategy Builder. Requires admin review, evidence validation and marketplace approval.",
    source: "file-store",
    parsedMetrics,
  };
}

export default function AdminPage() {
  const [submissions, setSubmissions] =
    useState<Submission[]>(initialSubmissions);

  const [selectedId, setSelectedId] = useState(initialSubmissions[0].id);
  const [activeTab, setActiveTab] = useState<"All" | ReviewStatus>("All");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSubmissions() {
    setLoading(true);
    setAdminError("");

    try {
      const response = await fetch("/api/strategy-submissions", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load submissions.");
      }

      const storedSubmissions = (payload.data ?? []).map(
        normalizeApiSubmission
      ) as Submission[];

      const storedIds = new Set(
        storedSubmissions.map((submission) => submission.id)
      );

      const demoSubmissions = initialSubmissions.filter(
        (submission) => !storedIds.has(submission.id)
      );

      const merged = [...storedSubmissions, ...demoSubmissions];

      setSubmissions(merged);

      if (merged.length > 0 && !merged.some((item) => item.id === selectedId)) {
        setSelectedId(merged[0].id);
      }
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Failed to load submissions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedId) ??
    submissions[0];

  const filteredSubmissions = useMemo(() => {
    if (activeTab === "All") {
      return submissions;
    }

    return submissions.filter((submission) => submission.status === activeTab);
  }, [activeTab, submissions]);

  const pendingCount = submissions.filter(
    (submission) => submission.status === "Pending"
  ).length;

  const approvedCount = submissions.filter(
    (submission) => submission.status === "Approved"
  ).length;

  const rejectedCount = submissions.filter(
    (submission) => submission.status === "Rejected"
  ).length;

  async function updateStatus(id: string, status: ReviewStatus) {
    setAdminMessage("");
    setAdminError("");

    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reviewer: "demo-admin",
          reason: `Admin changed status to ${status}.`,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Admin review update failed.");
      }

      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === id ? { ...submission, status } : submission
        )
      );

      setAdminMessage(payload.message ?? `Submission updated to ${status}.`);
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Admin review update failed."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Admin review console
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Review, approve and govern submitted trading strategies.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Control marketplace quality with file-store submissions, risk
                checks, documentation review, broker evidence validation and
                approval workflows.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <Metric label="Pending" value={String(pendingCount)} />
              <Metric label="Approved" value={String(approvedCount)} />
              <Metric label="Rejected" value={String(rejectedCount)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Submission queue</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Strategy review pipeline
                </h2>

                <p className="mt-2 text-xs text-zinc-600">
                  {loading
                    ? "Loading file-store submissions..."
                    : "Live Strategy Builder submissions are loaded from /api/strategy-submissions."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={loadSubmissions}
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

            {adminError && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {adminError}
              </div>
            )}

            <div className="mt-6 grid gap-4">
              {filteredSubmissions.map((submission) => (
                <button
                  key={submission.id}
                  onClick={() => setSelectedId(submission.id)}
                  className={`rounded-3xl border p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05] ${
                    selectedSubmission.id === submission.id
                      ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-white">
                          {submission.name}
                        </h3>

                        <span className={statusClass(submission.status)}>
                          {submission.status}
                        </span>

                        <span className={riskClass(submission.risk)}>
                          {submission.risk} risk
                        </span>

                        <span className={sourceClass(submission.source)}>
                          {submission.source === "file-store"
                            ? "Live submission"
                            : "Demo"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-zinc-500">
                        {submission.manager} · submitted {submission.submittedAt}
                      </p>

                      <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                        {submission.notes}
                      </p>
                    </div>

                    <div className="grid min-w-[260px] grid-cols-2 gap-3">
                      <SmallMetric
                        label="Monthly target"
                        value={`${submission.monthlyReturn}%`}
                      />
                      <SmallMetric
                        label="Max DD"
                        value={`${submission.maxDrawdown}%`}
                      />
                      <SmallMetric
                        label="Sharpe"
                        value={
                          submission.sharpe > 0
                            ? submission.sharpe.toFixed(2)
                            : "Pending"
                        }
                      />
                      <SmallMetric
                        label="Trades"
                        value={
                          submission.trades > 0
                            ? submission.trades.toLocaleString()
                            : "Pending"
                        }
                      />
                    </div>
                  </div>
                </button>
              ))}

              {filteredSubmissions.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center">
                  <p className="text-lg font-medium">No submissions found</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Change the review filter or submit a new strategy from
                    Strategy Builder.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Selected submission</p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">
                {selectedSubmission.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                {selectedSubmission.manager}
              </p>
            </div>

            <span className={statusClass(selectedSubmission.status)}>
              {selectedSubmission.status}
            </span>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <Row label="Source" value={selectedSubmission.source} />
            <Row label="Asset class" value={selectedSubmission.assetClass} />
            <Row label="Timeframe" value={selectedSubmission.timeframe} />
            <Row
              label="Monthly target"
              value={`${selectedSubmission.monthlyReturn}%`}
            />
            <Row
              label="Max drawdown"
              value={`${selectedSubmission.maxDrawdown}%`}
            />
            <Row
              label="Sharpe"
              value={
                selectedSubmission.sharpe > 0
                  ? selectedSubmission.sharpe.toFixed(2)
                  : "Pending validation"
              }
            />
            <Row
              label="Documentation"
              value={selectedSubmission.documentation}
            />
            <Row
              label="Broker evidence"
              value={selectedSubmission.brokerEvidence}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Compliance checklist
            </p>

            <div className="mt-4 space-y-4">
              <ChecklistItem
                title="Documentation complete"
                active={selectedSubmission.documentation === "Complete"}
              />
              <ChecklistItem
                title="Broker evidence uploaded"
                active={selectedSubmission.brokerEvidence !== "Missing"}
              />
              <ChecklistItem
                title="Drawdown within platform limit"
                active={selectedSubmission.maxDrawdown <= 15}
              />
              <ChecklistItem
                title="Sharpe above minimum threshold"
                active={
                  selectedSubmission.sharpe === 0 ||
                  selectedSubmission.sharpe >= 1.5
                }
              />
            </div>
          </div>

          {selectedSubmission.parsedMetrics && (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-300">
                    Backtest validation
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Metrics parsed from uploaded CSV/JSON backtest file.
                  </p>
                </div>

                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {selectedSubmission.parsedMetrics.parserMode}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <SmallMetric
                  label="Detected rows"
                  value={String(selectedSubmission.parsedMetrics.detectedRows)}
                />
                <SmallMetric
                  label="Trades"
                  value={String(selectedSubmission.parsedMetrics.trades)}
                />
                <SmallMetric
                  label="Win rate"
                  value={`${selectedSubmission.parsedMetrics.winRate}%`}
                />
                <SmallMetric
                  label="Total return"
                  value={`${selectedSubmission.parsedMetrics.totalReturn}%`}
                />
                <SmallMetric
                  label="Avg. return"
                  value={`${selectedSubmission.parsedMetrics.averageReturn}%`}
                />
                <SmallMetric
                  label="Sharpe preview"
                  value={selectedSubmission.parsedMetrics.sharpe.toFixed(2)}
                />
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <Row
                  label="Parsed max DD"
                  value={`${selectedSubmission.parsedMetrics.maxDrawdown}%`}
                />
              </div>
            </div>
          )}

          {!selectedSubmission.parsedMetrics && (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
              <p className="text-sm font-medium text-amber-300">
                No parsed backtest metrics
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                This submission has no readable CSV/JSON metrics yet. Admin can
                still review it, but production approval should require broker
                or backtest evidence.
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => updateStatus(selectedSubmission.id, "Approved")}
              className="rounded-2xl bg-emerald-400 px-4 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Approve
            </button>

            <button
              onClick={() => updateStatus(selectedSubmission.id, "Rejected")}
              className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              Reject
            </button>
          </div>

          <button
            onClick={() => updateStatus(selectedSubmission.id, "Pending")}
            className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
          >
            Move back to pending
          </button>

          {adminMessage && (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {adminMessage}
            </div>
          )}

          {adminError && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {adminError}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Admin decision log
            </p>

            <div className="mt-4 space-y-3 text-xs leading-5 text-zinc-500">
              <p>
                File-store submissions persist in data/strategy-submissions.json.
              </p>
              <p>
                Admin decisions are sent to PATCH /api/admin/submissions/[id]
                and logged in the audit trail.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
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

function riskClass(risk: RiskRating) {
  if (risk === "Low") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300";
  }

  if (risk === "Medium") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300";
  }

  return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300";
}

function sourceClass(source: Submission["source"]) {
  if (source === "file-store") {
    return "rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300";
  }

  return "rounded-full border border-zinc-500/30 bg-zinc-500/10 px-3 py-1 text-xs text-zinc-300";
}