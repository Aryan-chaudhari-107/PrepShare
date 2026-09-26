import React from "react";
import { ErrorState, Loading } from "../ui";

/**
 * Code-split route boundary — it owns both moments a lazily-loaded page can
 * be in:
 *
 *  - SUSPENSE while the page's chunk arrives: the shell (app bar, rail,
 *    footer) stays mounted and the page area shows the app's normal
 *    content-shaped loading scene, so a first visit to a route reads as
 *    "developing", not "broken".
 *  - ERROR if the chunk never arrives (dropped connection, stale deploy):
 *    the designed error state with a retry action instead of a white screen.
 *
 * `AppShell` keys `RouteStage` by pathname, so this subtree remounts per
 * route: a failure on one page never poisons the next navigation, and the
 * boundary needs no reset plumbing of its own.
 */
export const RouteBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChunkErrorBoundary>
    <React.Suspense fallback={<RouteLoading />}>{children}</React.Suspense>
  </ChunkErrorBoundary>
);

/** Centered in the page column — exactly where the content will appear. */
const RouteLoading: React.FC = () => (
  <div className="flex min-h-[55vh] items-center justify-center">
    <Loading label="Loading page…" />
  </div>
);

interface BoundaryState {
  failed: boolean;
}

class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-[55vh] items-center justify-center px-4">
        <ErrorState
          title="This page didn't load"
          description="The connection dropped while fetching it — retrying picks it right back up."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
}
