"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AccessConfig = {
  label: string;
  role: string;
  status: string;
  description: string;
  tone: "public" | "investor" | "creator" | "admin" | "execution";
};

function getAccessConfig(pathname: string): AccessConfig | null {
  if (pathname === "/") {
    return null;
  }

  if (pathname.startsWith("/access")) {
    return {
      label: "Access Portal",
      role: "Public entry point",
      status: "Role selection",
      description:
        "Select Investor, Strategy Creator or Admin workspace access from this portal.",
      tone: "public",
    };
  }

  if (pathname.startsWith("/portfolio")) {
    return {
      label: "Protected Workspace",
      role: "Investor",
      status: "Demo session active",
      description:
        "Portfolio monitoring is intended for authenticated investors and capital allocators.",
      tone: "investor",
    };
  }

  if (pathname.startsWith("/marketplace")) {
    return {
      label: "Marketplace Access",
      role: "Investor / Institution",
      status: "Read-only demo",
      description:
        "Strategy discovery and report pages are visible in demo mode. Allocation should require authenticated access.",
      tone: "investor",
    };
  }

  if (pathname.startsWith("/strategy-builder")) {
    return {
      label: "Creator Workspace",
      role: "Strategy Creator",
      status: "Submission demo",
      description:
        "Strategy upload and validation workflow is intended for verified creators or quant teams.",
      tone: "creator",
    };
  }

  if (pathname.startsWith("/execution")) {
    return {
      label: "Execution Control",
      role: "Investor / Institution",
      status: "Approval required",
      description:
        "Broker connection and deployment controls should require server-side authorization before live use.",
      tone: "execution",
    };
  }

  if (pathname.startsWith("/pricing")) {
    return {
      label: "Commercial Page",
      role: "Public",
      status: "Pricing preview",
      description:
        "Pricing is public-facing demo content and should be reviewed before production launch.",
      tone: "public",
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      label: "Admin Route",
      role: "Administrator",
      status: "Restricted console",
      description:
        "Governance, approvals and review actions should require admin authentication and audit logging.",
      tone: "admin",
    };
  }

  return null;
}

export default function RouteAccessBanner() {
  const pathname = usePathname();
  const config = getAccessConfig(pathname);

  if (!config) {
    return null;
  }

  return (
    <div className="border-b border-white/10 bg-[#05070D]">
      <div className="mx-auto max-w-7xl px-6 py-3 lg:px-8">
        <div className={`rounded-2xl border px-4 py-3 ${toneClass(config.tone)}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {config.label}
                </span>
              </div>

              <div className="hidden h-4 w-px bg-white/10 md:block" />

              <p className="text-sm text-zinc-300">
                <span className="font-semibold text-white">{config.role}</span>
                <span className="mx-2 text-zinc-600">·</span>
                <span>{config.status}</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <p className="max-w-2xl text-xs leading-5 text-zinc-500">
                {config.description}
              </p>

              <Link
                href="/access"
                className="whitespace-nowrap rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/20 hover:text-emerald-200"
              >
                Manage access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toneClass(tone: AccessConfig["tone"]) {
  if (tone === "admin") {
    return "border-red-500/20 bg-red-500/[0.06]";
  }

  if (tone === "creator") {
    return "border-blue-500/20 bg-blue-500/[0.06]";
  }

  if (tone === "execution") {
    return "border-amber-500/20 bg-amber-500/[0.06]";
  }

  if (tone === "investor") {
    return "border-emerald-500/20 bg-emerald-500/[0.06]";
  }

  return "border-white/10 bg-white/[0.035]";
}