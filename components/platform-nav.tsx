import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Demo", href: "/demo" },
  { label: "Demo Data", href: "/system/demo-data" },
  { label: "Auth", href: "/auth" },
  { label: "Profile", href: "/profile" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Risk Check", href: "/risk-check" },
  { label: "Readiness", href: "/readiness" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Builder", href: "/strategy-builder" },
  { label: "Admin", href: "/admin" },
  { label: "Allocations", href: "/allocation-requests" },
  { label: "Execution", href: "/execution" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "System", href: "/system/storage" },
];

export default function PlatformNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070D]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">
            AT
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-white">
              AI Trader
            </p>
            <p className="text-xs text-zinc-500">Marketplace OS</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="hidden rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05] md:inline-flex"
          >
            Workspace
          </Link>

          <Link
            href="/login"
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Login
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-3 xl:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-mobile`}
              href={item.href}
              className="whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}