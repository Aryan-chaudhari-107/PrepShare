import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "../lib/cn";
import { DURATION, EASE, PERSPECTIVE, SPRING } from "./tokens";

/**
 * Standard DOM props minus the handlers framer-motion redefines with its own
 * signature (`onDrag*`, `onAnimation*`). Sharing this Omit between `Tilt` and
 * `Card` is what lets `Card` hand its leftover props straight through without
 * a type clash or an `any`.
 */
export type SurfaceProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

/**
 * Pointer-driven perspective card.
 *
 * WHY THIS EXISTS: PrepShare's cards represent documents — an interview
 * experience, a round, a stat. Giving them a physical response to the pointer
 * makes them read as objects you are handling rather than rows in a list.
 *
 * HOW IT STAYS CHEAP:
 *  - rotation/light are framer MotionValues, so pointermove never triggers a
 *    React render — the work happens on the compositor thread;
 *  - the highlight is a fixed radial gradient moved with `x/y` transforms
 *    (GPU-friendly) rather than a background-position that forces repaints;
 *  - it switches itself off entirely on coarse pointers and whenever the user
 *    prefers reduced motion, leaving the card completely static.
 *
 * Deliberately restrained: max rotation defaults to 5°. Past ~8° a card stops
 * feeling like paper and starts feeling like a toy.
 */
export interface TiltProps extends SurfaceProps {
  children: React.ReactNode;
  /** Maximum rotation in degrees. Keep this small. */
  max?: number;
  /** Specular highlight that tracks the pointer across the surface. */
  glare?: boolean;
  /** Hover scale — the "lift toward you" cue. Keep ≤ 1.02. */
  lift?: number;
  className?: string;
}

export const Tilt: React.FC<TiltProps> = ({
  children,
  max = 5,
  glare = true,
  lift = 1.015,
  className,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const [engaged, setEngaged] = useState(false);

  // Hover-capable pointers only: touch users get press states instead, and a
  // tilt that followed a finger would fight scrolling.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);

  const smoothRotateX = useSpring(rotateX, SPRING.inertial);
  const smoothRotateY = useSpring(rotateY, SPRING.inertial);
  const smoothOffsetX = useSpring(offsetX, SPRING.inertial);
  const smoothOffsetY = useSpring(offsetY, SPRING.inertial);

  const enabled = finePointer && !reduce;

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nx = (event.clientX - rect.left) / rect.width; // 0 → 1
      const ny = (event.clientY - rect.top) / rect.height;

      rotateX.set((0.5 - ny) * 2 * max);
      rotateY.set((nx - 0.5) * 2 * max);
      // Highlight offset in px: travels half the surface, so the hotspot
      // sweeps from centre to edge as the pointer approaches an edge.
      offsetX.set((nx - 0.5) * rect.width * 0.5);
      offsetY.set((ny - 0.5) * rect.height * 0.5);
    },
    [max, offsetX, offsetY, rotateX, rotateY]
  );

  const handleLeave = useCallback(() => {
    setEngaged(false);
    rotateX.set(0);
    rotateY.set(0);
    offsetX.set(0);
    offsetY.set(0);
  }, [offsetX, offsetY, rotateX, rotateY]);

  return (
    <motion.div
      ref={ref}
      // Spread first so Tilt's own transform/pointer handlers always win over
      // anything the caller passed through.
      {...rest}
      className={cn("relative", className)}
      style={{
        rotateX: smoothRotateX,
        rotateY: smoothRotateY,
        transformPerspective: PERSPECTIVE,
        transformStyle: "preserve-3d",
      }}
      animate={{ scale: engaged && enabled ? lift : 1 }}
      transition={{ duration: DURATION.base, ease: EASE.standard }}
      onPointerEnter={() => setEngaged(true)}
      onPointerMove={enabled ? handleMove : undefined}
      onPointerLeave={enabled ? handleLeave : undefined}
    >
      {children}

      {glare && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        >
          {/* Masked to the card: the highlight's sweep travels a quarter of
              the surface, and unclipped it painted over the gutter (and
              inflated the page's scroll width). The mask wraps ONLY the
              glare, so the card's own box-shadow still falls freely. */}
          <motion.span
            className="absolute inset-0"
            style={{
              x: smoothOffsetX,
              y: smoothOffsetY,
              background:
                "radial-gradient(58% 58% at 50% 50%, rgb(255 255 255 / 0.34), rgb(255 255 255 / 0) 72%)",
            }}
            initial={false}
            animate={{ opacity: engaged && enabled ? 1 : 0 }}
            transition={{ duration: DURATION.slow, ease: EASE.standard }}
          />
        </span>
      )}
    </motion.div>
  );
};
