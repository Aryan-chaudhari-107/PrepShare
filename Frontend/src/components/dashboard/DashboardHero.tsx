import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button, LINK_PRIMARY, LINK_SECONDARY } from "../ui/Button";
import { Card } from "../ui/Card";
import { POSITIVE_CHIP } from "./constants";
import { compactCount } from "../../lib/format";
import type { DashboardSummary } from "../../types";

/* ── Hero (the 7×2 command-center card) ────────────────────────────────── */

export interface DashboardHeroProps {
  signed: boolean;
  displayName: string;
  counts: DashboardSummary["counts"];
  streak: DashboardSummary["streak"];
  offer: DashboardSummary["offer_signal"];
  platform: DashboardSummary["platform"];
  contributionScore: number;
  onRegister: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  signed,
  displayName,
  counts,
  streak,
  offer,
  platform,
  contributionScore,
  onRegister,
}) => (
  <Card className="relative h-full overflow-hidden">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/12 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
    />

    <div className="relative flex h-full flex-col gap-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        <Sparkles size={13} aria-hidden="true" />
        {signed ? "Dashboard · this week" : "PrepShare · live"}
      </p>

      <h1 className="text-2xl font-bold leading-snug tracking-tight text-heading sm:text-[1.65rem]">
        {signed ? (
          <>
            Welcome back, <span className="text-primary">{displayName}</span>
            {streak && streak.current > 0 ? (
              <>
                {" "}
                — you're on a <span className="text-primary">{streak.current}-day</span>{" "}
                streak.
              </>
            ) : (
              <> — your command center is ready.</>
            )}
          </>
        ) : (
          <>
            Real interview intelligence, from people who{" "}
            <span className="text-primary">sat in the chair</span>.
          </>
        )}
      </h1>

      <p className="max-w-[64ch] text-sm leading-relaxed text-body">
        {signed && counts
          ? `${counts.posts} experiences shared · ${counts.comments_received} community replies received · ${compactCount(counts.views)} views across your write-ups.`
          : `${platform.total_posts} experiences from ${platform.total_contributors} contributors across ${platform.total_users} members — filter by company, role or round and learn what actually happens.`}
      </p>

      <div className="flex flex-wrap gap-x-8 gap-y-4 pt-1">
        {signed && counts ? (
          <>
            <div>
              <div className="tabular text-xl font-bold text-heading">{counts.posts}</div>
              <div className="text-xs text-muted">experiences shared</div>
            </div>
            <div>
              <div className="tabular text-xl font-bold text-heading">
                {compactCount(counts.views)}
              </div>
              <div className="text-xs text-muted">write-up views</div>
            </div>
            <div>
              <div className="tabular text-xl font-bold text-heading">
                {streak?.current ?? 0}d
              </div>
              <div className="text-xs text-muted">current streak</div>
            </div>
            <div>
              <div className="tabular text-xl font-bold text-heading">
                {contributionScore}
              </div>
              <div className="text-xs text-muted">contribution score</div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="tabular text-xl font-bold text-heading">
                {platform.total_posts}
              </div>
              <div className="text-xs text-muted">experiences</div>
            </div>
            <div>
              <div className="tabular text-xl font-bold text-heading">
                {platform.total_contributors}
              </div>
              <div className="text-xs text-muted">contributors</div>
            </div>
            <div>
              <div className="tabular text-xl font-bold text-heading">
                {platform.total_users}
              </div>
              <div className="text-xs text-muted">members</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-2">
        {signed ? (
          <>
            <Link to="/draft" className={LINK_PRIMARY}>
              Share experience
            </Link>
            <Link to="/profile" className={LINK_SECONDARY}>
              View profile
            </Link>
            {offer.offers > 0 && (
              <span className={POSITIVE_CHIP}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                Offer signal active
              </span>
            )}
          </>
        ) : (
          <>
            <Button onClick={onRegister}>Create account</Button>
            <Link to="/feed" className={LINK_SECONDARY}>
              Explore the feed
            </Link>
          </>
        )}
      </div>
    </div>
  </Card>
);
