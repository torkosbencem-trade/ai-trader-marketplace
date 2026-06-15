import { getStrategyPromotionAudit } from "@/lib/api";
import {
  Card,
  CardHeader,
  JsonPreview,
  PageHero,
  PremiumPageShell,
  StatusPill,
  type Tone,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

function isObject(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecordArray(data: unknown, key: string): AnyRecord[] {
  if (!isObject(data)) return [];

  const value = data[key];

  if (!Array.isArray(value)) return [];

  return value.filter(isObject);
}

function getString(data: unknown, key: string, fallback = "—") {
  if (!isObject(data)) return fallback;

  const value = data[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumber(data: unknown, key: string, fallback = 0) {
  if (!isObject(data)) return fallback;

  const value = data[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function getBoolean(data: unknown, key: string, fallback = false) {
  if (!isObject(data)) return fallback;

  const value = data[key];

  if (value === true) return true;
  if (value === false) return false;

  return fallback;
}

function getPromotionTone(status: string): Tone {
  if (status === "ready_for_testnet_review") return "success";
  if (status === "ready_for_shadow_live") return "warning";
  if (status === "blocked") return "danger";

  return "info";
}

function getRiskTierTone(riskTier: string): Tone {
  if (riskTier === "standard_testnet") return "success";
  if (riskTier === "conservative_testnet") return "warning";
  if (riskTier === "shadow_only") return "warning";
  if (riskTier === "blocked") return "danger";

  return "info";
}

function formatDate(value: string) {
  if (!value || value === "—") return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export default async function PromotionAuditPage() {
  let data: unknown = null;
  let error: string | null = null;

  try {
    data = await getStrategyPromotionAudit(100);
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Failed to load strategy promotion audit.";
  }

  const items = getRecordArray(data, "items");

  const testnetCount = items.filter((item) =>
    getBoolean(item, "eligible_for_testnet"),
  ).length;

  const shadowCount = items.filter((item) =>
    getBoolean(item, "eligible_for_shadow_live"),
  ).length;

  const blockedCount = items.filter(
    (item) => getString(item, "status") === "blocked",
  ).length;

  const averageScore =
    items.length > 0
      ? Math.round(
          items.reduce(
            (sum, item) => sum + getNumber(item, "promotion_score", 0),
            0,
          ) / items.length,
        )
      : 0;

  return (
    <PremiumPageShell>
      <PageHero
        pills={[
          { label: "Promotion Audit", tone: "info" },
          { label: "SQLite Log", tone: "success" },
          { label: `${items.length} Rows`, tone: "warning" },
        ]}
        title="Strategy Promotion Audit"
        description="Review historical promotion decisions, scores, risk tiers, and testnet readiness results."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs text-slate-500">Audit Rows</p>
          <p className="mt-2 text-3xl font-black text-white">{items.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs text-slate-500">Average Score</p>
          <p className="mt-2 text-3xl font-black text-white">
            {averageScore}%
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-xs text-emerald-100/70">Testnet Ready</p>
          <p className="mt-2 text-3xl font-black text-emerald-100">
            {testnetCount}
          </p>
        </div>

        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5">
          <p className="text-xs text-rose-100/70">Blocked</p>
          <p className="mt-2 text-3xl font-black text-rose-100">
            {blockedCount}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          eyebrow="History"
          title="Promotion Decisions"
          description="Latest 100 strategy promotion evaluations."
          action={<StatusPill label={`${shadowCount} Shadow Ready`} tone="warning" />}
        />

        <div className="overflow-hidden rounded-b-3xl">
          <div className="grid grid-cols-[0.45fr_1.2fr_0.7fr_0.8fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            <span>ID</span>
            <span>Strategy</span>
            <span>Score</span>
            <span>Status</span>
            <span>Risk Tier</span>
            <span>Testnet</span>
            <span>Created</span>
          </div>

          {items.length > 0 ? (
            <div className="divide-y divide-white/10">
              {items.map((item) => {
                const id = getNumber(item, "id", 0);
                const strategyName = getString(item, "strategy_name");
                const strategyId = getString(item, "strategy_id");
                const status = getString(item, "status");
                const riskTier = getString(item, "risk_tier");
                const score = getNumber(item, "promotion_score", 0);
                const testnet = getBoolean(item, "eligible_for_testnet");
                const createdAt = getString(item, "created_at");

                return (
                  <div
                    key={id}
                    className="grid grid-cols-[0.45fr_1.2fr_0.7fr_0.8fr_0.8fr_0.7fr_0.9fr] items-center gap-3 px-5 py-4"
                  >
                    <span className="text-sm font-bold text-slate-400">
                      #{id}
                    </span>

                    <div>
                      <p className="font-bold text-white">{strategyName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {strategyId}
                      </p>
                    </div>

                    <span className="text-sm font-black text-white">
                      {score}%
                    </span>

                    <StatusPill
                      label={status}
                      tone={getPromotionTone(status)}
                    />

                    <StatusPill
                      label={riskTier}
                      tone={getRiskTierTone(riskTier)}
                    />

                    <StatusPill
                      label={testnet ? "YES" : "NO"}
                      tone={testnet ? "success" : "warning"}
                    />

                    <span className="text-xs text-slate-400">
                      {formatDate(createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-400">
              No strategy promotion audit rows yet. Run a promotion evaluation
              first.
            </div>
          )}
        </div>
      </Card>

      {data ? (
        <Card>
          <CardHeader
            eyebrow="Raw"
            title="Promotion Audit API Response"
            description="Developer view for checking backend response shape."
          />

          <div className="p-6">
            <JsonPreview data={data} />
          </div>
        </Card>
      ) : null}
    </PremiumPageShell>
  );
}