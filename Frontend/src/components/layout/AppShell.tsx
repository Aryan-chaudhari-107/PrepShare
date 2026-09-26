import React, { useCallback, useEffect, useState } from "react";
import { matchPath, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { TopNavBar } from "./TopNavBar";
import { SideNavBar } from "./SideNavBar";
import { AppFooter } from "./AppFooter";
import { ChatFab } from "./ChatFab";
import { MobileSearchForm } from "./MobileSearchForm";
import { AuthModal } from "../../pages/AuthModal";
import { PrivacyTermsModal } from "../common/PrivacyTermsModal";
import { Drawer } from "../ui/Drawer";
import { notificationsApi, chatApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/cn";
import { onUnreadChanged } from "../../lib/events";
import { setEnvironmentScene } from "../../lib/environment";
import { Atmosphere } from "../../motion/Atmosphere";
import { RouteStage } from "../../motion/RouteStage";

interface AppShellProps {
  children: React.ReactNode;
}

/** Routes where the floating Messages button would cover the page's own UI. */
const FAB_HIDDEN_ON = ["/messages", "/posts/:postId"];

/**
 * Application chrome: fixed app bar, persistent left rail (desktop), shared
 * navigation drawer (mobile), floating Messages button, footer, auth modal.
 *
 * MOUNTS EXACTLY ONCE. `App.tsx` renders this above the `<Routes>` and routed
 * pages supply only their content, so navigating no longer tears down and
 * rebuilds the top bar, rail, footer and FAB — which previously also meant
 * re-fetching both unread counts on every single navigation. Persisting the
 * chrome is what allows route transitions to animate CONTENT only.
 *
 * Search and the FAB's visibility are derived from the current route rather
 * than passed as props, because a page cannot pass props to its own layout.
 * The footer, FAB and mobile search are focused components (AppFooter,
 * ChatFab, MobileSearchForm); this file owns their wiring and state.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isAuthenticated, openAuthModal, isAuthModalOpen } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const hideChatFab = FAB_HIDDEN_ON.some((pattern) => matchPath(pattern, pathname));
  const onFeed = pathname === "/feed";
  const searchQuery = onFeed ? searchParams.get("search") || "" : undefined;

  /**
   * Global search. It always drives the feed URL, so searching from any page
   * lands on results — previously the field rendered everywhere but only did
   * anything on the feed, because only that page passed an `onSearch` prop.
   */
  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (onFeed) {
        const next = new URLSearchParams(searchParams);
        if (trimmed) next.set("search", trimmed);
        else next.delete("search");
        next.delete("page");
        setSearchParams(next);
      } else {
        navigate(trimmed ? `/feed?search=${encodeURIComponent(trimmed)}` : "/feed");
      }
    },
    [navigate, onFeed, searchParams, setSearchParams]
  );

  const refreshUnread = useCallback(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setUnreadMessages(0);
      return;
    }

    notificationsApi
      .list(1, 1)
      .then((res) => setUnreadCount(res.data?.unread_count || 0))
      .catch(() => {
        /* non-critical — the badge simply stays at zero */
      });

    chatApi
      .getUnreadCount()
      .then((res) => setUnreadMessages(res.data?.unread_count || 0))
      .catch(() => {
        /* non-critical */
      });
  }, [isAuthenticated]);

  // Fetch on mount / auth change, and again whenever a page reports that
  // something was marked read. Event-driven rather than polled: zero requests
  // while nothing is happening.
  useEffect(() => {
    refreshUnread();
    return onUnreadChanged(refreshUnread);
  }, [refreshUnread]);

  // ONE owner for the live 3D environment's scene, derived instead of
  // scattered: the auth dialog wins while open (the field focuses and orbits
  // around the form), then a post detail page (depth + brighter network),
  // otherwise the default world. Because every writer here is derived from
  // the same two inputs, scenes can never fight — and the field eases
  // between them (~0.5s) instead of snapping.
  useEffect(() => {
    setEnvironmentScene(
      isAuthModalOpen ? "auth" : pathname.startsWith("/posts/") ? "post" : "default"
    );
  }, [isAuthModalOpen, pathname]);

  // NOTE: no `bg-canvas` on this root — the body already paints the canvas,
  // and an opaque fill here would hide the Atmosphere layer beneath it.
  return (
    <div className="flex min-h-screen flex-col text-body">
      <Atmosphere />

      <TopNavBar
        onToggleMobileMenu={() => setMobileNavOpen((open) => !open)}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        unreadCount={unreadCount}
        unreadMessages={unreadMessages}
      />

      {/* Mobile navigation — search first, then the shared rail links */}
      <Drawer
        isOpen={mobileNavOpen}
        onClose={closeMobileNav}
        title="Navigation"
        side="left"
        width="w-[290px]"
      >
        <MobileSearchForm
          defaultValue={searchQuery}
          onSubmit={(query) => {
            handleSearch(query);
            closeMobileNav();
          }}
        />
        <div className="-mx-5 -my-4">
          <SideNavBar unreadCount={unreadCount} onNavigate={closeMobileNav} />
        </div>
      </Drawer>

      <div className="flex w-full flex-1 pt-header">
        {/* aria-label keeps this landmark's name distinct from the other
            <aside> panels (filters/conversations/discussion) so assistive
            tech never sees two unnamed "complementary" landmarks. */}
        <aside aria-label="Sidebar" className="sticky top-header hidden h-[calc(100vh_-_var(--navbar-height))] w-60 shrink-0 self-start overflow-y-auto border-r border-line bg-surface/60 scrollbar-slim lg:block">
          <SideNavBar unreadCount={unreadCount} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Route transitions live HERE, inside the chrome, so the app bar,
              rail and footer never move — only the page content does. */}
          <main className="flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <RouteStage key={pathname} location={location}>
                {children}
              </RouteStage>
            </AnimatePresence>
          </main>

          <AppFooter
            isAuthenticated={isAuthenticated}
            onSignIn={() => openAuthModal("login")}
            onOpenPrivacy={() => setIsPrivacyTermsOpen(true)}
          />
        </div>
      </div>

      {/* Toast notifications render below the app bar precisely so they can
          never cover the floating Messages button. */}
      {!hideChatFab && (
        <ChatFab
          isAuthenticated={isAuthenticated}
          unreadMessages={unreadMessages}
          onSignIn={() => openAuthModal("login")}
        />
      )}

      <AuthModal />
      <PrivacyTermsModal
        isOpen={isPrivacyTermsOpen}
        onClose={() => setIsPrivacyTermsOpen(false)}
      />
    </div>
  );
};

/** Shared page wrapper so every route uses identical gutters and max width. */
export const PageContainer: React.FC<{
  width?: "shell" | "list" | "prose" | "wizard";
  className?: string;
  children: React.ReactNode;
}> = ({ width = "list", className, children }) => (
  <div
    className={cn(
      "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
      width === "shell" && "max-w-shell",
      width === "list" && "max-w-list",
      width === "prose" && "max-w-prose",
      width === "wizard" && "max-w-wizard",
      className
    )}
  >
    {children}
  </div>
);
