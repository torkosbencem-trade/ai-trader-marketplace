"use client";

import { useMemo, useState } from "react";

import { submitDryRunOrder, type DryRunOrderResult } from "@/lib/api";
import {
  Card,
  CardHeader,
  Field,
  JsonPreview,
  MetricCard,
  PageHero,
  PremiumPageShell,
  SafetyNotice,
  ScoreBar,
  SecondaryLink,
  SectionLabel,
  StatusPill,
  inputClassName,
} from "@/components/ui/PremiumUI";

type OrderSide = "BUY" | "SELL";

type DryRunFormState = {
  symbol: string;
  side: OrderSide;
  order_type: string;
  quantity: string;
  price: string;
  stop_loss_price: string;
  take_profit_price: string;
};

const defaultForm: DryRunFormState = {
  symbol: "BTCUSDT",
  side: "BUY",
  order_type: "MARKET",
  quantity: "0.001",
  price: "",
  stop_loss_price: "",
  take_profit_price: "",
};

function getBoolean(value: unknown) {
  return value === true;
}

function getString(value: unknown, fallback = "—") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return fallback;
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toPayload(form: DryRunFormState) {
  const payload: Record<string, unknown> = {
    symbol: form.symbol.trim().toUpperCase(),
    side: form.side,
    order_type: form.order_type,
  };

  const quantity = getNumber(form.quantity);
  const price = getNumber(form.price);
  const stopLoss = getNumber(form.stop_loss_price);
  const takeProfit = getNumber(form.take_profit_price);

  if (quantity !== null) payload.quantity = quantity;
  if (price !== null) payload.price = price;
  if (stopLoss !== null) payload.stop_loss_price = stopLoss;
  if (takeProfit !== null) payload.take_profit_price = takeProfit;

  return payload;
}

function SafetyFlag({
  label,
  value,
  expected,
}: {
  label: string;
  value: unknown;
  expected: boolean;
}) {
  const boolValue = getBoolean(value);
  const safe = boolValue === expected;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <p className="mt-1 text-xs text-slate-500">
          Expected: {String(expected)}
        </p>
      </div>

      <StatusPill
        label={String(boolValue)}
        tone={safe ? "success" : "danger"}
      />
    </div>
  );
}

export default function ExecutionPage() {
  const [form, setForm] = useState<DryRunFormState>(defaultForm);
  const [result, setResult] = useState<DryRunOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const payload = useMemo(() => toPayload(form), [form]);

  const symbolInvalid = !form.symbol.trim();
  const quantityInvalid = getNumber(form.quantity) === null;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await submitDryRunOrder(payload);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dry-run order failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const realOrderSent = result?.real_order_sent;
  const networkRequestSent = result?.network_request_sent;
  const binanceOrderSent = result?.binance_order_sent;
  const orderNetworkRequestSent = result?.order_network_request_sent;

  return (
    <PremiumPageShell>
      <div className="space-y-8">
        <PageHero
          pills={[
            { label: "Execution Control", tone: "info" },
            { label: "Dry Run Only", tone: "success" },
            { label: "Mainnet Locked", tone: "danger" },
            { label: "Audit Required", tone: "neutral" },
          ]}
          title="Execution Panel"
          description="Protected execution workspace for testing order payloads through the dry-run gateway. This page must never become a direct mainnet order interface without a separate safety promotion process."
          actions={
            <>
              <SecondaryLink href="/system" tone="info">
                System Safety
              </SecondaryLink>
              <SecondaryLink href="/execution-audit" tone="neutral">
                Execution Audit
              </SecondaryLink>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Execution Mode"
            value="Dry Run"
            helper="Order requests are simulated."
            tone="success"
          />
          <MetricCard
            label="Mainnet Routing"
            value="Locked"
            helper="Production order flow is disabled."
            tone="danger"
          />
          <MetricCard
            label="Gateway"
            value="Protected"
            helper="Safety fields are verified after each test."
            tone="info"
          />
          <MetricCard
            label="Last Result"
            value={getString(result?.status, "No run")}
            helper="Submit a dry-run order to inspect gateway output."
            tone={result ? "success" : "neutral"}
          />
        </div>

        <SafetyNotice
          title="Real execution is blocked"
          tone="warning"
          description="This panel is for dry-run validation only. A successful dry-run result must still report real_order_sent=false, network_request_sent=false and binance_order_sent=false."
        />

        <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
          <Card>
            <CardHeader
              eyebrow="Dry-run order"
              title="Order payload"
              description="Build a simulated order request. The payload is submitted to the backend dry-run endpoint only."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <Field label="Symbol" helper="Example: BTCUSDT, ETHUSDT">
                <input
                  className={inputClassName(symbolInvalid)}
                  value={form.symbol}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      symbol: event.target.value,
                    }))
                  }
                  placeholder="BTCUSDT"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Side">
                  <select
                    className={inputClassName()}
                    value={form.side}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        side: event.target.value as OrderSide,
                      }))
                    }
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </Field>

                <Field label="Order Type">
                  <select
                    className={inputClassName()}
                    value={form.order_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order_type: event.target.value,
                      }))
                    }
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                  </select>
                </Field>
              </div>

              <Field label="Quantity" helper="Numeric value only. Example: 0.001">
                <input
                  className={inputClassName(quantityInvalid)}
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="0.001"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Price">
                  <input
                    className={inputClassName()}
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                    placeholder="optional"
                  />
                </Field>

                <Field label="Stop Loss">
                  <input
                    className={inputClassName()}
                    value={form.stop_loss_price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        stop_loss_price: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                    placeholder="optional"
                  />
                </Field>

                <Field label="Take Profit">
                  <input
                    className={inputClassName()}
                    value={form.take_profit_price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        take_profit_price: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                    placeholder="optional"
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || symbolInvalid || quantityInvalid}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting dry-run..." : "Submit Dry-run Order"}
              </button>

              {error ? (
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200">
                  {error}
                </div>
              ) : null}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader
                eyebrow="Payload Preview"
                title="Request body"
                description="This is the normalized payload that will be sent to the dry-run endpoint."
              />
              <div className="p-5 sm:p-6">
                <JsonPreview data={payload} />
              </div>
            </Card>

            <Card>
              <CardHeader
                eyebrow="Safety Verification"
                title="Gateway result flags"
                description="After a dry-run submission, these flags should remain false for real execution and network order routing."
              />

              <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
                <SafetyFlag
                  label="real_order_sent"
                  value={realOrderSent}
                  expected={false}
                />
                <SafetyFlag
                  label="network_request_sent"
                  value={networkRequestSent}
                  expected={false}
                />
                <SafetyFlag
                  label="binance_order_sent"
                  value={binanceOrderSent}
                  expected={false}
                />
                <SafetyFlag
                  label="order_network_request_sent"
                  value={orderNetworkRequestSent}
                  expected={false}
                />
              </div>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader
              eyebrow="Dry-run response"
              title="Backend result"
              description="Raw backend response for inspection and audit debugging."
            />
            <div className="p-5 sm:p-6">
              <JsonPreview
                data={
                  result ?? {
                    status: "not_submitted",
                    message: "Submit a dry-run order to inspect the response.",
                  }
                }
              />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionLabel>Execution readiness</SectionLabel>

            <div className="mt-5 space-y-4">
              <ScoreBar
                label="Dry-run Safety"
                value={96}
                tone="success"
                helper="The execution panel is configured for simulated order flow."
              />
              <ScoreBar
                label="Mainnet Readiness"
                value={0}
                tone="danger"
                helper="Mainnet order routing should remain disabled."
              />
              <ScoreBar
                label="Audit Confidence"
                value={82}
                tone="info"
                helper="Use the execution audit page to review recorded events."
              />
            </div>
          </Card>
        </div>
      </div>
    </PremiumPageShell>
  );
}