import { createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";

/**
 * The location a route stage was CREATED with.
 *
 * Route transitions keep the outgoing page mounted while it animates away
 * (see `RouteStage`). During that window the router's live location has
 * already changed, so a `useLocation()` inside the leaving subtree would
 * re-render with the INCOMING route's location — swapping the old page for
 * the new route's content (or its Suspense fallback) before its exit
 * animation could ever play. Stages therefore publish their own stable
 * location, and everything they render reads it from here.
 *
 * Same-path updates (a query-param change on the feed, say) keep the stage's
 * key, so React updates the prop on the existing stage — the value tracks
 * normally while the page is current, and freezes only once the page starts
 * leaving (an exiting subtree is rendered from a snapshot of the old element,
 * props included).
 *
 * App chrome (top bar, rail, footer) lives OUTSIDE the stage and keeps its
 * live `useLocation()` on purpose — nav highlighting must flip instantly.
 * For anything outside a stage the fallback below is exactly that live value.
 */
export const StagedLocationContext = createContext<Location | null>(null);

/** The location for anything rendered inside a `RouteStage`. */
export const useStagedLocation = (): Location => {
  const staged = useContext(StagedLocationContext);
  const live = useLocation();
  return staged ?? live;
};
