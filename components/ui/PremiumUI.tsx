import Link from "next/link";
import type { ReactNode } from "react";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

type ClassNameProp = {
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toneClass(tone: Tone) {
  if (tone === "success") {
    return {
      pill: "border-emerald-500/25 bg-emerald-500/8 text-emerald-300",
      dot: "bg-emerald-400",
      soft: "border-emerald-500/20 bg-emerald-500/7 text-emerald-200",
      bar: "bg-emerald-400",
    };
  }

  if (tone === "warning") {
    return {
      pill: "border-amber-500/25 bg-amber-500/8 text-amber-300",
      dot: "bg-amber-400",
      soft: "border-amber-500/20 bg-amber-500/7 text-amber-200",
      bar: "bg-amber-400",
    };
  }

  if (tone === "danger") {
    return {
      pill: "border-rose-500/25 bg-rose-500/8 text-rose-300",
      dot: "bg-rose-400",
      soft: "border-rose-500/20 bg-rose-500/7 text-rose-200",
      bar: "bg-rose-400",
    };
  }

  if (tone === "info") {
    return {
      pill: "border-sky-500/25 bg-sky-500/8 text-sky-300",
      dot: "bg-sky-400",
      soft: "border-sky-500/20 bg-sky-500/7 text-sky-200",
      bar: "bg-sky-400",
    };
  }

  return {
    pill: "border-slate-700 bg-slate-900/70 text-slate-300",
    dot: "bg-slate-400",
    soft: "border-slate-800 bg-slate-950/60 text-slate-300",
    bar: "bg-slate-500",
  };
}

export function PremiumPageShell({
  children,
  className,
}: {
  children: ReactNode;
} & ClassNameProp) {
  return (
    <main
      className={cx(
        "min-h-screen bg-[#070A0F] px-4 py-6 text-slate-100 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </main>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
} & ClassNameProp) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-slate-800/90 bg-[#0B111A]/95 shadow-[0_1px_0_rgba(255,255,255,0.03)]",
        "backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
} & ClassNameProp) {
  return (
    <div
      className={cx(
        "flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 sm:px-6",
        "lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="text-lg font-semibold tracking-tight text-slate-50">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: ReactNode;
  tone?: Tone;
} & ClassNameProp) {
  const toneStyles = toneClass(tone);

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        "text-xs font-semibold leading-none",
        toneStyles.pill,
        className,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", toneStyles.dot)} />
      <span>{label}</span>
    </span>
  );
}

export function SecondaryLink({
  href,
  children,
  tone = "neutral",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: Tone;
} & ClassNameProp) {
  const toneStyles = toneClass(tone);

  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center rounded-xl border px-4 py-2.5",
        "text-sm font-semibold transition",
        "hover:border-slate-500 hover:bg-slate-900",
        toneStyles.soft,
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  tone?: Tone;
} & ClassNameProp) {
  const toneStyles = toneClass(tone);

  return (
    <Card className={cx("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-slate-50">
            {value}
          </p>
        </div>

        <span className={cx("mt-1 h-2.5 w-2.5 rounded-full", toneStyles.dot)} />
      </div>

      {helper ? (
        <p className="mt-3 text-sm leading-6 text-slate-400">{helper}</p>
      ) : null}
    </Card>
  );
}

export function ScoreBar({
  label,
  value,
  helper,
  tone = "info",
  className,
}: {
  label: ReactNode;
  value: number;
  helper?: ReactNode;
  tone?: Tone;
} & ClassNameProp) {
  const safeValue = Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : 0;

  const toneStyles = toneClass(tone);

  return (
    <div className={cx("rounded-2xl border border-slate-800 bg-slate-950/40 p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <p className="text-sm font-semibold text-slate-300">
          {Math.round(safeValue)}%
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={cx("h-full rounded-full", toneStyles.bar)}
          style={{ width: `${safeValue}%` }}
        />
      </div>

      {helper ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

export function PageHero({
  pills,
  title,
  description,
  actions,
  className,
}: {
  pills?: Array<{ label: ReactNode; tone?: Tone }>;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
} & ClassNameProp) {
  return (
    <section
      className={cx(
        "rounded-3xl border border-slate-800 bg-[#0B111A] p-6 sm:p-7 lg:p-8",
        "shadow-[0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      {pills && pills.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {pills.map((pill, index) => (
            <StatusPill
              key={`${String(pill.label)}-${index}`}
              label={pill.label}
              tone={pill.tone ?? "neutral"}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function JsonPreview({
  data,
  className,
}: {
  data: unknown;
} & ClassNameProp) {
  return (
    <pre
      className={cx(
        "max-h-[420px] overflow-auto rounded-2xl border border-slate-800",
        "bg-slate-950/70 p-4 text-xs leading-5 text-slate-300",
        className,
      )}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function LoadingBlock({ className }: ClassNameProp) {
  return (
    <div
      className={cx(
        "h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50",
        className,
      )}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  label,
  tone = "neutral",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  label?: ReactNode;
  tone?: Tone;
} & ClassNameProp) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center",
        className,
      )}
    >
      {label ? (
        <div className="mb-4 flex justify-center">
          <StatusPill label={label} tone={tone} />
        </div>
      ) : null}

      <h3 className="text-base font-semibold text-slate-100">{title}</h3>

      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
} & ClassNameProp) {
  return (
    <p
      className={cx(
        "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500",
        className,
      )}
    >
      {children}
    </p>
  );
}


export function Field({
  label,
  helper,
  children,
  className,
}: {
  label: ReactNode;
  helper?: ReactNode;
  children: ReactNode;
} & ClassNameProp) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>

      {children}

      {helper ? (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

export function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
} & ClassNameProp) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SafetyNotice({
  title = "Safety Notice",
  description,
  tone = "warning",
  className,
}: {
  title?: ReactNode;
  description: ReactNode;
  tone?: Tone;
} & ClassNameProp) {
  const toneStyles = toneClass(tone);

  return (
    <div
      className={cx(
        "rounded-2xl border p-4",
        toneStyles.soft,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cx("mt-1 h-2 w-2 rounded-full", toneStyles.dot)} />

        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function inputClassName(state?: boolean | string | null) {
  const invalidClassName =
    "border-rose-500/45 focus:border-rose-400/70 focus:ring-rose-500/10";

  return cx(
    "w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60",
    typeof state === "string" ? state : null,
    state === true ? invalidClassName : null,
  );
}

