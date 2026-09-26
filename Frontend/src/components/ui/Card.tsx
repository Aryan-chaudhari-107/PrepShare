import React from "react";
import { cn } from "../../lib/cn";
import { Tilt, type SurfaceProps } from "../../motion/Tilt";

/* ── Card ───────────────────────────────────────────────────────────────────
   One surface recipe. `interactive` adds hover elevation without every page
   inventing its own shadow/translate combination. */

interface CardProps extends SurfaceProps {
  interactive?: boolean;
  padded?: boolean;
  as?: "div" | "article" | "section" | "li";
  /**
   * Pointer-driven perspective + specular highlight on the card itself.
   * OPT-IN AND RARE: use it on a page's focal surface only — the one card the
   * eye should land on. Applying it to every card in a list turns depth into
   * noise and costs a listener per card. Renders a `div`, so do not combine
   * it with `as`.
   */
  tilt?: boolean;
}

export const Card: React.FC<CardProps> = ({
  interactive,
  padded = true,
  as: Tag = "div",
  tilt,
  className,
  children,
  ...rest
}) => {
  const classes = cn(
    // `group` rides on every card so `glow-edge` can key off hover/focus on
    // the same element; the surface is translucent so the environment reads
    // faintly through it — glass, not plastic.
    "group rounded-xl border border-line bg-surface/85 shadow-xs",
    padded && "p-5 sm:p-6",
    interactive && "glow-edge",
    className
  );

  if (tilt) {
    return (
      <Tilt className={classes} {...rest}>
        {children}
      </Tilt>
    );
  }

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
};

/* ── Card header ────────────────────────────────────────────────────────── */

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** Heading level — keep the document outline correct on every page. */
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  as: Heading = "h3",
  className,
}) => (
  <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
    <div className="flex min-w-0 items-start gap-3">
      {icon && (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <Heading className="text-lg font-semibold tracking-tight">{title}</Heading>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ── Stat ──────────────────────────────────────────────────────────────── */

interface StatProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}

/** Tabular numerals so counts never jitter as they update. */
export const Stat: React.FC<StatProps> = ({ label, value, sub, className }) => (
  <div className={cn("min-w-0", className)}>
    <div className="tabular truncate text-2xl font-semibold tracking-tight text-heading">{value}</div>
    <div className="truncate text-sm text-muted">{label}</div>
    {sub && <div className="truncate text-xs text-faint">{sub}</div>}
  </div>
);

/* ── Divider ───────────────────────────────────────────────────────────── */

export const Divider: React.FC<{ label?: string; className?: string }> = ({
  label,
  className,
}) =>
  label ? (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium uppercase tracking-wider text-faint">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  ) : (
    <hr className={cn("border-0 border-t border-line", className)} />
  );
