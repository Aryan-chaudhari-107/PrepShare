/**
 * Read the OS motion preference at call time.
 *
 * A plain function (not a hook) so non-React call sites — imperative
 * `scrollTo`, scroll-into-view on a click handler — can honour it too. It is
 * deliberately read fresh every call: someone can flip the system setting
 * while the tab is open and the next scroll must respect the new value.
 *
 * Components that need to re-render on change should keep using framer's
 * `useReducedMotion()`; this helper is for the moments between renders.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
