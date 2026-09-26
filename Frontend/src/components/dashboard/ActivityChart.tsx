import React from "react";
import { motion } from "framer-motion";
import { EASE } from "../../motion";
import type { DashboardActivityDay, DashboardSummary } from "../../types";

/* ── Activity chart (last 7 days, stacked posts + replies + saves) ─────── */

/** "6 posts, 1 reply, 5 bookmarks" — zero-count parts dropped, pluralised. */
export const describeActivityDay = (day: DashboardActivityDay): string => {
  const parts = [
    day.posts > 0 ? `${day.posts} post${day.posts === 1 ? "" : "s"}` : null,
    day.comments > 0
      ? `${day.comments} ${day.comments === 1 ? "reply" : "replies"}`
      : null,
    day.bookmarks > 0
      ? `${day.bookmarks} bookmark${day.bookmarks === 1 ? "" : "s"}`
      : null,
    day.completions > 0
      ? `${day.completions} completion${day.completions === 1 ? "" : "s"}`
      : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(", ") : "no activity";
};

/**
 * Weekday short label ("Mon") for a YYYY-MM-DD date, pinned to midday so the
 * host timezone can't shift the day. Shared by the visible axis labels and the
 * chart's accessible name — the name must contain the visible text (WCAG 2.5.3).
 */
export const weekdayOf = (date: string): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });

export const ActivityChart: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  const week = summary.activity.slice(-7);
  const max = Math.max(...week.map((day) => day.total), 1);
  const total = week.reduce((sum, day) => sum + day.total, 0);

  return (
    <div>
      <div
        className="flex h-40 items-end gap-2 sm:gap-3"
        role="img"
        aria-label={`Daily activity for the last 7 days: ${week
          .map((day) => `${weekdayOf(day.date)} ${day.date}: ${describeActivityDay(day)}`)
          .join(", ")}`}
      >
        {week.map((day, index) => {
          const height = (day.total / max) * 100;
          const postsShare = day.total > 0 ? (day.posts / day.total) * 100 : 0;
          const repliesShare =
            day.total > 0 ? (day.comments / day.total) * 100 : 0;
          const savesShare = Math.max(0, 100 - postsShare - repliesShare);
          const weekday = weekdayOf(day.date);
          return (
            <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col justify-end">
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.18 + index * 0.05,
                    ease: EASE.enter,
                  }}
                  style={{ height: `${Math.max(height, 3)}%`, transformOrigin: "bottom" }}
                  className="flex w-full flex-col justify-end overflow-hidden rounded-md"
                  title={`${day.date} — ${describeActivityDay(day)}`}
                >
                  {day.total > 0 ? (
                    <>
                      <div
                        className="w-full bg-warning/70"
                        style={{ height: `${savesShare}%` }}
                      />
                      <div
                        className="w-full bg-accent/75"
                        style={{ height: `${repliesShare}%` }}
                      />
                      <div
                        className="w-full bg-primary"
                        style={{ height: `${postsShare}%` }}
                      />
                    </>
                  ) : (
                    <div className="h-0.5 w-full bg-line-strong/70" />
                  )}
                </motion.div>
              </div>
              <span className="mt-2 text-center text-[10px] font-medium text-faint">
                {weekday}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
        <span className="font-semibold text-heading">
          {total} actions in the last 7 days
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-sm bg-primary" aria-hidden="true" />
          posts
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-sm bg-accent/75" aria-hidden="true" />
          replies
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-sm bg-warning/70" aria-hidden="true" />
          saves &amp; completions
        </span>
      </div>
    </div>
  );
};
