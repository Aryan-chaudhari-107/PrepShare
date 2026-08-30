import React, { useEffect, useState } from "react";
import { Company } from "../../types";
import { companiesApi } from "../../api";

interface FilterBarProps {
  category?: string;
  onCategoryChange: (category?: string) => void;
  offerReceived?: boolean;
  onOfferReceivedChange: (val?: boolean) => void;
  selectedCompanyId?: string;
  onCompanyChange: (companyId?: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  category,
  onCategoryChange,
  offerReceived,
  onOfferReceivedChange,
  selectedCompanyId,
  onCompanyChange,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  useEffect(() => {
    companiesApi
      .list(undefined, 1, 100)
      .then((res) => {
        setCompanies(res.data.items || []);
      })
      .catch(() => {});
  }, []);

  const categories = [
    { label: "All Intelligence", value: undefined },
    { label: "Campus Placement", value: "campus_placement" },
    { label: "Off-Campus Placement", value: "off_campus_placement" },
    { label: "Campus Hackathon", value: "campus_hackathon" },
    { label: "Off-Campus Hackathon", value: "off_campus_hackathon" },
  ];

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-4 shadow-sm flex flex-wrap items-center gap-4 md:gap-6 mb-6">
      {/* Category Pills */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-on-surface-variant">Category:</span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const isSelected = category === c.value;
            return (
              <button
                key={c.label}
                onClick={() => onCategoryChange(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-6 w-px bg-border-subtle hidden lg:block"></div>

      {/* Company Search / Filter */}
      <div className="flex items-center gap-3 flex-1 min-w-[220px] relative">
        <span className="text-xs font-semibold text-on-surface-variant">Company:</span>
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base select-none">
            business
          </span>
          <input
            type="text"
            value={selectedCompany ? selectedCompany.name : companySearch}
            onChange={(e) => {
              setCompanySearch(e.target.value);
              if (selectedCompanyId) onCompanyChange(undefined);
              setShowCompanyDropdown(true);
            }}
            onFocus={() => setShowCompanyDropdown(true)}
            placeholder="Filter companies..."
            className="w-full bg-surface border border-border-subtle rounded-xl pl-9 pr-8 py-1.5 text-xs text-on-surface placeholder-on-surface-variant/60 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
          />
          {(selectedCompanyId || companySearch) && (
            <button
              onClick={() => {
                setCompanySearch("");
                onCompanyChange(undefined);
                setShowCompanyDropdown(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-xs"
            >
              ✕
            </button>
          )}

          {showCompanyDropdown && filteredCompanies.length > 0 && !selectedCompanyId && (
            <div className="absolute top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto bg-surface-elevated rounded-xl border border-border-subtle shadow-lg py-1 z-40 text-xs">
              {filteredCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onCompanyChange(c.id);
                    setCompanySearch(c.name);
                    setShowCompanyDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-surface-container flex items-center justify-between text-on-surface"
                >
                  <span className="font-medium">{c.name}</span>
                  {c.industry && (
                    <span className="text-[10px] text-on-surface-variant">{c.industry}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-border-subtle hidden sm:block"></div>

      {/* Offer Received Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-on-surface-variant">Offer:</span>
        <div className="flex bg-surface-container rounded-lg p-0.5 gap-1">
          <button
            onClick={() => onOfferReceivedChange(undefined)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              offerReceived === undefined
                ? "bg-surface-elevated text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Any
          </button>
          <button
            onClick={() => onOfferReceivedChange(true)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              offerReceived === true
                ? "bg-[#22C55E]/20 text-[#15803d] font-bold shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Received
          </button>
          <button
            onClick={() => onOfferReceivedChange(false)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              offerReceived === false
                ? "bg-error/10 text-error font-bold shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            No Offer
          </button>
        </div>
      </div>
    </div>
  );
};

