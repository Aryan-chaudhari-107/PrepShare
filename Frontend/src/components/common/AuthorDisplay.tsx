import React from "react";
import { Link } from "react-router-dom";
import { EyeOff, ShieldCheck } from "lucide-react";
import { AuthorOut } from "../../types";
import { Avatar } from "../ui";
import { cn } from "../../lib/cn";

interface AuthorDisplayProps {
  author?: AuthorOut | null;
  isAnonymous?: boolean;
  score?: number;
  size?: "sm" | "md" | "lg";
}

/** Matches `Avatar`'s built-in size boxes so both branches line up exactly. */
const ANON_BOX: Record<NonNullable<AuthorDisplayProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

const AVATAR_SIZE = { sm: "sm", md: "md", lg: "lg" } as const;

/**
 * One layout for every author state: anonymous, linkable and un-linkable.
 * Both branches render the identical class list through `cn()` — only the
 * root element differs (`<Link>` when there is a profile to open, otherwise a
 * plain `<span>`) — so the two can never drift apart visually again.
 */
export const AuthorDisplay: React.FC<AuthorDisplayProps> = ({
  author,
  isAnonymous = false,
  score,
  size = "md",
}) => {
  const shell = cn(
    "group flex min-w-0 items-center gap-3",
    "transition-transform duration-fast ease-swift active:scale-press"
  );
  const textColumn = "flex min-w-0 flex-col justify-center";

  if (isAnonymous || !author) {
    return (
      <span className={shell}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
            "border border-line bg-sunken font-semibold text-muted shadow-xs",
            ANON_BOX[size]
          )}
          aria-hidden="true"
        >
          <EyeOff className="h-5 w-5" />
        </span>
        <span className={textColumn}>
          <span className="flex items-center gap-1 text-lg font-semibold leading-tight text-heading">
            Anonymous Student
          </span>
          <span className="mt-0.5 text-sm leading-tight text-muted">Verified Experience</span>
        </span>
      </span>
    );
  }

  const identity = (
    <>
      <Avatar
        src={author.profile_photo_url}
        name={author.username}
        size={AVATAR_SIZE[size]}
        className="transition-transform duration-fast ease-swift group-hover:scale-105"
      />
      <span className={textColumn}>
        {/* `anywhere` (not `break-words`) because this span is a flex box: the
            username becomes an anonymous flex item whose min-content floor
            would otherwise push a very long name out of its card. */}
        <span className="flex min-w-0 items-center gap-1.5 [overflow-wrap:anywhere] text-lg font-semibold leading-tight text-heading transition-colors duration-fast ease-swift group-hover:text-primary">
          @{author.username}
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        </span>
        {score !== undefined ? (
          <span className="tabular mt-0.5 text-sm leading-tight text-muted">
            Score: {score.toLocaleString()} pts
          </span>
        ) : (
          <span className="mt-0.5 text-sm font-medium leading-tight text-primary">
            Verified Contributor
          </span>
        )}
      </span>
    </>
  );

  if (!author.user_id) {
    return <span className={shell}>{identity}</span>;
  }

  return (
    <Link to={`/users/${author.user_id}`} className={shell}>
      {identity}
    </Link>
  );
};
