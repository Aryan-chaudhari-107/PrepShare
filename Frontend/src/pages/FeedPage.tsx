import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PostCard } from "../components/feed/PostCard";
import { FilterSidebar } from "../components/feed/FilterSidebar";
import { Pagination } from "../components/common/Pagination";
import { PostListItem, PostListResponse, FilterMetadata, PostFeedFilterParams } from "../types";
import { postsApi } from "../api";
import { useToast } from "../context/ToastContext";

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
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full flex-1">
        {/* Mobile & Tablet Filter Toggle Header (Hidden on Desktop) */}
        <div className="lg:hidden mb-4 flex items-center justify-between bg-surface-elevated p-3.5 rounded-2xl border border-border-subtle shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {totalRecords} {totalRecords === 1 ? "Experience" : "Experiences"} Found
            </span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-on-primary text-primary text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* 2-Column Responsive Layout: [FilterSidebar (Left)] | [Main Feed (Right)] */}
        <div className="flex items-start gap-6 xl:gap-8">
          {/* Desktop Left Filter Sidebar (Hidden on mobile/tablet) */}
          <div className="hidden lg:block">
            <FilterSidebar
              filters={currentFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              metadata={metadata}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Main Feed Container */}
          <div className="flex-1 w-full min-w-0 space-y-5">
            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant bg-surface-elevated p-3 rounded-xl border border-border-subtle">
                <span className="font-semibold text-on-surface">Active Filters:</span>
                {currentFilters.search && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Search: "{currentFilters.search}"
                    <button
                      onClick={() => handleFilterChange("search", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.post_category && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Category: {currentFilters.post_category.replace(/_/g, " ")}
                    <button
                      onClick={() => handleFilterChange("post_category", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.institution_name && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    College: {currentFilters.institution_name}
                    <button
                      onClick={() => handleFilterChange("institution_name", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.course && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Course: {currentFilters.course}
                    <button
                      onClick={() => handleFilterChange("course", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.company_name && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Company: {currentFilters.company_name}
                    <button
                      onClick={() => handleFilterChange("company_name", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.work_location && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Location: {currentFilters.work_location}
                    <button
                      onClick={() => handleFilterChange("work_location", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.industry && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Industry: {currentFilters.industry}
                    <button
                      onClick={() => handleFilterChange("industry", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.job_role && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Role: {currentFilters.job_role}
                    <button
                      onClick={() => handleFilterChange("job_role", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.round_tag && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Tag: #{currentFilters.round_tag}
                    <button
                      onClick={() => handleFilterChange("round_tag", "")}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {currentFilters.is_offer_received !== undefined && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 font-medium">
                    Offer: {currentFilters.is_offer_received ? "Received" : "No Offer"}
                    <button
                      onClick={() => handleFilterChange("is_offer_received", undefined)}
                      className="hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-primary hover:underline font-semibold ml-auto"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Post Count Header (Desktop) */}
            <div className="hidden lg:flex items-center justify-between text-xs text-on-surface-variant pb-1">
              <span className="font-semibold text-on-surface">
                Showing {posts.length} of {totalRecords} {totalRecords === 1 ? "Experience" : "Experiences"}
              </span>
              <span>Page {page} of {totalPages || 1}</span>
            </div>

            {/* Posts Feed Listing */}
            {loading ? (
              <div className="flex flex-col gap-5 py-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 h-48 animate-pulse flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-surface-container rounded w-1/4"></div>
                        <div className="h-3 bg-surface-container rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-5 bg-surface-container rounded w-3/4 my-2"></div>
                    <div className="h-3 bg-surface-container rounded w-full"></div>
                    <div className="h-9 bg-surface-container rounded-xl mt-2"></div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="flex flex-col gap-5">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pt-4">
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
              </div>
            ) : (
              /* Empty State */
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-12 text-center flex flex-col items-center justify-center gap-4 my-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">travel_explore</span>
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-on-surface">No matching experiences</h3>
                  <p className="text-xs text-on-surface-variant">
                    Try adjusting your search criteria or clear active filters to explore more interview rounds.
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Slide-over Drawer Modal */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end animate-fade-in">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Slide-over Drawer */}
            <div className="relative w-full max-w-sm bg-surface-elevated h-full overflow-y-auto shadow-2xl z-10 animate-slide-left">
              <FilterSidebar
                filters={currentFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                metadata={metadata}
                activeFilterCount={activeFilterCount}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
};
