import React, { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppShell } from "./components/layout/AppShell";
import { RouteBoundary } from "./components/common/RouteBoundary";
import { useStagedLocation } from "./lib/stagedLocation";
import { DURATION, EASE } from "./motion/tokens";

/**
 * Route-level code splitting. The shell, contexts, motion system and design
 * primitives stay in the main chunk — each page ships only when someone
 * actually navigates to it. `AuthModal` is deliberately NOT listed here:
 * AppShell imports it eagerly so the sign-in dialog opens instantly.
 *
 * Pages export named components while `lazy` expects a default export, hence
 * the small bridge on each import. Chunk arrival and chunk failure are both
 * handled by `RouteBoundary`.
 */
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const FeedPage = lazy(() => import("./pages/FeedPage").then((m) => ({ default: m.FeedPage })));
const ReportDetailPage = lazy(() =>
  import("./pages/ReportDetailPage").then((m) => ({ default: m.ReportDetailPage }))
);
const DraftReportPage = lazy(() =>
  import("./pages/DraftReportPage").then((m) => ({ default: m.DraftReportPage }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const CompletedQuestionsPage = lazy(() =>
  import("./pages/CompletedQuestionsPage").then((m) => ({ default: m.CompletedQuestionsPage }))
);
const BookmarksPage = lazy(() =>
  import("./pages/BookmarksPage").then((m) => ({ default: m.BookmarksPage }))
);
const NotificationsPage = lazy(() =>
  import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage }))
);
const DraftsArchivePage = lazy(() =>
  import("./pages/DraftsArchivePage").then((m) => ({ default: m.DraftsArchivePage }))
);
const MessagesPage = lazy(() =>
  import("./pages/MessagesPage").then((m) => ({ default: m.MessagesPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

/**
 * All routes. `location` is passed explicitly so that during a transition the
 * OUTGOING stage keeps rendering the route it came from — otherwise the old
 * page would swap to the new route's content mid-exit and flash.
 *
 * Scroll-to-top is deliberately NOT handled here: `RouteStage` resets the
 * scroll when it mounts, which under `AnimatePresence mode="wait"` is after
 * the previous page has finished leaving, so the jump is never visible.
 *
 * The location comes from `useStagedLocation`, never the router's live value:
 * while a page leaves, its stage is still mounted, and a live subscription
 * here would re-render the OUTGOING stage with the incoming route — replacing
 * the old page (with new content, or the chunk-loading fallback) mid-exit.
 */
const AppRoutes: React.FC = () => {
  const location = useStagedLocation();

  return (
    <Routes location={location}>
      {/* Command center — the app-shell landing (bento dashboard) */}
      <Route path="/" element={<DashboardPage />} />

      {/* Primary Feed */}
      <Route path="/feed" element={<FeedPage />} />

      {/* Post Detail (split panel) */}
      <Route path="/posts/:postId" element={<ReportDetailPage />} />

      {/* Create Post Wizard */}
      <Route path="/draft" element={<DraftReportPage />} />

      {/* User Profile */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/users/:userId" element={<ProfilePage />} />

      {/* Messages */}
      <Route path="/messages" element={<MessagesPage />} />

      {/* Solved Questions */}
      <Route path="/completed-questions" element={<CompletedQuestionsPage />} />

      {/* Bookmarks */}
      <Route path="/bookmarks" element={<BookmarksPage />} />

      {/* Notifications */}
      <Route path="/notifications" element={<NotificationsPage />} />

      {/* Drafts Repository */}
      <Route path="/drafts" element={<DraftsArchivePage />} />

      {/* 404 — matched in place so the requested URL survives and the page can
          echo it back; redirecting to /404 destroyed it. */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      {/* One default transition for the whole app — components that need a
          different tier override it explicitly from motion/tokens. */}
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: DURATION.base, ease: EASE.standard }}
      >
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppShell>
                <RouteBoundary>
                  <AppRoutes />
                </RouteBoundary>
              </AppShell>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </ThemeProvider>
  );
};

export default App;
