import {
  Card,
  CardHeader,
  StatusPill,
  JsonPreview,
} from "@/components/ui/PremiumUI";

type AnyRecord = Record<string, unknown>;

function isObject(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(source: AnyRecord, key: string, fallback = "—") {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getBoolean(source: AnyRecord, key: string) {
  return source[key] === true;
}

export function GatewayStatusPanel({ result }: { result: unknown }) {
  if (!isObject(result)) return null;

  const gatewayCalled = getBoolean(result, "gateway_called");
  const realOrderSent = getBoolean(result, "real_order_sent");
  const networkRequestSent = getBoolean(result, "network_request_sent");
  const binanceOrderSent = getBoolean(result, "binance_order_sent");
  const auditLogged = getBoolean(result, "audit_logged");

  const gateway = getString(result, "gateway");
  const executionEngine = getString(result, "execution_engine");
  const gatewayMessage = getString(result, "gateway_message");

  const safe =
    gatewayCalled &&
    gateway === "DRY_RUN_EXCHANGE_GATEWAY" &&
    realOrderSent === false &&
    networkRequestSent === false &&
    binanceOrderSent === false;

  return (
    <Card>
      <CardHeader
        eyebrow="Execution Gateway"
        title="Dry-run gateway validation"
        description="Confirms that accepted orders are routed through the dry-run exchange gateway and never sent to a real exchange."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <StatusPill tone={safe ? "success" : "danger"}>
          {safe ? "Gateway safe" : "Gateway unsafe"}
        </StatusPill>

        <StatusPill tone={gatewayCalled ? "success" : "warning"}>
          gateway_called: {String(gatewayCalled)}
        </StatusPill>

        <StatusPill tone={gateway === "DRY_RUN_EXCHANGE_GATEWAY" ? "success" : "warning"}>
          {gateway}
        </StatusPill>

        <StatusPill tone={realOrderSent ? "danger" : "success"}>
          real_order_sent: {String(realOrderSent)}
        </StatusPill>

        <StatusPill tone={networkRequestSent ? "danger" : "success"}>
          network_request_sent: {String(networkRequestSent)}
        </StatusPill>

        <StatusPill tone={binanceOrderSent ? "danger" : "success"}>
          binance_order_sent: {String(binanceOrderSent)}
        </StatusPill>

        <StatusPill tone={auditLogged ? "success" : "warning"}>
          audit_logged: {String(auditLogged)}
        </StatusPill>

        <StatusPill tone={executionEngine === "dry_run_only" ? "success" : "warning"}>
          engine: {executionEngine}
        </StatusPill>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
        {gatewayMessage}
      </div>

      <div className="mt-4">
        <JsonPreview value={result} />
      </div>
    </Card>
  );
}