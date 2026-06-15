"use client";

import {
  Card,
  CardHeader,
  JsonPreview,
  StatusPill,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

type GatewayStatusPanelProps = {
  result: unknown;
};

function toRecord(value: unknown): AnyRecord {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as AnyRecord;
  }

  return {};
}

function boolValue(data: AnyRecord, key: string, fallback = false) {
  const value = data[key];

  if (value === true) return true;
  if (value === false) return false;

  return fallback;
}

function stringValue(data: AnyRecord, key: string, fallback = "unknown") {
  const value = data[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

export function GatewayStatusPanel({ result }: GatewayStatusPanelProps) {
  const data = toRecord(result);

  const gateway = stringValue(data, "gateway", "unknown");
  const executionEngine = stringValue(data, "execution_engine", "unknown");

  const safe = boolValue(data, "safe", false);
  const gatewayCalled = boolValue(data, "gateway_called", false);
  const realOrderSent = boolValue(data, "real_order_sent", false);
  const networkRequestSent = boolValue(data, "network_request_sent", false);
  const binanceOrderSent = boolValue(data, "binance_order_sent", false);
  const auditLogged = boolValue(data, "audit_logged", false);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        eyebrow="Execution Gateway"
        title="Gateway Safety Result"
        description="Confirms that accepted orders are routed through the dry-run exchange gateway and never sent to a real exchange."
      />

      <div className="p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StatusPill
            label={safe ? "Gateway safe" : "Gateway unsafe"}
            tone={safe ? "success" : "danger"}
          />

          <StatusPill
            label={`gateway_called: ${String(gatewayCalled)}`}
            tone={gatewayCalled ? "success" : "warning"}
          />

          <StatusPill
            label={gateway}
            tone={gateway === "DRY_RUN_EXCHANGE_GATEWAY" ? "success" : "warning"}
          />

          <StatusPill
            label={`real_order_sent: ${String(realOrderSent)}`}
            tone={realOrderSent ? "danger" : "success"}
          />

          <StatusPill
            label={`network_request_sent: ${String(networkRequestSent)}`}
            tone={networkRequestSent ? "danger" : "success"}
          />

          <StatusPill
            label={`binance_order_sent: ${String(binanceOrderSent)}`}
            tone={binanceOrderSent ? "danger" : "success"}
          />

          <StatusPill
            label={`audit_logged: ${String(auditLogged)}`}
            tone={auditLogged ? "success" : "warning"}
          />

          <StatusPill
            label={`engine: ${executionEngine}`}
            tone={executionEngine === "dry_run_only" ? "success" : "warning"}
          />
        </div>

        <div className="mt-5">
          <JsonPreview data={data} />
        </div>
      </div>
    </Card>
  );
}
