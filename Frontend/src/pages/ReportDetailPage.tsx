import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AuthorDisplay } from "../components/common/AuthorDisplay";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { RoundAccordion } from "../components/detail/RoundAccordion";
import { CommentSection } from "../components/detail/CommentSection";
import { ReportModal } from "../components/common/ReportModal";
import { PostOut } from "../types";
import { postsApi, interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const ReportDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostOut | null>(null);
  const [loading, setLoading] = useState(true);

  // Engagement state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // Mobile discussion drawer toggle
  const [mobileDiscussionOpen, setMobileDiscussionOpen] = useState(false);

  // Moderation Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await postsApi.getById(postId);
      const data = res.data;
      setPost(data);
      setLikeCount(data.view_count || 0);
      setShareCount(data.share_count || 0);

      // Fetch like and bookmark states if available
      try {
        const likeRes = await interactionsApi.getLikeStatus(postId);
        setLiked(likeRes.data.liked);
        setLikeCount(likeRes.data.like_count);
      } catch {}

      if (isAuthenticated) {
        try {
          const bmRes = await interactionsApi.getBookmarkStatus(postId);
          setBookmarked(bmRes.data.bookmarked);
        } catch {}
      }
    } catch (err: any) {
      error(err.response?.data?.detail || "Experience not found.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [postId, isAuthenticated, navigate, error]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!postId) return;
    try {
      const res = await interactionsApi.toggleLike(postId);
      setLiked(res.data.liked);
      setLikeCount(res.data.like_count);
      success(res.data.message || (res.data.liked ? "Liked experience" : "Unliked"));
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to update like status.");
    }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!postId) return;
    try {
      const res = await interactionsApi.toggleBookmark(postId);
      setBookmarked(res.data.bookmarked);
      success(res.data.message || (res.data.bookmarked ? "Saved to bookmarks" : "Removed"));
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to update bookmark.");
    }
  };

  const handleShare = async () => {
    if (!postId) return;
    try {
      const res = await postsApi.sharePost(postId);
      setShareCount(res.data.share_count);
      await navigator.clipboard.writeText(window.location.href);
      info("Experience link copied to clipboard.", "Link Copied");
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      info("Link copied to clipboard.");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[1600px] mx-auto py-12 px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col gap-6 animate-pulse">
          <div className="h-8 bg-surface-container rounded-xl w-1/3"></div>
          <div className="h-48 bg-surface-container rounded-2xl w-full"></div>
          <div className="h-64 bg-surface-container rounded-2xl w-full"></div>
        </div>
      </AppShell>
    );
  }

  if (!post) return null;

  const isDraft = post.status === "draft";
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date(post.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const formattedPackage = () => {
    if (post.package_amount === undefined || post.package_amount === null) return null;
    const currency = post.currency || "INR";
    const symbol = currency.toUpperCase() === "INR" ? "₹" : "$";
    return `${symbol} ${post.package_amount.toLocaleString()} ${currency.toUpperCase() === "INR" ? "LPA" : ""}`.trim();
  };

  // Compute total difficulty distribution across all questions
  let totalEasy = 0;
  let totalMedium = 0;
  let totalHard = 0;
  if (post.rounds) {
    for (const r of post.rounds) {
      for (const q of r.questions || []) {
        totalEasy += q.easy_count || 0;
        totalMedium += q.medium_count || 0;
        totalHard += q.hard_count || 0;
      }
    }
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Left Panel: Discussion / Comments (35% on desktop, toggleable modal/drawer on mobile) */}
        <aside
          className={`w-full md:w-[35%] border-r border-border-subtle bg-surface-elevated split-scroll overflow-y-auto ${
            mobileDiscussionOpen ? "block" : "hidden md:flex flex-col"
          }`}
        >
          {/* Mobile close button */}
          <div className="md:hidden p-3 border-b border-border-subtle flex justify-end">
            <button
              onClick={() => setMobileDiscussionOpen(false)}
              className="text-xs font-semibold text-primary px-3 py-1 bg-surface-container rounded-lg"
            >
              Back to Experience ✕
            </button>
          </div>
          <CommentSection
            postId={post.id}
            onCommentCountChange={(count) => setCommentCount(count)}
          />
        </aside>

        {/* Right Panel: Main Post Context (65% on desktop, full width on mobile) */}
        <section className="flex-1 w-full md:w-[65%] bg-background split-scroll overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <Link
              to="/"
              className="flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Feed</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileDiscussionOpen(!mobileDiscussionOpen)}
                className="md:hidden flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                <span>Discussion ({commentCount})</span>
              </button>
            </div>
          </div>

          {/* Draft Notice if viewing own unpublished draft */}
          {isDraft && (
            <div className="p-4 rounded-xl border border-secondary bg-secondary-container/20 text-on-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-base">info</span>
                <span>Draft Experience — Visible only to you</span>
              </div>
              <Link
                to="/draft"
                className="px-3 py-1 rounded-lg bg-primary text-on-primary font-semibold text-xs shadow-sm"
              >
                Resume Drafting →
              </Link>
            </div>
          )}

          {/* Post Header Card (Stitch layout) */}
          <article className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {/* Top Row: Author, Status, Category, Date */}
              <div className="flex items-center justify-between w-full flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <AuthorDisplay
                    author={post.author}
                    isAnonymous={post.is_anonymous}
                    size="md"
                  />
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                  {post.is_offer_received ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[#15803d] text-xs font-bold border border-[#22C55E]/20">
                      Offer Received
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                      Interview Logged
                    </span>
                  )}
                  <CategoryBadge category={post.post_category} />
                  <span className="text-xs text-outline">{formattedDate}</span>
                </div>
              </div>

              {/* Metadata Row: Company, Role, Compensation, Location */}
              <div className="flex items-center gap-3 md:gap-4 flex-wrap text-xs sm:text-sm text-on-surface-variant border-y border-border-subtle py-3 mt-1">
                {post.company_name && (
                  <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                    <span className="material-symbols-outlined text-primary text-base select-none">
                      business
                    </span>
                    <span>{post.company_name}</span>
                  </div>
                )}

                {post.job_role && (
                  <>
                    <div className="w-px h-3.5 bg-border-subtle hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 font-medium text-primary">
                      <span className="material-symbols-outlined text-primary text-base select-none">
                        work
                      </span>
                      <span>{post.job_role}</span>
                    </div>
                  </>
                )}

                {formattedPackage() && (
                  <>
                    <div className="w-px h-3.5 bg-border-subtle hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 font-medium text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary text-base select-none">
                        payments
                      </span>
                      <span>{formattedPackage()}</span>
                    </div>
                  </>
                )}

                {post.work_location && (
                  <>
                    <div className="w-px h-3.5 bg-border-subtle hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 text-xs text-outline">
                      <span className="material-symbols-outlined text-outline text-base select-none">
                        location_on
                      </span>
                      <span>{post.work_location}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Post Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* Narrative Experience Text */}
              {post.experience_text && (
                <div className="text-sm sm:text-base text-on-surface leading-relaxed whitespace-pre-wrap mt-2 font-normal">
                  {post.experience_text}
                </div>
              )}

              {/* Tips & Strategy Section */}
              {post.tips && (
                <div className="p-4 rounded-xl bg-primary-container/10 border border-primary/20 text-xs sm:text-sm text-on-surface flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <span className="material-symbols-outlined text-base">lightbulb</span>
                    <span>Candidate Tips & Preparation Strategy</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap text-on-surface-variant">
                    {post.tips}
                  </p>
                </div>
              )}
            </div>

            {/* Rounds and Questions Section */}
            <div className="flex flex-col gap-4 mt-2">
              <h2 className="text-lg font-bold text-on-surface flex items-center justify-between border-b border-border-subtle pb-2">
                <span>Interview Rounds & Questions</span>
                <span className="text-xs font-semibold text-primary bg-primary-container/10 px-2.5 py-0.5 rounded-full">
                  {post.rounds?.length || 0} {post.rounds?.length === 1 ? "Round" : "Rounds"}
                </span>
              </h2>

              {post.rounds && post.rounds.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {post.rounds.map((round) => (
                    <RoundAccordion key={round.post_round_id} round={round} />
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-border-subtle bg-surface text-center text-xs text-on-surface-variant">
                  No individual rounds or questions were recorded in this report.
                </div>
              )}
            </div>

            {/* Engagement & Action Toolbar */}
            <footer className="flex items-center justify-between pt-4 border-t border-border-subtle flex-wrap gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                    liked
                      ? "text-error"
                      : "text-on-surface-variant hover:text-error"
                  }`}
                  title={liked ? "Unlike" : "Like"}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                  <span>{likeCount}</span>
                </button>

                {/* Comment Count / Jump */}
                <button
                  type="button"
                  onClick={() => setMobileDiscussionOpen(true)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
                  title="Discussion"
                >
                  <span className="material-symbols-outlined text-xl">chat_bubble</span>
                  <span>{commentCount}</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
                  title="Share"
                >
                  <span className="material-symbols-outlined text-xl">share</span>
                  <span>{shareCount}</span>
                </button>

                {/* Difficulty Distribution */}
                {(totalEasy > 0 || totalMedium > 0 || totalHard > 0) && (
                  <div className="flex items-center gap-1.5 pl-2 border-l border-border-subtle hidden sm:flex">
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#15803d] text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                      <span>{totalEasy}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#b45309] text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                      <span>{totalMedium}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error/10 border border-error/20 text-error text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      <span>{totalHard}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  className={`p-2 rounded-full transition-all active:scale-95 ${
                    bookmarked
                      ? "text-primary bg-primary-container/10"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                  }`}
                  title={bookmarked ? "Saved in Bookmarks" : "Save Bookmark"}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </span>
                </button>

                {/* Moderation Flag Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal("login");
                      return;
                    }
                    setReportModalOpen(true);
                  }}
                  className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all active:scale-95"
                  title="Report Inappropriate Content"
                >
                  <span className="material-symbols-outlined text-xl">flag</span>
                </button>
              </div>
            </footer>
          </article>
        </section>
      </div>

      {/* Moderation Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={post.id}
        postTitle={post.title}
      />
    </AppShell>
  );
};

