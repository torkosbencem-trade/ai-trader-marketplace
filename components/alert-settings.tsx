"use client";

import { useState } from "react";

export function AlertSettings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(false);
  const [webhookAlerts, setWebhookAlerts] = useState(true);
  const [tvConfirmedOnly, setTvConfirmedOnly] = useState(true);
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold">Alert Settings</h2>
        <p className="mt-1 text-sm text-slate-400">
          Configure how you want to receive marketplace trading signals.
        </p>
      </div>

      <div className="grid gap-3">
        <ToggleRow
          label="Email Alerts"
          description="Receive signal notifications by email."
          enabled={emailAlerts}
          onToggle={() => setEmailAlerts((current) => !current)}
        />

        <ToggleRow
          label="Telegram Alerts"
          description="Send signals to your Telegram bot/channel."
          enabled={telegramAlerts}
          onToggle={() => setTelegramAlerts((current) => !current)}
        />

        <ToggleRow
          label="Webhook Alerts"
          description="Forward signals to external tools or automation systems."
          enabled={webhookAlerts}
          onToggle={() => setWebhookAlerts((current) => !current)}
        />

        <ToggleRow
          label="TV Confirmed Only"
          description="Only alert when TradingView confirmation matches the AI signal."
          enabled={tvConfirmedOnly}
          onToggle={() => setTvConfirmedOnly((current) => !current)}
        />

        <ToggleRow
          label="High Confidence Only"
          description="Only alert when confidence is 80% or higher."
          enabled={highConfidenceOnly}
          onToggle={() => setHighConfidenceOnly((current) => !current)}
        />
      </div>

      <div className="mt-5 rounded-xl bg-cyan-400/[0.04] p-4 text-sm text-slate-300">
        <span className="font-semibold text-cyan-300">Preview:</span>{" "}
        {emailAlerts && "Email "}
        {telegramAlerts && "Telegram "}
        {webhookAlerts && "Webhook "}
        alerts enabled.
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-cyan-400/30"
    >
      <div>
        <div className="font-semibold">{label}</div>
        <div className="mt-1 text-sm text-slate-500">{description}</div>
      </div>

      <div
        className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
          enabled ? "bg-cyan-400" : "bg-white/10"
        }`}
      >
        <div
          className={`h-5 w-5 rounded-full bg-white transition ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}