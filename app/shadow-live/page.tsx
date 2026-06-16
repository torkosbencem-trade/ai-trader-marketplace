"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardHeader,
  EmptyState,
  Field,
  JsonPreview,
  LoadingBlock,
  MetricCard,
  PageHero,
  PremiumPageShell,
  SafetyNotice,
  ScoreBar,
  SecondaryLink,
  SectionLabel,
  StatusPill,
  inputClassName,
  type Tone,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

type ShadowLiveFormState = {
  shadow_live_enabled: string;
  tv_confirmation_required: string;
  emergency_stop: string;
  max_order_usdt: string;
  max_risk_percent: string;
  min_confidence: string;
  max_daily_trades: string;
  allowed_symbols: string;
  blocked_symbols: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8005";

const defaultForm: ShadowLiveFormState = {
  shadow_live_enabled: "false",
  tv_confirmation_required: "true",
  emergency_stop: "true",
  max_order_usdt: "100",
  max_risk_percent: "1",
  min_confidence: "70",
  max_daily_trades: "3",
  allowed_symbols: "BTCUSDT, ETHUSDT",
  blocked_symbols: "",
};

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValue(source: unknown, keys: string[], fallback = "—") {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (Array.isArray(value)) return value.join(", ");
  }

  return fallback;
}

function getBoolean(source: unknown, keys: string[], fallback = false) {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }

  return fallback;
}

function getNumber(source: unknown, keys: string[], fallback = 0) {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSymbols(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function getSafetyTone(enabled: boolean, emergencyStop: boolean): Tone {
  if (emergencyStop) return "success";
  if (!enabled) return "warning";
  return "danger";
}

function toPayload(form: ShadowLiveFormState) {
  return {
    shadow_live_enabled: form.shadow_live_enabled === "true",
    enabled: form.shadow_live_enabled === "true",

    tv_confirmation_required: form.tv_confirmation_required === "true",
    emergency_stop: form.emergency_stop === "true",

    max_order_usdt: parseNumber(form.max_order_usdt) ?? 0,
    max_risk_percent: parseNumber(form.max_risk_percent) ?? 0,
    min_confidence: parseNumber(form.min_confidence) ?? 0,
    max_daily_trades: parseNumber(form.max_daily_trades) ?? 0,

    allowed_symbols: parseSymbols(form.allowed_symbols),
    blocked_symbols: parseSymbols(form.blocked_symbols),

    real_order_sent: false,
    network_request_sent: false,
    binance_order_sent: false,
    order_network_request_sent: false,
  };
}

function formFromConfig(config: unknown): ShadowLiveFormState {
  return {
    shadow_live_enabled: getValue(
      config,
      ["shadow_live_enabled", "enabled"],
      defaultForm.shadow_live_enabled,
    ),
    tv_confirmation_required: getValue(
      config,
      ["tv_confirmation_required"],
      defaultForm.tv_confirmation_required,
    ),
    emergency_stop: getValue(
      config,
      ["emergency_stop"],
      defaultForm.emergency_stop,
    ),
    max_order_usdt: getValue(
      config,
      ["max_order_usdt"],
      defaultForm.max_order_usdt,
    ),
    max_risk_percent: getValue(
      config,
      ["max_risk_percent"],
      defaultForm.max_risk_percent,
    ),
    min_confidence: getValue(
      config,
      ["min_confidence"],
      defaultForm.min_confidence,
    ),
    max_daily_trades: getValue(
      config,
      ["max_daily_trades"],
      defaultForm.max_daily_trades,
    ),
    allowed_symbols: getValue(
      config,
      ["allowed_symbols"],
      defaultForm.allowed_symbols,
    ),
    blocked_symbols: getValue(
      config,
      ["blocked_symbols"],
      defaultForm.blocked_symbols,
    ),
  };
}

async function apiGetShadowConfig() {
  const response = await fetch(`${API_BASE}/shadow-live/config`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`/shadow-live/config returned HTTP ${response.status}`);
  }

  return response.json();
}

async function apiUpdateShadowConfig(payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/shadow-live/config`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`/shadow-live/config returned HTTP ${response.status}`);
  }

  return response.json();
}

function SafetyFlag({
  label,
  safe,
  helper,
}: {
  label: string;
  safe: boolean;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">{label}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
        </div>

        <StatusPill
          label={safe ? "Safe" : "Review"}
          tone={safe ? "success" : "warning"}
        />
      </div>
    </div>
  );
}

export default function ShadowLivePage() {
  const [form, setForm] = useState<ShadowLiveFormState>(defaultForm);
  const [config, setConfig] = useState<unknown>(null);
  const [lastUpdateResult, setLastUpdateResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadConfig() {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await apiGetShadowConfig();
      setConfig(response);
      setForm(formFromConfig(response));
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load shadow-live config.",
      );
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setSaveError(null);

    try {
      const response = await apiUpdateShadowConfig(payload);
      setConfig(response);
      setLastUpdateResult(response);
      setForm(formFromConfig(response));
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to update shadow-live config.",
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  const payload = useMemo(() => toPayload(form), [form]);

  const shadowEnabled = form.shadow_live_enabled === "true";
  const tvRequired = form.tv_confirmation_required === "true";
  const emergencyStop = form.emergency_stop === "true";

  const maxOrder = parseNumber(form.max_order_usdt);
  const maxRisk = parseNumber(form.max_risk_percent);
  const minConfidence = parseNumber(form.min_confidence);
  const maxDailyTrades = parseNumber(form.max_daily_trades);

  const maxOrderInvalid = maxOrder === null || maxOrder < 0;
  const maxRiskInvalid = maxRisk === null || maxRisk < 0 || maxRisk > 100;
  const minConfidenceInvalid =
    minConfidence === null || minConfidence < 0 || minConfidence > 100;
  const maxDailyTradesInvalid = maxDailyTrades === null || maxDailyTrades < 0;

  const savedEmergencyStop = getBoolean(config, ["emergency_stop"], true);
  const savedShadowEnabled = getBoolean(
    config,
    ["shadow_live_enabled", "enabled"],
    false,
  );
  const savedMaxOrder = getNumber(config, ["max_order_usdt"], 0);
  const savedMaxRisk = getNumber(config, ["max_risk_percent"], 0);

  const canSave =
    !maxOrderInvalid &&
    !maxRiskInvalid &&
    !minConfidenceInvalid &&
    !maxDailyTradesInvalid;

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Shadow-live Control", tone: "info" },
            { label: "No Real Orders", tone: "success" },
            { label: "Emergency Stop Visible", tone: "warning" },
            { label: "Mainnet Locked", tone: "danger" },
          ]}
          title="Shadow-live"
          description="Controlled configuration surface for shadow-live validation. This page is for simulated monitoring and safety-gated review, not real exchange execution."
          actions={
            <>
              <button
                type="button"
                onClick={loadConfig}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Config"}
              </button>

              <SecondaryLink href="/shadow-live/live-signals" tone="neutral">
                Shadow Signals
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Shadow-live"
            value={savedShadowEnabled ? "Enabled" : "Disabled"}
            helper="Saved backend configuration state."
            tone={savedShadowEnabled ? "warning" : "neutral"}
          />

          <MetricCard
            label="Emergency Stop"
            value={savedEmergencyStop ? "Enabled" : "Disabled"}
            helper="Emergency stop should stay visible and easy to audit."
            tone={savedEmergencyStop ? "success" : "danger"}
          />

          <MetricCard
            label="Max Order"
            value={`$${formatNumber(savedMaxOrder)}`}
            helper="Configured maximum simulated order size."
            tone={savedMaxOrder > 0 ? "info" : "neutral"}
          />

          <MetricCard
            label="Max Risk"
            value={`${formatNumber(savedMaxRisk)}%`}
            helper="Configured per-trade risk cap."
            tone={savedMaxRisk <= 1 ? "success" : savedMaxRisk <= 3 ? "warning" : "danger"}
          />
        </div>

        <SafetyNotice
          title="Shadow-live is not live execution"
          tone="warning"
          description="This configuration may enable shadow-live style validation, but it must not unlock real exchange orders. Mainnet remains locked and Binance order routing should stay disabled until a separate safety release exists."
        />

        {loadError ? (
          <Card className="p-5 sm:p-6">
            <EmptyState
              title="Shadow-live config unavailable"
              description={loadError}
              label="Load Error"
              tone="danger"
            />
          </Card>
        ) : null}

        {saveError ? (
          <Card className="p-5 sm:p-6">
            <EmptyState
              title="Shadow-live config update failed"
              description={saveError}
              label="Save Error"
              tone="danger"
            />
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[520px_1fr]">
          <Card>
            <CardHeader
              eyebrow="Configuration"
              title="Shadow-live guardrails"
              description="Adjust validation settings while keeping execution safety visible."
            />

            <div className="space-y-5 p-5 sm:p-6">
              {loading ? (
                <LoadingBlock />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Shadow-live Enabled"
                      helper="This should remain separate from real execution."
                    >
                      <select
                        className={inputClassName(shadowEnabled && !emergencyStop)}
                        value={form.shadow_live_enabled}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            shadow_live_enabled: event.target.value,
                          }))
                        }
                      >
                        <option value="false">Disabled</option>
                        <option value="true">Enabled</option>
                      </select>
                    </Field>

                    <Field
                      label="Emergency Stop"
                      helper="Recommended default: Enabled."
                    >
                      <select
                        className={inputClassName(!emergencyStop)}
                        value={form.emergency_stop}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            emergency_stop: event.target.value,
                          }))
                        }
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </Field>
                  </div>

                  <Field
                    label="TradingView Confirmation"
                    helper="Require external/manual confirmation before validation."
                  >
                    <select
                      className={inputClassName(!tvRequired)}
                      value={form.tv_confirmation_required}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tv_confirmation_required: event.target.value,
                        }))
                      }
                    >
                      <option value="true">Required</option>
                      <option value="false">Not required</option>
                    </select>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Max Order USDT">
                      <input
                        className={inputClassName(maxOrderInvalid)}
                        value={form.max_order_usdt}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            max_order_usdt: event.target.value,
                          }))
                        }
                        inputMode="decimal"
                        placeholder="100"
                      />
                    </Field>

                    <Field label="Max Risk Percent">
                      <input
                        className={inputClassName(maxRiskInvalid)}
                        value={form.max_risk_percent}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            max_risk_percent: event.target.value,
                          }))
                        }
                        inputMode="decimal"
                        placeholder="1"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Min Confidence">
                      <input
                        className={inputClassName(minConfidenceInvalid)}
                        value={form.min_confidence}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            min_confidence: event.target.value,
                          }))
                        }
                        inputMode="decimal"
                        placeholder="70"
                      />
                    </Field>

                    <Field label="Max Daily Trades">
                      <input
                        className={inputClassName(maxDailyTradesInvalid)}
                        value={form.max_daily_trades}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            max_daily_trades: event.target.value,
                          }))
                        }
                        inputMode="numeric"
                        placeholder="3"
                      />
                    </Field>
                  </div>

                  <Field
                    label="Allowed Symbols"
                    helper="Comma separated symbols. Example: BTCUSDT, ETHUSDT"
                  >
                    <input
                      className={inputClassName()}
                      value={form.allowed_symbols}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          allowed_symbols: event.target.value,
                        }))
                      }
                      placeholder="BTCUSDT, ETHUSDT"
                    />
                  </Field>

                  <Field
                    label="Blocked Symbols"
                    helper="Comma separated symbols to block from validation."
                  >
                    <input
                      className={inputClassName()}
                      value={form.blocked_symbols}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          blocked_symbols: event.target.value,
                        }))
                      }
                      placeholder="optional"
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={saveConfig}
                    disabled={saving || !canSave}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Shadow-live Config"}
                  </button>
                </>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader
                eyebrow="Safety Review"
                title="Shadow-live control checks"
                description="These checks should remain visible before running any shadow-live validation."
              />

              <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
                <SafetyFlag
                  label="Emergency stop configured"
                  safe={emergencyStop}
                  helper="Emergency stop should remain enabled unless intentionally testing configuration behavior."
                />

                <SafetyFlag
                  label="TV/manual confirmation"
                  safe={tvRequired}
                  helper="Confirmation gate reduces accidental strategy progression."
                />

                <SafetyFlag
                  label="Order size capped"
                  safe={!maxOrderInvalid && (maxOrder ?? 0) <= 100}
                  helper="Smaller notional limits are safer during validation."
                />

                <SafetyFlag
                  label="Risk cap controlled"
                  safe={!maxRiskInvalid && (maxRisk ?? 100) <= 1}
                  helper="A one percent or lower max risk cap is preferred during validation."
                />
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SectionLabel>Shadow-live Readiness</SectionLabel>

              <div className="mt-5 space-y-4">
                <ScoreBar
                  label="Configuration Safety"
                  value={
                    emergencyStop && tvRequired && canSave
                      ? 92
                      : emergencyStop && canSave
                        ? 76
                        : 38
                  }
                  tone={getSafetyTone(shadowEnabled, emergencyStop)}
                  helper="Based on emergency stop, confirmation and validation limits."
                />

                <ScoreBar
                  label="Execution Isolation"
                  value={100}
                  tone="success"
                  helper="This page does not create real exchange orders."
                />

                <ScoreBar
                  label="Mainnet Readiness"
                  value={0}
                  tone="danger"
                  helper="Mainnet routing must remain locked."
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                eyebrow="Payload Preview"
                title="Config update request"
                description="Normalized payload that will be sent to the backend."
              />

              <div className="p-5 sm:p-6">
                <JsonPreview data={payload} />
              </div>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader
              eyebrow="Saved Config"
              title="Backend configuration"
              description="Current shadow-live config as returned by the backend."
            />

            <div className="p-5 sm:p-6">
              <JsonPreview
                data={
                  config ?? {
                    status: loading ? "loading" : "not_available",
                    message:
                      loadError ??
                      "Shadow-live config has not been loaded from backend.",
                  }
                }
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Last Update"
              title="Save response"
              description="Raw response from the latest config update."
            />

            <div className="p-5 sm:p-6">
              <JsonPreview
                data={
                  lastUpdateResult ?? {
                    status: "not_updated",
                    message: "Save the config to inspect the backend response.",
                  }
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </PremiumPageShell>
  );
}