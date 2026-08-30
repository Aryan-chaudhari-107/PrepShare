import React from "react";
import { Link } from "react-router-dom";
import { AuthorOut } from "../../types";

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
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  if (isAnon) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`${avatarSizes[size]} rounded-full border border-border-subtle bg-surface-container text-on-surface-variant font-semibold flex items-center justify-center shrink-0`}
        >
          <span className="material-symbols-outlined text-base text-outline">
            visibility_off
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-on-surface">
            Anonymous Student
          </span>
          <span className="text-xs text-outline">Verified Experience</span>
        </div>
      </div>
    );
  }

  const initials = (author.username || "OP").substring(0, 2).toUpperCase();

  return (
    <Link
      to={`/users/${author.user_id}`}
      className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
    >
      <div
        className={`${avatarSizes[size]} rounded-full border border-border-subtle overflow-hidden shrink-0 bg-surface-container flex items-center justify-center font-bold text-primary`}
      >
        {author.profile_photo_url ? (
          <img
            src={author.profile_photo_url}
            alt={author.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
          @{author.username}
        </span>
        {score !== undefined ? (
          <span className="text-xs text-outline">Score: {score.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-primary font-medium">Contributor</span>
        )}
      </div>
    </Link>
  );
};

