import React from "react";
import {
  SlidersHorizontal,
  Search,
  Layers,
  GraduationCap,
  BookOpen,
  Building2,
  Factory,
  MapPin,
  BadgeCheck,
  Tag,
  X,
} from "lucide-react";
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

  const selectClassName =
    "w-full h-[44px] bg-[#f3eee1] border border-[#e3dccd] rounded-xl px-3.5 text-[15px] text-[#0f1926] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 focus:bg-white transition-all cursor-pointer";

  return (
    <aside
      className={`flex flex-col gap-6 ${
        isMobileDrawer
          ? "w-full p-6 bg-[#faf7ee]"
          : "w-full shrink-0 bg-white rounded-2xl border border-[#e3dccd] p-6 shadow-sm sticky top-[96px] max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e3dccd] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 flex items-center justify-center text-[#2f6b47]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-[15px] text-[#0f1926] uppercase tracking-wider">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="bg-[#3f6f52] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-[14px] font-semibold text-[#2f6b47] hover:text-[#3f6f52] transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-xl text-[#5f6e82] hover:text-[#0f1926] hover:bg-[#f3eee1] transition-colors cursor-pointer"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Keyword / Search */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#5f6e82]" />
          Keyword Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Role, college, skill..."
            className="w-full h-[44px] bg-[#f3eee1] border border-[#e3dccd] rounded-xl px-3.5 pl-9 text-[15px] text-[#0f1926] placeholder:text-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-[#5f6e82] absolute left-3 top-3.5 pointer-events-none" />
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-3 top-3.5 text-[#5f6e82] hover:text-[#0f1926] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Category */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#5f6e82]" />
          Experience Type
        </label>
        <select
          value={filters.post_category || ""}
          onChange={(e) => onFilterChange("post_category", e.target.value)}
          className={selectClassName}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value} className="bg-white text-[#0f1926]">
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. College / University */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#5f6e82]" />
          College / University
        </label>
        <select
          value={filters.institution_name || ""}
          onChange={(e) => onFilterChange("institution_name", e.target.value)}
          className={selectClassName}
        >
          <option value="" className="bg-white text-[#0f1926]">All Colleges</option>
          {metadata?.colleges?.map((col) => (
            <option key={col} value={col} className="bg-white text-[#0f1926]">
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Course / Discipline */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#5f6e82]" />
          Course / Discipline
        </label>
        <select
          value={filters.course || ""}
          onChange={(e) => onFilterChange("course", e.target.value)}
          className={selectClassName}
        >
          <option value="" className="bg-white text-[#0f1926]">All Disciplines</option>
          {metadata?.courses?.map((crs) => (
            <option key={crs} value={crs} className="bg-white text-[#0f1926]">
              {crs}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Company */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#5f6e82]" />
          Company
        </label>
        <select
          value={filters.company_name || ""}
          onChange={(e) => onFilterChange("company_name", e.target.value)}
          className={selectClassName}
        >
          <option value="" className="bg-white text-[#0f1926]">All Companies</option>
          {metadata?.companies?.map((comp) => (
            <option key={comp} value={comp} className="bg-white text-[#0f1926]">
              {comp}
            </option>
          ))}
        </select>
      </div>

      {/* 6. Industry */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <Factory className="w-4 h-4 text-[#5f6e82]" />
          Industry
        </label>
        <select
          value={filters.industry || ""}
          onChange={(e) => onFilterChange("industry", e.target.value)}
          className={selectClassName}
        >
          <option value="" className="bg-white text-[#0f1926]">All Industries</option>
          {metadata?.industries?.map((ind) => (
            <option key={ind} value={ind} className="bg-white text-[#0f1926]">
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Location */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#5f6e82]" />
          Location
        </label>
        <select
          value={filters.work_location || ""}
          onChange={(e) => onFilterChange("work_location", e.target.value)}
          className={selectClassName}
        >
          <option value="" className="bg-white text-[#0f1926]">All Locations</option>
          {metadata?.locations?.map((loc) => (
            <option key={loc} value={loc} className="bg-white text-[#0f1926]">
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* 8. Offer Status (42px height, 14-15px font) */}
      <div className="space-y-2">
        <label className="text-[15px] font-semibold text-[#0f1926] flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-[#5f6e82]" />
          Offer Status
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-[#f3eee1] p-1.5 rounded-xl border border-[#e3dccd] h-[48px] items-center">
          <button
            type="button"
            onClick={() => onFilterChange("is_offer_received", undefined)}
            className={`h-[38px] px-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer flex items-center justify-center ${
              filters.is_offer_received === undefined
                ? "bg-[#3f6f52] text-white shadow-xs"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            Any
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("is_offer_received", true)}
            className={`h-[38px] px-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer flex items-center justify-center ${
              filters.is_offer_received === true
                ? "bg-[#2f7d52] text-white font-bold shadow-xs"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            Offer
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("is_offer_received", false)}
            className={`h-[38px] px-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer flex items-center justify-center ${
              filters.is_offer_received === false
                ? "bg-[#b5462f] text-white font-bold shadow-xs"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            No Offer
          </button>
        </div>
      </div>

      {/* 9. Round / Assessment Tags (Max-height 260px, 8px gap, wrap cleanly) */}
      {metadata?.round_tags && metadata.round_tags.length > 0 && (
        <div className="space-y-2.5 border-t border-[#e3dccd] pt-4">
          <label className="text-[15px] font-semibold text-[#0f1926] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#5f6e82]" />
              Assessment Tags
            </span>
            {filters.round_tag && (
              <button
                onClick={() => onFilterChange("round_tag", "")}
                className="text-[12px] text-[#2f6b47] hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
            {metadata.round_tags.map((tag) => {
              const isSelected = filters.round_tag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    onFilterChange("round_tag", isSelected ? "" : tag)
                  }
                  className={`text-[13.5px] px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer break-words max-w-full text-left ${
                    isSelected
                      ? "bg-[#3f6f52] text-white font-semibold shadow-xs"
                      : "bg-[#f3eee1] text-[#2b3a4f] border border-[#e3dccd] hover:border-[#3f6f52]/50 hover:text-[#0f1926]"
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
        <div className="pt-3">
          <button
            onClick={onCloseMobileDrawer}
            className="w-full h-[44px] bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-xl font-bold text-[15px] shadow-sm transition-all cursor-pointer"
          >
            Show Results
          </button>
        </div>
      )}
    </aside>
  );
};
