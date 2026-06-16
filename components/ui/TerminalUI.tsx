import Link from "next/link";
import type { ReactNode } from "react";

export type TerminalTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

type ClassNameProp = {
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toneStyles(tone: TerminalTone) {
  if (tone === "success") {
    return {
      badge: "border-emerald-500/20 bg-emerald-500/8 text-emerald-300",
      dot: "bg-emerald-400",
      text: "text-emerald-300",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/8",
    };
  }

  if (tone === "warning") {
    return {
      badge: "border-amber-500/20 bg-amber-500/8 text-amber-300",
      dot: "bg-amber-400",
      text: "text-amber-300",
      border: "border-amber-500/20",
      bg: "bg-amber-500/8",
    };
  }

  if (tone === "danger") {
    return {
      badge: "border-rose-500/20 bg-rose-500/8 text-rose-300",
      dot: "bg-rose-400",
      text: "text-rose-300",
      border: "border-rose-500/20",
      bg: "bg-rose-500/8",
    };
  }

  if (tone === "info") {
    return {
      badge: "border-sky-500/20 bg-sky-500/8 text-sky-300",
      dot: "bg-sky-400",
      text: "text-sky-300",
      border: "border-sky-500/20",
      bg: "bg-sky-500/8",
    };
  }

  return {
    badge: "border-slate-800 bg-slate-950 text-slate-300",
    dot: "bg-slate-500",
    text: "text-slate-300",
    border: "border-slate-800",
    bg: "bg-slate-950",
  };
}

export function TerminalPage({
  children,
  className,
}: {
  children: ReactNode;
} & ClassNameProp) {
  return (
    <main
      className={cx(
        "min-h-screen bg-[#06080D] px-4 py-5 text-slate-100 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1600px]">{children}</div>
    </main>
  );
}

export function TerminalHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
} & ClassNameProp) {
  return (
    <header className={cx("border-b border-slate-800/90 pb-5", className)}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}

          {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function TerminalBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: ReactNode;
  tone?: TerminalTone;
} & ClassNameProp) {
  const styles = toneStyles(tone);

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1",
        "text-[11px] font-semibold uppercase tracking-[0.14em]",
        styles.badge,
        className,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  );
}

export function TerminalButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: TerminalTone;
} & ClassNameProp) {
  const styles = toneStyles(tone);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center rounded-lg border px-3.5 py-2",
        "text-xs font-semibold uppercase tracking-[0.12em] transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        tone === "neutral"
          ? "border-slate-700 bg-slate-100 text-slate-950 hover:bg-white"
          : `${styles.badge} hover:border-slate-500`,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TerminalLink({
  href,
  children,
  tone = "neutral",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: TerminalTone;
} & ClassNameProp) {
  const styles = toneStyles(tone);

  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center rounded-lg border px-3.5 py-2",
        "text-xs font-semibold uppercase tracking-[0.12em] transition",
        tone === "neutral"
          ? "border-slate-700 bg-slate-100 text-slate-950 hover:bg-white"
          : `${styles.badge} hover:border-slate-500`,
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function ControlBar({
  children,
  className,
}: {
  children: ReactNode;
} & ClassNameProp) {
  return (
    <section
      className={cx(
        "rounded-xl border border-slate-800 bg-[#090D14] p-3",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {children}
      </div>
    </section>
  );
}

export function DataPanel({
  title,
  eyebrow,
  description,
  actions,
  children,
  className,
  noPadding = false,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
} & ClassNameProp) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-xl border border-slate-800 bg-[#090D14]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      {title || eyebrow || description || actions ? (
        <div className="flex flex-col gap-4 border-b border-slate-800 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            {eyebrow ? (
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-100">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function SplitView({
  left,
  right,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
} & ClassNameProp) {
  return (
    <div className={cx("grid gap-4 xl:grid-cols-[1fr_420px]", className)}>
      <div className="min-w-0">{left}</div>
      <aside className="min-w-0">{right}</aside>
    </div>
  );
}

export function CompactMetric({
  label,
  value,
  helper,
  tone = "neutral",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  tone?: TerminalTone;
} & ClassNameProp) {
  const styles = toneStyles(tone);

  return (
    <div
      className={cx(
        "rounded-xl border border-slate-800 bg-[#090D14] p-4",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
          {label}
        </p>
        <span className={cx("mt-0.5 h-1.5 w-1.5 rounded-full", styles.dot)} />
      </div>

      <p className={cx("mt-3 text-xl font-semibold tracking-tight", styles.text)}>
        {value}
      </p>

      {helper ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

export function StatusMatrix({
  items,
  className,
}: {
  items: Array<{
    label: ReactNode;
    value: ReactNode;
    tone?: TerminalTone;
    helper?: ReactNode;
  }>;
} & ClassNameProp) {
  return (
    <div className={cx("grid gap-2", className)}>
      {items.map((item, index) => {
        const tone = item.tone ?? "neutral";
        const styles = toneStyles(tone);

        return (
          <div
            key={`${String(item.label)}-${index}`}
            className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {item.label}
              </p>
              {item.helper ? (
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {item.helper}
                </p>
              ) : null}
            </div>

            <span
              className={cx(
                "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold",
                styles.badge,
              )}
            >
              <span className={cx("h-1.5 w-1.5 rounded-full", styles.dot)} />
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function InspectorPanel({
  title,
  eyebrow,
  children,
  className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
} & ClassNameProp) {
  return (
    <section
      className={cx(
        "sticky top-24 rounded-xl border border-slate-800 bg-[#090D14]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      <div className="border-b border-slate-800 px-4 py-4">
        {eyebrow ? (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-100">
          {title}
        </h2>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

export function TerminalTable({
  children,
  className,
}: {
  children: ReactNode;
} & ClassNameProp) {
  return (
    <div
      className={cx(
        "overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/30",
        className,
      )}
    >
      <table className="w-full min-w-[980px] border-collapse text-left">
        {children}
      </table>
    </div>
  );
}

export function TerminalTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-800 bg-slate-950/70">
      {children}
    </thead>
  );
}

export function TerminalTh({ children }: { children: ReactNode }) {
  return (
    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
      {children}
    </th>
  );
}

export function TerminalTd({
  children,
  className,
}: {
  children: ReactNode;
} & ClassNameProp) {
  return (
    <td className={cx("px-3 py-3 align-top text-sm text-slate-300", className)}>
      {children}
    </td>
  );
}

export function TerminalJson({
  data,
  className,
}: {
  data: unknown;
} & ClassNameProp) {
  return (
    <pre
      className={cx(
        "max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3",
        "font-mono text-[11px] leading-5 text-slate-400",
        className,
      )}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function TerminalEmpty({
  title,
  description,
  tone = "neutral",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  tone?: TerminalTone;
} & ClassNameProp) {
  return (
    <div
      className={cx(
        "rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center",
        className,
      )}
    >
      <div className="mb-3 flex justify-center">
        <TerminalBadge label={tone === "danger" ? "Error" : "Empty"} tone={tone} />
      </div>

      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>

      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function TerminalInputClassName(state?: boolean | string | null) {
  return cx(
    "w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition",
    "placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10",
    "disabled:cursor-not-allowed disabled:opacity-50",
    typeof state === "string" ? state : null,
    state === true
      ? "border-rose-500/45 focus:border-rose-400/70 focus:ring-rose-500/10"
      : null,
  );
}
