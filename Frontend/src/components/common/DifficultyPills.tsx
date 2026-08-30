import React from "react";

interface DifficultyPillsProps {
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export const DifficultyPills: React.FC<DifficultyPillsProps> = ({
  easyCount = 0,
  mediumCount = 0,
  hardCount = 0,
  size = "sm",
  showLabel = false,
}) => {
  const isSm = size === "sm";

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
          Difficulty
        </span>
      )}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-bold ${
            isSm ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs"
          }`}
          title={`Easy: ${easyCount} votes`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
          <span>{easyCount}</span>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] font-bold ${
            isSm ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs"
          }`}
          title={`Medium: ${mediumCount} votes`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
          <span>{mediumCount}</span>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] font-bold ${
            isSm ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs"
          }`}
          title={`Hard: ${hardCount} votes`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
          <span>{hardCount}</span>
        </div>
      </div>
    </div>
  );
};
