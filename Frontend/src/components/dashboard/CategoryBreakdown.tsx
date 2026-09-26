import React from "react";
import { motion } from "framer-motion";
import { EASE } from "../../motion";
import type { DashboardSummary } from "../../types";
import { categoryLabel } from "./constants";

/* ── Category breakdown (anonymous view, next to the hero) ─────────────── */

export const CategoryBreakdown: React.FC<{
  categories: DashboardSummary["categories"];
  totalPosts: number;
}> = ({ categories, totalPosts }) => (
  <ul className="flex flex-col gap-3">
    {categories.map((entry) => {
      const pct =
        totalPosts > 0 ? Math.round((entry.count / totalPosts) * 100) : 0;
      return (
        <li key={entry.category}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-heading">
              {categoryLabel(entry.category)}
            </span>
            <span className="tabular shrink-0 text-muted">{entry.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sunken">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: EASE.enter, delay: 0.2 }}
              className="h-full rounded-full bg-primary/80"
            />
          </div>
        </li>
      );
    })}
  </ul>
);
