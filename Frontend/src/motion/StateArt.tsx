import React from "react";
import { cn } from "../lib/cn";

/**
 * Designed illustration for empty / error / 404 states.
 *
 * WHY: an empty viewport is the one place a user has literally nothing to look
 * at, and it is usually where they are most frustrated (no results, no
 * bookmarks, a dead link). A stock icon-in-a-tile says "we ran out of ideas".
 * These are drawn in the product's own vocabulary — stacked documents, round
 * sequences, message layers — so even the absence of content feels authored.
 *
 * Built from SVG + CSS only (no images, no canvas, no WebGL): a few hundred
 * bytes, instantly paintable, and the ambient float runs on the compositor
 * under the global `prefers-reduced-motion` kill switch in index.css.
 */

export type ArtVariant =
  /** layered documents — bookmarks, drafts, saved items */
  | "stack"
  /** a round sequence, waiting to be filled — completed questions, report empty */
  | "rounds"
  /** message layers — conversations */
  | "chat"
  /** a quiet signal waiting to arrive — notifications */
  | "signal"
  /** the mis-filed case — 404 and errors */
  | "stray";

interface StateArtProps {
  variant?: ArtVariant;
  /** `muted` for neutral empty states, `danger` for errors. */
  tone?: "muted" | "danger";
  className?: string;
}

const TONES = {
  muted: {
    back: "fill-sunken",
    mid: "fill-raised",
    front: "fill-surface",
    line: "stroke-line-strong",
    accent: "stroke-primary",
    accentSoft: "fill-primary-soft",
    text: "stroke-muted",
  },
  danger: {
    back: "fill-sunken",
    mid: "fill-raised",
    front: "fill-surface",
    line: "stroke-line-strong",
    accent: "stroke-danger",
    accentSoft: "fill-danger-soft",
    text: "stroke-danger",
  },
} as const;

const Frame: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("pointer-events-none select-none", className)}>
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-hidden="true"
      className="h-auto w-[168px] overflow-visible sm:w-[184px]"
    >
      {children}
    </svg>
  </div>
);

/** Ambient float — 7s, tiny amplitude, runs only while motion is allowed. */
const FLOAT = "animate-art-float";

export const StateArt: React.FC<StateArtProps> = ({ variant = "stack", tone = "muted", className }) => {
  const t = TONES[tone];

  if (variant === "rounds") {
    // Three nested rounds descending — the shape of every interview loop in
    // the product. The innermost sits open, waiting for content.
    return (
      <Frame className={className}>
        <g className={FLOAT}>
          <rect x="18" y="16" width="164" height="104" rx="16" className={t.back} />
          <rect x="34" y="30" width="132" height="76" rx="13" className={t.mid} />
          <rect
            x="50"
            y="44"
            width="100"
            height="48"
            rx="10"
            className={cn(t.front, t.line, "stroke")}
          />
          <path
            d="M66 68h30M66 78h54"
            strokeLinecap="round"
            strokeWidth="4"
            className={cn(t.text, "opacity-40")}
            fill="none"
          />
          <circle cx="134" cy="70" r="9" className={t.accentSoft} />
          <path
            d="M130 70l3 3 5-6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            className={cn(t.accent, "opacity-70")}
            fill="none"
          />
        </g>
      </Frame>
    );
  }

  if (variant === "chat") {
    return (
      <Frame className={className}>
        <g className={FLOAT}>
          <rect x="24" y="24" width="96" height="42" rx="14" className={t.back} />
          <rect
            x="80"
            y="58"
            width="96"
            height="42"
            rx="14"
            className={cn(t.front, t.line, "stroke")}
          />
          <path d="M44 40h52M44 50h34" strokeLinecap="round" strokeWidth="4" className={cn(t.text, "opacity-35")} fill="none" />
          <path d="M100 74h52M100 84h30" strokeLinecap="round" strokeWidth="4" className={cn(t.text, "opacity-35")} fill="none" />
          <circle cx="164" cy="34" r="6" className={t.accentSoft} />
        </g>
      </Frame>
    );
  }

  if (variant === "signal") {
    return (
      <Frame className={className}>
        <g className={FLOAT}>
          <rect x="30" y="86" width="26" height="30" rx="8" className={t.back} />
          <rect x="66" y="66" width="26" height="50" rx="8" className={t.mid} />
          <rect x="102" y="46" width="26" height="70" rx="8" className={t.back} />
          <rect x="138" y="30" width="26" height="86" rx="8" className={cn(t.front, t.line, "stroke")} />
          <path
            d="M34 52c26-16 62-26 104-30"
            strokeLinecap="round"
            strokeWidth="3"
            strokeDasharray="6 9"
            className={cn(t.accent, "opacity-55")}
            fill="none"
          />
        </g>
      </Frame>
    );
  }

  if (variant === "stray") {
    // The mis-filed report: one card out of line, stamped with a question.
    return (
      <Frame className={className}>
        <g className={FLOAT}>
          <rect x="52" y="22" width="104" height="94" rx="14" className={t.back} />
          <g transform="rotate(-7 100 70)">
            <rect
              x="40"
              y="34"
              width="104"
              height="94"
              rx="14"
              className={cn(t.front, t.line, "stroke")}
            />
            <path d="M60 60h48M60 74h64M60 88h34" strokeLinecap="round" strokeWidth="5" className={cn(t.text, "opacity-35")} fill="none" />
            <circle cx="126" cy="98" r="17" className={t.accentSoft} />
            <path
              d="M121 94a5.2 5.2 0 1 1 7.4 4.7c-1.6.8-2.4 1.7-2.4 3.3"
              strokeLinecap="round"
              strokeWidth="3.4"
              className={t.accent}
              fill="none"
            />
            <circle cx="126" cy="107" r="2.2" className={t.accent} />
          </g>
        </g>
      </Frame>
    );
  }

  // "stack" — default: layered documents with the top sheet lifting away.
  return (
    <Frame className={className}>
      <g className={FLOAT}>
        <rect x="46" y="44" width="108" height="80" rx="14" className={t.back} />
        <rect x="36" y="34" width="108" height="80" rx="14" className={t.mid} />
        <rect
          x="26"
          y="24"
          width="108"
          height="80"
          rx="14"
          className={cn(t.front, t.line, "stroke")}
        />
        <path d="M46 48h56M46 62h68M46 76h40" strokeLinecap="round" strokeWidth="5" className={cn(t.text, "opacity-35")} fill="none" />
        <circle cx="118" cy="88" r="10" className={t.accentSoft} />
        <path
          d="M114 88l3 3 5-6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          className={cn(t.accent, "opacity-70")}
          fill="none"
        />
      </g>
    </Frame>
  );
};
