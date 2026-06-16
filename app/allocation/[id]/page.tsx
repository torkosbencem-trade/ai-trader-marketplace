"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MarketplaceStrategy = {
  id: string;
  name: string;
  manager: string;
  category: string;
  risk: "Low" | "Medium" | "High";
  monthlyReturn: number;
  drawdown: number;
  sharpe: number;
  winRate: number;
  trades: number;
  capital: string;
  markets: string[];
  description: string;
  status: string;
  source?: "demo" | "file-store";
};

export default function AllocationRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [strategyId, setStrategyId] = useState("");
  const [strategy, setStrategy] = useState<MarketplaceStrategy | null>(null);

  const [investorEmail, setInvestorEmail] = useState("investor@example.com");
  const [requestedCapital, setRequestedCapital] = useState("100000");
  const [timeHorizon, setTimeHorizon] = useState("6-12 months");
  const [notes, setNotes] = useState("");
  const [riskAcknowledgement, setRiskAcknowledgement] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setStrategyId(resolved.id);
    }

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!strategyId) {
      return;
    }

    async function loadStrategy() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/marketplace", {
          cache: "no-store",
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load strategy.");
        }

        const found = (payload.data ?? []).find(
          (item: MarketplaceStrategy) => item.id === strategyId
        );

        if (!found) {
          throw new Error("Strategy not found in marketplace.");
        }

        setStrategy(found);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load strategy."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStrategy();
  }, [strategyId]);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!strategy) {
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");
    setRequestId("");

    try {
      const response = await fetch("/api/allocation-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyId: strategy.id,
          strategyName: strategy.name,
          investorEmail,
          requestedCapital: Number(requestedCapital),
          riskAcknowledgement,
          timeHorizon,
          notes,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Allocation request failed.");
      }

      setMessage(payload.message ?? "Allocation request submitted.");
      setRequestId(payload.data?.id ?? "");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Allocation request failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <Link
            href={strategyId ? `/marketplace/${strategyId}` : "/marketplace"}
            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08]"
          >
            ← Back to strategy report
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Investor allocation request
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Request access before deployment.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Submit allocation intent for review. In production, this step
                should connect investor suitability, KYC, capital limits, risk
                checks and execution approval.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Selected strategy</p>

              {loading ? (
                <p className="mt-3 text-lg font-semibold">Loading...</p>
              ) : strategy ? (
                <>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {strategy.name}
                  </h2>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Metric label="Return" value={`${strategy.monthlyReturn}%`} />
                    <Metric label="Max DD" value={`${strategy.drawdown}%`} />
                    <Metric label="Sharpe" value={strategy.sharpe.toFixed(2)} />
                    <Metric label="Risk" value={strategy.risk} />
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-red-300">
                  Strategy could not be loaded.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <form
          onSubmit={submitRequest}
          className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
        >
          <p className="text-sm text-zinc-500">Request form</p>
          <h2 className="mt-1 text-2xl font-semibold">
            Allocation access details
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Investor email">
              <input
                value={investorEmail}
                onChange={(event) => setInvestorEmail(event.target.value)}
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              />
            </Field>

            <Field label="Requested capital">
              <input
                value={requestedCapital}
                onChange={(event) => setRequestedCapital(event.target.value)}
                type="number"
                min="1"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              />
            </Field>

            <Field label="Time horizon">
              <select
                value={timeHorizon}
                onChange={(event) => setTimeHorizon(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F17] px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              >
                <option>1-3 months</option>
                <option>3-6 months</option>
                <option>6-12 months</option>
                <option>12+ months</option>
              </select>
            </Field>

            <Field label="Strategy ID">
              <input
                value={strategyId}
                readOnly
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-400 outline-none"
              />
            </Field>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm text-zinc-400">
              Notes for review
            </span>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              placeholder="Capital source, preferred broker, constraints, allocation notes..."
            />
          </label>

          <label className="mt-6 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={riskAcknowledgement}
              onChange={(event) =>
                setRiskAcknowledgement(event.target.checked)
              }
              className="mt-1 h-4 w-4"
            />

            <span className="text-sm leading-6 text-zinc-400">
              I understand this is not live deployment approval. Allocation
              requires risk review, suitability checks and execution approval.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !strategy}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit allocation request"}
          </button>

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {message}
              {requestId && (
                <p className="mt-2 font-mono text-xs text-emerald-200">
                  Request ID: {requestId}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </form>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Workflow status</p>
          <h3 className="mt-1 text-2xl font-semibold">
            Allocation governance
          </h3>

          <div className="mt-6 space-y-4">
            <ChecklistItem title="Marketplace strategy selected" active={Boolean(strategy)} />
            <ChecklistItem title="Investor email provided" active={investorEmail.includes("@")} />
            <ChecklistItem title="Capital amount entered" active={Number(requestedCapital) > 0} />
            <ChecklistItem title="Risk acknowledgement accepted" active={riskAcknowledgement} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              After submission
            </p>

            <div className="mt-4 space-y-3 text-xs leading-5 text-zinc-500">
              <p>1. Request is saved to data/allocation-requests.json.</p>
              <p>2. Audit event is created.</p>
              <p>3. Execution approval can be connected next.</p>
              <p>4. Later this can become investor onboarding / KYC.</p>
            </div>
          </div>

          <Link
            href="/system/audit"
            className="mt-6 block rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-center text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
          >
            View audit log
          </Link>

          <Link
            href="/execution"
            className="mt-3 block rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/[0.05]"
          >
            Open execution center
          </Link>
        </aside>
      </section>
    </main>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
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