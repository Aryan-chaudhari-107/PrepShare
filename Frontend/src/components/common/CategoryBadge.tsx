import React from "react";

interface CategoryBadgeProps {
  category: string;
  className?: string;
  size?: "xs" | "sm" | "md";
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  className = "",
  size = "xs",
}) => {
  const isCampus = category.toLowerCase().includes("campus") && !category.toLowerCase().includes("off");

  const formatCategory = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "campus_placement":
      case "campus-placement":
        return "CAMPUS";
      case "off_campus_placement":
      case "off-campus-placement":
        return "OFF-CAMPUS";
      case "campus_hackathon":
      case "campus-hackathon":
        return "CAMPUS HACKATHON";
      case "off_campus_hackathon":
      case "off-campus-hackathon":
        return "OFF-CAMPUS HACKATHON";
      default:
        return cat.replace(/_/g, " ").toUpperCase();
    }
  };

  const sizeClasses = {
    xs: "text-[10px] px-2 py-0.5 font-bold tracking-wider",
    sm: "text-xs px-2.5 py-1 font-bold tracking-wider",
    md: "text-sm px-3 py-1.5 font-bold",
  };

  if (isCampus) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 uppercase ${sizeClasses[size]} ${className}`}
      >
        {formatCategory(category)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 uppercase ${sizeClasses[size]} ${className}`}
    >
      {formatCategory(category)}
    </span>
  );
};
