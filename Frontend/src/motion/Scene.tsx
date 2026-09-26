import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { DURATION, EASE } from "./tokens";
import { item } from "./variants";

/**
 * Page-level scene: the one place a page gets its cinematic entrance.
 *
 * Wrap the page root in `<Scene>` and give its major sections
 * `variants={item}` — they will cascade in on the stagger cadence laid down
 * here, so every page arrives with the same rhythm instead of each component
 * inventing its own fade-up.
 *
 * Deliberately applied at SECTION level, not per element. Animating every row
 * and label is the difference between art direction and animation spam.
 */
export const Scene: React.FC<{
  children: React.ReactNode;
  /** Seconds before the first section starts. */
  delay?: number;
  /** Seconds between sections. */
  gap?: number;
  className?: string;
}> = ({ children, delay = 0.02, gap = 0.07, className }) => (
  <motion.div
    className={cn(className)}
    initial="hidden"
    animate="show"
    exit="exit"
    variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
  >
    {children}
  </motion.div>
);

/** Section inside a `Scene`. Use as the direct child of `Scene`. */
export const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Opt out for a section that should simply be present (dense text blocks). */
  still?: boolean;
}> = ({ children, className, still = false }) => {
  if (still) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
};

/**
 * Standalone entrance for a single focal element — a hero block, a stat, the
 * outcome band. Not part of a `Scene` stagger; it owns its own timing so the
 * focal point can arrive slightly after the page has begun to settle.
 */
export const Focus: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 22, scale: 0.985 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: DURATION.cinematic, ease: EASE.enter, delay }}
  >
    {children}
  </motion.div>
);
