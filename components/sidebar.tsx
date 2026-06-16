"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  description: string;
  icon: ReactNode;
};

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm text-slate-300">
      {children}
    </span>
  );
}

const navItems: NavItem[] = [
  {
    label: "Marketplace",
    href: "/",
    description: "Strategy discovery",
    icon: <NavIcon>⌁</NavIcon>,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Control center",
    icon: <NavIcon>⌂</NavIcon>,
  },
  {
    label: "Live Signals",
    href: "/signals",
    description: "Signal intelligence",
    icon: <NavIcon>↯</NavIcon>,
  },
  {
    label: "Performance",
    href: "/performance",
    description: "Analytics layer",
    icon: <NavIcon>◎</NavIcon>,
  },
  {
    label: "Test Runs",
    href: "/test-runs",
    description: "Validation lab",
    icon: <NavIcon>▣</NavIcon>,
  },
  {
    label: "Shadow Live",
    href: "/shadow-live",
    description: "Simulated monitoring",
    icon: <NavIcon>◐</NavIcon>,
  },
  {
    label: "Execution",
    href: "/execution",
    description: "Dry-run orders",
    icon: <NavIcon>⚡</NavIcon>,
  },
  {
    label: "Subscription",
    href: "/subscription",
    description: "Premium access",
    icon: <NavIcon>✦</NavIcon>,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-white/10 bg-slate-950/90 px-5 py-6 text-slate-100 backdrop-blur-xl lg:block">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative flex h-full flex-col">
        <Link href="/" className="group block">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 transition group-hover:border-cyan-400/30 group-hover:bg-white/[0.065]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
                AI
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight text-white">
                  AI Trader
                </p>

                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Marketplace
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Dry Run Only
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-100/80">
                Real order routing is currently blocked by design.
              </p>
            </div>
          </div>
        </Link>

        <nav className="mt-6 flex-1 space-y-2">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                  active
                    ? "border-cyan-400/30 bg-cyan-400/10 text-white shadow-lg shadow-cyan-950/20"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.045] hover:text-white"
                }`}
              >
                {item.icon}

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {item.label}
                  </span>

                  <span
                    className={`mt-0.5 block truncate text-xs ${
                      active ? "text-cyan-100/70" : "text-slate-600"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>

                {active && (
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Promotion Pipeline
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <p className="text-xs text-slate-400">
                  Signals → Test Runs
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                <p className="text-xs text-slate-400">
                  Test Runs → Shadow Live
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-xs text-slate-400">
                  Shadow Live → Dry Run
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/subscription"
            className="flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
          >
            Upgrade Access
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;