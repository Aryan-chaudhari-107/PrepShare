import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  Compass,
  Eye,
  FileEdit,
  Flame,
  LogIn,
  MessageSquare,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import { dashboardApi, postsApi } from "../api";
import type { DashboardSummary, PostListItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { Button, LINK_SECONDARY } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { PageContainer } from "../components/layout/AppShell";
import { Scene, Section } from "../motion";
import { errorMessage } from "../lib/format";
import { NEUTRAL_CHIP, POSITIVE_CHIP } from "../components/dashboard/constants";
import { Sparkline, StatTile } from "../components/dashboard/StatTile";
import { ActivityChart } from "../components/dashboard/ActivityChart";
import { OfferGauge } from "../components/dashboard/OfferGauge";
import { FreshFeed } from "../components/dashboard/FreshFeed";
import { Discussions } from "../components/dashboard/Discussions";
import { CategoryBreakdown } from "../components/dashboard/CategoryBreakdown";
import { DashboardHero } from "../components/dashboard/DashboardHero";
import { WeeklyGoalCard } from "../components/dashboard/WeeklyGoalCard";
import { PitchCard } from "../components/dashboard/PitchCard";
import { NextUpCard } from "../components/dashboard/NextUpCard";

/* ──────────────────────────────────────────────────────────────────────────
   The command center: an app-shell dashboard in a 12-column bento grid.

   Every number here comes from GET /dashboard/summary — one request that
   returns the personal ledger for signed-in users and platform-wide numbers
   for visitors. Nothing is invented client-side; if a block has no backing
   data it is not rendered.

   This file owns the LAYOUT (every Section span below); the content blocks
   live in src/components/dashboard/ as focused, testable components.

   Layout language (mirrors the approved template):
     r1-r2  hero (7×2) + shared(2) + views(3) | replies(3) + streak(2)
     r3-r4  activity chart(5×2) + offer gauge(3×2) + fresh feed(4×2)
     r5     discussions(6) + weekly goal(3) + next up(3)
   md collapses to 2 columns, phones to 1 — spans are applied from md up so
   a single-column grid never inherits a span-2 that would overflow.
   ────────────────────────────────────────────────────────────────────────── */

export const DashboardPage: React.FC = () => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [summaryResult, feedResult] = await Promise.allSettled([
        dashboardApi.getSummary(),
        postsApi.getFeed({ page: 1, limit: 4 }),
      ]);
      if (summaryResult.status === "rejected") throw summaryResult.reason;
      setSummary(summaryResult.value.data);
      if (feedResult.status === "fulfilled") {
        setPosts(feedResult.value.data.items ?? []);
      }
    } catch (error) {
      setLoadError(error);
      setFailed(true);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Re-runs when auth flips so the ledger swaps between personal/platform.
  useEffect(() => {
    void load();
  }, [load]);

  const signed = Boolean(isAuthenticated && summary?.signed_in);
  const counts = summary?.counts ?? null;
  const trend = summary?.trend ?? null;
  const streak = summary?.streak ?? null;
  const offer = summary?.offer_signal ?? { offers: 0, without_offer: 0, total: 0 };

  const weekActivity = (summary?.activity ?? []).slice(-7);
  const sparkValues = (summary?.activity ?? []).map((day) => day.total);
  const engagementTotal = sparkValues.reduce((sum, value) => sum + value, 0);
  // Composition of the sparkline sum, so the tile's value and sub-line agree.
  const posts14 = (summary?.activity ?? []).reduce(
    (sum, day) => sum + day.posts,
    0,
  );
  const replies14 = (summary?.activity ?? []).reduce(
    (sum, day) => sum + day.comments,
    0,
  );
  const saves14 = (summary?.activity ?? []).reduce(
    (sum, day) => sum + day.bookmarks + day.completions,
    0,
  );

  /* ── loading skeleton: same spans as the real grid (no layout shift) ── */
  if (loading && !summary) {
    return (
      <PageContainer width="shell" className="pb-12">
        <div
          className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-12"
          role="status"
          aria-label="Loading your dashboard"
        >
          <div className="shimmer h-72 rounded-xl bg-surface/70 md:col-span-2 xl:col-span-7 xl:row-span-2" />
          <div className="shimmer h-44 rounded-xl bg-surface/70 xl:col-span-2" />
          <div className="shimmer h-44 rounded-xl bg-surface/70 xl:col-span-3" />
          <div className="shimmer h-44 rounded-xl bg-surface/70 xl:col-span-3" />
          <div className="shimmer h-44 rounded-xl bg-surface/70 xl:col-span-2" />
          <div className="shimmer h-80 rounded-xl bg-surface/70 md:col-span-2 xl:col-span-5 xl:row-span-2" />
          <div className="shimmer h-80 rounded-xl bg-surface/70 xl:col-span-3 xl:row-span-2" />
          <div className="shimmer h-80 rounded-xl bg-surface/70 xl:col-span-4 xl:row-span-2" />
          <div className="shimmer h-56 rounded-xl bg-surface/70 md:col-span-2 xl:col-span-6" />
          <div className="shimmer h-56 rounded-xl bg-surface/70 xl:col-span-3" />
          <div className="shimmer h-56 rounded-xl bg-surface/70 xl:col-span-3" />
        </div>
      </PageContainer>
    );
  }

  /* ── error ── */
  if (failed && !summary) {
    return (
      <PageContainer width="shell" className="pb-12">
        <Card className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <RefreshCw size={22} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-heading">Couldn't load your dashboard</h1>
            <p className="mt-1 text-sm text-muted">
              {errorMessage(loadError, "The summary service didn't respond.")}
            </p>
          </div>
          <Button icon={<RefreshCw size={16} />} onClick={() => void load()}>
            Try again
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (!summary) return null;

  const displayName = user?.full_name || user?.username || "";

  return (
    <PageContainer width="shell" className="pb-12">
      <Scene gap={0.06} className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-12">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <Section className="md:col-span-2 xl:col-span-7 xl:row-span-2">
          <DashboardHero
            signed={signed}
            displayName={displayName}
            counts={counts}
            streak={streak}
            offer={offer}
            platform={summary.platform}
            contributionScore={user?.contribution_score ?? 0}
            onRegister={() => openAuthModal("register")}
          />
        </Section>

        {/* ── Small stat tiles ────────────────────────────────────────── */}
        {signed && counts && trend ? (
          <>
            <Section className="xl:col-span-2">
              <StatTile
                label="Shared"
                icon={<FileEdit size={16} aria-hidden="true" />}
                value={counts.posts}
                sub={`${counts.drafts} draft${counts.drafts === 1 ? "" : "s"} in progress`}
                chip={
                  trend.posts_this_week > 0 ? (
                    <span className={POSITIVE_CHIP}>
                      <TrendingUp size={11} aria-hidden="true" />+{trend.posts_this_week} this week
                    </span>
                  ) : undefined
                }
              />
            </Section>

            <Section className="xl:col-span-3">
              <StatTile
                label="Engagement · 14d"
                icon={<Eye size={16} aria-hidden="true" />}
                value={engagementTotal}
                sub={[
                  `${posts14} ${posts14 === 1 ? "post" : "posts"}`,
                  `${replies14} ${replies14 === 1 ? "reply" : "replies"}`,
                  saves14 > 0
                    ? `${saves14} save${saves14 === 1 ? "" : "s"} & completions`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                spark={
                  <div className="mt-2">
                    <Sparkline
                      values={sparkValues}
                      label="Daily engagement for the last 14 days"
                    />
                  </div>
                }
              />
            </Section>

            <Section className="xl:col-span-3">
              <StatTile
                label="Replies given"
                icon={<MessageSquare size={16} aria-hidden="true" />}
                value={counts.replies_given}
                sub={`${counts.comments_received} replies received · ${counts.completed_questions} questions solved`}
                chip={
                  trend.comments_this_week > 0 ? (
                    <span className={POSITIVE_CHIP}>
                      <TrendingUp size={11} aria-hidden="true" />+
                      {trend.comments_this_week} this week
                    </span>
                  ) : (
                    <span className={NEUTRAL_CHIP}>a little quiet this week</span>
                  )
                }
              />
            </Section>

            <Section className="xl:col-span-2">
              <StatTile
                label="Streak"
                icon={<Flame size={16} aria-hidden="true" />}
                value={`${streak?.current ?? 0}d`}
                sub={`best run: ${streak?.best ?? 0} days`}
                spark={
                  <div
                    className="mt-3 flex items-center gap-1.5"
                    role="img"
                    aria-label="Activity on each of the last 7 days"
                  >
                    {weekActivity.map((day) => (
                      <span
                        key={day.date}
                        title={`${day.date}: ${day.total} ${
                          day.total === 1 ? "action" : "actions"
                        }`}
                        className={`h-3 w-3 rounded-full ${
                          day.total > 0
                            ? "bg-primary shadow-[0_0_8px_rgb(var(--primary)/.55)]"
                            : "border border-line bg-raised"
                        }`}
                      />
                    ))}
                    <span className="ml-auto text-[10px] text-faint">
                      last 7 days
                    </span>
                  </div>
                }
              />
            </Section>
          </>
        ) : (
          <>
            <Section className="xl:col-span-2">
              <StatTile
                label="Experiences"
                icon={<FileEdit size={16} aria-hidden="true" />}
                value={summary.platform.total_posts}
                sub="published on PrepShare"
              />
            </Section>
            <Section className="xl:col-span-3">
              <StatTile
                label="Contributors"
                icon={<MessageSquare size={16} aria-hidden="true" />}
                value={summary.platform.total_contributors}
                sub="students & professionals sharing"
              />
            </Section>
            <Section className="xl:col-span-3">
              <StatTile
                label="Members"
                icon={<Eye size={16} aria-hidden="true" />}
                value={summary.platform.total_users}
                sub="learning from real interviews"
              />
            </Section>
            <Section className="xl:col-span-2">
              <StatTile
                label="Discussions"
                icon={<Flame size={16} aria-hidden="true" />}
                value={summary.active_discussions.length}
                sub="threads talking right now"
              />
            </Section>
          </>
        )}

        {/* ── Activity chart / category breakdown ─────────────────────── */}
        {signed ? (
          <Section className="md:col-span-2 xl:col-span-5 xl:row-span-2">
            <Card className="h-full">
              <CardHeader
                as="h2"
                title="Interview activity"
                subtitle="Your contributions, last 7 days"
                icon={<BarChart3 size={16} aria-hidden="true" />}
              />
              <ActivityChart summary={summary} />
            </Card>
          </Section>
        ) : (
          <Section className="md:col-span-2 xl:col-span-5 xl:row-span-2">
            <Card className="h-full">
              <CardHeader
                as="h2"
                title="Community categories"
                subtitle="Where the experiences cluster"
                icon={<BarChart3 size={16} aria-hidden="true" />}
              />
              <CategoryBreakdown
                categories={summary.categories}
                totalPosts={summary.platform.total_posts}
              />
            </Card>
          </Section>
        )}

        {/* ── Offer signal ────────────────────────────────────────────── */}
        <Section className="xl:col-span-3 xl:row-span-2">
          <Card className="h-full">
            <CardHeader
              as="h2"
              title="Offer signal"
              subtitle={signed ? "Across your published experiences" : "Across every experience"}
              icon={<Award size={16} aria-hidden="true" />}
            />
            <div className="flex h-full flex-col justify-center">
              <OfferGauge offers={offer.offers} without={offer.without_offer} total={offer.total} />
            </div>
          </Card>
        </Section>

        {/* ── Fresh feed ──────────────────────────────────────────────── */}
        <Section className="xl:col-span-4 xl:row-span-2">
          <Card className="h-full">
            <CardHeader
              as="h2"
              title="Fresh from the feed"
              subtitle="Latest published experiences"
              icon={<Compass size={16} aria-hidden="true" />}
              action={
                <Link to="/feed" className="text-xs font-medium text-primary hover:underline">
                  Open feed
                </Link>
              }
            />
            <FreshFeed posts={posts} />
          </Card>
        </Section>

        {/* ── Active discussions ──────────────────────────────────────── */}
        <Section className="md:col-span-2 xl:col-span-6">
          <Card className="h-full">
            <CardHeader
              as="h2"
              title="Active discussions"
              subtitle="Threads with the freshest replies"
              icon={<MessageSquare size={16} aria-hidden="true" />}
            />
            <Discussions items={summary.active_discussions} />
          </Card>
        </Section>

        {/* ── Weekly goal (signed-in only) ────────────────────────────── */}
        {signed && summary.weekly ? (
          <Section className="xl:col-span-3">
            <WeeklyGoalCard weekly={summary.weekly} />
          </Section>
        ) : (
          <Section className="xl:col-span-3">
            <PitchCard
              title="Your command center"
              subtitle="Streaks, goals and replies — personal to you"
              icon={<Target size={16} aria-hidden="true" />}
              body="Sign in to track your contribution streak, weekly goal and the reach of every experience you share."
            >
              <Button size="sm" onClick={() => openAuthModal("login")}>
                Sign in
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openAuthModal("register")}>
                Sign up
              </Button>
            </PitchCard>
          </Section>
        )}

        {/* ── Next up (signed-in only) ────────────────────────────────── */}
        {signed ? (
          <Section className="xl:col-span-3">
            <NextUpCard draft={summary.recent_draft} />
          </Section>
        ) : (
          <Section className="xl:col-span-3">
            <PitchCard
              title="Join the exchange"
              subtitle="Four minutes to help the next candidate"
              icon={<LogIn size={16} aria-hidden="true" />}
              body="Create an account to bookmark threads, reply in discussions and publish your own experience."
            >
              <Button size="sm" onClick={() => openAuthModal("register")}>
                Get started
              </Button>
              <Link to="/feed" className={LINK_SECONDARY}>
                Browse first
              </Link>
            </PitchCard>
          </Section>
        )}
      </Scene>
    </PageContainer>
  );
};

export default DashboardPage;
