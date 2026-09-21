import React from "react";
import { Link } from "react-router-dom";
import { EyeOff, ShieldCheck } from "lucide-react";
import { AuthorOut } from "../../types";
import { getMediaUrl } from "../../utils/media";

interface AuthorDisplayProps {
  author?: AuthorOut | null;
  isAnonymous?: boolean;
  score?: number;
  size?: "sm" | "md" | "lg";
}

export const AuthorDisplay: React.FC<AuthorDisplayProps> = ({
  author,
  isAnonymous = false,
  score,
  size = "md",
}) => {
  const isAnon = isAnonymous || !author;

  const avatarSizes = {
    sm: "w-10 h-10 text-xs",
    md: "w-11 h-11 sm:w-12 sm:h-12 text-sm",
    lg: "w-13 h-13 text-base",
  };

  if (isAnon) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`${avatarSizes[size]} rounded-full border border-[#e3dccd] bg-[#f3eee1] text-[#5f6e82] font-semibold flex items-center justify-center shrink-0 shadow-xs`}
        >
          <EyeOff className="w-5 h-5 text-[#5f6e82]" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[16px] font-semibold text-[#0f1926] flex items-center gap-1 leading-tight">
            Anonymous Student
          </span>
          <span className="text-[13.5px] text-[#5f6e82] leading-tight mt-0.5">Verified Experience</span>
        </div>
      </div>
    );
  }

  const initials = (author.username || "OP").substring(0, 2).toUpperCase();

  return (
    <Link
      to={`/users/${author.user_id}`}
      className="flex items-center gap-3 group transition-transform active:scale-98"
    >
      <div
        className={`${avatarSizes[size]} rounded-full border border-[#e3dccd] overflow-hidden shrink-0 bg-[#3f6f52] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform`}
      >
        {author.profile_photo_url ? (
          <img
            src={getMediaUrl(author.profile_photo_url)}
            alt={author.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-[16px] font-semibold text-[#0f1926] group-hover:text-[#3f6f52] transition-colors flex items-center gap-1.5 leading-tight">
          @{author.username}
          <ShieldCheck className="w-4 h-4 text-[#2f6b47] shrink-0" />
        </span>
        {score !== undefined ? (
          <span className="text-[13.5px] text-[#5f6e82] leading-tight mt-0.5">Score: {score.toLocaleString()} pts</span>
        ) : (
          <span className="text-[13.5px] text-[#2f6b47] font-medium leading-tight mt-0.5">Verified Contributor</span>
        )}
      </div>
    </Link>
  );
};
