import React from "react";
import { Link } from "react-router-dom";
import { Award, ChevronRight, Compass } from "lucide-react";
import type { PostListItem } from "../../types";
import { relativeDate } from "../../lib/format";
import { categoryLabel } from "./constants";

/* ── Fresh feed list ───────────────────────────────────────────────────── */

export const FreshFeed: React.FC<{ posts: PostListItem[] }> = ({ posts }) => {
  if (posts.length === 0) {
    return <p className="py-4 text-sm text-muted">No experiences to show right now.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            to={`/posts/${post.id}`}
            className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sunken/60"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                post.is_offer_received
                  ? "border-primary/30 bg-primary-soft text-primary"
                  : "border-accent/30 bg-accent-soft text-accent"
              }`}
              aria-hidden="true"
            >
              {post.is_offer_received ? <Award size={15} /> : <Compass size={15} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-heading transition-colors group-hover:text-primary">
                {post.title}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {categoryLabel(post.post_category)} ·{" "}
                {post.company_name || post.institution_name || "Community"} ·{" "}
                {relativeDate(post.published_at ?? post.created_at)}
              </span>
            </span>
            <ChevronRight
              size={14}
              className="shrink-0 text-faint transition-colors group-hover:text-primary"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
};
