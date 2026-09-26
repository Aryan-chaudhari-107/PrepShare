import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "../lib/cn";
import { DURATION, EASE, SPRING } from "./tokens";

/**
 * Magnetic hover — the control leans a fraction of the way toward the cursor,
 * so pressing it feels like closing a small gap rather than poking a rectangle.
 *
 * Scope matters: magnetic motion only makes sense on a small number of
 * deliberate focal controls (a hero CTA, the messages button, a logo). Applied
 * to every button it becomes noise and breaks the rhythm of dense UI, so this
 * is opt-in and used sparingly by design.
 *
 * Like `Tilt`, the movement runs entirely on MotionValues — no renders per
 * pointer event — and it disables itself for reduced motion and touch.
 */
interface MagneticProps {
  children: React.ReactNode;
  /** How far it leans toward the pointer, as a fraction of the offset. */
  strength?: number;
  className?: string;
}

export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.3, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, SPRING.snappy);
  const smoothY = useSpring(y, SPRING.snappy);

  const enabled = finePointer && !reduce;

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
      y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
    },
    [strength, x, y]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: smoothX, y: smoothY }}
      onPointerMove={enabled ? handleMove : undefined}
      onPointerLeave={enabled ? handleLeave : undefined}
      whileTap={enabled ? { scale: 0.96, transition: { duration: DURATION.instant, ease: EASE.emphasized } } : undefined}
    >
      {children}
    </motion.span>
  );
};
