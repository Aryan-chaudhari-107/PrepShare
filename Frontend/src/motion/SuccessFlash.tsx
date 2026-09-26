import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DURATION, EASE } from "./tokens";
import { pulseEnvironment } from "../lib/environment";

/**
 * One-shot success ceremony after authentication.
 *
 * Two DIFFERENT visual languages, because signup and sign-in are different
 * moments and identical animations read as template filler:
 *
 *  - login    → ACCESS GRANTED: two rings and a light wave expand outward
 *               from the centre (entering the environment), while the
 *               particle field receives a matching outward burst;
 *  - signup   → IDENTITY VERIFIED: orbital rings assemble around the centre
 *               with sparks orbiting at different speeds and a diamond frame
 *               snapping into place, while the field pulls particles INWARD
 *               (assembly, the mirror of login).
 *
 * Both are decorative (`aria-hidden`): the toast already announces success to
 * assistive tech, and the whole thing is `pointer-events-none`, so it can
 * never block the page it plays over.
 *
 * LIFECYCLE: the parent owns `kind` state; this component fires its pulse
 * exactly once on mount and calls `onDone` after its window (1.15s / 1.35s,
 * shortened under reduced motion) so the parent can unmount it. Under
 * `MotionConfig reducedMotion="user"` all transform animation collapses and
 * only opacity fades remain — a calm blink instead of a ceremony.
 */
export type SuccessKind = "login" | "signup";

const WINDOW_MS: Record<SuccessKind, number> = {
  login: 1150,
  signup: 1350,
};

interface SuccessFlashProps {
  kind: SuccessKind;
  onDone: () => void;
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.span
    className="relative font-mono text-[11px] font-semibold uppercase tracking-[0.42em] text-primary"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -8] }}
    transition={{ duration: 1.15, times: [0, 0.22, 0.68, 1], ease: "easeOut" }}
  >
    {children}
  </motion.span>
);

export const SuccessFlash: React.FC<SuccessFlashProps> = ({ kind, onDone }) => {
  const reduce = useReducedMotion();

  // `onDone` is an inline closure in the parent — hold it in a ref so the
  // effect below runs exactly once per flash, never once per re-render.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      pulseEnvironment(kind === "login" ? "login-success" : "signup-success");
    }
    const timer = window.setTimeout(() => doneRef.current(), reduce ? 520 : WINDOW_MS[kind]);
    return () => window.clearTimeout(timer);
  }, [kind, reduce]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[75] flex items-center justify-center overflow-hidden"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE.exit } }}
    >
      {kind === "login" ? (
        <>
          {/* Light wave — the environment parting. */}
          <motion.div
            className="absolute inset-0 m-auto h-[220px] w-[220px] rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgb(var(--primary) / 0.3), rgb(var(--primary) / 0) 72%)",
            }}
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 1.05, ease: EASE.exit }}
          />
          {/* Portal rings — a delayed twin so it reads as a portal, not a ripple. */}
          <motion.div
            className="absolute inset-0 m-auto h-[150px] w-[150px] rounded-full border-2 border-primary/70"
            initial={{ scale: 0.35, opacity: 1 }}
            animate={{ scale: 3.7, opacity: 0 }}
            transition={{ duration: 0.95, ease: EASE.standard }}
          />
          <motion.div
            className="absolute inset-0 m-auto h-[150px] w-[150px] rounded-full border border-accent/70"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 4.6, opacity: 0 }}
            transition={{ duration: 1.1, ease: EASE.standard, delay: 0.12 }}
          />
          <Label>Access granted</Label>
        </>
      ) : (
        <>
          {/* Soft field pulse. */}
          <motion.div
            className="absolute inset-0 m-auto h-[240px] w-[240px] rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgb(var(--accent) / 0.26), rgb(var(--accent) / 0) 70%)",
            }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 2.3, 2.1], opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.2, times: [0, 0.55, 1], ease: "easeOut" }}
          />

          {/* Three orbital rings assembling — staggered entry, then slow
              counter-rotation at different periods so they never phase-lock. */}
          {[
            { size: 128, border: "border-primary/60", spin: 360, period: 3.2 },
            { size: 188, border: "border-accent/50", spin: -360, period: 4.4 },
            { size: 248, border: "border-primary/35", spin: 360, period: 6.0 },
          ].map((ring, index) => (
            <motion.div
              key={ring.size}
              className={`absolute inset-0 m-auto rounded-full border ${ring.border}`}
              style={{ width: ring.size, height: ring.size }}
              initial={{ scale: 0.55, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: ring.spin }}
              transition={{
                scale: { duration: 0.55, ease: EASE.emphasized, delay: index * 0.09 },
                opacity: { duration: 0.4, delay: index * 0.09 },
                rotate: { duration: ring.period, ease: "linear", repeat: Infinity },
              }}
            />
          ))}

          {/* Sparks orbiting on the three tracks — different speeds and
              directions so the assembly feels mechanical, not decorative. */}
          {Array.from({ length: 6 }, (_, i) => {
            const radius = [64, 94, 124][i % 3];
            const dir = i % 2 === 0 ? 1 : -1;
            return (
              <motion.span
                key={i}
                className="absolute inset-0 m-auto block"
                style={{ width: radius * 2, height: radius * 2 }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: dir * 360 }}
                transition={{
                  scale: { duration: 0.5, ease: EASE.emphasized, delay: 0.15 + i * 0.05 },
                  opacity: { duration: 0.35, delay: 0.15 + i * 0.05 },
                  rotate: { duration: 3.4 + (i % 3) * 1.3, ease: "linear", repeat: Infinity },
                }}
              >
                <span
                  className={`absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    i % 2 === 0 ? "bg-primary" : "bg-accent"
                  }`}
                />
              </motion.span>
            );
          })}

          {/* The frame that snaps shut at the centre. */}
          <motion.div
            className="absolute inset-0 m-auto h-14 w-14 border border-accent/70 bg-accent-soft/40"
            style={{ borderRadius: 14, rotate: 45 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.18, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.7, times: [0, 0.6, 1], ease: EASE.emphasized, delay: 0.2 }}
          />

          <Label>Identity verified</Label>
        </>
      )}
    </motion.div>
  );
};
