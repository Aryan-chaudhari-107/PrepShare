/**
 * Environment signals: how any part of the app tells the live 3D background
 * what is happening, without importing the renderer or threading context.
 *
 * Two channels, both plain DOM events (the same pattern as `lib/events.ts`):
 *
 *  1. SCENE — a persistent mood the field eases TOWARD over ~0.5s.
 *     Owned by exactly one component (AppShell derives it from route +
 *     auth-modal state), so scenes can never fight each other: last write
 *     wins, and AppShell always writes the correct one.
 *
 *  2. PULSE — a one-shot impulse at a point (the pointer position that
 *     opened a post, the viewport centre for auth). Pulses are consumed by
 *     the particle field immediately; nothing is stored.
 *
 * The renderer (`motion/ParticleField`) subscribes to both; every other
 * module only publishes. A failed delivery (no listener yet mounted) is a
 * no-op — pulses are decoration, never state.
 */

export type EnvironmentScene = "default" | "auth" | "post";

export type EnvironmentPulseKind =
  /** a post card was opened — ripple from the pointer */
  | "post-open"
  /** sign-in succeeded — strong outward burst */
  | "login-success"
  /** account created — inward assemble (the mirror of login) */
  | "signup-success"
  /** route changed — a quiet breath through the field */
  | "route";

export interface EnvironmentPulse {
  kind: EnvironmentPulseKind;
  /** Viewport/client coordinates of the impulse. Defaults to centre. */
  x?: number;
  y?: number;
}

const SCENE_EVENT = "prepshare:environment-scene";
const PULSE_EVENT = "prepshare:environment-pulse";

/** Publish the new scene. Safe to call on every render — identical values
 *  are deduplicated so a route re-render never re-dispatches. */
export const setEnvironmentScene = (scene: EnvironmentScene): void => {
  if (lastScene === scene) return;
  lastScene = scene;
  window.dispatchEvent(new CustomEvent<EnvironmentScene>(SCENE_EVENT, { detail: scene }));
};
let lastScene: EnvironmentScene | null = null;

/** The scene currently published (or "default" before the first write) —
 *  lets a freshly mounted field start in sync instead of waiting for a
 *  change event that may never come. */
export const getEnvironmentScene = (): EnvironmentScene => lastScene ?? "default";

/** Fire a one-shot impulse into the field. */
export const pulseEnvironment = (
  kind: EnvironmentPulseKind,
  point?: { x?: number; y?: number }
): void => {
  window.dispatchEvent(
    new CustomEvent<EnvironmentPulse>(PULSE_EVENT, {
      detail: { kind, x: point?.x, y: point?.y },
    })
  );
};

/** Subscribe to scene changes. Returns its own unsubscribe — return it
 *  straight from a `useEffect`. */
export const onEnvironmentScene = (
  handler: (scene: EnvironmentScene) => void
): (() => void) => {
  const listener = (event: Event) => handler((event as CustomEvent<EnvironmentScene>).detail);
  window.addEventListener(SCENE_EVENT, listener);
  return () => window.removeEventListener(SCENE_EVENT, listener);
};

/** Subscribe to one-shot pulses. Returns its own unsubscribe. */
export const onEnvironmentPulse = (
  handler: (pulse: EnvironmentPulse) => void
): (() => void) => {
  const listener = (event: Event) => handler((event as CustomEvent<EnvironmentPulse>).detail);
  window.addEventListener(PULSE_EVENT, listener);
  return () => window.removeEventListener(PULSE_EVENT, listener);
};
