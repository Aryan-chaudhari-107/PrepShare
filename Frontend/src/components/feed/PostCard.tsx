import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Briefcase,
  GraduationCap,
  MapPin,
  Banknote,
  Eye,
  Share2,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";
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
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formattedPackage = () => {
    if (post.package_amount === undefined || post.package_amount === null) return null;
    const currency = post.currency || "INR";
    const symbol = currency.toUpperCase() === "INR" ? "₹" : "$";
    return `${symbol} ${post.package_amount.toLocaleString()} ${currency.toUpperCase() === "INR" ? "LPA" : ""}`.trim();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      className="bg-white rounded-2xl border border-[#e3dccd] hover:border-[#3f6f52]/45 p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden group"
    >
      {/* Subtle top-right accent glow on hover */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#3f6f52]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      {/* Top Meta & Header Section */}
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between w-full flex-wrap gap-3">
          <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap">
            {/* Author info with 44-48px avatar and 16px font */}
            <AuthorDisplay
              author={post.author}
              isAnonymous={post.is_anonymous}
              size="md"
            />

            {/* Company Divider */}
            {post.company_name && (
              <>
                <div className="w-px h-4 bg-[#e3dccd] hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-[14.5px] sm:text-[15px] font-semibold text-[#0f1926]">
                  <Building2 className="w-4 h-4 text-[#3f6f52] shrink-0" />
                  <span>{post.company_name}</span>
                </div>
              </>
            )}

            {/* Role Divider */}
            {post.job_role && (
              <>
                <div className="w-px h-4 bg-[#e3dccd] hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-[14.5px] sm:text-[15px] font-medium text-[#b26a00]">
                  <Briefcase className="w-4 h-4 text-[#b26a00] shrink-0" />
                  <span>{post.job_role}</span>
                </div>
              </>
            )}

            {/* College & Course */}
            {post.institution_name && (
              <>
                <div className="w-px h-4 bg-[#e3dccd] hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-[14px] sm:text-[14.5px] font-medium text-[#5f6e82]">
                  <GraduationCap className="w-4 h-4 text-[#5f6e82] shrink-0" />
                  <span>{post.institution_name}</span>
                  {post.course && (
                    <span className="text-[13.5px] text-[#5f6e82] font-normal">· {post.course}</span>
                  )}
                </div>
              </>
            )}

            {/* Location */}
            {post.work_location && (
              <>
                <div className="w-px h-4 bg-[#e3dccd] hidden sm:block"></div>
                <div className="flex items-center gap-1 text-[13.5px] sm:text-[14px] text-[#5f6e82]">
                  <MapPin className="w-3.5 h-3.5 text-[#5f6e82] shrink-0" />
                  <span>{post.work_location}</span>
                </div>
              </>
            )}

            {/* Package Divider */}
            {formattedPackage() && (
              <>
                <div className="w-px h-4 bg-[#e3dccd] hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-[14px] sm:text-[14.5px] font-semibold text-[#2f7d52] bg-[#2f7d52]/10 px-3 py-1 rounded-full border border-[#2f7d52]/20">
                  <Banknote className="w-4 h-4 text-[#2f7d52] shrink-0" />
                  <span>{formattedPackage()}</span>
                </div>
              </>
            )}
          </div>

          {/* Category Tag & Time */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <CategoryBadge category={post.post_category} size="sm" />
            <span className="text-[13px] text-[#5f6e82] font-medium">{formattedDate()}</span>
          </div>
        </div>

        {/* Post Title (22px, semibold, line-height 1.3) */}
        <h2 className="text-[22px] font-semibold text-[#0f1926] group-hover:text-[#3f6f52] transition-colors leading-[1.3] pt-1">
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h2>
      </div>

      {/* Experience Excerpt & Round Box */}
      <div className="space-y-4 relative z-10">
        {post.experience_text_excerpt ? (
          <p className="text-[15px] sm:text-[16px] text-[#2b3a4f] leading-relaxed line-clamp-2">
            {post.experience_text_excerpt}
          </p>
        ) : null}

        {/* Round Preview Container (Padded 14px 18px) */}
        <div className="bg-[#faf7ee] rounded-xl border border-[#e3dccd] p-3.5 sm:px-4.5 sm:py-3.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[13.5px] font-semibold text-[#2f6b47] bg-[#3f6f52]/10 border border-[#3f6f52]/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#3f6f52]" />
              {post.round_count} {post.round_count === 1 ? "Round" : "Rounds"} Faced
            </span>
            {post.is_offer_received ? (
              <span className="text-[13.5px] font-bold text-[#2f7d52] bg-[#2f7d52]/10 border border-[#2f7d52]/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2f7d52]" />
                Offer Received
              </span>
            ) : (
              <span className="text-[13.5px] font-medium text-[#5f6e82] bg-white border border-[#e3dccd] px-3 py-1.5 rounded-full">
                Process Completed
              </span>
            )}
          </div>

          <Link
            to={`/posts/${post.id}`}
            className="text-[15px] font-semibold text-[#2f6b47] hover:text-[#3f6f52] flex items-center gap-1.5 group/btn transition-colors cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Footer Engagement Bar */}
      <footer className="pt-4 border-t border-[#e3dccd]/80 flex items-center justify-between text-[14px] text-[#5f6e82] relative z-10">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-medium" title="Views">
            <Eye className="w-4 h-4 text-[#5f6e82]" />
            <span>{post.view_count} views</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium" title="Shares">
            <Share2 className="w-4 h-4 text-[#5f6e82]" />
            <span>{post.share_count} shares</span>
          </span>
        </div>

        <Link
          to={`/posts/${post.id}`}
          className="text-[15px] font-semibold text-[#2f6b47] hover:text-[#3f6f52] flex items-center gap-1.5 group/read transition-colors cursor-pointer"
        >
          <span>Read Full Experience</span>
          <ArrowRight className="w-4 h-4 group-hover/read:translate-x-1 transition-transform" />
        </Link>
      </footer>
    </motion.article>
  );
};
