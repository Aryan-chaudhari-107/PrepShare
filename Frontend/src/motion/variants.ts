import type { Variants } from "framer-motion";
import { DURATION, EASE } from "./tokens";

/**
 * Reusable variant sets.
 *
 * Containers declare `initial="hidden" animate="show" exit="exit"`; their
 * motion descendants pick these up by NAME, which is how staggering works
 * without a single line of timing logic in the component itself.
 *
 * Rule: list/section children animate `y + opacity` only (compositor-friendly,
 * safe at scale). Blur and scale are reserved for one-off focal moments, never
 * for rows in a long list.
 */

/** Parent: lays down the stagger cadence for its motion children. */
export const stagger = (gap = 0.055, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
  exit: {},
});

/** A row/card arriving as part of a stagger. */
export const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.enter } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast, ease: EASE.exit } },
};

/** A whole page settling into place. Used by `Scene` / route transitions. */
export const scene: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.cinematic, ease: EASE.enter } },
  exit: { opacity: 0, y: -10, transition: { duration: DURATION.fast, ease: EASE.exit } },
};

/** Modal / drawer backdrop. */
export const veil: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.exit } },
};

/**
 * Modal / drawer body. Arrives from slight depth (scale 0.97 → 1) rather than
 * sliding across the screen — panels belong to the surface they cover.
 */
export const panel: Variants = {
  hidden: { opacity: 0, scale: 0.965, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE.enter } },
  exit: { opacity: 0, scale: 0.98, y: 6, transition: { duration: DURATION.fast, ease: EASE.exit } },
};

/**
 * Disclosure: content that expands in place (accordion, collapsible filter).
 * Kept quick — the user asked for the content, not the animation.
 */
export const disclosure: Variants = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: "auto", transition: { duration: DURATION.base, ease: EASE.standard } },
  exit: { opacity: 0, height: 0, transition: { duration: DURATION.fast, ease: EASE.exit } },
};

/**
 * A message/bubble entering a conversation — arrives from the side it was
 * sent from, so direction carries meaning.
 */
export const bubble = (mine: boolean): Variants => ({
  hidden: { opacity: 0, x: mine ? 14 : -14, y: 6 },
  show: { opacity: 1, x: 0, y: 0, transition: { duration: DURATION.base, ease: EASE.enter } },
});
