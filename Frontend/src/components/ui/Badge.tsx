import React from "react";
import { cn } from "../../lib/cn";

export type Tone =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "offered";

type Variant = "soft" | "solid" | "outline";

const SOFT: Record<Tone, string> = {
  neutral: "bg-sunken text-muted",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  offered: "bg-warning-soft text-warning",
};

const SOLID: Record<Tone, string> = {
  neutral: "bg-sunken text-muted",
  primary: "bg-primary text-primary-fg",
  accent: "bg-accent text-accent-fg",
  success: "bg-success text-success-fg",
  warning: "bg-warning text-warning-fg",
  danger: "bg-danger text-danger-fg",
  offered: "bg-warning text-warning-fg",
};

const OUTLINE: Record<Tone, string> = {
  neutral: "border-line text-muted",
  primary: "border-primary/40 text-primary",
  accent: "border-accent/40 text-accent",
  success: "border-success/40 text-success",
  warning: "border-warning/40 text-warning",
  danger: "border-danger/40 text-danger",
  offered: "border-warning/40 text-warning",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-faint",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  offered: "bg-warning",
};

interface BadgeProps {
  tone?: Tone;
  variant?: Variant;
  icon?: React.ReactNode;
  /** Renders as a true dot indicator with a screen-reader label. */
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** Static label — status, category, role, verification. */
export const Badge: React.FC<BadgeProps> = ({
  tone = "neutral",
  variant = "soft",
  icon,
  dot,
  className,
  children,
}) => {
  const palette =
    variant === "solid" ? SOLID[tone] : variant === "outline" ? OUTLINE[tone] : SOFT[tone];

  if (dot) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT[tone])} aria-hidden="true" />
        {children && <span className={cn("text-sm text-muted", className)}>{children}</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5",
        palette,
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};

interface ChipProps {
  children: React.ReactNode;
  /** Shows an accessible remove affordance when provided. */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}

/** Removable filter chip — used by the feed filter bar and tag pickers. */
export const Chip: React.FC<ChipProps> = ({
  children,
  onRemove,
  removeLabel = "Remove filter",
  className,
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary",
      className
    )}
  >
    {children}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${removeLabel}: ${typeof children === "string" ? children : ""}`.trim()}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    )}
  </span>
);
