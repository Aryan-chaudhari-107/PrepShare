import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  GraduationCap,
  MapPin,
  Banknote,
  Eye,
  Share2,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { PostListItem } from "../../types";
import { AuthorDisplay } from "../common/AuthorDisplay";
import { CategoryBadge } from "../common/CategoryBadge";
import { DEPTH, Tilt } from "../../motion";
import { cn } from "../../lib/cn";
import { formatPackage, relativeDate } from "../../lib/format";
import { pulseEnvironment } from "../../lib/environment";

interface PostCardProps {
  post: PostListItem;
  /**
   * Elevation accent: the list marks its signal card (the feed picks the
   * first offer on the page) so it sits a touch prouder than its neighbours.
   * Pointer tilt is NOT gated on this — every card owns its own Tilt — so
   * depth still reads as emphasis through shadow, never through interaction.
   */
  focal?: boolean;
}

/** A metadata cell preceded by a hairline separator (hidden before `sm`). */
const Meta: React.FC<{
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ icon, className, children }) => (
  <>
    <span className="hidden h-4 w-px shrink-0 bg-line sm:block" aria-hidden="true" />
    <span className={cn("flex min-w-0 items-center gap-1.5 text-sm", className)}>
      {icon}
      <span className="truncate">{children}</span>
    </span>
  </>
);

/**
 * Feed card.
 *
 * Motion rules this card follows:
 *  - NO entrance animation of its own. Arrival is choreographed by the LIST
 *    the card lives in (the feed staggers its rows with the shared `stagger`
 *    / `item` variants), so every list in the product lands with one rhythm
 *    instead of each surface inventing its own fade-up;
 *  - hover is colour + transform only: the border darkens, the title underline
 *    sweeps and the CTA arrow leans forward. No shadow animation on rows —
 *    elevation is a static `shadow-*`, never a transition;
 *  - when the post ended in an offer, hovering the card sends ONE light sweep
 *    across the round/offer strip (translate-driven, tokens for duration and
 *    easing, and hover-only so touch devices never depend on it). That strip
 *    carries the product's signal, so it is the only part of the card that
 *    catches the light;
 *  - `focal` deepens the static shadow one step — every card is wrapped in
 *    its own `<Tilt>`: pointer-driven perspective plus a specular highlight
 *    that tracks the cursor, each instance driven by its own MotionValues,
 *    and it disables itself on coarse pointers and for reduced motion.
 */
export const PostCard: React.FC<PostCardProps> = ({ post, focal = false }) => {
  const packageLabel = formatPackage(post.package_amount, post.currency);
  const dateLabel = relativeDate(post.published_at || post.created_at);

  /**
   * Opening a post kicks the environment at the exact point the user clicked:
   * the field ripples outward from the card while the route stage zooms the
   * detail view toward the camera. Keyboard activation (Enter on the link)
   * carries no pointer coordinates, so it falls back to the centre of the
   * link that was activated.
   */
  const handleOpenPulse = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target instanceof Element ? e.target : null;
    const link = target?.closest('a[href^="/posts/"]');
    if (!link) return;
    const rect = link.getBoundingClientRect();
    pulseEnvironment("post-open", {
      x: e.clientX || rect.left + rect.width / 2,
      y: e.clientY || rect.top + rect.height / 2,
    });
  };

  const card = (
    <article
      className={cn(
        // `glow-edge` + `group` on the same element: border warms to the brand
        // hue and a soft halo lifts on hover AND keyboard focus. The surface is
        // translucent so the live environment reads faintly through the card.
        "group glow-edge relative flex flex-col gap-4 rounded-xl border border-line bg-surface/85 p-5 sm:p-6",
        focal ? "shadow-sm" : "shadow-xs"
      )}
    >
      {/* Top light: a brand-tinted sheen fades in on hover/focus — opacity
          only, so it costs one composited layer and never repaints content. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-xl bg-gradient-to-b from-primary/[0.06] to-transparent opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-within:opacity-100"
      />
      {/* Header: author, org context, category, time */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <AuthorDisplay author={post.author} isAnonymous={post.is_anonymous} size="md" />

          {post.company_name && (
            <Meta
              icon={
                <Building2 size={15} className="shrink-0 text-primary" aria-hidden="true" />
              }
              className="font-semibold text-heading"
            >
              {post.company_name}
            </Meta>
          )}

          {post.job_role && (
            <Meta icon={<Briefcase size={15} className="shrink-0 text-warning" aria-hidden="true" />} className="font-medium text-warning">
              {post.job_role}
            </Meta>
          )}

          {post.institution_name && (
            <Meta
              icon={<GraduationCap size={15} className="shrink-0 text-muted" aria-hidden="true" />}
              className="text-muted"
            >
              {post.institution_name}
              {post.course && <span className="text-faint"> · {post.course}</span>}
            </Meta>
          )}

          {post.work_location && (
            <Meta
              icon={<MapPin size={14} className="shrink-0 text-muted" aria-hidden="true" />}
              className="text-muted"
            >
              {post.work_location}
            </Meta>
          )}

          {packageLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-3 py-1 text-sm font-semibold text-success">
              <Banknote size={15} aria-hidden="true" />
              <span className="tabular">{packageLabel}</span>
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <CategoryBadge category={post.post_category} size="sm" />
          <time className="text-sm text-muted" dateTime={post.published_at || post.created_at}>
            {dateLabel}
          </time>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold leading-tight tracking-tight">
        <Link
          to={`/posts/${post.id}`}
          className="transition-colors duration-fast ease-swift hover:text-primary"
        >
          <span className="bg-gradient-to-r from-transparent to-transparent bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-base ease-swift group-hover:bg-[length:100%_1px] group-hover:from-primary">
            {post.title}
          </span>
        </Link>
      </h2>

      {/* Excerpt */}
      {post.experience_text_excerpt && (
        <p className="line-clamp-2 text-base leading-relaxed text-body">
          {post.experience_text_excerpt}
        </p>
      )}

      {/* Round / offer summary strip — the card's signal. On offer posts the
          strip catches a single light sweep while the pointer is on the card:
          transform-only, and only where the outcome makes it relevant. */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-raised px-4 py-3">
        {post.is_offer_received && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
          >
            <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-[transform,opacity] duration-slow ease-enter group-hover:translate-x-[400%] group-hover:opacity-100" />
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
            <Layers size={15} aria-hidden="true" />
            <span className="tabular">
              {post.round_count} {post.round_count === 1 ? "round" : "rounds"}
            </span>
          </span>

          {post.is_offer_received ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-3 py-1 text-sm font-semibold text-success">
              <CheckCircle2 size={15} aria-hidden="true" />
              Offer received
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
              Process completed
            </span>
          )}
        </div>

        <Link
          to={`/posts/${post.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors duration-fast ease-swift hover:text-[rgb(var(--primary-hover))]"
        >
          Read experience
          <ArrowRight
            size={15}
            className="transition-transform duration-fast ease-swift group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* Engagement footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
        <div className="flex items-center gap-5">
          <span className="tabular inline-flex items-center gap-1.5" title="Views">
            <Eye size={15} aria-hidden="true" />
            <span>{post.view_count} views</span>
          </span>
          <span className="tabular inline-flex items-center gap-1.5" title="Shares">
            <Share2 size={15} aria-hidden="true" />
            <span>{post.share_count} shares</span>
          </span>
        </div>
      </footer>
    </article>
  );

  // Every card owns its own Tilt instance — independent MotionValues and
  // pointer handlers per post — so the depth response works on every row,
  // not just the signal card. `focal` only affects the shadow above.
  return (
    <Tilt
      className="rounded-xl"
      lift={DEPTH.lifted.scale}
      onClickCapture={handleOpenPulse}
    >
      {card}
    </Tilt>
  );
};
