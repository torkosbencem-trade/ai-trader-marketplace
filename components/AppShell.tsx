"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  shortLabel?: string;
  description: string;
};

const navItems: NavItem[] = [
  {
    label: "Marketplace",
    shortLabel: "Home",
    href: "/",
    description: "Discover AI trading strategies",
  },
  {
    label: "Dashboard",
    shortLabel: "Dash",
    href: "/dashboard",
    description: "Control center and system status",
  },
  {
    label: "Live Signals",
    shortLabel: "Signals",
    href: "/signals",
    description: "Review signal candidates",
  },
  {
    label: "Performance",
    shortLabel: "Perf",
    href: "/performance",
    description: "Analytics and validation metrics",
  },
  {
    label: "Test Runs",
    shortLabel: "Tests",
    href: "/test-runs",
    description: "Controlled strategy validation",
  },
  {
    label: "Shadow Live",
    shortLabel: "Shadow",
    href: "/shadow-live",
    description: "Simulated live monitoring",
  },
    {
    label: "Execution",
    shortLabel: "Exec",
    href: "/execution",
    description: "Protected dry-run order tests",
  },
  {
    label: "Promotion Gate",
    shortLabel: "Promo",
    href: "/promotion",
    description: "Strategy promotion decision engine",
  },
    {
    label: "Promotion Audit",
    shortLabel: "Audit",
    href: "/promotion-audit",
    description: "Strategy promotion decision history",
  },
  {
    label: "Execution Audit",
    shortLabel: "Audit",
    href: "/execution-audit",
    description: "Dry-run order audit log",
  },
  {
    label: "Project Status",
    shortLabel: "Status",
    href: "/project-status",
    description: "Developer checkpoint snapshot",
  },
  {
    label: "System",
    shortLabel: "System",
    href: "/system",
    description: "Backend health and safety status",
  },
  {
    label: "Subscription",
    shortLabel: "Plan",
    href: "/subscription",
    description: "Access tiers and upgrade path",
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/strategies");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActivePageLabel(pathname: string): string {
  const active = navItems.find((item) => isActivePath(pathname, item.href));

  if (active) return active.label;

  return "AI Trader";
}

function NavLink({
  item,
  pathname,
  compact = false,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const active = isActivePath(pathname, item.href);

  if (compact) {
    return (
      <Link
        href={item.href}
        className={`flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-semibold transition ${
          active
            ? "bg-white text-slate-950 shadow-lg shadow-black/30"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span>{item.shortLabel ?? item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`group block rounded-2xl border px-4 py-3 transition ${
        active
          ? "border-sky-400/40 bg-sky-400/10 text-white shadow-lg shadow-sky-950/30"
          : "border-white/5 bg-white/[0.025] text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{item.label}</p>

        <span
          className={`h-2 w-2 rounded-full transition ${
            active ? "bg-sky-300" : "bg-slate-700 group-hover:bg-slate-500"
          }`}
        />
      </div>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {item.description}
      </p>
    </Link>
  );
}

function PipelineBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "info" | "warning" | "success";
}) {
  const styles = {
    info: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  };

  return (
    <div className={`rounded-2xl border p-3 ${styles[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const activePageLabel = getActivePageLabel(pathname);

    const mobileNavItems = navItems.filter((item) =>
    ["/", "/signals", "/promotion", "/execution", "/dashboard"].includes(
      item.href,
    ),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-80 border-r border-white/10 bg-slate-950/85 backdrop-blur-2xl lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-6">
            <Link href="/" className="block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 text-lg font-black text-sky-200 shadow-lg shadow-sky-950/40">
                  AI
                </div>

                <div>
                  <p className="text-lg font-black tracking-tight text-white">
                    AI Trader
                  </p>

                  <p className="text-xs font-medium text-slate-500">
                    Marketplace Cockpit
                  </p>
                </div>
              </div>
            </Link>

            <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                  Safety Mode
                </p>

                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
                  Dry Run
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-emerald-100/80">
                Real orders remain blocked. Strategies should pass validation
                before execution testing.
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="border-t border-white/10 p-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Promotion Pipeline
              </p>

              <div className="mt-4 space-y-3">
                <PipelineBadge label="Gate 1" value="Signals" tone="info" />
                <PipelineBadge
                  label="Gate 2"
                  value="Test Runs"
                  tone="warning"
                />
                <PipelineBadge
                  label="Gate 3"
                  value="Shadow Live"
                  tone="success"
                />
              </div>

              <Link
                href="/subscription"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Upgrade Access
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 text-sm font-black text-sky-200">
              AI
            </div>

            <div>
              <p className="text-sm font-black text-white">AI Trader</p>
              <p className="text-xs text-slate-500">{activePageLabel}</p>
            </div>
          </Link>

          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
            Dry Run
          </span>
        </div>
      </header>

      <div className="lg:pl-80">
        <div className="min-h-screen pb-24 lg:pb-0">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/90 px-3 py-3 backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              compact
            />
          ))}
        </div>
      </nav>
    </div>
  );
}