import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Flag,
  Lightbulb,
  Building2,
  Briefcase,
  MapPin,
  Banknote,
  CheckCircle2,
  MessageSquare,
  Layers,
  ShieldAlert,
  X,
} from "lucide-react";
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

      // Trigger celebration confetti if candidate received an offer!
      if (data.is_offer_received) {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.25 },
            colors: ["#6366F1", "#8B5CF6", "#10B981", "#EC4899"],
          });
        } catch {}
      }

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
          <div className="h-8 bg-slate-800 rounded-xl w-1/3"></div>
          <div className="h-48 bg-slate-800/80 rounded-2xl w-full"></div>
          <div className="h-64 bg-slate-800/80 rounded-2xl w-full"></div>
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

  return (
    <AppShell>
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Left Panel: Discussion / Comments (35% on desktop, toggleable modal/drawer on mobile) */}
        <aside
          className={`w-full md:w-[35%] border-r border-[#e3dccd] bg-[#faf7ee]/80 split-scroll overflow-y-auto ${
            mobileDiscussionOpen ? "block" : "hidden md:flex flex-col"
          }`}
        >
          {/* Mobile close button */}
          <div className="md:hidden p-3 border-b border-[#e3dccd] flex justify-end">
            <button
              onClick={() => setMobileDiscussionOpen(false)}
              className="text-xs font-semibold text-[#2f6b47] px-3 py-1 bg-white border border-[#e3dccd] rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <span>Back to Experience</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <CommentSection
            postId={post.id}
            onCommentCountChange={(count) => setCommentCount(count)}
          />
        </aside>

        {/* Right Panel: Main Post Context (65% on desktop, full width on mobile) */}
        <section className="flex-1 w-full md:w-[65%] split-scroll overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between text-xs text-[#5f6e82]">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-[#2f6b47] hover:text-[#3f6f52] font-semibold transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Feed</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileDiscussionOpen(!mobileDiscussionOpen)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3f6f52] hover:bg-[#345c44] text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion ({commentCount})</span>
              </button>
            </div>
          </div>

          {/* Draft Notice if viewing own unpublished draft */}
          {isDraft && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-[#b26a00]/30 bg-[#b26a00]/10 text-[#0f1926] flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#b26a00]">
                <ShieldAlert className="w-4 h-4" />
                <span>Draft Experience — Visible only to you</span>
              </div>
              <Link
                to="/draft"
                className="px-3.5 py-1.5 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-semibold text-xs shadow-sm"
              >
                Resume Drafting →
              </Link>
            </motion.div>
          )}

          {/* Post Header Card */}
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#e3dccd] p-6 sm:p-7 shadow-sm flex flex-col gap-6 relative overflow-hidden"
          >
            {/* Top right decorative glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[#3f6f52]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-4 relative z-10">
              {/* Top Row: Author, Status, Category, Date */}
              <div className="flex items-center justify-between w-full flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <AuthorDisplay
                    author={post.author}
                    isAnonymous={post.is_anonymous}
                    size="md"
                  />
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                  {post.is_offer_received ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2f7d52]/10 text-[#2f7d52] text-xs font-bold border border-[#2f7d52]/20 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2f7d52]" />
                      Offer Received
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f3eee1] border border-[#e3dccd] text-[#5f6e82] text-xs font-medium">
                      Interview Logged
                    </span>
                  )}
                  <CategoryBadge category={post.post_category} />
                  <span className="text-xs text-[#5f6e82]">{formattedDate}</span>
                </div>
              </div>

              {/* Metadata Row: Company, Role, Compensation, Location */}
              <div className="flex items-center gap-3 md:gap-4 flex-wrap text-xs sm:text-sm text-[#5f6e82] border-y border-[#e3dccd] py-3 mt-1">
                {post.company_name && (
                  <div className="flex items-center gap-1.5 font-semibold text-[#0f1926]">
                    <Building2 className="w-4 h-4 text-[#3f6f52] shrink-0" />
                    <span>{post.company_name}</span>
                  </div>
                )}

                {post.job_role && (
                  <>
                    <div className="w-px h-3.5 bg-[#e3dccd] hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 font-medium text-[#b26a00]">
                      <Briefcase className="w-4 h-4 text-[#b26a00] shrink-0" />
                      <span>{post.job_role}</span>
                    </div>
                  </>
                )}

                {formattedPackage() && (
                  <>
                    <div className="w-px h-3.5 bg-[#e3dccd] hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 font-semibold text-[#2f7d52] bg-[#2f7d52]/10 px-2.5 py-0.5 rounded-full border border-[#2f7d52]/20">
                      <Banknote className="w-4 h-4 text-[#2f7d52] shrink-0" />
                      <span>{formattedPackage()}</span>
                    </div>
                  </>
                )}

                {post.work_location && (
                  <>
                    <div className="w-px h-3.5 bg-[#e3dccd] hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 text-xs text-[#5f6e82]">
                      <MapPin className="w-4 h-4 text-[#5f6e82] shrink-0" />
                      <span>{post.work_location}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Post Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1926] leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* Narrative Experience Text */}
              {post.experience_text && (
                <div className="text-sm sm:text-base text-[#2b3a4f] leading-relaxed whitespace-pre-wrap mt-2 font-normal">
                  {post.experience_text}
                </div>
              )}

              {/* Tips & Strategy Section */}
              {post.tips && (
                <div className="p-5 rounded-2xl bg-[#faf7ee] border border-[#3f6f52]/25 text-xs sm:text-sm text-[#0f1926] flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 font-bold text-[#2f6b47]">
                    <Lightbulb className="w-4 h-4 text-[#b26a00]" />
                    <span>Candidate Tips & Preparation Strategy</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap text-[#2b3a4f]">
                    {post.tips}
                  </p>
                </div>
              )}
            </div>

            {/* Rounds and Questions Section */}
            <div className="flex flex-col gap-4 mt-2 relative z-10">
              <h2 className="text-base sm:text-lg font-bold text-[#0f1926] flex items-center justify-between border-b border-[#e3dccd] pb-3">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#3f6f52]" />
                  <span>Interview Rounds & Questions</span>
                </span>
                <span className="text-xs font-semibold text-[#2f6b47] bg-[#3f6f52]/10 border border-[#3f6f52]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Layers className="w-3 h-3" />
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
                <div className="p-8 rounded-xl border border-dashed border-[#e3dccd] bg-[#faf7ee] text-center text-xs text-[#5f6e82]">
                  No individual rounds or questions were recorded in this report.
                </div>
              )}
            </div>

            {/* Engagement & Action Toolbar */}
            <footer className="flex items-center justify-between pt-4 border-t border-[#e3dccd] flex-wrap gap-4 relative z-10">
              <div className="flex items-center gap-5 flex-wrap">
                {/* Like Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    liked
                      ? "text-[#b5462f]"
                      : "text-[#5f6e82] hover:text-[#b5462f]"
                  }`}
                  title={liked ? "Unlike" : "Like"}
                >
                  <Heart
                    className={`w-4 h-4 ${liked ? "fill-[#b5462f] text-[#b5462f]" : ""}`}
                  />
                  <span>{likeCount}</span>
                </motion.button>

                {/* Comment Count / Jump */}
                <button
                  type="button"
                  onClick={() => setMobileDiscussionOpen(true)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#5f6e82] hover:text-[#3f6f52] transition-colors cursor-pointer"
                  title="Discussion"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{commentCount}</span>
                </button>

                {/* Share Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#5f6e82] hover:text-[#3f6f52] transition-colors cursor-pointer"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{shareCount}</span>
                </motion.button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {/* Bookmark Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleToggleBookmark}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    bookmarked
                      ? "text-[#b26a00] bg-[#b26a00]/15 border border-[#b26a00]/30"
                      : "text-[#5f6e82] hover:text-[#b26a00] hover:bg-[#f3eee1]"
                  }`}
                  title={bookmarked ? "Saved in Bookmarks" : "Save Bookmark"}
                >
                  <Bookmark
                    className={`w-4 h-4 ${bookmarked ? "fill-[#b26a00] text-[#b26a00]" : ""}`}
                  />
                </motion.button>

                {/* Moderation Flag Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal("login");
                      return;
                    }
                    setReportModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-[#5f6e82] hover:text-[#b5462f] hover:bg-[#b5462f]/10 transition-all cursor-pointer"
                  title="Report Inappropriate Content"
                >
                  <Flag className="w-4 h-4" />
                </motion.button>
              </div>
            </footer>
          </motion.article>
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
