import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Compass,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { PostCard } from "../components/feed/PostCard";
import { FilterSidebar } from "../components/feed/FilterSidebar";
import { Pagination } from "../components/common/Pagination";
import { PostListItem, PostListResponse, FilterMetadata, PostFeedFilterParams } from "../types";
import { postsApi } from "../api";
import { useToast } from "../context/ToastContext";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const FeedPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { error } = useToast();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(() => parseInt(searchParams.get("page") || "1", 10));
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<FilterMetadata | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Extract filters from searchParams
  const currentFilters: PostFeedFilterParams = {
    search: searchParams.get("search") || undefined,
    post_category: searchParams.get("category") || searchParams.get("post_category") || undefined,
    company_name: searchParams.get("company_name") || undefined,
    institution_name: searchParams.get("institution_name") || searchParams.get("college") || undefined,
    course: searchParams.get("course") || undefined,
    work_location: searchParams.get("work_location") || searchParams.get("location") || undefined,
    industry: searchParams.get("industry") || undefined,
    job_role: searchParams.get("job_role") || searchParams.get("role") || undefined,
    round_tag: searchParams.get("round_tag") || searchParams.get("tag") || undefined,
    is_offer_received:
      searchParams.get("offer_received") === "true"
        ? true
        : searchParams.get("offer_received") === "false"
        ? false
        : undefined,
  };

  // Count active filters
  const activeFilterCount = Object.entries(currentFilters).filter(
    ([key, val]) => key !== "page" && key !== "limit" && val !== undefined && val !== ""
  ).length;

  // Load filter metadata once
  useEffect(() => {
    postsApi
      .getFiltersMetadata()
      .then((res) => setMetadata(res.data))
      .catch((err) => console.warn("Failed to load filter metadata:", err));
  }, []);

  // Fetch feed items
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postsApi.getFeed({
        search: currentFilters.search,
        post_category: currentFilters.post_category,
        company_name: currentFilters.company_name,
        institution_name: currentFilters.institution_name,
        course: currentFilters.course,
        work_location: currentFilters.work_location,
        industry: currentFilters.industry,
        job_role: currentFilters.job_role,
        round_tag: currentFilters.round_tag,
        is_offer_received: currentFilters.is_offer_received,
        page,
        limit: 10,
      });

      const data: PostListResponse = res.data;
      setPosts(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalRecords(data.total || 0);
      setHasNext(data.has_next || false);
      setHasPrevious(data.has_previous || false);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to load experiences from database.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentFilters.search,
    currentFilters.post_category,
    currentFilters.company_name,
    currentFilters.institution_name,
    currentFilters.course,
    currentFilters.work_location,
    currentFilters.industry,
    currentFilters.job_role,
    currentFilters.round_tag,
    currentFilters.is_offer_received,
    page,
    error,
  ]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleFilterChange = (key: keyof PostFeedFilterParams, value: any) => {
    const nextParams = new URLSearchParams(searchParams);
    const paramKeyMap: Record<string, string> = {
      search: "search",
      post_category: "category",
      company_name: "company_name",
      institution_name: "institution_name",
      course: "course",
      work_location: "work_location",
      industry: "industry",
      job_role: "job_role",
      round_tag: "round_tag",
      is_offer_received: "offer_received",
    };

    const urlKey = paramKeyMap[key as string] || (key as string);

    if (value !== undefined && value !== "") {
      nextParams.set(urlKey, String(value));
    } else {
      nextParams.delete(urlKey);
    }
    nextParams.set("page", "1");
    setPage(1);
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
    setPage(1);
  };

  return (
    <AppShell
      onSearch={(q) => handleFilterChange("search", q)}
      searchQuery={currentFilters.search || ""}
    >
      <main className="w-full max-w-[1680px] mx-auto px-[clamp(24px,4vw,64px)] py-8 flex-1">
        {/* Mobile & Tablet Filter Toggle Header (Hidden on Desktop) */}
        <div className="lg:hidden mb-5 flex items-center justify-between bg-white p-4 rounded-2xl border border-[#e3dccd] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#0f1926] uppercase tracking-wider">
              {totalRecords} {totalRecords === 1 ? "Experience" : "Experiences"} Found
            </span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-xl text-[14px] font-bold shadow-sm transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-[#3f6f52] text-[11px] font-black px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* 2-Column Responsive CSS Grid Layout: [Sidebar 320px] | [Main Feed minmax(0, 1fr)] with 32px gap */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start">
          {/* Desktop Left Filter Sidebar (Hidden on mobile/tablet <1024px) */}
          <div className="hidden lg:block w-[320px]">
            <FilterSidebar
              filters={currentFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              metadata={metadata}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Main Feed Container */}
          <div className="w-full min-w-0 space-y-6">
            {/* Active Filter Chips */}
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-2.5 text-[13.5px] text-[#5f6e82] bg-white p-4 rounded-2xl border border-[#e3dccd] shadow-sm"
                >
                  <span className="font-semibold text-[#0f1926]">Active Filters:</span>
                  {currentFilters.search && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Search: "{currentFilters.search}"
                      <button
                        onClick={() => handleFilterChange("search", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.post_category && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Category: {currentFilters.post_category.replace(/_/g, " ")}
                      <button
                        onClick={() => handleFilterChange("post_category", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.institution_name && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      College: {currentFilters.institution_name}
                      <button
                        onClick={() => handleFilterChange("institution_name", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.course && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Course: {currentFilters.course}
                      <button
                        onClick={() => handleFilterChange("course", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.company_name && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Company: {currentFilters.company_name}
                      <button
                        onClick={() => handleFilterChange("company_name", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.work_location && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Location: {currentFilters.work_location}
                      <button
                        onClick={() => handleFilterChange("work_location", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.industry && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Industry: {currentFilters.industry}
                      <button
                        onClick={() => handleFilterChange("industry", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.job_role && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Role: {currentFilters.job_role}
                      <button
                        onClick={() => handleFilterChange("job_role", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.round_tag && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Tag: #{currentFilters.round_tag}
                      <button
                        onClick={() => handleFilterChange("round_tag", "")}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {currentFilters.is_offer_received !== undefined && (
                    <span className="px-3 py-1.5 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#0f1926] flex items-center gap-2 font-medium">
                      Offer: {currentFilters.is_offer_received ? "Received" : "No Offer"}
                      <button
                        onClick={() => handleFilterChange("is_offer_received", undefined)}
                        className="hover:text-[#b5462f] transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="text-[#2f6b47] hover:text-[#3f6f52] font-semibold ml-auto flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post Count Header (15px font) */}
            <div className="hidden lg:flex items-center justify-between text-[15px] text-[#5f6e82] pb-1">
              <span className="font-semibold text-[#0f1926]">
                Showing {posts.length} of {totalRecords} {totalRecords === 1 ? "Experience" : "Experiences"}
              </span>
              <span>Page {page} of {totalPages || 1}</span>
            </div>

            {/* Posts Feed Listing (24px gap between cards) */}
            {loading ? (
              <div className="flex flex-col gap-6 py-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl border border-[#e3dccd] p-7 h-56 skeleton-shimmer flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[#e3dccd]"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-[#e3dccd] rounded w-1/4"></div>
                        <div className="h-3 bg-[#e3dccd]/70 rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-5 bg-[#e3dccd] rounded w-3/4 my-2"></div>
                    <div className="h-3.5 bg-[#e3dccd]/70 rounded w-full"></div>
                    <div className="h-10 bg-[#e3dccd]/50 rounded-xl mt-2"></div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-6"
              >
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pt-3">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      total={totalRecords}
                      hasNext={hasNext}
                      hasPrevious={hasPrevious}
                      onPageChange={(newPage) => {
                        setPage(newPage);
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set("page", String(newPage));
                        setSearchParams(nextParams);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-[#e3dccd] p-14 text-center flex flex-col items-center justify-center gap-4 my-4 shadow-sm"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 flex items-center justify-center text-[#2f6b47]">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-lg font-bold text-[#0f1926]">No matching experiences</h3>
                  <p className="text-[14px] text-[#5f6e82]">
                    Try adjusting your search criteria or clear active filters to explore more interview rounds.
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-xl text-[14px] font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Slide-over Drawer Modal */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0f1926]/40 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileDrawerOpen(false)}
              />

              {/* Slide-over Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-[#faf7ee] h-full overflow-y-auto shadow-2xl z-10 border-l border-[#e3dccd]"
              >
                <FilterSidebar
                  filters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  metadata={metadata}
                  activeFilterCount={activeFilterCount}
                  isMobileDrawer={true}
                  onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </AppShell>
  );
};
