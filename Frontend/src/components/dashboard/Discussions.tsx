import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MessageSquare } from "lucide-react";
import type { ActiveDiscussion } from "../../types";
import { relativeDate } from "../../lib/format";
import { categoryLabel } from "./constants";

/* ── Active discussions ────────────────────────────────────────────────── */

export const Discussions: React.FC<{ items: ActiveDiscussion[] }> = ({ items }) => {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-muted">No active threads yet — start one.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={`/posts/${item.id}`}
            className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sunken/60"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <MessageSquare size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-heading transition-colors group-hover:text-primary">
                {item.title}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {categoryLabel(item.post_category)} · {item.comment_count} replies ·{" "}
                {relativeDate(item.last_activity_at)}
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
