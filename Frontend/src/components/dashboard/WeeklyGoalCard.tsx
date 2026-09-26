import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { EASE } from "../../motion";
import type { DashboardSummary } from "../../types";

/* ── Weekly goal (signed-in only) ──────────────────────────────────────── */

export const WeeklyGoalCard: React.FC<{ weekly: DashboardSummary["weekly"] }> = ({
  weekly,
}) => {
  if (!weekly) return null;
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        as="h2"
        title="Weekly goal"
        subtitle={`${weekly.completed} of ${weekly.goal}`}
        icon={<Target size={16} aria-hidden="true" />}
      />
      {/* progressbar wraps only the bar itself: putting the caption <p>
          inside it would make the caption the bar's "visible text" and
          break WCAG 2.5.3 (accessible name must contain visible text). */}
      <div className="mt-auto">
        <div
          role="progressbar"
          aria-valuenow={weekly.completed}
          aria-valuemin={0}
          aria-valuemax={weekly.goal}
          aria-label="Weekly contribution goal"
        >
          <div className="h-2.5 overflow-hidden rounded-full border border-line bg-sunken">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(
                  100,
                  Math.round((weekly.completed / weekly.goal) * 100)
                )}%`,
              }}
              transition={{ duration: 0.8, ease: EASE.enter, delay: 0.3 }}
              className="h-full rounded-full bg-primary shadow-[0_0_10px_rgb(var(--primary)/.5)]"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          {weekly.completed >= weekly.goal
            ? "Goal reached — excellent week."
            : `${weekly.goal - weekly.completed} more contribution${
                weekly.goal - weekly.completed === 1 ? "" : "s"
              } to hit this week's goal.`}
        </p>
      </div>
    </Card>
  );
};
