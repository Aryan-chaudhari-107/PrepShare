import React from "react";
import { FilterMetadata, PostFeedFilterParams } from "../../types";

interface FilterSidebarProps {
  filters: PostFeedFilterParams;
  onFilterChange: (key: keyof PostFeedFilterParams, value: any) => void;
  onClearFilters: () => void;
  metadata?: FilterMetadata | null;
  activeFilterCount: number;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  metadata,
  activeFilterCount,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const categories = [
    { value: "", label: "All Categories" },
    { value: "campus_placement", label: "Campus Placement" },
    { value: "off_campus_placement", label: "Off-Campus Placement" },
    { value: "campus_hackathon", label: "Campus Hackathon" },
    { value: "off_campus_hackathon", label: "Off-Campus Hackathon" },
  ];

  return (
    <aside
      className={`flex flex-col gap-5 ${
        isMobileDrawer
          ? "w-full p-6 bg-surface-elevated"
          : "w-[270px] lg:w-[280px] shrink-0 bg-surface-elevated rounded-2xl border border-border-subtle p-5 shadow-sm sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl select-none">
            tune
          </span>
          <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear all
            </button>
          )}
          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Close filters"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Keyword / Search */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">search</span>
          Keyword Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Role, college, skill, company..."
            className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 pl-8 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-sm pointer-events-none">
            manage_search
          </span>
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Category */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">category</span>
          Experience Type
        </label>
        <select
          value={filters.post_category || ""}
          onChange={(e) => onFilterChange("post_category", e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. College / University */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">school</span>
          College / University
        </label>
        <select
          value={filters.institution_name || ""}
          onChange={(e) => onFilterChange("institution_name", e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
        >
          <option value="">All Colleges</option>
          {metadata?.colleges?.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Course / Discipline */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">menu_book</span>
          Course / Discipline
        </label>
        <select
          value={filters.course || ""}
          onChange={(e) => onFilterChange("course", e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
        >
          <option value="">All Disciplines</option>
          {metadata?.courses?.map((crs) => (
            <option key={crs} value={crs}>
              {crs}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Company */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">business</span>
          Company
        </label>
        <select
          value={filters.company_name || ""}
          onChange={(e) => onFilterChange("company_name", e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
        >
          <option value="">All Companies</option>
          {metadata?.companies?.map((comp) => (
            <option key={comp} value={comp}>
              {comp}
            </option>
          ))}
        </select>
      </div>

      {/* 6. Industry */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">domain</span>
          Industry
        </label>
        <select
          value={filters.industry || ""}
          onChange={(e) => onFilterChange("industry", e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
        >
          <option value="">All Industries</option>
          {metadata?.industries?.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Location */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">location_on</span>
          Location
        </label>
        <select
          value={filters.work_location || ""}
          onChange={(e) => onFilterChange("work_location", e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
        >
          <option value="">All Locations</option>
          {metadata?.locations?.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* 8. Role */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">badge</span>
          Role / Job Title
        </label>
        <select
          value={filters.job_role || ""}
          onChange={(e) => onFilterChange("job_role", e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
        >
          <option value="">All Roles</option>
          {metadata?.roles?.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* 9. Offer Status */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-outline">verified</span>
          Offer Status
        </label>
        <div className="grid grid-cols-3 gap-1 bg-surface p-1 rounded-xl border border-border-subtle">
          <button
            type="button"
            onClick={() => onFilterChange("is_offer_received", undefined)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              filters.is_offer_received === undefined
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Any
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("is_offer_received", true)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              filters.is_offer_received === true
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Offer
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("is_offer_received", false)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              filters.is_offer_received === false
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            No Offer
          </button>
        </div>
      </div>

      {/* 10. Round / Assessment Tags */}
      {metadata?.round_tags && metadata.round_tags.length > 0 && (
        <div className="space-y-2 border-t border-border-subtle pt-3">
          <label className="text-xs font-semibold text-on-surface-variant flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-outline">tag</span>
              Assessment Tags
            </span>
            {filters.round_tag && (
              <button
                onClick={() => onFilterChange("round_tag", "")}
                className="text-[10px] text-primary hover:underline"
              >
                Clear
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            {metadata.round_tags.map((tag) => {
              const isSelected = filters.round_tag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    onFilterChange("round_tag", isSelected ? "" : tag)
                  }
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary font-semibold shadow-xs"
                      : "bg-surface text-on-surface-variant border border-border-subtle hover:border-primary/50 hover:text-on-surface"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Drawer Bottom Button */}
      {isMobileDrawer && (
        <div className="pt-2">
          <button
            onClick={onCloseMobileDrawer}
            className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-sm hover:opacity-90 transition-all"
          >
            Show Results
          </button>
        </div>
      )}
    </aside>
  );
};
