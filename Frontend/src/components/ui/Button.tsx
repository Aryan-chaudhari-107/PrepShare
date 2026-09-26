import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Replaces the leading icon with a spinner and announces busy state. */
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const BASE =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium " +
  "whitespace-nowrap align-middle transition-[background-color,border-color,color,box-shadow,transform] " +
  "duration-fast ease-swift active:scale-press " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg shadow-xs hover:bg-[rgb(var(--primary-hover))]",
  secondary:
    "border border-line bg-surface text-heading shadow-xs hover:border-line-strong hover:bg-raised",
  ghost: "text-muted hover:bg-sunken/70 hover:text-heading",
  danger: "bg-danger text-danger-fg shadow-xs hover:brightness-95",
  link: "text-primary underline-offset-4 hover:underline p-0 h-auto rounded-none bg-transparent",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

/**
 * Anchors that must LOOK like buttons (router `<Link>` navigation).
 * Kept beside <Button> so a link-button can never drift from the real one.
 *
 * Use these instead of nesting <Button> inside <Link>: an interactive element
 * inside an interactive element is invalid HTML and confuses both keyboard
 * navigation and screen readers.
 */
export const LINK_PRIMARY =
  "inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 " +
  "text-sm font-medium text-primary-fg shadow-xs active:scale-press " +
  "transition-[background-color,border-color,box-shadow,transform] duration-fast ease-swift " +
  "hover:bg-[rgb(var(--primary-hover))]";

export const LINK_SECONDARY =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 " +
  "text-sm font-medium text-heading shadow-xs active:scale-press " +
  "transition-[background-color,border-color,box-shadow,transform] duration-fast ease-swift " +
  "hover:border-line-strong hover:bg-raised";

/**
 * The one and only button in the app. Every interactive action renders
 * through this component so size, radius, focus, disabled and loading
 * behaviour can never drift between pages again.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}) => {
  const iconSize = size === "lg" ? 18 : size === "sm" ? 14 : 16;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-live={loading ? "polite" : undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        icon && <span className="shrink-0 [&>svg]:block">{icon}</span>
      )}
      {children && <span className="min-w-0 truncate">{children}</span>}
      {iconRight && !loading && (
        <span className="shrink-0 [&>svg]:block">{iconRight}</span>
      )}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Always required — icon-only controls must expose an accessible name. */
  label: string;
  loading?: boolean;
  tone?: "default" | "primary" | "danger";
}

const ICON_TONES = {
  default: "text-muted hover:bg-sunken/80 hover:text-heading",
  primary: "bg-primary text-primary-fg shadow-xs hover:bg-[rgb(var(--primary-hover))]",
  danger: "text-danger hover:bg-danger-soft hover:text-danger",
};

/**
 * Square icon-only control. Forbids anonymous buttons — `label` becomes both
 * the accessible name and the tooltip.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  label,
  loading = false,
  tone = "default",
  className,
  children,
  disabled,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cn(
      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-fast ease-swift",
      "active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
      ICON_TONES[tone],
      className
    )}
    {...rest}
  >
    {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : children}
  </button>
);
