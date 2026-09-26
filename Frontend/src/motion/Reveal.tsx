import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { DURATION, EASE } from "./tokens";

/**
 * Progressive content reveal on scroll.
 *
 * This is the ONLY scroll animation used across lists and sections, so the app
 * has one reveal rhythm rather than a different curve per page. It runs once
 * (`once: true`) — content never re-animates when you scroll back up, which is
 * what makes scroll effects feel cheap when they do.
 *
 * The element animates `y + opacity` only: both are compositor-friendly, so a
 * long feed of revealed rows costs nothing. For reduced-motion users framer's
 * `MotionConfig reducedMotion="user"` drops the transform and keeps the fade.
 *
 * NOTE: `Reveal` renders a div — use it AS the grid/flex item, not as a
 * wrapper around siblings, or it changes the layout it is meant to decorate.
 */
interface RevealProps {
  children: React.ReactNode;
  /** Seconds before this one starts, after it enters the viewport. */
  delay?: number;
  /** Travel distance in px. Keep ≤ 24 — bigger reads as a slideshow. */
  y?: number;
  /** Fraction of the element that must be visible before it fires. */
  amount?: number;
  /** Re-arm every time it leaves and re-enters. Off by default, on purpose. */
  repeat?: boolean;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  y = 18,
  amount = 0.2,
  repeat = false,
  className,
}) => (
  <motion.div
    className={cn(className)}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: !repeat, amount }}
    transition={{ duration: DURATION.slow, ease: EASE.enter, delay }}
  >
    {children}
  </motion.div>
);

/**
 * Sibling group that reveals in sequence. Cheaper than wrapping every row in
 * its own `Reveal`, because the container owns all the timing.
 */
export const RevealGroup: React.FC<{
  children: React.ReactNode;
  /** Seconds between each child's start. */
  gap?: number;
  delay?: number;
  y?: number;
  className?: string;
}> = ({ children, gap = 0.06, delay = 0, y = 16, className }) => (
  <motion.div
    className={cn(className)}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.15 }}
    exit="hidden"
    variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
  >
    {React.Children.map(children, (child) =>
      React.isValidElement(child) ? (
        <motion.div
          variants={{
            hidden: { opacity: 0, y },
            show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.enter } },
          }}
        >
          {child}
        </motion.div>
      ) : (
        child
      )
    )}
  </motion.div>
);
