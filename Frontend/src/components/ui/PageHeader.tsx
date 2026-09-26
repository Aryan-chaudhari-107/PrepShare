import React from "react";
import { cn } from "../../lib/cn";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Buttons / filters aligned to the right of the title. */
  actions?: React.ReactNode;
  /** Rendered under the actions row, full width. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Every list page previously grew its own title block with different margins,
 * heading sizes and no consistent place for actions. This standardises it and
 * guarantees a single, correctly-levelled <h1> per page.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  children,
  className,
}) => (
  <header className={cn("mb-6", className)}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1 max-w-prose text-balance text-sm text-muted sm:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </header>
);
