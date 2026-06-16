"use client";

import { useMemo, useState } from "react";

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

export default function StrategyBuilderPage() {
  const [strategyName, setStrategyName] = useState("Momentum Breakout Alpha");
  const [assetClass, setAssetClass] = useState("Crypto");
  const [timeframe, setTimeframe] = useState("1h");
  const [riskProfile, setRiskProfile] = useState("Balanced");
  const [maxDrawdown, setMaxDrawdown] = useState("8");
  const [monthlyTarget, setMonthlyTarget] = useState("12");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedMetrics, setParsedMetrics] = useState<ParsedMetrics | null>(null);

  const readinessScore = useMemo(() => {
    let score = 35;

    if (strategyName.trim().length >= 4) score += 10;
    if (assetClass) score += 10;
    if (timeframe) score += 10;
    if (riskProfile) score += 10;
    if (Number(maxDrawdown) > 0) score += 10;
    if (Number(monthlyTarget) > 0) score += 10;
    if (selectedFile) score += 15;

    return Math.min(score, 100);
  }, [
    strategyName,
    assetClass,
    timeframe,
    riskProfile,
    maxDrawdown,
    monthlyTarget,
    selectedFile,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitted(false);
    setSubmitMessage("");
    setSubmitError("");
    setParsedMetrics(null);

    try {
      const formData = new FormData();

      formData.append("strategyName", strategyName);
      formData.append("assetClass", assetClass);
      formData.append("timeframe", timeframe);
      formData.append("riskProfile", riskProfile);
      formData.append("maxDrawdown", maxDrawdown);
      formData.append("monthlyTarget", monthlyTarget);

      if (selectedFile) {
        formData.append("file", selectedFile, selectedFile.name);
      }

      const response = await fetch("/api/strategy-submissions", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Strategy submission failed.");
      }

      setSubmitted(true);
      setSubmitMessage(
        payload.message ?? "Strategy package submitted for review."
      );

      setParsedMetrics(payload.data?.parsedMetrics ?? null);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Strategy submission failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Strategy creator workspace
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Upload, configure and validate your trading strategy.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg">
                Submit a strategy package with CSV or JSON backtest evidence.
                The backend parser reads the file and creates validation metrics
                for Admin Review.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-sm text-zinc-500">Submission readiness</p>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-5xl font-semibold">{readinessScore}%</p>
                <p className="pb-2 text-sm text-emerald-300">
                  {selectedFile ? "Evidence attached" : "Awaiting file"}
                </p>
              </div>

              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-zinc-500">
                CSV parser requires a readable return column such as return,
                pnl, pnl%, profit or profit%.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
        >
          <div>
            <p className="text-sm text-zinc-500">Strategy package</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Submission details
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Strategy name">
              <input
                value={strategyName}
                onChange={(event) => setStrategyName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
                placeholder="Momentum Breakout Alpha"
              />
            </Field>

            <Field label="Asset class">
              <select
                value={assetClass}
                onChange={(event) => setAssetClass(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F17] px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              >
                <option>Crypto</option>
                <option>Forex</option>
                <option>Equities</option>
                <option>Futures</option>
                <option>Multi-Asset</option>
              </select>
            </Field>

            <Field label="Timeframe">
              <select
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F17] px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              >
                <option>1m</option>
                <option>5m</option>
                <option>15m</option>
                <option>1h</option>
                <option>4h</option>
                <option>1D</option>
              </select>
            </Field>

            <Field label="Risk profile">
              <select
                value={riskProfile}
                onChange={(event) => setRiskProfile(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F17] px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              >
                <option>Conservative</option>
                <option>Balanced</option>
                <option>Aggressive</option>
              </select>
            </Field>

            <Field label="Max drawdown target (%)">
              <input
                value={maxDrawdown}
                onChange={(event) => setMaxDrawdown(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              />
            </Field>

            <Field label="Monthly target (%)">
              <input
                value={monthlyTarget}
                onChange={(event) => setMonthlyTarget(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-emerald-400/50"
              />
            </Field>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Upload backtest / report file
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Select a CSV or JSON file. For CSV, use a column named return,
              pnl, pnl%, profit or profit%.
            </p>

            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0] ?? null;
                setSelectedFile(file);
                setParsedMetrics(null);
                setSubmitted(false);
                setSubmitMessage("");
                setSubmitError("");
              }}
              className="mt-5 block w-full cursor-pointer rounded-2xl border border-white/10 bg-[#0B0F17] p-3 text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-400 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-black hover:file:bg-emerald-300"
            />

            {selectedFile ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-medium text-emerald-300">
                  File selected: {selectedFile.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-300">
                  No file selected yet.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit strategy for review"}
          </button>

          {submitted && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {submitMessage}
            </div>
          )}

          {submitError && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {submitError}
            </div>
          )}
        </form>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">Live validation preview</p>
          <h3 className="mt-1 text-2xl font-semibold">Backtest parser</h3>

          {parsedMetrics ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-emerald-300">
                  Parsed successfully
                </p>

                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  {parsedMetrics.parserMode}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Rows" value={String(parsedMetrics.detectedRows)} />
                <Metric label="Trades" value={String(parsedMetrics.trades)} />
                <Metric label="Win rate" value={`${parsedMetrics.winRate}%`} />
                <Metric
                  label="Total return"
                  value={`${parsedMetrics.totalReturn}%`}
                />
                <Metric
                  label="Max DD"
                  value={`${parsedMetrics.maxDrawdown}%`}
                />
                <Metric
                  label="Sharpe"
                  value={parsedMetrics.sharpe.toFixed(2)}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">
                After submitting a CSV/JSON file, parsed metrics will appear
                here and in the Admin Review validation card.
              </p>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Required CSV format
            </p>

            <pre className="mt-4 overflow-auto rounded-xl border border-white/10 bg-[#020409] p-4 text-xs leading-5 text-zinc-400">
{`date,return
2026-01-01,1.4
2026-01-02,-0.5
2026-01-03,2.2`}
            </pre>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-zinc-300">
              Review workflow
            </p>

            <div className="mt-4 space-y-3 text-xs leading-5 text-zinc-500">
              <p>1. File is attached with FormData.</p>
              <p>2. /api/strategy-submissions receives the file.</p>
              <p>3. Parser extracts metrics.</p>
              <p>4. Admin Review displays validation data.</p>
              <p>5. Approved strategies appear in Marketplace.</p>
            </div>
          </div>
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