import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  LogIn,
  MessageSquare,
  Bell,
  Bookmark,
  CheckCircle,
  User as UserIcon,
  FileText,
  LogOut,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../ui/Avatar";
import { initials } from "../../lib/format";
import { DURATION, EASE } from "../../motion";

interface TopNavBarProps {
  /** Opens the mobile navigation drawer. Owned by AppShell. */
  onToggleMobileMenu?: () => void;
  onSearch?: (query: string) => void;
  /** `undefined` when the layout has no feed query to mirror — see the sync
   *  effect below; it must not wipe what the user has typed. */
  searchQuery?: string;
  unreadCount?: number;
  unreadMessages?: number;
}

const ICON_BTN =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-fast ease-swift hover:bg-sunken/70 hover:text-heading";

function CountBadge({ count, tone }: { count: number; tone: "primary" | "danger" }) {
  if (count <= 0) return null;
  return (
    <span
      className={cnBadge(tone)}
      aria-hidden="true"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function cnBadge(tone: "primary" | "danger") {
  return [
    "tabular absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center",
    "rounded-full px-1 py-0.5 text-xs font-bold leading-none text-white ring-2 ring-canvas",
    tone === "danger" ? "bg-danger" : "bg-primary",
  ].join(" ");
}

/**
 * App bar: brand, global search, primary CTA, notification shortcuts and the
 * account menu.
 *
 * Changes from the original:
 *  - height locked to --navbar-height (was 72px while three pages offset by
 *    64/80/96px, producing wrong scroll heights);
 *  - the hamburger is now ALWAYS rendered on mobile and actually wired to
 *    AppShell's drawer — previously it was conditional on a prop that no page
 *    passed, so it never appeared;
 *  - the account menu is a real `menu` widget with aria-expanded/haspopup,
 *    Escape-to-close and focus return;
 *  - a working light/dark toggle backs the `theme_preference` the settings
 *    screen already persists to the API.
 */
export const TopNavBar: React.FC<TopNavBarProps> = ({
  onToggleMobileMenu,
  onSearch,
  searchQuery = "",
  unreadCount = 0,
  unreadMessages = 0,
}) => {
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const { resolved, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [localSearch, setLocalSearch] = useState(searchQuery ?? "");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Sync only when the layout supplies a value. `undefined` means "not on the
  // feed" — clearing the field there would discard a query the user is still
  // composing while they look at a result.
  useEffect(() => {
    if (searchQuery !== undefined) setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUserMenu(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showUserMenu]);

  // Close the menu on navigation so it never floats over a new page.
  useEffect(() => setShowUserMenu(false), [location.pathname]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSearch) onSearch(localSearch);
    else navigate(`/feed?search=${encodeURIComponent(localSearch)}`);
  };

  // The app-shell's breadcrumb: mirrors the current route as a section name.
  const pageTitle = (() => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/feed") return "Explore Feed";
    if (path.startsWith("/posts/")) return "Experience";
    if (path.startsWith("/drafts")) return "Draft Archive";
    if (path.startsWith("/draft")) return "Share Experience";
    if (path.startsWith("/users/") || path === "/profile") return "Profile";
    if (path.startsWith("/messages")) return "Messages";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path.startsWith("/bookmarks")) return "Bookmarks";
    if (path.startsWith("/completed-questions")) return "Solved Questions";
    return "PrepShare";
  })();

  const menuItem =
    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-raised";

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-header border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-shell items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile nav toggle — always present below lg */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className={`${ICON_BTN} lg:hidden`}
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-fg shadow-xs">
            PS
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-heading sm:block">
            PrepShare
          </span>
        </Link>

        {/* Section breadcrumb — the app-shell's "where am I", hidden on the
            smallest screens where the hero/page heading carries the context. */}
        <div className="hidden min-w-0 flex-col leading-tight lg:flex">
          <span className="text-[11px] text-faint">PrepShare</span>
          <span className="truncate text-sm font-semibold text-heading">{pageTitle}</span>
        </div>

        {/* Global search — md and up; smaller screens reach search via the
            feed's filter panel, which is surfaced in the nav drawer. */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="ml-2 hidden max-w-xl flex-1 md:block"
        >
          <label htmlFor="global-search" className="sr-only">
            Search companies, roles or topics
          </label>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-sunken px-3 transition-colors focus-within:border-primary focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/20">
            <Search size={16} className="shrink-0 text-faint" aria-hidden="true" />
            <input
              id="global-search"
              type="search"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Search companies, roles, topics…"
              className="h-full w-full min-w-0 bg-transparent text-sm text-heading outline-none placeholder:text-faint"
            />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} theme`}
            className={ICON_BTN}
          >
            {resolved === "dark" ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>

          {isAuthenticated ? (
            <Link
              to="/draft"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg shadow-xs transition-colors hover:bg-[rgb(var(--primary-hover))] active:scale-press sm:px-4"
            >
              <Plus size={16} aria-hidden="true" />
              <span className="hidden lg:not-sr-only lg:inline">Share Experience</span>
              <span className="sr-only">Share Experience</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg shadow-xs transition-colors hover:bg-[rgb(var(--primary-hover))] active:scale-press"
              >
                <LogIn size={16} aria-hidden="true" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="hidden h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-heading transition-colors hover:border-line-strong hover:bg-raised sm:inline-flex"
              >
                Sign Up
              </button>
            </div>
          )}

          {isAuthenticated && (
            <>
              <Link
                to="/messages"
                className={ICON_BTN}
                aria-label={`Direct messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ""}`}
              >
                <MessageSquare size={18} aria-hidden="true" />
                <CountBadge count={unreadMessages} tone="primary" />
              </Link>

              <Link
                to="/notifications"
                className={ICON_BTN}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell size={18} aria-hidden="true" />
                <CountBadge count={unreadCount} tone="danger" />
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setShowUserMenu((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  aria-controls="account-menu"
                  /* WCAG 2.5.3 (label in name): the button shows the avatar
                     initials, so the accessible name must contain them. */
                  aria-label={`${initials(user?.full_name || user?.username)} account menu`}
                  className="ml-0.5 rounded-full ring-offset-2 ring-offset-canvas transition-shadow hover:ring-2 hover:ring-primary/40"
                >
                  <Avatar
                    src={user?.profile_photo_url}
                    name={user?.full_name || user?.username}
                    size="sm"
                  />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      id="account-menu"
                      role="menu"
                      aria-label="Account"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        y: -4,
                        scale: 0.97,
                        transition: { duration: DURATION.fast, ease: EASE.exit },
                      }}
                      transition={{ duration: DURATION.base, ease: EASE.enter }}
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-xl"
                    >
                      <div className="border-b border-line px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-heading">
                          {user?.full_name || user?.username}
                        </p>
                        <p className="truncate text-xs text-muted">@{user?.username}</p>
                      </div>

                      <div className="py-1">
                        <Link to="/profile" role="menuitem" className={menuItem}>
                          <UserIcon size={16} className="text-primary" aria-hidden="true" />
                          My Profile
                        </Link>
                        <Link to="/drafts" role="menuitem" className={menuItem}>
                          <FileText size={16} className="text-primary" aria-hidden="true" />
                          Drafts Archive
                        </Link>
                        <Link to="/bookmarks" role="menuitem" className={menuItem}>
                          <Bookmark size={16} className="text-warning" aria-hidden="true" />
                          Bookmarks
                        </Link>
                        <Link to="/completed-questions" role="menuitem" className={menuItem}>
                          <CheckCircle size={16} className="text-success" aria-hidden="true" />
                          Completed Questions
                        </Link>
                      </div>

                      <div className="my-1 border-t border-line" />

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className={`${menuItem} text-danger hover:bg-danger-soft`}
                      >
                        <LogOut size={16} aria-hidden="true" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
