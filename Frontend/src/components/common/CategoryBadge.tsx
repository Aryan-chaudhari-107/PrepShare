import React from "react";
import { Building, Globe } from "lucide-react";
import { cn } from "../../lib/cn";

interface CategoryBadgeProps {
  category: string;
  className?: string;
  size?: "xs" | "sm" | "md";
}

const SIZE_CLASSES: Record<NonNullable<CategoryBadgeProps["size"]>, string> = {
  xs: "px-2.5 py-1 text-xs font-semibold",
  sm: "px-3 py-1.5 text-sm font-semibold",
  md: "px-3.5 py-1.5 text-base font-semibold",
};

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

/**
 * Purely presentational category pill. Campus variants use the `olive` brand
 * scale and off-campus variants use the `accent` status scale — the exact
 * hues the previous hardcoded hexes resolved to, but sourced from tokens so
 * they can be retuned or theme-flipped in one place.
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  className,
  size = "sm",
}) => {
  const isCampus =
    category.toLowerCase().includes("campus") && !category.toLowerCase().includes("off");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border shadow-xs",
        SIZE_CLASSES[size],
        isCampus
          ? "border-olive-500/25 bg-olive-500/10 text-olive-ink"
          : "border-accent/25 bg-accent-soft text-accent",
        className
      )}
    >
      {isCampus ? (
        <Building className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      {formatCategory(category)}
    </span>
  );
};
