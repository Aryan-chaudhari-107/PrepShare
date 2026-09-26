import React, { useId } from "react";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  ChevronDown,
  Factory,
  GraduationCap,
  Layers,
  MapPin,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { FilterMetadata, PostFeedFilterParams } from "../../types";
import { Button, Chip, IconButton, Segmented, Select } from "../ui";
import { cn } from "../../lib/cn";

/** Everything a filter control is allowed to write back to the page. */
type FilterValue = PostFeedFilterParams[keyof PostFeedFilterParams];
type OfferValue = "any" | "offer" | "no-offer";

interface FilterSidebarProps {
  filters: PostFeedFilterParams;
  onFilterChange: (key: keyof PostFeedFilterParams, value: FilterValue) => void;
  onClearFilters: () => void;
  metadata?: FilterMetadata | null;
  activeFilterCount: number;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "campus_placement", label: "Campus Placement" },
  { value: "off_campus_placement", label: "Off-Campus Placement" },
  { value: "campus_hackathon", label: "Campus Hackathon" },
  { value: "off_campus_hackathon", label: "Off-Campus Hackathon" },
];

const toOptions = (values: string[] | undefined): { value: string; label: string }[] =>
  (values ?? []).map((value) => ({ value, label: value }));

const OFFER_OPTIONS: { value: OfferValue; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "offer", label: "Offer" },
  { value: "no-offer", label: "No Offer" },
];

interface FilterSelectProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}

/** Label + select + chevron, so every dropdown shares one accessible shape. */
const FilterSelect: React.FC<FilterSelectProps> = ({
  id,
  label,
  icon,
  value,
  onChange,
  allLabel,
  options,
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-heading">
      <span className="text-muted" aria-hidden="true">
        {icon}
      </span>
      {label}
    </label>
    <div className="relative">
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-11">
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  </div>
);

/**
 * The feed's filter panel. Desktop and mobile previously rendered the same
 * controls through two near-identical trees; there is now ONE renderer whose
 * chrome is switched with `isMobileDrawer`, so a filter can never be added to
 * one surface and forgotten on the other.
 */
export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  metadata,
  activeFilterCount,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const baseId = useId();
  const offerValue: OfferValue =
    filters.is_offer_received === undefined
      ? "any"
      : filters.is_offer_received
        ? "offer"
        : "no-offer";

  const handleOfferChange = (value: OfferValue) =>
    onFilterChange("is_offer_received", value === "any" ? undefined : value === "offer");

  return (
    <aside
      aria-label={isMobileDrawer ? "Mobile filters" : "Filters"}
      className={cn(
        "flex flex-col gap-6",
        isMobileDrawer
          ? "w-full bg-canvas p-6"
          : "sticky top-24 max-h-[calc(100vh_-_7rem)] w-full shrink-0 overflow-y-auto scrollbar-slim rounded-xl border border-line bg-surface/85 p-6 shadow-xs"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
          {/* h2 (not h3): the feed page's first heading is the h1 page title,
              and skipping straight to h3 fails WCAG heading-order checks. */}
          <h2 className="text-sm font-semibold uppercase tracking-wider text-heading">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-fg shadow-xs">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="cursor-pointer text-sm font-semibold text-primary transition-[color,transform] duration-fast ease-swift hover:underline active:scale-press"
            >
              Reset
            </button>
          )}
          {isMobileDrawer && onCloseMobileDrawer && (
            <IconButton label="Close filters" onClick={onCloseMobileDrawer}>
              <X size={18} aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>

      {/* 1. Keyword search */}
      <div className="space-y-2">
        <label
          htmlFor={`${baseId}-search`}
          className="flex items-center gap-2 text-sm font-semibold text-heading"
        >
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          Keyword Search
        </label>
        <div className="relative">
          <input
            id={`${baseId}-search`}
            type="search"
            value={filters.search || ""}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Role, college, skill..."
            className="field h-11 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
          />
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange("search", "")}
              aria-label="Clear keyword search"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted transition-[color,transform] duration-fast ease-swift hover:bg-sunken hover:text-heading active:scale-95"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Experience type */}
      <FilterSelect
        id={`${baseId}-category`}
        label="Experience Type"
        icon={<Layers className="h-4 w-4" />}
        value={filters.post_category || ""}
        onChange={(value) => onFilterChange("post_category", value)}
        allLabel="All Categories"
        options={CATEGORIES}
      />

      {/* 3. College / university */}
      <FilterSelect
        id={`${baseId}-college`}
        label="College / University"
        icon={<GraduationCap className="h-4 w-4" />}
        value={filters.institution_name || ""}
        onChange={(value) => onFilterChange("institution_name", value)}
        allLabel="All Colleges"
        options={toOptions(metadata?.colleges)}
      />

      {/* 4. Course / discipline */}
      <FilterSelect
        id={`${baseId}-course`}
        label="Course / Discipline"
        icon={<BookOpen className="h-4 w-4" />}
        value={filters.course || ""}
        onChange={(value) => onFilterChange("course", value)}
        allLabel="All Disciplines"
        options={toOptions(metadata?.courses)}
      />

      {/* 5. Company */}
      <FilterSelect
        id={`${baseId}-company`}
        label="Company"
        icon={<Building2 className="h-4 w-4" />}
        value={filters.company_name || ""}
        onChange={(value) => onFilterChange("company_name", value)}
        allLabel="All Companies"
        options={toOptions(metadata?.companies)}
      />

      {/* 6. Industry */}
      <FilterSelect
        id={`${baseId}-industry`}
        label="Industry"
        icon={<Factory className="h-4 w-4" />}
        value={filters.industry || ""}
        onChange={(value) => onFilterChange("industry", value)}
        allLabel="All Industries"
        options={toOptions(metadata?.industries)}
      />

      {/* 7. Location */}
      <FilterSelect
        id={`${baseId}-location`}
        label="Location"
        icon={<MapPin className="h-4 w-4" />}
        value={filters.work_location || ""}
        onChange={(value) => onFilterChange("work_location", value)}
        allLabel="All Locations"
        options={toOptions(metadata?.locations)}
      />

      {/* 8. Offer status */}
      <div className="space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-heading">
          <BadgeCheck className="h-4 w-4 text-muted" aria-hidden="true" />
          Offer Status
        </span>
        <Segmented
          options={OFFER_OPTIONS}
          value={offerValue}
          onChange={handleOfferChange}
          label="Offer status"
          tone={(value) =>
            value === "offer" ? "text-success" : value === "no-offer" ? "text-danger" : "text-primary"
          }
        />
      </div>

      {/* 9. Assessment tags */}
      {metadata?.round_tags && metadata.round_tags.length > 0 && (
        <div className="space-y-2.5 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-2">
            <span
              id={`${baseId}-tags-label`}
              className="flex items-center gap-2 text-sm font-semibold text-heading"
            >
              <Tag className="h-4 w-4 text-muted" aria-hidden="true" />
              Assessment Tags
            </span>
            {filters.round_tag && (
              <Chip
                removeLabel="Clear assessment tag"
                onRemove={() => onFilterChange("round_tag", "")}
              >
                {`#${filters.round_tag}`}
              </Chip>
            )}
          </div>

          <div
            role="group"
            aria-labelledby={`${baseId}-tags-label`}
            className="scrollbar-slim flex max-h-[260px] flex-wrap gap-2 overflow-y-auto pr-1"
          >
            {metadata.round_tags.map((tag) => {
              const isSelected = filters.round_tag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onFilterChange("round_tag", isSelected ? "" : tag)}
                  className={cn(
                    "max-w-full cursor-pointer break-words rounded-full px-3 py-1.5 text-left text-sm font-medium",
                    // Toggle + press only: colour for the state, a small
                    // transform for the press. This panel is a control
                    // surface, so it stays still otherwise.
                    "transition-[color,background-color,border-color,transform] duration-fast ease-swift active:scale-press",
                    isSelected
                      ? "bg-primary text-primary-fg shadow-xs"
                      : "border border-line bg-sunken text-body hover:border-primary/50 hover:text-heading"
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile drawer footer */}
      {isMobileDrawer && onCloseMobileDrawer && (
        <div className="pt-3">
          <Button fullWidth onClick={onCloseMobileDrawer}>
            Show Results
          </Button>
        </div>
      )}
    </aside>
  );
};
