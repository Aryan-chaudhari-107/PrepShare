import React from "react";
import { Link } from "react-router-dom";
import { PostListItem } from "../../types";
import { AuthorDisplay } from "../common/AuthorDisplay";
import { CategoryBadge } from "../common/CategoryBadge";

interface PostCardProps {
  post: PostListItem;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formattedDate = () => {
    const d = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formattedPackage = () => {
    if (post.package_amount === undefined || post.package_amount === null) return null;
    const currency = post.currency || "INR";
    const symbol = currency.toUpperCase() === "INR" ? "₹" : "$";
    return `${symbol} ${post.package_amount.toLocaleString()} ${currency.toUpperCase() === "INR" ? "LPA" : ""}`.trim();
  };

  return (
    <article className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-sm transition-all hover:shadow-md hover:border-outline-variant/60 flex flex-col justify-between gap-5 relative">
      {/* Top Meta Row */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full flex-wrap gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Author info */}
            <AuthorDisplay
              author={post.author}
              isAnonymous={post.is_anonymous}
              size="sm"
            />

            {/* Company Divider */}
            {post.company_name && (
              <>
                <div className="w-px h-4 bg-border-subtle hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-primary text-base select-none">
                    business
                  </span>
                  <span>{post.company_name}</span>
                </div>
              </>
            )}

            {/* Role Divider */}
            {post.job_role && (
              <>
                <div className="w-px h-4 bg-border-subtle hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary">
                  <span className="material-symbols-outlined text-primary text-base select-none">
                    work
                  </span>
                  <span>{post.job_role}</span>
                </div>
              </>
            )}

            {/* College & Course */}
            {post.institution_name && (
              <>
                <div className="w-px h-4 bg-border-subtle hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-base select-none">
                    school
                  </span>
                  <span>{post.institution_name}</span>
                  {post.course && (
                    <span className="text-xs text-outline font-normal">· {post.course}</span>
                  )}
                </div>
              </>
            )}

            {/* Location */}
            {post.work_location && (
              <>
                <div className="w-px h-4 bg-border-subtle hidden sm:block"></div>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-outline">
                  <span className="material-symbols-outlined text-base select-none">
                    location_on
                  </span>
                  <span>{post.work_location}</span>
                </div>
              </>
            )}

            {/* Package Divider */}
            {formattedPackage() && (
              <>
                <div className="w-px h-4 bg-border-subtle hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-base select-none">
                    payments
                  </span>
                  <span>{formattedPackage()}</span>
                </div>
              </>
            )}
          </div>

          {/* Category Tag & Time */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <CategoryBadge category={post.post_category} />
            <span className="text-[11px] text-outline">{formattedDate()}</span>
          </div>
        </div>

        {/* Post Title */}
        <h2 className="text-lg sm:text-xl font-bold text-on-surface hover:text-primary transition-colors leading-snug">
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h2>
      </div>

      {/* Experience Excerpt & Round Box */}
      <div className="space-y-4">
        {post.experience_text_excerpt ? (
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-3">
            {post.experience_text_excerpt}
          </p>
        ) : null}

        {/* Round Preview Container */}
        <div className="bg-surface rounded-xl border border-border-subtle p-3.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-primary bg-primary-container/10 px-3 py-1 rounded-full">
              {post.round_count} {post.round_count === 1 ? "Round" : "Rounds"} Faced
            </span>
            {post.is_offer_received ? (
              <span className="text-xs font-bold text-[#15803d] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                Offer Received
              </span>
            ) : (
              <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full">
                Process Completed
              </span>
            )}
          </div>

          <Link
            to={`/posts/${post.id}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View Details</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Footer Engagement Bar */}
      <footer className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5" title="Views">
            <span className="material-symbols-outlined text-base text-outline">
              visibility
            </span>
            <span>{post.view_count} views</span>
          </span>
          <span className="flex items-center gap-1.5" title="Shares">
            <span className="material-symbols-outlined text-base text-outline">
              share
            </span>
            <span>{post.share_count} shares</span>
          </span>
        </div>

        <Link
          to={`/posts/${post.id}`}
          className="text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1 group"
        >
          <span>Read Full Experience</span>
          <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </Link>
      </footer>
    </article>
  );
};

