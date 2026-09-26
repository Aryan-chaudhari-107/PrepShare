import React from "react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import { StateArt, type ArtVariant } from "../../motion/StateArt";

/* ── Spinner ───────────────────────────────────────────────────────────── */

export const Spinner: React.FC<{ size?: number; className?: string; label?: string }> = ({
  size = 18,
  className,
  label,
}) => (
  <span className={cn("inline-flex items-center gap-2", className)} role="status">
    <span
      className="animate-spin rounded-full border-2 border-current border-t-transparent text-primary motion-reduce:animate-none"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
    {label && <span className="text-sm text-muted">{label}</span>}
  </span>
);

/* ── Loading (page / section) ──────────────────────────────────────────── */

/**
 * Full-size loading is a MINIATURE OF THE CONTENT rather than a spinner: three
 * lines developing in sequence, so what appears next is already hinted at.
 * `compact` keeps the ring — inside a narrow comment rail there is no room for
 * a scene and a spinner reads faster.
 */
export const Loading: React.FC<{ label?: string; className?: string; compact?: boolean }> = ({
  label = "Loading…",
  className,
  compact,
}) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      "flex flex-col items-center justify-center gap-3 text-muted",
      compact ? "py-8" : "py-16",
      className
    )}
  >
    {compact ? (
      <Spinner size={18} />
    ) : (
      <div className="w-40 space-y-2" aria-hidden="true">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-3/4" delay={0.12} />
        <Skeleton className="h-2.5 w-5/6" delay={0.24} />
      </div>
    )}
    <span className="text-sm">{label}</span>
  </div>
);

/* ── Skeleton ──────────────────────────────────────────────────────────── */

/**
 * `delay` offsets this bar's sweep so a group of them does not pulse as one
 * block — the shimmer travels through the placeholder top-to-bottom like the
 * content is developing, which is what makes a skeleton feel choreographed
 * instead of like a grey rectangle with a shine on it.
 */
export const Skeleton: React.FC<{ className?: string; delay?: number }> = ({
  className,
  delay = 0,
}) => (
  <div
    className={cn("shimmer rounded-md", className)}
    style={delay ? { animationDelay: `${delay}s` } : undefined}
    aria-hidden="true"
  />
);

/** Feed-card shaped placeholder — matches PostCard's real geometry. */
export const SkeletonCard: React.FC = () => (
  <div className="rounded-xl border border-line bg-surface p-5 sm:p-6" aria-hidden="true">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" delay={0.06} />
        <Skeleton className="h-3 w-24" delay={0.12} />
      </div>
    </div>
    <Skeleton className="mt-5 h-5 w-3/4" delay={0.18} />
    <Skeleton className="mt-2.5 h-3.5 w-full" delay={0.24} />
    <Skeleton className="mt-2 h-3.5 w-5/6" delay={0.3} />
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-6 w-20 rounded-full" delay={0.36} />
      <Skeleton className="h-6 w-24 rounded-full" delay={0.42} />
      <Skeleton className="h-6 w-16 rounded-full" delay={0.48} />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-start gap-4 rounded-xl border border-line bg-surface p-4"
      >
        <Skeleton className="h-10 w-10 rounded-full" delay={i * 0.07} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" delay={i * 0.07 + 0.06} />
          <Skeleton className="h-3 w-4/5" delay={i * 0.07 + 0.12} />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" delay={i * 0.07 + 0.18} />
      </div>
    ))}
  </div>
);

/* ── Empty / Error states ──────────────────────────────────────────────── */

interface StateProps {
  icon?: React.ReactNode;
  /** Required for EmptyState; ErrorState falls back to a sensible default. */
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** `page` = full-viewport, `inline` = inside a card. */
  size?: "page" | "inline";
  tone?: "neutral" | "danger";
  /**
   * Product-specific illustration, used in preference to the icon tile. An
   * empty viewport is the one place the user has nothing to look at, so it is
   * the right moment for the design to show up rather than a generic glyph.
   */
  art?: ArtVariant;
  className?: string;
}

const STATE_TONE = {
  neutral: "bg-sunken text-muted",
  danger: "bg-danger-soft text-danger",
};

const base =
  "flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface px-6 text-center";

/** Renders the illustration, or falls back to the caller's icon tile. */
const StateFigure: React.FC<{
  art?: ArtVariant;
  icon?: React.ReactNode;
  tone: "neutral" | "danger";
}> = ({ art, icon, tone }) => {
  if (art) {
    return <StateArt variant={art} tone={tone === "danger" ? "danger" : "muted"} />;
  }
  if (!icon) return null;
  return (
    <span
      className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", STATE_TONE[tone])}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
};

/**
 * Distinct from <Loading/> on purpose — the app previously rendered failures
 * as an empty state ("No matching experiences"), which lied to the user.
 * An empty state always names what is missing, so `title` stays required here.
 */
export const EmptyState: React.FC<StateProps & { title: string }> = ({
  icon,
  title,
  description,
  action,
  size = "inline",
  tone = "neutral",
  art,
  className,
}) => (
  <div className={cn(base, size === "page" ? "py-16" : "py-12", className)}>
    <StateFigure art={art} icon={icon} tone={tone} />
    <h3 className="text-lg font-semibold">{title}</h3>
    {description && (
      <p className="max-w-sm text-balance text-sm text-muted">{description}</p>
    )}
    {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>
);

/** Explicit failure state with a retry affordance. */
export const ErrorState: React.FC<StateProps & { onRetry?: () => void }> = ({
  icon,
  title = "Something went wrong",
  description,
  action,
  onRetry,
  size = "inline",
  tone = "danger",
  // Errors default to the mis-filed report: the query became a cold case.
  art = icon ? undefined : "stray",
  className,
}) => (
  <div role="alert" className={cn(base, size === "page" ? "py-16" : "py-12", className)}>
    <StateFigure art={art} icon={icon} tone={tone} />
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="max-w-sm text-balance text-sm text-muted">
      {description ?? "The request didn't complete. Check your connection and try again."}
    </p>
    <div className="mt-1 flex flex-wrap justify-center gap-2">
      {action}
      {onRetry && (
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  </div>
);
