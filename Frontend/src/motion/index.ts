/**
 * PrepShare motion system.
 *
 * Import from `../motion` rather than reaching into individual files, so the
 * system can be reorganised without touching every page.
 *
 * Design rules for this codebase:
 *  1. Never hardcode a duration or easing — take it from `tokens`.
 *  2. Calm surfaces stay still. Only focal moments, transitions and direct
 *     manipulation get motion.
 *  3. Pointer-driven effects are MotionValue-based (no per-frame React
 *     renders) and switch off for coarse pointers and reduced motion.
 *  4. Animate transform/opacity. Blur and colour are reserved for one-off
 *     focal moments, never for rows in a long list.
 */
export { DURATION, EASE, SPRING, DEPTH, PERSPECTIVE } from "./tokens";
export type { Bezier } from "./tokens";

export { stagger, item, scene, veil, panel, disclosure, bubble } from "./variants";

export { Tilt } from "./Tilt";
export type { SurfaceProps, TiltProps } from "./Tilt";
export { Magnetic } from "./Magnetic";
export { Reveal, RevealGroup } from "./Reveal";
export { Scene, Section, Focus } from "./Scene";
export { Atmosphere } from "./Atmosphere";
export { ParticleField } from "./ParticleField";
export { SuccessFlash } from "./SuccessFlash";
export type { SuccessKind } from "./SuccessFlash";
export { RouteStage } from "./RouteStage";
export { StateArt } from "./StateArt";
export type { ArtVariant } from "./StateArt";
