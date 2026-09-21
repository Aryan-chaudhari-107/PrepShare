import React from "react";
import { Building, Globe } from "lucide-react";

interface CategoryBadgeProps {
  category: string;
  className?: string;
  size?: "xs" | "sm" | "md";
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  className = "",
  size = "sm",
}) => {
  const isCampus = category.toLowerCase().includes("campus") && !category.toLowerCase().includes("off");

  const formatCategory = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "campus_placement":
      case "campus-placement":
        return "Campus Placement";
      case "off_campus_placement":
      case "off-campus-placement":
        return "Off-Campus";
      case "campus_hackathon":
      case "campus-hackathon":
        return "Campus Hackathon";
      case "off_campus_hackathon":
      case "off-campus-hackathon":
        return "Off-Campus Hackathon";
      default:
        return cat.replace(/_/g, " ");
    }
  };

  const sizeClasses = {
    xs: "text-[12px] px-2.5 py-1 font-semibold",
    sm: "text-[13.5px] px-3 py-1.5 font-semibold",
    md: "text-[14.5px] px-3.5 py-1.5 font-semibold",
  };

  if (isCampus) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#3f6f52]/10 text-[#2f6b47] border border-[#3f6f52]/25 shadow-xs ${sizeClasses[size]} ${className}`}
      >
        <Building className="w-3.5 h-3.5 shrink-0 text-[#2f6b47]" />
        {formatCategory(category)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#3f6f9e]/10 text-[#2b587a] border border-[#3f6f9e]/25 shadow-xs ${sizeClasses[size]} ${className}`}
    >
      <Globe className="w-3.5 h-3.5 shrink-0 text-[#3f6f9e]" />
      {formatCategory(category)}
    </span>
  );
};
