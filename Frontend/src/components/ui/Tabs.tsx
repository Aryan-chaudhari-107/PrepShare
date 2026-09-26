import React, { useId, useRef } from "react";
import { cn } from "../../lib/cn";

interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Rendered next to the label, e.g. an unread count. */
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Accessible name for the tablist. */
  label: string;
  variant?: "underline" | "pill";
  size?: "sm" | "md";
  className?: string;
  /** Optional live region announcing the panel contents. */
  panelId?: string;
}

/**
 * WAI-ARIA tabs with roving tabindex: Left/Right/Home/End move between tabs,
 * only the active tab is in the tab order, and selection follows focus —
 * matching native tab behaviour rather than a row of styled links.
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  onChange,
  label,
  variant = "underline",
  size = "md",
  className,
  panelId,
}) => {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const focusTab = (index: number) => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)');
    if (!buttons || buttons.length === 0) return;
    const bounded = (index + buttons.length) % buttons.length;
    buttons[bounded].focus();
    const id = buttons[bounded].dataset.tabId;
    if (id) onChange(id);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const enabled = items.filter((i) => !i.disabled);
    const current = enabled.findIndex((i) => i.id === value);
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTab(current + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTab(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(enabled.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "scrollbar-hide flex items-center gap-1 overflow-x-auto",
        variant === "underline"
          ? "border-b border-line"
          : "rounded-lg bg-sunken p-1",
        className
      )}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-tab-id={item.id}
            id={`${baseId}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 font-medium transition-colors duration-fast ease-swift",
              "disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "px-2.5 py-1.5 text-sm" : "px-3 py-2 text-sm",
              variant === "underline"
                ? cn(
                    "-mb-px border-b-2",
                    selected
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:border-line-strong hover:text-heading"
                  )
                : cn(
                    "rounded-md",
                    selected
                      ? "bg-surface text-heading shadow-xs"
                      : "text-muted hover:text-heading"
                  )
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
};

/* ── Segmented control ─────────────────────────────────────────────────────
   Same ARIA model as Tabs, but used for in-place view/scope switching
   (difficulty vote, range selector, feed layout). */

interface SegmentedProps<T extends string> {
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  /** Required — this control is operable with no visible label attached. */
  label: string;
  size?: "sm" | "md";
  tone?: (value: T) => string;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  tone,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex rounded-lg bg-sunken p-1",
        size === "sm" ? "gap-0.5" : "gap-1",
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-fast ease-swift",
              "active:scale-press",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
              selected
                ? cn("bg-surface text-heading shadow-xs", tone?.(option.value))
                : "text-muted hover:text-heading"
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
