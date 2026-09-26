import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  getEnvironmentScene,
  onEnvironmentPulse,
  onEnvironmentScene,
  type EnvironmentPulse,
  type EnvironmentScene,
} from "../lib/environment";
import { prefersReducedMotion } from "../lib/motion";

/**
 * The live 3D environment behind the entire application.
 *
 * WHAT IT IS: a real (if lightweight) 3D field — every particle owns an
 * (x, y, z) position and is drawn through a perspective projection, so depth
 * is geometry, not a parallax trick. Around that: a constellation of nodes
 * joined by thin lines, two slowly tumbling wireframe solids, two tilted
 * orbital rings, and pre-rendered glow sprites. It is mounted exactly once
 * (inside `Atmosphere`, under the readability scrim) and never intersects
 * the UI: `fixed` canvas, `pointer-events: none`, `aria-hidden`.
 *
 * WHY CANVAS 2D AND NOT WEBGL: the whole system is ~140 drawImage calls per
 * frame. Canvas 2D gets there with zero shader code, zero context-loss
 * failure modes and a much smaller bundle — the premium feel here comes from
 * choreography (scenes, pulses, parallax), not from triangle count.
 *
 * SCENES + PULSES (see lib/environment.ts):
 *  - the field eases between moods (default / auth / post) over ~0.5s, so a
 *    route or modal change *animates* the environment rather than swapping it;
 *  - one-shot pulses kick particles outward (post opened, login succeeded) or
 *    inward (signup — particles assemble), each with an expanding/contracting
 *    ring drawn at the impulse point.
 *
 * COST DISCIPLINE:
 *  - ONE requestAnimationFrame loop, cancelled on unmount / tab-hide;
 *  - all mutable state lives in this effect's closure — no React state is
 *    written per frame, so rendering never re-renders from motion;
 *  - glow sprites and gradients are baked ONCE per theme change, never per frame;
 *  - particle count adapts to viewport area, coarse pointers and low-end
 *    devices (≤4 cores / ≤4GB), DPR capped at 1.75;
 *  - `prefers-reduced-motion` draws a single static frame (redrawn only on
 *    resize / theme / scene change) — zero ongoing cost;
 *  - frame delta is clamped so a background tab never causes a jump.
 *
 * ACCESSIBILITY: decorative by construction — screen readers never see it,
 * clicks pass through it, and the OS motion preference freezes it entirely.
 */

/** Per-theme drawing recipe. Alpha is the delicate knob: the scrim above the
 *  canvas already washes everything toward the page colour. */
interface FieldTheme {
  /** Composite mode — additive glow on dark, ink-like on light. */
  composite: GlobalCompositeOperation;
  particleAlpha: number;
  lineAlpha: number;
  ringAlpha: number;
  wireAlpha: number;
  orbitAlpha: number;
  /** Glow sprite built with a white-hot core (dark) or a pure tint (light). */
  hotCore: boolean;
}

const THEME: Record<"light" | "dark", FieldTheme> = {
  dark: {
    composite: "lighter",
    particleAlpha: 0.78,
    lineAlpha: 0.13,
    ringAlpha: 0.55,
    wireAlpha: 0.2,
    orbitAlpha: 0.07,
    hotCore: true,
  },
  light: {
    composite: "source-over",
    particleAlpha: 0.5,
    lineAlpha: 0.1,
    ringAlpha: 0.34,
    wireAlpha: 0.17,
    orbitAlpha: 0.055,
    hotCore: false,
  },
};

/** Scene targets. The field lerps toward these every frame — never snaps. */
interface SceneParams {
  /** global drift multiplier */
  speed: number;
  /** constellation + orbit-ring opacity multiplier */
  lines: number;
  /** sprite/brightness multiplier */
  glow: number;
  /** centre attraction strength (auth focus) */
  focus: number;
  /** dolly-in amount — a small z-push so opening a post feels deeper */
  push: number;
}

const SCENES: Record<EnvironmentScene, SceneParams> = {
  // The everyday world: full constellation, cinematic idle drift.
  default: { speed: 1, lines: 1, glow: 1, focus: 0, push: 0 },
  // Authentication: the field quiets and slowly orbits AROUND the dialog —
  // a focused composition behind the form instead of a competing one.
  auth: { speed: 0.55, lines: 0.35, glow: 1.25, focus: 1, push: 0.06 },
  // A post is open: depth increases, the network brightens, motion lifts —
  // the environment reacts to the layer you entered.
  post: { speed: 1.18, lines: 1.3, glow: 1.22, focus: 0, push: 0.1 },
};

interface Particle {
  x: number;
  y: number;
  z: number; // 0 = near, 1 = far
  /** persistent base drift (normalised units / second) */
  bx: number;
  by: number;
  bz: number;
  /** decaying impulse from pulses */
  ix: number;
  iy: number;
  size: number;
  tint: 0 | 1; // 0 = primary, 1 = accent
  phase: number;
  twinkle: number;
}

interface Pulse {
  x: number;
  y: number;
  born: number;
  life: number;
  strength: number; // + outward, − inward
  tint: 0 | 1;
  ring: boolean;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Adaptive quality: area-based count, halved-ish for touch, trimmed again
 *  for low-end hardware; DPR capped so retina phones don't pay 4×. */
function readQuality() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const lowEnd =
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;

  let count = Math.round((w * h) / 16000); // ~1440p ≈ 150
  if (coarse) count *= 0.5;
  if (lowEnd) count *= 0.7;
  count = Math.max(34, Math.min(count, 150));

  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
  return { count, dpr };
}

/** Bake a radial glow sprite. Called once per theme, never per frame. */
function makeSprite(rgb: [number, number, number], hotCore: boolean): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const [r, g, b] = rgb;
  if (hotCore) {
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.18, `rgba(${r},${g},${b},0.85)`);
  } else {
    grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
    grad.addColorStop(0.2, `rgba(${r},${g},${b},0.7)`);
  }
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

/** Wireframe solids — vertices + edge pairs, tiny but they give the field
 *  "objects" rather than only points. */
const TETRA: { v: [number, number, number][]; e: [number, number][] } = {
  v: [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ],
  e: [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3],
  ],
};

const OCTA: { v: [number, number, number][]; e: [number, number][] } = {
  v: [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ],
  e: [
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 4],
    [2, 5],
    [3, 4],
    [3, 5],
  ],
};

export const ParticleField: React.FC = () => {
  const { resolved } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Re-init only when the theme changes (sprites + composite are per theme).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const cfg = THEME[resolved];
    const { count, dpr } = readQuality();
    const isDark = resolved === "dark";
    const tintRGB: [number, number, number][] = isDark
      ? [[116, 174, 140], [126, 168, 213]] // primary, accent — brightened for additive
      : [[63, 111, 82], [63, 111, 158]];
    const sprites = [makeSprite(tintRGB[0], cfg.hotCore), makeSprite(tintRGB[1], cfg.hotCore)];
    const tintCss = (t: 0 | 1, alpha: number) => {
      const [r, g, b] = tintRGB[t];
      return `rgba(${r},${g},${b},${alpha})`;
    };

    // ── Particles ────────────────────────────────────────────────────────
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(-1.2, 1.2),
        y: rand(-1.2, 1.2),
        z: Math.random(),
        bx: rand(-0.013, 0.013),
        by: rand(-0.013, 0.013),
        bz: rand(0.003, 0.012),
        ix: 0,
        iy: 0,
        size: rand(0.55, 1.9) * (Math.random() < 0.07 ? 2.1 : 1),
        tint: Math.random() < 0.62 ? 0 : 1,
        phase: Math.random() * Math.PI * 2,
        twinkle: rand(0.35, 1.05),
      });
    }
    // Constellation nodes: every 3rd particle, index list built once.
    const nodeIdx: number[] = [];
    for (let i = 0; i < count; i += 3) nodeIdx.push(i);
    // Scratch buffers hoisted OUT of the frame loop — zero per-frame allocation.
    const projected = new Float32Array(count * 4); // sx, sy, persp, alpha

    const pulses: Pulse[] = [];

    // ── Scene / energy state (all refs-in-closure, no React state) ───────
    let scene = getEnvironmentScene();
    const params: SceneParams = { ...SCENES[scene] };
    let energy = 0; // transient speed/brightness boost after a big pulse

    const unsubscribeScene = onEnvironmentScene((next) => {
      scene = next;
      if (reduced) {
        Object.assign(params, SCENES[next]);
        draw(0);
      }
    });
    const unsubscribePulse = onEnvironmentPulse((pulse: EnvironmentPulse) => {
      const strength =
        pulse.kind === "login-success"
          ? 2.4
          : pulse.kind === "signup-success"
            ? -1.7
            : pulse.kind === "post-open"
              ? 1.1
              : 0.35;
      // In static (reduced-motion) mode there is no clock running, so the
      // ring is pinned to a fixed early age and simply drawn once.
      const born = reduced ? -0.1 : performance.now() / 1000;
      pulses.push({
        x: pulse.x ?? window.innerWidth / 2,
        y: pulse.y ?? window.innerHeight / 2,
        born,
        life: pulse.kind === "login-success" ? 1.5 : 1.15,
        strength,
        tint: pulse.kind === "signup-success" || pulse.kind === "post-open" ? 1 : 0,
        ring: true,
      });
      if (pulses.length > 6) pulses.shift();
      if (pulse.kind === "login-success") energy = 1;
      if (reduced) draw(0); // static mode: one redraw so the ring is visible
    });

    // ── Sizing ───────────────────────────────────────────────────────────
    let width = 0;
    let height = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(0);
    };

    // ── Pointer parallax (fine pointers only — touch keeps idle drift) ───
    let mouseNX = 0;
    let mouseNY = 0;
    let hasMouse = false;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onPointerMove = (event: PointerEvent) => {
      mouseNX = event.clientX / window.innerWidth - 0.5;
      mouseNY = event.clientY / window.innerHeight - 0.5;
      hasMouse = true;
    };
    if (finePointer && !reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    // ── Camera (smoothed; idle drift when no pointer) ────────────────────
    let camX = 0;
    let camY = 0;

    // ── The frame ────────────────────────────────────────────────────────
    const draw = (t: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const theme = cfg;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = theme.composite;

      const push = 1 + params.push;
      const glowMul = theme.particleAlpha * params.glow * (1 + energy * 0.55);
      const parallax = reduced ? 0 : 1;

      // Project once per particle; offsets for pulses are computed in
      // normalised space (matching the particle world).
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        const persp = 1 / (1 + p.z * 2.4);
        const scale = push * persp;
        const offX = camX * (1 - p.z) * 0.05 * parallax;
        const offY = camY * (1 - p.z) * 0.05 * parallax;
        const sx = cx + (p.x + offX) * cx * scale;
        const sy = cy + (p.y + offY) * cy * scale;
        const tw = 0.68 + 0.32 * Math.sin(t * p.twinkle * 1.7 + p.phase);
        const alpha = Math.min(1, glowMul * tw * (0.45 + persp * 0.55));
        const j = i * 4;
        projected[j] = sx;
        projected[j + 1] = sy;
        projected[j + 2] = persp;
        projected[j + 3] = alpha;
      }

      // Particles (glow sprites).
      for (let i = 0; i < count; i++) {
        const j = i * 4;
        const p = particles[i];
        const r = p.size * projected[j + 2] * 4.5 + 1.2;
        ctx.globalAlpha = projected[j + 3];
        ctx.drawImage(sprites[p.tint], projected[j] - r, projected[j + 1] - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // Constellation lines — one batched path, one stroke.
      if (theme.lineAlpha * params.lines > 0.01) {
        const maxDist = Math.min(130, Math.max(90, Math.min(width, height) * 0.13));
        const maxDist2 = maxDist * maxDist;
        ctx.strokeStyle = tintCss(0, theme.lineAlpha * params.lines);
        ctx.lineWidth = 1;
        ctx.beginPath();
        let drawn = 0;
        outer: for (let a = 0; a < nodeIdx.length; a++) {
          const ia = nodeIdx[a] * 4;
          for (let b = a + 1; b < nodeIdx.length; b++) {
            const ib = nodeIdx[b] * 4;
            const dx = projected[ia] - projected[ib];
            const dy = projected[ia + 1] - projected[ib + 1];
            const d2 = dx * dx + dy * dy;
            if (d2 < maxDist2) {
              ctx.moveTo(projected[ia], projected[ia + 1]);
              ctx.lineTo(projected[ib], projected[ib + 1]);
              if (++drawn > 170) break outer; // hard budget per frame
            }
          }
        }
        ctx.stroke();
      }

      // Wireframe solids — slow tumble, depth-projected.
      const drawWire = (
        solid: { v: [number, number, number][]; e: [number, number][] },
        nx: number,
        ny: number,
        z: number,
        size: number,
        tint: 0 | 1,
        yaw: number,
        pitch: number
      ) => {
        const persp = 1 / (1 + z * 2.4);
        const scale = push * persp;
        const ox = cx + (nx + camX * (1 - z) * 0.05 * parallax) * cx * scale;
        const oy = cy + (ny + camY * (1 - z) * 0.05 * parallax) * cy * scale;
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);
        const pts: [number, number][] = solid.v.map(([vx, vy, vz]) => {
          // yaw around Y, then pitch around X
          const x1 = vx * cosY + vz * sinY;
          const z1 = -vx * sinY + vz * cosY;
          const y2 = vy * cosP - z1 * sinP;
          const z2 = vy * sinP + z1 * cosP;
          const perspV = 1 / (1 + (z + (z2 * 0.06)) * 2.4);
          const s = size * perspV * scale;
          return [ox + x1 * s, oy + y2 * s];
        });
        ctx.strokeStyle = tintCss(tint, theme.wireAlpha * params.lines);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [a, b] of solid.e) {
          ctx.moveTo(pts[a][0], pts[a][1]);
          ctx.lineTo(pts[b][0], pts[b][1]);
        }
        ctx.stroke();
      };

      drawWire(TETRA, -0.58, -0.34, 0.55, Math.min(width, height) * 0.16, 0, t * 0.1, Math.sin(t * 0.07) * 0.5);
      drawWire(OCTA, 0.56, 0.4, 0.4, Math.min(width, height) * 0.14, 1, -t * 0.08, Math.cos(t * 0.06) * 0.6);

      // Orbital rings — tilted ellipses, counter-rotating.
      if (theme.orbitAlpha * params.lines > 0.01) {
        const base = Math.min(width, height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = tintCss(0, theme.orbitAlpha * params.lines);
        ctx.beginPath();
        ctx.ellipse(cx, cy, base * 0.44, base * 0.17, t * 0.03, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = tintCss(1, theme.orbitAlpha * params.lines * 0.8);
        ctx.beginPath();
        ctx.ellipse(cx, cy, base * 0.6, base * 0.23, -0.6 - t * 0.02, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Pulses — expanding (or contracting for signup) rings at the impulse.
      for (const pulse of pulses) {
        const age = t - pulse.born;
        if (age < 0 || age > pulse.life) continue;
        const k = age / pulse.life;
        const eased = 1 - Math.pow(1 - k, 3);
        const maxR = Math.max(width, height) * 0.55;
        const r =
          (pulse.strength >= 0 ? eased * maxR : (1 - eased) * maxR) *
          (pulse.strength > 2 ? 1.15 : 1);
        const alpha = Math.pow(1 - k, 1.6) * theme.ringAlpha;
        ctx.strokeStyle = tintCss(pulse.tint, alpha);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.stroke();
        if (pulse.strength > 2) {
          // Login gets a delayed second ring — a portal, not a single ripple.
          const k2 = Math.max(0, k - 0.22) / 0.78;
          const r2 = (1 - Math.pow(1 - k2, 3)) * maxR * 0.72;
          ctx.strokeStyle = tintCss(1, Math.pow(1 - k2, 1.6) * theme.ringAlpha * 0.7);
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, Math.max(1, r2), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    // ── Simulation step (skipped entirely in static mode) ────────────────
    const step = (dt: number, t: number) => {
      // Ease scene params toward their target — this IS the scene
      // transition (≈0.5s), so nothing ever snaps.
      const k = 1 - Math.exp(-dt * 2.4);
      const target = SCENES[scene];
      params.speed += (target.speed - params.speed) * k;
      params.lines += (target.lines - params.lines) * k;
      params.glow += (target.glow - params.glow) * k;
      params.focus += (target.focus - params.focus) * k;
      params.push += (target.push - params.push) * k;
      energy *= Math.exp(-dt * 1.6);

      // Camera: pointer if available, otherwise a slow idle figure-eight.
      const targetX = hasMouse ? mouseNX * 2 : Math.sin(t * 0.06) * 0.022;
      const targetY = hasMouse ? mouseNY * 2 : Math.cos(t * 0.047) * 0.017;
      const ck = 1 - Math.exp(-dt * 3);
      camX += (targetX - camX) * ck;
      camY += (targetY - camY) * ck;

      const speed = params.speed * (1 + energy * 0.9);
      for (const p of particles) {
        p.x += (p.bx * speed + p.ix) * dt;
        p.y += (p.by * speed + p.iy) * dt;
        p.z = (p.z + p.bz * speed * 0.5 * dt) % 1;
        p.ix *= Math.exp(-dt * 2.1);
        p.iy *= Math.exp(-dt * 2.1);

        // Auth focus: a slow tangential orbit plus a gentle pull toward a
        // ring around the dialog — a composition, not a vortex.
        if (params.focus > 0.01) {
          const r = Math.hypot(p.x, p.y) + 1e-4;
          const tx = -p.y / r;
          const ty = p.x / r;
          const pull = 0.5 - r;
          p.x += (tx * 0.1 + (p.x / r) * pull * 0.35) * params.focus * dt;
          p.y += (ty * 0.1 + (p.y / r) * pull * 0.35) * params.focus * dt;
        }

        // Wrap — particles recycle to the far side, density stays constant.
        if (p.x > 1.25) p.x = -1.25;
        else if (p.x < -1.25) p.x = 1.25;
        if (p.y > 1.25) p.y = -1.25;
        else if (p.y < -1.25) p.y = 1.25;
      }

      // Pulses push particles away from (or toward) their origin — depth
      // scales the kick, so near particles react most.
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        if (t - pulse.born > pulse.life) {
          pulses.splice(i, 1);
          continue;
        }
        const nx = (pulse.x - window.innerWidth / 2) / (window.innerWidth / 2);
        const ny = (pulse.y - window.innerHeight / 2) / (window.innerHeight / 2);
        const age = t - pulse.born;
        if (age > 0.35) continue; // impulse lands in the first beat only
        const R = 1.1;
        for (const p of particles) {
          const dx = p.x - nx;
          const dy = p.y - ny;
          const d = Math.hypot(dx, dy);
          if (d < 0.03 || d > R) continue;
          const fall = Math.pow(1 - d / R, 2) * pulse.strength * 0.55 * (1 - p.z * 0.7);
          p.ix += (dx / d) * fall;
          p.iy += (dy / d) * fall;
        }
      }
    };

    // ── Loop ─────────────────────────────────────────────────────────────
    let raf = 0;
    let last = 0;
    const frame = (ms: number) => {
      const t = ms / 1000;
      const dt = last ? Math.min(0.05, t - last) : 0.016;
      last = t;
      step(dt, t);
      draw(t);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    // ── Static (reduced-motion) mode: one frame, redrawn on demand ───────
    const resizeOrRedraw = () => {
      resize();
      if (!reduced) start();
    };
    resize();
    if (reduced) {
      draw(0);
    } else {
      document.addEventListener("visibilitychange", onVisibility);
      start();
    }
    window.addEventListener("resize", resizeOrRedraw);

    return () => {
      stop();
      window.removeEventListener("resize", resizeOrRedraw);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeScene();
      unsubscribePulse();
    };
  }, [resolved]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 block h-full w-full"
    />
  );
};
