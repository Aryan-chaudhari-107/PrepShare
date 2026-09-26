import React, { useEffect, useRef } from "react";
import { useNavigationType } from "react-router-dom";
import type { Location } from "react-router-dom";
import { motion } from "framer-motion";
import { DURATION, EASE } from "./tokens";
import { prefersReducedMotion } from "../lib/motion";
import { pulseEnvironment } from "../lib/environment";
import { StagedLocationContext } from "../lib/stagedLocation";

/** Guards the one-time "no pulse on app load" rule across stage mounts. */
let hasMountedOnce = false;

/**
 * The animated stage every route renders into.
 *
 * Lives INSIDE `AppShell` (see App.tsx), so only the page content moves — the
 * app bar, rail, footer and FAB stay put and keep their state. That separation
 * is what makes navigation read as "the content changed" instead of "the
 * website reloaded".
 *
 * DIRECTION CARRIES MEANING: pushing forward, the outgoing page leaves to the
 * left and the incoming one arrives from the right; going back mirrors it. The
 * travel is deliberately small (28px) — enough to read as spatial movement,
 * not enough to feel like a slideshow. The transition is intentionally short
 * (~0.14s out, ~0.24s in) because a route change is a utility action: making
 * the user wait for choreography would be worse than no choreography at all.
 *
 * Scroll reset happens on MOUNT. Under `AnimatePresence mode="wait"` the new
 * stage only mounts once the old one has finished leaving, so the jump to the
 * top can never be seen mid-transition (which is what a naive `ScrollToTop`
 * listener on `pathname` does).
 *
 * FROZEN LOCATION: the stage hands its own `location` down through
 * `StagedLocationContext`. An exiting stage is still mounted while it leaves,
 * and a live router subscription inside it would flip the outgoing page to
 * the incoming route's content mid-exit — swallowing the exit animation.
 * Because this prop rides on the element itself, the exiting snapshot carries
 * the old location, while same-path updates (query changes) update the prop
 * on the existing stage as usual.
 */
export const RouteStage: React.FC<{ location: Location; children: React.ReactNode }> = ({
  location,
  children,
}) => {
  const navigationType = useNavigationType();
  const forward = navigationType !== "POP";
  // Per-instance guard so the route breath fires exactly once per stage —
  // React StrictMode's development double-invoke of effects would otherwise
  // pulse twice for every navigation.
  const pulsedRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion() ? "auto" : "instant" });
    // Every stage after the very first is a navigation — give the live field
    // one quiet breath through it. The first mount is the app loading, not a
    // route change, so it stays silent.
    if (hasMountedOnce && !pulsedRef.current) pulseEnvironment("route");
    hasMountedOnce = true;
    pulsedRef.current = true;
  }, []);

  // Entering a post is a movement INTO a layer: that stage arrives with a
  // camera push (scale from 0.955) instead of the lateral slide, and a stage
  // that IS a post leaves by passing through the camera (scale to 1.05).
  // Each stage derives this from its OWN (frozen) location, so the outgoing
  // and incoming halves never need to know about each other — and both stay
  // short: a route change is still a utility action.
  const isDetail = location.pathname.startsWith("/posts/");
  const initial = isDetail
    ? { opacity: 0, scale: 0.955 }
    : { opacity: 0, x: forward ? 28 : -28, scale: 0.994 };
  const exit = isDetail
    ? { opacity: 0, scale: 1.05, transition: { duration: DURATION.base, ease: EASE.exit } }
    : {
        opacity: 0,
        x: forward ? -20 : 20,
        scale: 1.004,
        transition: { duration: DURATION.fast, ease: EASE.exit },
      };

  return (
    <StagedLocationContext.Provider value={location}>
      <motion.div
        initial={initial}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={exit}
        transition={{ duration: DURATION.base, ease: EASE.enter }}
      >
        {children}
      </motion.div>
    </StagedLocationContext.Provider>
  );
};
