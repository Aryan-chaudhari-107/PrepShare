import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Bookmark,
  Building2,
  CheckCircle2,
  Flag,
  Heart,
  Layers,
  Lightbulb,
  MapPin,
  MessageSquare,
  ScrollText,
  Share2,
  ShieldAlert,
} from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import { AuthorDisplay } from "../components/common/AuthorDisplay";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { RoundAccordion } from "../components/detail/RoundAccordion";
import { CommentSection } from "../components/detail/CommentSection";
import { ReportModal } from "../components/common/ReportModal";
import {
  Button,
  EmptyState,
  ErrorState,
  LINK_PRIMARY,
  LINK_SECONDARY,
  Skeleton,
  SkeletonCard,
  Spinner,
} from "../components/ui";
import { Focus, Scene, Section, SPRING, Tilt } from "../motion";
import { prefersReducedMotion } from "../lib/motion";
import { PostOut } from "../types";
import { postsApi, interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { absoluteDate, errorMessage, formatPackage } from "../lib/format";
import { cn } from "../lib/cn";

/** On-palette celebration colours — the original used off-brand purples/pinks. */
const CELEBRATION_COLORS = ["#3f6f52", "#3f6f9e", "#b26a00", "#a4c3ae"];

/**
 * The two-pane geometry is declared ONCE and reused by the loading branch, so
 * the real layout lands exactly where its placeholder was — no sideways jump
 * the moment the experience resolves.
 */
const PANE_SHELL = "mx-auto flex w-full max-w-shell flex-col px-4 sm:px-6 lg:flex-row lg:px-8";
const EXPERIENCE_PANE = "min-w-0 flex-1 py-5 lg:py-8";
const DISCUSSION_PANE =
  "w-full shrink-0 border-line bg-raised/50 lg:sticky lg:top-header lg:block " +
  "lg:h-[calc(100vh_-_var(--navbar-height))] lg:w-[340px] lg:overflow-y-auto " +
  "lg:border-r lg:px-4 lg:py-6 scrollbar-slim";

/* ── Outcome band ──────────────────────────────────────────────────────────
   Beat 1 of this page: the answer to "did they get it?" staged as an object
   rather than one more chip in a row of chips. Two stacked surfaces (a raised
   shelf behind, a strip of status colour across the top) give it depth without
   a single animated shadow, and `Focus` lets it land after the page has begun
   to settle so it reads as the centre of gravity. */

interface FactProps {
  icon: React.ReactNode;
  label: string;
  valueClass: string;
  children: React.ReactNode;
}

/** One cell of the band: a quiet label above, the value carrying the weight. */
const Fact: React.FC<FactProps> = ({ icon, label, valueClass, children }) => (
  <div
    className={cn(
      // Two-up on small screens (a stacked strip would push the title off the
      // first screen), one flowing row from `sm` where hairlines can separate
      // the cells — a flex row always fills, so no cell ever leaves a stub of
      // border behind.
      "flex min-w-0 flex-col gap-0.5 px-5 py-3",
      "sm:flex-1 sm:border-l sm:border-line sm:px-4 sm:first:border-l-0"
    )}
  >
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
      {icon}
      {label}
    </span>
    <span className={cn("text-sm leading-snug sm:text-base", valueClass)}>{children}</span>
  </div>
);

interface OutcomeBandProps {
  isOffer: boolean;
  company?: string | null;
  role?: string | null;
  packageLabel: string | null;
  location?: string | null;
  /** Anchors the celebration burst to the offer mark instead of the viewport. */
  markRef: React.RefObject<HTMLSpanElement>;
}

const OutcomeBand: React.FC<OutcomeBandProps> = ({
  isOffer,
  company,
  role,
  packageLabel,
  location,
  markRef,
}) => {
  const hasFacts = Boolean(company || role || packageLabel || location);

  return (
    <Focus delay={0.12} className="relative pb-3">
      {/* The shelf the composition rests on — static, so depth costs nothing. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-4 bottom-0 top-6 rounded-2xl border border-line bg-raised shadow-xs"
      />

      <Tilt
        max={2}
        lift={1.006}
        glare={false}
        className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-md"
      >
        <div
          className={cn(
            "flex items-center gap-4 border-b px-5 py-4 sm:px-6",
            isOffer ? "border-success/25 bg-success-soft" : "border-line bg-raised"
          )}
        >
          <span
            ref={markRef}
            className={cn(
              "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-surface shadow-xs",
              isOffer ? "border-success/30 text-success" : "border-line text-muted"
            )}
          >
            {isOffer && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-xl bg-success/30 animate-pulse-ring"
              />
            )}
            <span className="relative">
              {isOffer ? (
                <CheckCircle2 size={26} aria-hidden="true" />
              ) : (
                <ScrollText size={24} aria-hidden="true" />
              )}
            </span>
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Outcome</p>
            <p className="mt-0.5 text-xl font-bold leading-tight tracking-tight text-heading sm:text-2xl">
              {isOffer ? "Offer received" : "Interview completed"}
            </p>
          </div>
        </div>

        {hasFacts && (
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-stretch sm:gap-0">
            {company && (
              <Fact
                icon={<Building2 size={14} className="text-primary" aria-hidden="true" />}
                label="Company"
                valueClass="font-semibold text-heading"
              >
                {company}
              </Fact>
            )}
            {role && (
              <Fact
                icon={<Briefcase size={14} className="text-warning" aria-hidden="true" />}
                label="Role"
                valueClass="font-medium text-heading"
              >
                {role}
              </Fact>
            )}
            {packageLabel && (
              <Fact
                icon={
                  <Banknote
                    size={14}
                    className={isOffer ? "text-success" : "text-muted"}
                    aria-hidden="true"
                  />
                }
                label="Package"
                valueClass={cn("tabular font-semibold", isOffer ? "text-success" : "text-heading")}
              >
                {packageLabel}
              </Fact>
            )}
            {location && (
              <Fact
                icon={<MapPin size={14} className="text-muted" aria-hidden="true" />}
                label="Location"
                valueClass="text-body"
              >
                {location}
              </Fact>
            )}
          </div>
        )}
      </Tilt>
    </Focus>
  );
};

/* ── Engagement controls ─────────────────────────────────────────────────── */

interface EngagementButtonProps {
  active?: boolean;
  activeClass?: string;
  count?: number;
  label: string;
  onClick: () => void;
  filled?: boolean;
  children: React.ReactNode;
}

/** Like / comment / share control: one recipe, `aria-pressed` for toggles. */
const EngagementButton: React.FC<EngagementButtonProps> = ({
  active,
  activeClass = "text-primary",
  count,
  label,
  onClick,
  filled,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={count !== undefined ? `${label} (${count})` : label}
    aria-pressed={active}
    title={label}
    className={cn(
      "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium",
      "transition-[color,background-color,transform] duration-fast ease-swift active:scale-95",
      active ? activeClass : "text-muted hover:bg-sunken/70 hover:text-heading"
    )}
  >
    {/* `_svg` (not `>svg`) so an icon may be wrapped for its own motion. */}
    <span className={cn(filled && active && "[&_svg]:fill-current")}>{children}</span>
    {count !== undefined && <span className="tabular">{count}</span>}
  </button>
);

/**
 * The one playful accent on this page: a confirmed action stamps itself into
 * place. Spring-driven so it lands with weight instead of easing politely.
 */
const IconPop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.span
    className="inline-flex"
    initial={{ scale: 0.6 }}
    animate={{ scale: 1 }}
    transition={SPRING.bouncy}
  >
    {children}
  </motion.span>
);

export const ReportDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Engagement state. `likeCount` starts at 0 and is only ever populated from
  // GET /posts/{id}/like — it is NEVER seeded from `view_count`, which is what
  // previously made the heart display page views as likes when that request
  // failed.
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // Mobile: show EITHER the experience OR the discussion, never both squashed.
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const celebratedRef = useRef(false);
  const outcomeMarkRef = useRef<HTMLSpanElement>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await postsApi.getById(postId);
      const data = res.data;
      setPost(data);
      setShareCount(data.share_count || 0);

      // Public, optional-auth endpoint — correct source for the like count.
      try {
        const likeRes = await interactionsApi.getLikeStatus(postId);
        setLiked(likeRes.data.liked);
        setLikeCount(likeRes.data.like_count);
      } catch {
        // Leave at 0 rather than substituting an unrelated metric.
        setLiked(false);
        setLikeCount(0);
      }

      if (isAuthenticated) {
        try {
          const bmRes = await interactionsApi.getBookmarkStatus(postId);
          setBookmarked(bmRes.data.bookmarked);
        } catch {
          /* bookmark state is cosmetic — ignore */
        }
      }
    } catch (err: unknown) {
      setLoadFailed(true);
      error(errorMessage(err, "That experience could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [postId, isAuthenticated, error]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Celebration: once per post per session, on-palette, and never for users
  // who asked the OS to reduce motion.
  //
  // It waits for `loading` to clear so the burst is fired FROM the offer mark
  // in the outcome band — the celebration belongs to that object, not to the
  // whole viewport — and so it never fires at a skeleton.
  useEffect(() => {
    if (loading || !post?.is_offer_received || celebratedRef.current) return;

    const storageKey = `prepshare_celebrated_${post.id}`;
    if (prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* storage blocked — still celebrate, just without deduping */
    }

    celebratedRef.current = true;
    const rect = outcomeMarkRef.current?.getBoundingClientRect();
    const origin =
      rect && rect.width > 0 && window.innerWidth > 0 && window.innerHeight > 0
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.3 };

    confetti({
      particleCount: 45,
      spread: 55,
      scalar: 0.9,
      origin,
      colors: CELEBRATION_COLORS,
    });
  }, [post, loading]);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    openAuthModal("login");
    return false;
  }, [isAuthenticated, openAuthModal]);

  const handleToggleLike = async () => {
    if (!requireAuth() || !postId) return;
    try {
      const res = await interactionsApi.toggleLike(postId);
      setLiked(res.data.liked);
      setLikeCount(res.data.like_count);
      success(res.data.message || (res.data.liked ? "Liked experience" : "Like removed"));
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to update like."));
    }
  };

  const handleToggleBookmark = async () => {
    if (!requireAuth() || !postId) return;
    try {
      const res = await interactionsApi.toggleBookmark(postId);
      setBookmarked(res.data.bookmarked);
      success(res.data.message || (res.data.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks"));
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to update bookmark."));
    }
  };

  const handleShare = async () => {
    if (!postId) return;
    const url = window.location.href;

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        info("Link copied to clipboard.", "Link copied");
        return true;
      } catch {
        return false;
      }
    };

    // Guests just copy — share counting requires an authenticated user.
    if (!isAuthenticated) {
      if (!(await copy())) info(url, "Copy this link");
      return;
    }

    setSharing(true);
    try {
      const res = await postsApi.sharePost(postId);
      setShareCount(res.data.share_count);
      await copy();
    } catch {
      // Share counter unavailable — copying the link still succeeded for user.
      if (!(await copy())) info(url, "Copy this link");
    } finally {
      setSharing(false);
    }
  };

  const scrollToDiscussion = () => {
    setDiscussionOpen(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById("discussion")
        ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    });
  };

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div role="status" aria-live="polite" className={PANE_SHELL}>
        <span className="sr-only">Loading experience…</span>

        {/* Discussion rail placeholder — same geometry as the live rail. */}
        <aside className={cn(DISCUSSION_PANE, "hidden lg:block")} aria-hidden="true">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-[84px] w-full" delay={0.06} />
            <Skeleton className="h-24 w-full" delay={0.12} />
            <Skeleton className="h-24 w-full" delay={0.18} />
          </div>
        </aside>

        <section className={EXPERIENCE_PANE} aria-hidden="true">
          <div className="flex flex-col gap-4">
            {/* Byline */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-40" delay={0.06} />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" delay={0.12} />
            </div>

            {/* Outcome band — mirrors the real composition's geometry */}
            <div className="relative pb-3">
              <span
                className="absolute inset-x-4 bottom-0 top-6 rounded-2xl border border-line bg-raised"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
                <div className="flex items-center gap-4 border-b border-line bg-raised px-5 py-4 sm:px-6">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" delay={0.06} />
                    <Skeleton className="h-6 w-44" delay={0.12} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-stretch sm:gap-0">
                  {[0, 1, 2].map((cell) => (
                    <div
                      key={cell}
                      className={cn(
                        "min-w-0 px-5 py-3 sm:flex-1 sm:px-4",
                        cell > 0 && "sm:border-l sm:border-line"
                      )}
                    >
                      <Skeleton className="h-3 w-20" delay={0.18 + cell * 0.06} />
                      <Skeleton className="mt-2 h-4 w-24" delay={0.24 + cell * 0.06} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Article placeholder */}
            <div className="rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-7">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="mt-4 h-4 w-full" delay={0.12} />
              <Skeleton className="mt-2 h-4 w-5/6" delay={0.18} />
              <Skeleton className="mt-2 h-4 w-4/6" delay={0.24} />
              <Skeleton className="mt-6 h-24 w-full" delay={0.3} />
            </div>

            <SkeletonCard />
          </div>
        </section>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────────── */
  if (loadFailed || !post) {
    return (
      <>
        <PageContainer width="list">
          <ErrorState
            size="page"
            art="stray"
            title="We couldn't load this experience"
            description="The post may have been removed, or the connection dropped part-way."
            onRetry={postId ? fetchPost : undefined}
            action={
              <>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  Go back
                </Button>
                <Link to="/feed" className={LINK_PRIMARY}>
                  Back to feed
                </Link>
              </>
            }
          />
        </PageContainer>
      </>
    );
  }

  const isDraft = post.status === "draft";
  const packageLabel = formatPackage(post.package_amount, post.currency);
  const dateLabel = absoluteDate(post.published_at || post.created_at);
  const roundCount = post.rounds?.length ?? 0;

  return (
    <>
      <div className={PANE_SHELL}>
        {/* Discussion panel — full-width on mobile only when opened */}
        <aside
          id="discussion"
          aria-label="Discussion"
          className={cn(
            DISCUSSION_PANE,
            discussionOpen ? "block border-b py-4 lg:border-b-0" : "hidden"
          )}
        >
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <h2 className="text-base font-semibold tracking-tight">Discussion</h2>
            <Button variant="ghost" size="sm" onClick={() => setDiscussionOpen(false)}>
              Back to experience
            </Button>
          </div>
          <CommentSection postId={post.id} onCommentCountChange={setCommentCount} />
        </aside>

        {/* Experience panel */}
        <section
          className={cn(
            EXPERIENCE_PANE,
            discussionOpen && "hidden lg:block"
          )}
        >
          <Scene>
            {/* Toolbar */}
            <Section className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/feed"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-fast ease-swift hover:text-[rgb(var(--primary-hover))]"
              >
                <ArrowLeft
                  size={15}
                  className="transition-transform duration-fast ease-swift group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                Back to feed
              </Link>

              <Button
                variant="secondary"
                size="sm"
                icon={<MessageSquare size={15} aria-hidden="true" />}
                onClick={scrollToDiscussion}
                className="lg:hidden"
              >
                Discussion
                <span className="tabular ml-1 text-muted">{commentCount}</span>
              </Button>
            </Section>

            {/* Draft notice */}
            {isDraft && (
              <Section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-medium text-warning">
                  <ShieldAlert size={16} aria-hidden="true" />
                  Draft experience — visible only to you
                </span>
                <Link to="/draft" className={LINK_SECONDARY}>
                  Resume drafting
                </Link>
              </Section>
            )}

            <Section>
              <article className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-7">
                {/* Header */}
                <header className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <AuthorDisplay author={post.author} isAnonymous={post.is_anonymous} size="md" />

                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <CategoryBadge category={post.post_category} />
                      <time
                        className="text-sm text-muted"
                        dateTime={post.published_at || post.created_at}
                      >
                        {dateLabel}
                      </time>
                    </div>
                  </div>

                  {/* Beat 1 — the outcome, staged as the page's anchor */}
                  <OutcomeBand
                    isOffer={post.is_offer_received}
                    company={post.company_name}
                    role={post.job_role}
                    packageLabel={packageLabel}
                    location={post.work_location}
                    markRef={outcomeMarkRef}
                  />

                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    {post.title}
                  </h1>

                  {post.experience_text && (
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-body">
                      {post.experience_text}
                    </p>
                  )}

                  {post.tips && (
                    <div className="rounded-xl border border-primary/25 bg-primary-soft/60 p-5">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                        <Lightbulb size={16} className="text-warning" aria-hidden="true" />
                        Candidate tips &amp; preparation strategy
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-body">{post.tips}</p>
                    </div>
                  )}
                </header>

                {/* Beat 2 — the round sequence, sitting in a recessed well */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                      <Layers size={17} className="text-primary" aria-hidden="true" />
                      Interview rounds &amp; questions
                    </h2>
                    <span className="tabular inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <Layers size={13} aria-hidden="true" />
                      {roundCount} {roundCount === 1 ? "round" : "rounds"}
                    </span>
                  </div>

                  {roundCount > 0 ? (
                    <div className="rounded-2xl border border-line bg-sunken p-2 sm:p-2.5">
                      <div className="flex flex-col gap-2 sm:gap-2.5">
                        {post.rounds!.map((round) => (
                          <RoundAccordion key={round.post_round_id} round={round} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      art="rounds"
                      title="No rounds recorded"
                      description="No individual rounds or questions were recorded in this report."
                    />
                  )}
                </div>

                {/* Engagement toolbar */}
                <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                  <div className="flex flex-wrap items-center gap-1">
                    <EngagementButton
                      label={liked ? "Unlike" : "Like"}
                      active={liked}
                      activeClass="text-danger"
                      count={likeCount}
                      filled
                      onClick={handleToggleLike}
                    >
                      <IconPop key={liked ? "liked" : "idle"}>
                        <Heart size={17} aria-hidden="true" />
                      </IconPop>
                    </EngagementButton>

                    <EngagementButton
                      label="Jump to discussion"
                      count={commentCount}
                      onClick={scrollToDiscussion}
                    >
                      <MessageSquare size={17} aria-hidden="true" />
                    </EngagementButton>

                    <EngagementButton
                      label="Copy share link"
                      count={shareCount}
                      onClick={handleShare}
                    >
                      {sharing ? <Spinner size={15} /> : <Share2 size={17} aria-hidden="true" />}
                    </EngagementButton>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      aria-pressed={bookmarked}
                      aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
                      title={bookmarked ? "Saved in bookmarks" : "Save bookmark"}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                        "transition-[color,background-color,border-color,transform] duration-fast ease-swift active:scale-95",
                        bookmarked
                          ? "border border-warning/30 bg-warning-soft text-warning [&_svg]:fill-current"
                          : "text-muted hover:bg-sunken/70 hover:text-heading"
                      )}
                    >
                      <Bookmark size={17} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!requireAuth()) return;
                        setReportModalOpen(true);
                      }}
                      aria-label="Report this experience"
                      title="Report inappropriate content"
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted",
                        "transition-[color,background-color,transform] duration-fast ease-swift",
                        "hover:bg-danger-soft hover:text-danger active:scale-95"
                      )}
                    >
                      <Flag size={17} aria-hidden="true" />
                    </button>
                  </div>
                </footer>
              </article>
            </Section>
          </Scene>
        </section>
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={post.id}
        postTitle={post.title}
      />
    </>
  );
};
