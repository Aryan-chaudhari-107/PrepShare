import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  FileText,
  Heart,
  Lock,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import { Pagination } from "../components/common/Pagination";
import {
  Badge,
  Button,
  Divider,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonList,
} from "../components/ui";
import { Scene, Section } from "../motion";
import { NotificationOut } from "../types";
import { notificationsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { cn } from "../lib/cn";
import { emitUnreadChanged } from "../lib/events";
import { errorMessage, fullDate, relativeDate } from "../lib/format";

/** The five panels that can occupy the list region — one slot, one rhythm. */
type Slot = "signed-out" | "loading" | "error" | "empty" | "list";

/**
 * Activity inbox.
 *
 * Guest handling: the fetch bails out BEFORE any request and releases the
 * loading flag; the signed-out state renders below instead of a spinner that
 * could never resolve.
 *
 * LIST LANGUAGE (identical on Bookmarks / Drafts / Completed questions):
 *  - the page is a `Scene`: header → list → pagination cascade on the design
 *    system's own `item` rhythm, so no page carries a private timing literal;
 *  - all five states share ONE keyed `Section` slot. Nothing waits to leave —
 *    the outgoing panel unmounts instantly instead of sitting through a
 *    `mode="wait"` exit — and the incoming panel mounts immediately and
 *    settles with `item`. The loading placeholder is `still`: skeletons paint
 *    at once, resolved content lands.
 *  - rows carry no per-row stagger. A utility list arrives as one surface, so
 *    mark-as-read refetches and page changes never re-fire a cascade.
 *
 * ROW ANATOMY (the one this page owns): leading type mark → message (primary)
 * → timestamp (metadata) → unread state → trailing affordance. Depth is spent
 * only where it means something: the row itself is the link, so it is the one
 * surface in the app's lists allowed to lift and press.
 */
export const NotificationsPage: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await notificationsApi.list(page, 20);
      setNotifications(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err: unknown) {
      // Keep the previous page on screen — an error is not "empty".
      setLoadError(errorMessage(err, "Failed to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      success("All notifications marked as read.", "Inbox Updated");
      emitUnreadChanged(); // header badge clears without a full reload
      fetchNotifs();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to mark all as read."));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      emitUnreadChanged(); // header badge clears without a full reload
      fetchNotifs();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to mark notification as read."));
    }
  };

  const getNotificationIcon = (type: NotificationOut["type"]) => {
    switch (type) {
      case "LIKE":
        return <Heart size={18} className="text-danger" aria-hidden="true" />;
      case "COMMENT":
        return <MessageSquare size={18} className="text-primary" aria-hidden="true" />;
      case "FOLLOW":
        return <UserPlus size={18} className="text-accent" aria-hidden="true" />;
      case "NEW_POST":
        return <FileText size={18} className="text-warning" aria-hidden="true" />;
      default:
        return <Bell size={18} className="text-muted" aria-hidden="true" />;
    }
  };

  const getMessage = (n: NotificationOut) => {
    const sender = n.sender?.username ? `@${n.sender.username}` : "Someone";
    if (n.type === "LIKE") return `${sender} liked your interview experience.`;
    if (n.type === "COMMENT") return `${sender} commented on your interview experience.`;
    if (n.type === "FOLLOW") return `${sender} started following your profile.`;
    if (n.type === "NEW_POST") return `${sender} posted a new interview experience.`;
    return `${sender} sent a notification.`;
  };

  const slot: Slot = !isAuthLoading && !isAuthenticated
    ? "signed-out"
    : isAuthLoading || loading
    ? "loading"
    : loadError
    ? "error"
    : notifications.length === 0
    ? "empty"
    : "list";

  return (
    <>
      <PageContainer width="list">
        <Scene>
          <Section key="header">
            <PageHeader
              title="Notifications"
              description="Stay updated on discussions, likes, and profile followers."
              icon={<Bell size={20} aria-hidden="true" />}
              actions={
                unreadCount > 0 ? (
                  <>
                    <Badge tone="danger">{unreadCount} unread</Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<CheckCheck size={14} aria-hidden="true" />}
                      onClick={handleMarkAllRead}
                      loading={markingAll}
                      disabled={markingAll}
                    >
                      Mark all as read
                    </Button>
                  </>
                ) : null
              }
            >
              {/* The rule the index hangs from: chrome above, content below. */}
              <Divider className="mt-5" />
            </PageHeader>
          </Section>

          <Section key={slot} still={slot === "loading"}>
            {slot === "signed-out" ? (
              <EmptyState
                art="chat"
                title="Sign in to see your notifications"
                description="Likes, comments and followers are only visible on your own account."
                action={
                  <Button
                    icon={<Lock size={16} aria-hidden="true" />}
                    onClick={() => openAuthModal("login")}
                  >
                    Sign in
                  </Button>
                }
              />
            ) : slot === "loading" ? (
              <SkeletonList count={5} />
            ) : slot === "error" ? (
              <ErrorState description={loadError} onRetry={fetchNotifs} />
            ) : slot === "empty" ? (
              <EmptyState
                art="signal"
                title="You're all caught up"
                description="New likes, comments and followers will show up here as they happen."
                action={
                  <Button
                    iconRight={<ArrowRight size={16} aria-hidden="true" />}
                    onClick={() => navigate("/feed")}
                  >
                    Explore the feed
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => {
                  const targetUrl =
                    n.reference_type === "post" ||
                    n.reference_type === "comment" ||
                    n.type === "COMMENT" ||
                    n.type === "LIKE" ||
                    n.type === "NEW_POST"
                      ? `/posts/${n.reference_id}`
                      : n.reference_type === "user" || n.type === "FOLLOW"
                      ? `/users/${n.reference_id}`
                      : "/";

                  return (
                    <li key={n.id}>
                      {/* The whole row is the link: pointer, keyboard and screen
                          readers all land on the same target. */}
                      <Link
                        to={targetUrl}
                        onClick={() => {
                          if (!n.is_read) handleMarkOne(n.id);
                        }}
                        className={cn(
                          "group relative flex w-full items-center gap-4 rounded-xl border p-4 shadow-xs",
                          "transition-[border-color,transform] duration-fast ease-swift",
                          "hover:-translate-y-px active:scale-nudge",
                          n.is_read
                            ? "border-line bg-surface hover:border-line-strong"
                            : "border-primary/30 bg-primary-soft/60 hover:border-primary/50"
                        )}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-sunken"
                          aria-hidden="true"
                        >
                          {getNotificationIcon(n.type)}
                        </span>

                        <span className="min-w-0 flex-1">
                          {!n.is_read && <span className="sr-only">Unread — </span>}
                          <span
                            className={cn(
                              "block break-words text-sm leading-snug transition-colors duration-fast ease-swift group-hover:text-primary",
                              n.is_read ? "font-normal text-body" : "font-semibold text-heading"
                            )}
                          >
                            {getMessage(n)}
                          </span>
                          <time
                            className="mt-1 block text-xs tabular text-muted"
                            dateTime={n.created_at}
                            title={fullDate(n.created_at)}
                          >
                            {relativeDate(n.created_at)}
                          </time>
                        </span>

                        {!n.is_read && <Badge dot tone="primary" />}

                        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
                          <span>View</span>
                          <ArrowRight
                            size={14}
                            className="transition-transform duration-fast ease-swift group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {isAuthenticated && !loadError && (
            <Section key="pagination" className="mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                noun="notification"
                isLoading={loading}
                onPageChange={(p) => setPage(p)}
              />
            </Section>
          )}
        </Scene>
      </PageContainer>
    </>
  );
};
