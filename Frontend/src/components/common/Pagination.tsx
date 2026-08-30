import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  hasNext,
  hasPrevious,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-2 border-t border-border-subtle text-xs text-on-surface-variant">
      <div>
        Showing page <span className="font-semibold text-on-surface">{page}</span> of{" "}
        <span className="font-semibold text-on-surface">{totalPages}</span> ({total} total experiences)
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="px-4 py-2 rounded-lg border border-border-subtle bg-surface-elevated font-medium text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-all active:scale-95 shadow-sm"
        >
          Previous
        </button>
        <button
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-container transition-all active:scale-95 shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
};

