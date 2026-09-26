import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { DURATION, SPRING } from "./tokens";
import { ParticleField } from "./ParticleField";

/**
 * Global atmosphere: fine film grain, two slow ambient light fields that
 * drift across the canvas, the live 3D particle field, a readability scrim,
 * and one very soft light that tracks the pointer.
 *
 * WHY: the canvas was a single flat colour, which is a large part of why every
 * screen read as "generic dashboard". The drift fields keep the base alive
 * without any input — long 46s/61s offset loops that read as weather rather
 * than objects — while the single tracked light keeps its directional,
 * authored role: a light has an origin, which is what makes the layer read
 * as art direction instead of garnish. Between them sits `ParticleField`:
 * the environment layer proper (perspective-projected particles, a
 * constellation, wireframe solids, orbital rings) that reacts to scenes and
 * pulses from the app (lib/environment.ts). The scrim sits between the art
 * and the page so every wash and particle stays low-contrast and text always
 * lands on a calm field.
 *
 * COST: fixed, `pointer-events-none`, `-z-10`. The drift is pure CSS
 * keyframes animating transform alone — compositor-only, no repaint, no JS —
 * and the tracked light is a single element moved with transforms (compositor
 * only, no repaint) driven by MotionValues, so the window-level pointer
 * listener never causes a React render. Grain and scrim are static: one
 * paint, no loop. The particle field owns exactly one rAF loop and never
 * writes React state while running (see ParticleField.tsx for the full
 * budget).
 *
 * REDUCED MOTION / TOUCH: the light switches off entirely, the global
 * prefers-reduced-motion rule in index.css collapses each drift loop to its
 * resting frame, and ParticleField draws a single static frame — only the
 * static grain remains, with zero movement.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const Atmosphere: React.FC = () => {
  const reduce = useReducedMotion();
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setTracked(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, SPRING.inertial);
  const smoothY = useSpring(y, SPRING.inertial);

  const enabled = tracked && !reduce;

  useEffect(() => {
    if (!enabled) return;
    const handleMove = (event: PointerEvent) => {
      x.set(event.clientX - window.innerWidth / 2);
      y.set(event.clientY - window.innerHeight / 2);
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [enabled, x, y]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Grain: gives every surface tooth so flat colour stops reading as plastic. */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{ backgroundImage: GRAIN, backgroundRepeat: "repeat" }}
      />

      {/* Ambient drift — two soft light fields crossing on long, offset
          loops (46s / 61s, transform-only: compositor, no repaint, no JS).
          The global prefers-reduced-motion rule in index.css collapses each
          loop to its resting frame for reduced-motion users. */}
      <div
        className="absolute -left-[18%] top-[-22%] h-[65vmax] w-[65vmax] animate-atmosphere-a"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--primary) / 0.09), rgb(var(--primary) / 0) 72%)",
        }}
      />
      <div
        className="absolute -right-[16%] bottom-[-24%] h-[58vmax] w-[58vmax] animate-atmosphere-b"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--accent) / 0.08), rgb(var(--accent) / 0) 70%)",
        }}
      />

      {/* Perspective floor — the spatial-depth cue from the immersive
          language: a receding grid at the base of the world, masked to a
          whisper so it reads as distance, never as content. Static: one
          paint, no animation, no JS. */}
      <div
        className="absolute inset-x-0 bottom-[-8%] h-[36%] opacity-[0.10] dark:opacity-[0.14]"
        style={{
          background:
            "linear-gradient(rgb(var(--primary) / 0.55) 1px, transparent 1px) 0 0 / 100% 46px," +
            " linear-gradient(90deg, rgb(var(--primary) / 0.45) 1px, transparent 1px) 0 0 / 64px 100%",
          transform: "perspective(560px) rotateX(63deg)",
          transformOrigin: "50% 100%",
          WebkitMaskImage: "linear-gradient(transparent, #000 65%)",
          maskImage: "linear-gradient(transparent, #000 65%)",
        }}
      />

      {/* The living layer: perspective particles + constellation + wireframes.
          Above the orbs (they light it), below the scrim (text wins). */}
      <ParticleField />

      {/* Readability scrim — a canvas wash above the art so page text keeps
          a calm, low-contrast field beneath it; stronger at the top/bottom
          where the chrome and footer sit, lightest through the middle. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(var(--canvas) / 0.32) 0%, rgb(var(--canvas) / 0.10) 45%, rgb(var(--canvas) / 0.42) 100%)",
        }}
      />

      {/* The light. `inset-0 m-auto` centres it without Tailwind translate
          classes, which framer's inline transform would otherwise override. */}
      <motion.div
        className="absolute inset-0 m-auto h-[130vmax] w-[130vmax]"
        initial={false}
        animate={{ opacity: enabled ? 1 : 0 }}
        transition={{ duration: DURATION.cinematic }}
        style={{
          x: smoothX,
          y: smoothY,
          background:
            "radial-gradient(closest-side, rgb(var(--primary) / 0.10), rgb(var(--primary) / 0) 70%)",
        }}
      />
    </div>
  );
};
