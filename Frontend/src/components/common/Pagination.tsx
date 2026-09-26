import React from "react";
import { cn } from "../../lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Plural noun for the total line, e.g. "experiences", "notifications".
   * Previously hard-coded to "experiences", so Notifications, Drafts and
   * Completed Questions all read "(12 total experiences)".
   */
  noun?: string;
  total?: number;
  isLoading?: boolean;
  className?: string;
}

const edge = cn(
  "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors duration-fast ease-swift",
  "disabled:cursor-not-allowed disabled:opacity-40"
);

/** Page window: first … current±1 … last, with ellipsis markers. */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  noun = "items",
  total,
  isLoading,
  className,
}) => {
  if (totalPages <= 1) {
    if (total === undefined || total === 0) return null;
    return (
      <p className={cn("text-center text-sm text-muted", className)}>
        {total} {noun}
        {total === 1 ? "" : "s"}
      </p>
    );
  }

  const go = (next: number) => {
    if (next < 1 || next > totalPages || next === page || isLoading) return;
    onPageChange(next);
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}
    >
      <p className="text-sm text-muted">
        {total !== undefined && (
          <span className="tabular">
            {total} {noun}
            {total === 1 ? "" : "s"} ·{" "}
          </span>
        )}
        <span className="tabular">
          Page {page} of {totalPages}
        </span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1 || isLoading}
          className={cn(edge, "border border-line bg-surface hover:bg-raised")}
        >
          Previous
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((entry, index) =>
            entry === "…" ? (
              <span key={`gap-${index}`} className="px-1.5 text-sm text-faint" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => go(entry)}
                disabled={isLoading}
                aria-current={entry === page ? "page" : undefined}
                aria-label={`Page ${entry}`}
                className={cn(
                  "tabular h-9 w-9 rounded-lg text-sm font-medium transition-colors duration-fast ease-swift disabled:cursor-not-allowed",
                  entry === page
                    ? "bg-primary text-primary-fg shadow-xs"
                    : "text-muted hover:bg-raised hover:text-heading"
                )}
              >
                {entry}
              </button>
            )
          )}
        </div>

        <span className="tabular px-2 text-sm text-muted sm:hidden">
          {page}/{totalPages}
        </span>

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages || isLoading}
          className={cn(edge, "border border-line bg-surface hover:bg-raised")}
        >
          Next
        </button>
      </div>
    </nav>
  );
};
