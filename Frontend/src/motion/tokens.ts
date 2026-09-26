import type { Transition } from "framer-motion";

/**
 * PrepShare motion system — the single source of truth for time, easing and
 * depth. Components read from here instead of inventing numbers, so the whole
 * product moves with one personality.
 *
 * The personality: things have weight.
 *  - arrivals DECELERATE and land softly          (EASE.enter)
 *  - departures ACCELERATE away and never linger   (EASE.exit)
 *  - direct manipulation settles with a hint of overshoot (EASE.emphasized)
 * Nothing bounces for its own sake; nothing is slower than it needs to be.
 *
 * Tiers are chosen by how much attention the motion deserves, not by habit:
 * DURATION.fast for things the user feels, DURATION.cinematic for things the
 * user watches.
 */

export type Bezier = [number, number, number, number];

/** Seconds. Small → large; pick by how much the user should notice. */
export const DURATION = {
  /** press, icon swap, tooltip — felt, not watched */
  instant: 0.08,
  /** hover colour, focus, small state flips */
  fast: 0.14,
  /** dropdowns, toggles, expanding rows — the default */
  base: 0.24,
  /** modals, drawers, card reveals */
  slow: 0.38,
  /** page/scene entrance, hero — the cinematic tier */
  cinematic: 0.64,
} as const;

export const EASE = {
  /** general purpose — confident decelerate, no overshoot */
  standard: [0.2, 0.8, 0.2, 1] as Bezier,
  /** entering: long tail, lands without a thud */
  enter: [0.16, 1, 0.3, 1] as Bezier,
  /** exiting: leaves immediately, no lingering fade */
  exit: [0.7, 0, 0.84, 0] as Bezier,
  /** direct manipulation: a little overshoot reads as physical */
  emphasized: [0.34, 1.56, 0.64, 1] as Bezier,
} as const;

/**
 * Spring presets. Use these instead of hand-tuned stiffness values so
 * interactive elements share the same perceived mass.
 */
export const SPRING: Record<"snappy" | "gentle" | "bouncy" | "inertial", Transition> = {
  /** buttons, toggles — anything the user just pressed */
  snappy: { type: "spring", stiffness: 520, damping: 40, mass: 0.7 },
  /** cards and panels settling into place */
  gentle: { type: "spring", stiffness: 190, damping: 26, mass: 1 },
  /** one deliberately playful accent (badges, confirmations) */
  bouncy: { type: "spring", stiffness: 420, damping: 18, mass: 0.8 },
  /** pointer-driven values: heavy and slightly laggy, which reads as premium */
  inertial: { type: "spring", stiffness: 150, damping: 24, mass: 0.9 },
};

/**
 * Depth tiers. Scale, translateZ and elevation always move TOGETHER — a card
 * that lifts but casts no shadow (or vice versa) immediately reads as fake.
 * Pair with the matching `shadow-*` class from tailwind.config.js.
 */
export const DEPTH = {
  /** resting surface, flush with the page */
  flat: { scale: 1, lift: 0 },
  /** interactive: pointer is on it, or it is focusable */
  lifted: { scale: 1.012, lift: 1 },
  /** transient: menus, popovers, dragged objects */
  floating: { scale: 1.03, lift: 2 },
} as const;

/** Perspective value used by every 3D surface — one number, so depth is comparable. */
export const PERSPECTIVE = 1000;
