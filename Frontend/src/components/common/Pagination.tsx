import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-2 border-t border-[#e3dccd] text-xs text-[#5f6e82]">
      <div>
        Showing page <span className="font-semibold text-[#0f1926]">{page}</span> of{" "}
        <span className="font-semibold text-[#0f1926]">{totalPages}</span> ({total} total experiences)
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="px-3.5 py-2 rounded-xl border border-[#e3dccd] bg-white font-medium text-[#2b3a4f] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f3eee1] hover:text-[#0f1926] transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>
        <button
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="px-3.5 py-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
