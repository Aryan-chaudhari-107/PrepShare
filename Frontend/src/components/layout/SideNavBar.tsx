import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  Compass,
  FileEdit,
  LayoutDashboard,
  LogIn,
  Award,
  MessageSquare,
  Plus,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/cn";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  authRequired?: boolean;
  badge?: number;
}

interface SideNavBarProps {
  /** Unread notification count, supplied by AppShell (fetched once). */
  unreadCount?: number;
  /** Called after a link is followed — closes the mobile drawer. */
  onNavigate?: () => void;
}

/**
 * The application's persistent navigation — the app-shell's left rail.
 *
 * Structure follows the approved dashboard template: two labelled groups
 * (Menu / Workspace), a "Share experience" call-to-action and the account
 * card pinned to the foot of the rail, with an edge indicator on the active
 * item. Every entry maps to a route that actually exists — nothing here is
 * decorative.
 */
export const SideNavBar: React.FC<SideNavBarProps> = ({ unreadCount = 0, onNavigate }) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const location = useLocation();
  const [pendingNotifs, setPendingNotifs] = useState(0);

  // Count is authoritative only for the signed-in user; start from the
  // shell's value and keep it fresh as the route changes.
  useEffect(() => {
    setPendingNotifs(unreadCount);
  }, [unreadCount]);

  const menuItems: NavItem[] = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Explore Feed", path: "/feed", icon: Compass },
    {
      label: "Notifications",
      path: "/notifications",
      icon: Bell,
      authRequired: true,
      badge: pendingNotifs,
    },
    { label: "Messages", path: "/messages", icon: MessageSquare, authRequired: true },
  ];

  const workspaceItems: NavItem[] = [
    { label: "My Bookmarks", path: "/bookmarks", icon: Bookmark, authRequired: true },
    {
      label: "Completed Questions",
      path: "/completed-questions",
      icon: CheckCircle2,
      authRequired: true,
    },
    { label: "Draft Archive", path: "/drafts", icon: FileEdit, authRequired: true },
    { label: "My Profile", path: "/profile", icon: UserIcon, authRequired: true },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderItems = (items: NavItem[]) =>
    items
      .filter((item) => !(item.authRequired && !isAuthenticated))
      .map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm",
                "transition-colors duration-fast ease-swift",
                active
                  ? "bg-primary-soft font-semibold text-primary before:absolute before:-left-3 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-primary before:content-['']"
                  : "font-medium text-muted hover:bg-sunken/70 hover:text-heading"
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon
                  size={16}
                  className={cn("shrink-0", active ? "text-primary" : "text-faint")}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge tone="danger" className="tabular shrink-0">
                  {item.badge > 99 ? "99+" : item.badge}
                </Badge>
              )}
            </Link>
          </li>
        );
      });

  const ctaClasses =
    "group block w-full rounded-xl border border-primary/35 bg-gradient-to-br from-primary/20 to-primary/5 p-3 text-left transition-[border-color,box-shadow,transform] duration-fast ease-swift hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_12px_30px_-16px_rgb(var(--primary)/.7)]";

  return (
    <div className="flex h-full flex-col p-3">
      <nav aria-label="Main" className="space-y-6">
        <div>
          <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-faint">
            Menu
          </p>
          <ul className="space-y-0.5">{renderItems(menuItems)}</ul>
        </div>

        {isAuthenticated && (
          <div>
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-faint">
              Workspace
            </p>
            <ul className="space-y-0.5">{renderItems(workspaceItems)}</ul>
          </div>
        )}
      </nav>

      {/* Pinned foot: the CTA, then who you are signed in as. */}
      <div className="mt-auto space-y-3 pt-5">
        {isAuthenticated ? (
          <Link to="/draft" onClick={onNavigate} className={ctaClasses}>
            <span className="flex items-center gap-2 text-sm font-semibold text-heading transition-colors group-hover:text-primary">
              <Plus size={15} className="text-primary" aria-hidden="true" />
              Share experience
            </span>
            <span className="mt-0.5 block text-[11px] text-muted">
              Help the next candidate — takes 4 min
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              openAuthModal("login");
            }}
            className={ctaClasses}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-heading transition-colors group-hover:text-primary">
              <LogIn size={15} className="text-primary" aria-hidden="true" />
              Sign in to contribute
            </span>
            <span className="mt-0.5 block text-[11px] text-muted">
              Bookmark, reply and publish
            </span>
          </button>
        )}

        {/* Account card / guest prompt */}
        <div className="rounded-xl border border-line bg-surface p-3 shadow-xs">
          {isAuthenticated && user ? (
            <Link
              to="/profile"
              onClick={onNavigate}
              className="group flex items-center gap-3 rounded-lg"
            >
              <Avatar src={user.profile_photo_url} name={user.full_name || user.username} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-heading transition-colors group-hover:text-primary">
                  {user.full_name || user.username}
                </div>
                <div className="flex items-center gap-1 truncate text-xs font-medium text-warning">
                  <Award size={12} className="shrink-0" aria-hidden="true" />
                  <span className="tabular">{user.contribution_score || 0} pts</span>
                </div>
              </div>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                openAuthModal("login");
              }}
              className="group flex w-full items-center gap-3 rounded-lg text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-muted transition-colors group-hover:border-primary group-hover:text-primary">
                <LogIn size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-heading">Welcome, guest</span>
                <span className="block text-xs font-medium text-primary">Sign in to interact →</span>
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          <span className="flex items-center gap-2">
            <Shield size={14} className="shrink-0 text-primary" aria-hidden="true" />
            PrepShare Verified
          </span>
          <span className="font-mono text-faint">v2.0</span>
        </div>
      </div>
    </div>
  );
};
