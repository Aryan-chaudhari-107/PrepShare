import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Compass, RotateCcw, SlidersHorizontal } from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import { PostCard } from "../components/feed/PostCard";
import { FilterSidebar } from "../components/feed/FilterSidebar";
import { Pagination } from "../components/common/Pagination";
import {
  Button,
  Chip,
  Drawer,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCard,
} from "../components/ui";
import { Focus, Magnetic, Scene, Section, disclosure, item, stagger } from "../motion";
import { PostListItem, PostListResponse, FilterMetadata, PostFeedFilterParams } from "../types";
import { postsApi } from "../api";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/format";
import { cn } from "../lib/cn";
import { prefersReducedMotion } from "../lib/motion";
import { useStagedLocation } from "../lib/stagedLocation";

/**
 * Same derivation FilterSidebar uses, kept local so the feed doesn't have to
 * import a type from inside a component module.
 */
type FilterValue = PostFeedFilterParams[keyof PostFeedFilterParams];

/** Human labels for each filterable URL parameter. */
const FILTER_LABELS: { key: keyof PostFeedFilterParams; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "post_category", label: "Category" },
  { key: "company_name", label: "Company" },
  { key: "institution_name", label: "College" },
  { key: "course", label: "Course" },
  { key: "work_location", label: "Location" },
  { key: "industry", label: "Industry" },
  { key: "job_role", label: "Role" },
  { key: "round_tag", label: "Tag" },
  { key: "is_offer_received", label: "Offer" },
];

/** Filter key → the URL query parameter it is stored under. */
const URL_KEY: Record<string, string> = {
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

/**
 * The list's arrival rhythm — the same shared `stagger` the page's sections
 * use, so rows land with one cadence instead of a hand-tuned delay per card.
 */
const LIST_STAGGER = stagger();

/**
 * "The offer signal" — the feed's first-viewport moment.
 *
 * The feed is the product's front door, and its whole reason to exist is that
 * outcomes here are real: every experience is tagged with how its process
 * ended. This band makes that legible BEFORE the first scroll — one mark per
 * loaded card (filled = an offer followed), the count spelled out beside it,
 * and a one-click route into the existing offer filter.
 *
 * Every number is derived from the page already in memory (the same response
 * the list renders), so there is no extra request and no invented total; while
 * the first page is still loading it shows copy with no numbers at all.
 */
const OfferSignal: React.FC<{
  posts: PostListItem[];
  loading: boolean;
  offerFilterOn: boolean;
  onToggleOfferFilter: () => void;
}> = ({ posts, loading, offerFilterOn, onToggleOfferFilter }) => {
  const ready = !loading && posts.length > 0;
  const offerCount = posts.filter((post) => post.is_offer_received).length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface/85 shadow-xs">
      {/* Editorial tint + accent rule: this band is an insert, not another
          card in the stack, so it never reads as "row eleven". */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-soft via-primary-soft/55 to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/10"
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <BadgeCheck size={14} aria-hidden="true" />
            The offer signal
          </p>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-body sm:text-base">
            {ready ? (
              <>
                <span className="tabular font-semibold text-heading">{offerCount}</span> of the{" "}
                <span className="tabular font-semibold text-heading">{posts.length}</span>{" "}
                experiences on this page ended with an offer.
              </>
            ) : (
              "Every experience is tagged with how its process ended, so the ones that led to an offer are easy to find."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* One mark per loaded card — the count, at a glance. Mirrors the
              list below exactly, which is why it never needs a new number. */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {ready &&
              posts.map((post) => (
                <span
                  key={post.id}
                  className={cn(
                    "h-2 w-2 rounded-full",
                    post.is_offer_received ? "bg-success" : "bg-line-strong"
                  )}
                />
              ))}
          </div>

          {/* One of the page's few magnetic controls — the focal action. */}
          <Magnetic>
            <Button
              type="button"
              size="sm"
              variant={offerFilterOn ? "secondary" : "primary"}
              icon={<BadgeCheck size={14} aria-hidden="true" />}
              onClick={onToggleOfferFilter}
            >
              {offerFilterOn ? "Show all experiences" : "Show offer experiences"}
            </Button>
          </Magnetic>
        </div>
      </div>
    </div>
  );
};

export const FeedPage: React.FC = () => {
  // Reads come from the STAGED location so the feed doesn't reset its filters
  // or page mid-exit while the stage is leaving; writes stay on the live
  // router setter (same-path updates refresh this stage's prop as usual).
  const location = useStagedLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [, setSearchParams] = useSearchParams();
  const { error: showError } = useToast();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [page, setPage] = useState<number>(() =>
    Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [metadata, setMetadata] = useState<FilterMetadata | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const currentFilters: PostFeedFilterParams = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      post_category: searchParams.get("category") || searchParams.get("post_category") || undefined,
      company_name: searchParams.get("company_name") || undefined,
      institution_name:
        searchParams.get("institution_name") || searchParams.get("college") || undefined,
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
    }),
    [searchParams]
  );

  const activeFilters = useMemo(
    () =>
      FILTER_LABELS.flatMap(({ key, label }) => {
        const value = currentFilters[key];
        if (value === undefined || value === "") return [];
        return [
          {
            key,
            label:
              key === "is_offer_received" ? (value ? "Received" : "No offer") : String(value),
            prefix: label,
          },
        ];
      }),
    [currentFilters]
  );

  const activeFilterCount = activeFilters.length;

  /**
   * The list's elevation accent: the first offer on the page (falling back
   * to the top card) renders one shadow step prouder. Every card carries its
   * own pointer tilt regardless — this only decides emphasis.
   * Re-derived whenever a fetch replaces `posts`, which is exactly when the
   * feed changes under the user (filter, search or page change).
   */
  const focalPostId = useMemo(
    () => (posts.find((post) => post.is_offer_received) ?? posts[0])?.id,
    [posts]
  );

  // Filter metadata only informs the sidebar's option lists; failure is
  // non-fatal, so it must never surface as a feed error.
  useEffect(() => {
    let cancelled = false;
    postsApi
      .getFiltersMetadata()
      .then((res) => {
        if (!cancelled) setMetadata(res.data);
      })
      .catch(() => {
        /* sidebar falls back to free-text inputs */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
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
    } catch (err: unknown) {
      // Deliberately do NOT clear `posts`: an unreachable server must render
      // as an error, not as a misleading "no results" empty state.
      setLoadFailed(true);
      showError(errorMessage(err, "Failed to load experiences."));
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
    showError,
  ]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleFilterChange = useCallback(
    (key: keyof PostFeedFilterParams, value: FilterValue) => {
      const nextParams = new URLSearchParams(searchParams);
      const urlKey = URL_KEY[key as string] || (key as string);

      if (value !== undefined && value !== "") {
        nextParams.set(urlKey, String(value));
      } else {
        nextParams.delete(urlKey);
      }
      nextParams.set("page", "1");
      setPage(1);
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
    setPage(1);
    setFiltersOpen(false);
  }, [setSearchParams]);

  /** The band's one action — a shortcut into the existing offer filter. */
  const toggleOfferFilter = useCallback(() => {
    handleFilterChange(
      "is_offer_received",
      currentFilters.is_offer_received === true ? undefined : true
    );
  }, [handleFilterChange, currentFilters.is_offer_received]);

  return (
    <>
      <PageContainer width="shell">
        <Scene>
          <Section>
            <PageHeader
              title="Experience feed"
              description="Real interview experiences, round by round, shared by students."
              icon={<Compass size={20} aria-hidden="true" />}
              actions={
                <>
                  <span className="tabular hidden text-sm text-muted sm:inline">
                    {loading ? "Loading…" : `${totalRecords} ${totalRecords === 1 ? "experience" : "experiences"}`}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<SlidersHorizontal size={15} aria-hidden="true" />}
                    onClick={() => setFiltersOpen(true)}
                    className="lg:hidden"
                  >
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="tabular ml-1 rounded-full bg-primary px-1.5 text-xs font-bold text-primary-fg">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </>
              }
            />
          </Section>

          {/* The page's one focal moment — owns its own cinematic timing, so
              it lands after the chrome has begun to settle. */}
          <Focus className="mb-6">
            <OfferSignal
              posts={posts}
              loading={loading}
              offerFilterOn={currentFilters.is_offer_received === true}
              onToggleOfferFilter={toggleOfferFilter}
            />
          </Focus>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
            {/* Desktop filter rail — a calm control surface; it arrives as one
                section and then holds still. */}
            <Section className="hidden lg:block">
              <FilterSidebar
                filters={currentFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                metadata={metadata}
                activeFilterCount={activeFilterCount}
              />
            </Section>

            <Section className="min-w-0 space-y-5">
              {/* Active filter chips */}
              <AnimatePresence initial={false}>
                {activeFilterCount > 0 && (
                  <motion.div
                    variants={disclosure}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 shadow-xs">
                      <span className="px-1 text-sm font-medium text-heading">Active filters</span>
                      {activeFilters.map((filter) => (
                        <Chip
                          key={filter.key}
                          removeLabel={`Remove ${filter.prefix} filter`}
                          onRemove={() =>
                            handleFilterChange(
                              filter.key,
                              filter.key === "is_offer_received" ? undefined : ""
                            )
                          }
                        >
                          {filter.prefix}: {filter.label}
                        </Chip>
                      ))}
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="ml-auto inline-flex items-center gap-1.5 px-1 text-sm font-medium text-primary transition-colors duration-fast ease-swift hover:text-[rgb(var(--primary-hover))]"
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                        Clear all
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results — every branch arrives on the same shared rhythm */}
              {loading ? (
                <motion.div
                  variants={item}
                  role="status"
                  aria-live="polite"
                  className="space-y-4"
                >
                  <span className="sr-only">Loading experiences…</span>
                  {/* SkeletonCard staggers its own shimmer — one look at these
                      three tells you the shape of what is arriving. */}
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </motion.div>
              ) : loadFailed && posts.length === 0 ? (
                <motion.div variants={item}>
                  <ErrorState onRetry={fetchFeed} />
                </motion.div>
              ) : posts.length > 0 ? (
                <motion.ul variants={LIST_STAGGER} className="space-y-4">
                  {posts.map((post) => (
                    <motion.li key={post.id} variants={item}>
                      <PostCard post={post} focal={post.id === focalPostId} />
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <motion.div variants={item}>
                  <EmptyState
                    art="rounds"
                    title="No matching experiences"
                    description="Try adjusting your search criteria or clear active filters to explore more interview rounds."
                    size="page"
                    action={
                      activeFilterCount > 0 ? (
                        <Button variant="primary" onClick={handleClearFilters}>
                          Clear all filters
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => setFiltersOpen(true)} className="lg:hidden">
                          Set up filters
                        </Button>
                      )
                    }
                  />
                </motion.div>
              )}

              {loadFailed && posts.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
                  Showing the last results loaded — the latest refresh failed.{" "}
                  <button
                    type="button"
                    onClick={fetchFeed}
                    className="font-semibold underline underline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              )}

              {posts.length > 0 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={totalRecords}
                  noun="experience"
                  isLoading={loading}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("page", String(newPage));
                    setSearchParams(nextParams);
                    window.scrollTo({
                      top: 0,
                      behavior: prefersReducedMotion() ? "auto" : "smooth",
                    });
                  }}
                  className={cn("border-t border-line pt-5")}
                />
              )}
            </Section>
          </div>
        </Scene>

        {/* Mobile filter drawer */}
        <Drawer
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filters"
          side="right"
          width="w-full sm:max-w-sm"
        >
          <FilterSidebar
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            metadata={metadata}
            activeFilterCount={activeFilterCount}
            isMobileDrawer
            onCloseMobileDrawer={() => setFiltersOpen(false)}
          />
        </Drawer>
      </PageContainer>
    </>
  );
};
