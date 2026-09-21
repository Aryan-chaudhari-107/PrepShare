import React, { useEffect, useState } from "react";
import { Building2, X, Layers, CheckCircle2, XCircle } from "lucide-react";
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
    <div className="bg-white rounded-2xl border border-[#e3dccd] p-4 shadow-sm flex flex-wrap items-center gap-4 md:gap-6 mb-6">
      {/* Category Pills */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[#0f1926] flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#2f6b47]" />
          Category:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const isSelected = category === c.value;
            return (
              <button
                key={c.label}
                onClick={() => onCategoryChange(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-[#3f6f52] text-white font-semibold shadow-sm"
                    : "bg-[#f3eee1] text-[#2b3a4f] border border-[#e3dccd] hover:bg-white hover:text-[#0f1926]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-6 w-px bg-[#e3dccd] hidden lg:block"></div>

      {/* Company Search / Filter */}
      <div className="flex items-center gap-3 flex-1 min-w-[220px] relative">
        <span className="text-xs font-semibold text-[#0f1926]">Company:</span>
        <div className="relative flex-1">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6e82] w-4 h-4 pointer-events-none" />
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
            className="w-full bg-[#f3eee1] border border-[#e3dccd] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:border-[#3f6f52] transition-all outline-none"
          />
          {(selectedCompanyId || companySearch) && (
            <button
              onClick={() => {
                setCompanySearch("");
                onCompanyChange(undefined);
                setShowCompanyDropdown(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5f6e82] hover:text-[#0f1926] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showCompanyDropdown && filteredCompanies.length > 0 && !selectedCompanyId && (
            <div className="absolute top-full mt-1.5 left-0 right-0 max-h-48 overflow-y-auto bg-white rounded-xl border border-[#e3dccd] shadow-xl py-1 z-40 text-xs">
              {filteredCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onCompanyChange(c.id);
                    setCompanySearch(c.name);
                    setShowCompanyDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f3eee1] flex items-center justify-between text-[#0f1926] transition-colors cursor-pointer"
                >
                  <span className="font-medium text-[#0f1926]">{c.name}</span>
                  {c.industry && (
                    <span className="text-[10px] text-[#5f6e82] bg-[#faf7ee] px-2 py-0.5 rounded-full border border-[#e3dccd]">{c.industry}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-[#e3dccd] hidden sm:block"></div>

      {/* Offer Received Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[#0f1926]">Offer:</span>
        <div className="flex bg-[#f3eee1] rounded-xl p-0.5 border border-[#e3dccd] gap-1">
          <button
            onClick={() => onOfferReceivedChange(undefined)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              offerReceived === undefined
                ? "bg-[#3f6f52] text-white font-semibold shadow-xs"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            Any
          </button>
          <button
            onClick={() => onOfferReceivedChange(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
              offerReceived === true
                ? "bg-[#2f7d52] text-white font-bold shadow-xs"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Received
          </button>
          <button
            onClick={() => onOfferReceivedChange(false)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
              offerReceived === false
                ? "bg-[#b5462f] text-white font-bold shadow-xs"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            <XCircle className="w-3 h-3" />
            No Offer
          </button>
        </div>
      </div>
    </div>
  );
};
