/* Shared visual language for the bento dashboard — category labels and the
   truncating chips reused across tiles, cards and the hero. */

export const CATEGORY_LABELS: Record<string, string> = {
  campus_hackathon: "Campus Hackathon",
  off_campus_hackathon: "Off-campus Hackathon",
  campus_placement: "Campus Placement",
  off_campus_placement: "Off-campus Placement",
};

export const categoryLabel = (category?: string | null): string => {
  if (!category) return "Experience";
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
};

/** Truncating chips keep long category/company strings inside their cards. */
export const NEUTRAL_CHIP =
  "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-line bg-sunken/70 px-2.5 py-1 text-[11px] font-medium text-muted";
export const POSITIVE_CHIP =
  "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-primary/35 bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary";
