"use client";

import { useEffect, useMemo, useState } from "react";

import { getStrategyPromotionAudit } from "@/lib/api";
import {
  Card,
  CardHeader,
  EmptyState,
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
  type Tone,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRows(source: unknown): AnyRecord[] {
  if (Array.isArray(source)) return source.filter(isRecord);

  if (isRecord(source)) {
    const keys = [
      "items",
      "data",
      "audit",
      "audits",
      "entries",
      "logs",
      "records",
      "results",
      "promotion_audit",
      "promotion_audit_log",
    ];

    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }

  return [];
}

function getDecisionSource(row: AnyRecord): AnyRecord {
  const nestedKeys = ["result", "evaluation", "decision", "promotion_result"];

  for (const key of nestedKeys) {
    const value = row[key];
    if (isRecord(value)) return value;
  }

  return row;
}

function getValue(source: unknown, keys: string[], fallback = "—") {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
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

function getArray(source: unknown, keys: string[]) {
  if (!isRecord(source)) return [];

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  if (value === "—") return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function getScoreTone(score: number): Tone {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  if (score > 0) return "danger";
  return "neutral";
}

function getStatusTone(status: string, score: number): Tone {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("eligible") ||
    normalized.includes("approved") ||
    normalized.includes("pass") ||
    normalized.includes("success") ||
    score >= 75
  ) {
    return "success";
  }

  if (
    normalized.includes("blocked") ||
    normalized.includes("rejected") ||
    normalized.includes("failed") ||
    normalized.includes("unsafe")
  ) {
    return "danger";
  }

  if (
    normalized.includes("review") ||
    normalized.includes("pending") ||
    normalized.includes("warning")
  ) {
    return "warning";
  }

  return "neutral";
}

function getRiskTone(risk: string): Tone {
  const normalized = risk.toLowerCase();

  if (normalized.includes("low") || normalized.includes("safe")) return "success";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "warning";
  if (normalized.includes("high") || normalized.includes("danger")) return "danger";

  return "neutral";
}

function AuditRow({
  row,
  selected,
  onSelect,
}: {
  row: AnyRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const decision = getDecisionSource(row);

  const auditId = getValue(row, ["audit_id", "id", "event_id"], "—");
  const strategy = getValue(
    decision,
    ["strategy_name", "strategy", "strategy_id", "name"],
    getValue(row, ["strategy_name", "strategy", "strategy_id"], "Unknown"),
  );
  const symbol = getValue(
    decision,
    ["symbol", "market", "pair"],
    getValue(row, ["symbol", "market", "pair"], "—"),
  ).toUpperCase();

  const status = getValue(decision, ["status", "state", "result"], "Review");
  const score = getNumber(decision, ["promotion_score", "score", "validation_score"], 0);
  const risk = getValue(decision, ["risk_tier", "risk", "risk_status"], "Review");
  const shadowEligible = getBoolean(decision, ["eligible_for_shadow_live"], false);
  const testnetEligible = getBoolean(decision, ["eligible_for_testnet"], false);
  const blockedReasons = getArray(decision, ["blocked_reasons", "reasons"]);
  const timestamp = getValue(row, ["created_at", "timestamp", "time"], "—");

  return (
    <tr
      className={
        selected
          ? "border-b border-sky-500/20 bg-sky-500/10"
          : "border-b border-slate-800/70 transition hover:bg-slate-950/70"
      }
    >
      <td className="px-4 py-4 align-top">
        <button
          type="button"
          onClick={onSelect}
          className="text-left"
        >
          <p className="font-mono text-xs text-slate-500">{auditId}</p>
          <p className="mt-1 text-sm font-semibold text-slate-50">{strategy}</p>
          <p className="mt-1 text-xs text-slate-500">{symbol}</p>
        </button>
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={status} tone={getStatusTone(status, score)} />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={formatNumber(score)} tone={getScoreTone(score)} />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill label={risk} tone={getRiskTone(risk)} />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill
          label={shadowEligible ? "Eligible" : "Review"}
          tone={shadowEligible ? "success" : "warning"}
        />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill
          label={testnetEligible ? "Eligible" : "Review"}
          tone={testnetEligible ? "success" : "warning"}
        />
      </td>

      <td className="px-4 py-4 align-top">
        <StatusPill
          label={String(blockedReasons.length)}
          tone={blockedReasons.length > 0 ? "danger" : "success"}
        />
      </td>

      <td className="px-4 py-4 align-top text-xs text-slate-500">
        {formatDate(timestamp)}
      </td>
    </tr>
  );
}

function BlockerPanel({ row }: { row: AnyRecord | null }) {
  if (!row) {
    return (
      <EmptyState
        title="No audit selected"
        description="Select an audit row to inspect blockers, warnings and raw decision output."
        label="Select Row"
        tone="neutral"
      />
    );
  }

  const decision = getDecisionSource(row);
  const blockedReasons = getArray(decision, ["blocked_reasons", "reasons"]);
  const warnings = getArray(decision, ["warnings"]);

  if (blockedReasons.length === 0 && warnings.length === 0) {
    return (
      <EmptyState
        title="No blockers reported"
        description="The selected promotion decision did not return blocked reasons or warnings."
        label="Clean"
        tone="success"
      />
    );
  }

  return (
    <div className="space-y-3">
      {blockedReasons.map((reason, index) => (
        <div
          key={`blocked-${index}`}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200"
        >
          {String(reason)}
        </div>
      ))}

      {warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200"
        >
          {String(warning)}
        </div>
      ))}
    </div>
  );
}

export default function PromotionAuditPage() {
  const [data, setData] = useState<unknown>(null);
  const [rows, setRows] = useState<AnyRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAudit() {
    setLoading(true);
    setError(null);

    try {
      const response = await getStrategyPromotionAudit(50);
      const loadedRows = getRows(response);

      setData(response);
      setRows(loadedRows);
      setSelectedIndex(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load promotion audit log.",
      );
      setData(null);
      setRows([]);
      setSelectedIndex(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAudit();
  }, []);

  const aggregate = useMemo(() => {
    const shadowEligible = rows.filter((row) =>
      getBoolean(getDecisionSource(row), ["eligible_for_shadow_live"], false),
    ).length;

    const testnetEligible = rows.filter((row) =>
      getBoolean(getDecisionSource(row), ["eligible_for_testnet"], false),
    ).length;

    const blocked = rows.filter((row) => {
      const decision = getDecisionSource(row);
      return getArray(decision, ["blocked_reasons", "reasons"]).length > 0;
    }).length;

    const scores = rows.map((row) =>
      getNumber(getDecisionSource(row), ["promotion_score", "score", "validation_score"], 0),
    );

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, value) => sum + value, 0) / scores.length
        : 0;

    return {
      shadowEligible,
      testnetEligible,
      blocked,
      averageScore,
    };
  }, [rows]);

  const selectedRow = rows[selectedIndex] ?? null;

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Promotion Audit", tone: "info" },
            { label: "Decision Log", tone: "neutral" },
            { label: "No Auto Execution", tone: "success" },
            { label: "Mainnet Locked", tone: "danger" },
          ]}
          title="Promotion Audit"
          description="Audit trail for strategy promotion evaluations. Use this page to inspect previous decisions, eligibility outcomes, blockers and raw promotion-gate responses."
          actions={
            <>
              <button
                type="button"
                onClick={loadAudit}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Audit"}
              </button>

              <SecondaryLink href="/promotion" tone="neutral">
                Promotion Gate
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Audit Records"
            value={rows.length}
            helper="Loaded promotion audit entries."
            tone="info"
          />

          <MetricCard
            label="Shadow Eligible"
            value={aggregate.shadowEligible}
            helper="Entries eligible for shadow-live validation."
            tone="success"
          />

          <MetricCard
            label="Testnet Eligible"
            value={aggregate.testnetEligible}
            helper="Entries eligible for testnet progression."
            tone="warning"
          />

          <MetricCard
            label="Blocked"
            value={aggregate.blocked}
            helper="Entries with blocked reasons."
            tone={aggregate.blocked > 0 ? "danger" : "success"}
          />
        </div>

        <SafetyNotice
          title="Audit visibility does not approve execution"
          tone="warning"
          description="Promotion audit records are for review and traceability. Even an eligible strategy must remain behind dry-run, manual review and execution safety controls before any future testnet or live path."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader
              eyebrow="Decision Log"
              title="Promotion audit records"
              description={
                rows.length > 0
                  ? `${rows.length} promotion audit record(s) loaded.`
                  : "No promotion audit records are currently available."
              }
            />

            <div className="p-5 sm:p-6">
              {loading ? (
                <LoadingBlock />
              ) : error ? (
                <EmptyState
                  title="Promotion audit unavailable"
                  description={error}
                  label="Load Error"
                  tone="danger"
                />
              ) : rows.length === 0 ? (
                <EmptyState
                  title="No promotion audit records"
                  description="Promotion evaluation records will appear here once the backend audit endpoint returns entries."
                  label="No Records"
                  tone="neutral"
                />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full min-w-[1120px] border-collapse text-left">
                    <thead className="border-b border-slate-800 bg-slate-950/70">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Strategy
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Score
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Risk
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Shadow
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Testnet
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Blockers
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, index) => (
                        <AuditRow
                          key={String(
                            row.audit_id ??
                              row.id ??
                              row.event_id ??
                              row.created_at ??
                              index,
                          )}
                          row={row}
                          selected={index === selectedIndex}
                          onSelect={() => setSelectedIndex(index)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionLabel>Decision Quality</SectionLabel>

            <div className="mt-5 space-y-4">
              <ScoreBar
                label="Average Promotion Score"
                value={Math.max(0, Math.min(100, aggregate.averageScore))}
                tone={getScoreTone(aggregate.averageScore)}
                helper="Average score across loaded audit entries."
              />

              <ScoreBar
                label="Shadow-live Eligibility"
                value={
                  rows.length > 0
                    ? Math.round((aggregate.shadowEligible / rows.length) * 100)
                    : 0
                }
                tone={aggregate.shadowEligible > 0 ? "success" : "neutral"}
                helper="Share of entries eligible for shadow-live validation."
              />

              <ScoreBar
                label="Execution Approval"
                value={0}
                tone="danger"
                helper="Audit entries do not approve real exchange execution."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Selected decision
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the table to select a promotion decision and inspect its
                blockers, warnings and raw payload below.
              </p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader
              eyebrow="Selected Record"
              title="Blockers and warnings"
              description="Review the blocking reasons and warnings returned by the selected promotion decision."
            />

            <div className="p-5 sm:p-6">
              <BlockerPanel row={selectedRow} />
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Raw Selected Audit"
              title="Selected audit payload"
              description="Raw selected audit record for debugging and traceability."
            />

            <div className="p-5 sm:p-6">
              <JsonPreview
                data={
                  selectedRow ?? {
                    status: "not_selected",
                    message: "Select a promotion audit row to inspect raw data.",
                  }
                }
              />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Raw Audit Response"
            title="Promotion audit endpoint payload"
            description="Full raw backend response for compatibility checks."
          />

          <div className="p-5 sm:p-6">
            <JsonPreview
              data={
                data ?? {
                  status: loading ? "loading" : "not_available",
                  message:
                    error ??
                    "Promotion audit data has not been loaded or no endpoint returned data.",
                }
              }
            />
          </div>
        </Card>
      </div>
    </PremiumPageShell>
  );
}