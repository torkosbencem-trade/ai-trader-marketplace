"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endTestRun, startTestRun } from "@/lib/api";

export function TestRunControls() {
  const router = useRouter();

  const [name, setName] = useState("Scalp 0.2/0.2 - TV OFF - Guard OFF");
  const [preset, setPreset] = useState("Scalp");
  const [tvConfirmation, setTvConfirmation] = useState("OFF");
  const [strategyGuard, setStrategyGuard] = useState("OFF");
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [notes, setNotes] = useState("Fast paper data collection test");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleStart() {
    try {
      setLoading(true);
      setMessage("");

      await startTestRun({
        name,
        preset,
        tv_confirmation: tvConfirmation,
        strategy_guard: strategyGuard,
        cooldown_minutes: cooldownMinutes,
        notes,
      });

      setMessage("Test run started successfully.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Could not start test run.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    try {
      setLoading(true);
      setMessage("");

      await endTestRun();

      setMessage("Active test run ended.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Could not end test run.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold">Test Run Controls</h2>
        <p className="mt-1 text-sm text-slate-400">
          Start a new paper trading test run or archive the currently active one.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-300">
            Test Run Name
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">Preset</label>
          <select
            value={preset}
            onChange={(event) => setPreset(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          >
            <option value="Scalp">Scalp</option>
            <option value="Balanced">Balanced</option>
            <option value="Swing">Swing</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            TV Confirmation
          </label>
          <select
            value={tvConfirmation}
            onChange={(event) => setTvConfirmation(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          >
            <option value="OFF">OFF</option>
            <option value="ON">ON</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Strategy Guard
          </label>
          <select
            value={strategyGuard}
            onChange={(event) => setStrategyGuard(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          >
            <option value="OFF">OFF</option>
            <option value="ON">ON</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">
            Cooldown Minutes
          </label>
          <input
            type="number"
            value={cooldownMinutes}
            onChange={(event) => setCooldownMinutes(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300">Notes</label>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleStart}
          disabled={loading}
          className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20 disabled:opacity-50"
        >
          {loading ? "Working..." : "Start New Test Run"}
        </button>

        <button
          onClick={handleEnd}
          disabled={loading}
          className="rounded-xl border border-red-400/30 px-5 py-3 text-sm font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
        >
          End Active Test Run
        </button>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-slate-300">{message}</p>
      ) : null}
    </div>
  );
}