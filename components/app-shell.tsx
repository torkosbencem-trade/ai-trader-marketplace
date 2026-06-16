"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

const mobileNavItems = [
  { label: "Marketplace", href: "/" },
  { label: "Live Signals", href: "/signals" },
  { label: "My Dashboard", href: "/dashboard" },
  { label: "Performance", href: "/performance" },
  { label: "Subscription", href: "/subscription" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-[#0B1020] px-5 py-4 lg:hidden">
            <div>
              <div className="text-lg font-bold">AI Trader</div>
              <div className="text-xs text-slate-400">
                Strategy Marketplace
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300"
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </header>

          {mobileMenuOpen && (
            <div className="border-b border-white/10 bg-[#0B1020] p-5 lg:hidden">
              <nav className="grid gap-3 text-sm">
                {mobileNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-3 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <section className="flex-1 p-6 lg:p-10">{children}</section>
        </div>
      </div>
    </main>
  );
}