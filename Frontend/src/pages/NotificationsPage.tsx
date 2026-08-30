import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { NotificationOut } from "../types";
import { notificationsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/common/Pagination";

export const NotificationsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setLoading(true);
    try {
      const res = await notificationsApi.list(page, 20);
      setNotifications(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, openAuthModal, error]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      success("All notifications marked as read.", "Inbox Updated");
      fetchNotifs();
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to mark all as read.");
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifs();
    } catch {}
  };

  const getMessage = (n: NotificationOut) => {
    const sender = n.sender?.username ? `@${n.sender.username}` : "Someone";
    if (n.type === "LIKE") return `${sender} liked your interview experience.`;
    if (n.type === "COMMENT") return `${sender} commented on your interview experience.`;
    if (n.type === "FOLLOW") return `${sender} started following your profile.`;
    if (n.type === "NEW_POST") return `${sender} posted a new interview experience.`;
    return `${sender} sent a notification.`;
  };

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col gap-6 flex-1">
        <div className="border-b border-border-subtle pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">
              Notifications {unreadCount > 0 && `(${unreadCount} Unread)`}
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Stay updated on discussions, likes, and followers.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-surface-elevated border border-border-subtle hover:bg-surface-container text-xs font-semibold text-primary transition-all shadow-sm active:scale-95"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant animate-pulse">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {notifications.map((n) => {
              const targetUrl =
                n.reference_type === "post"
                  ? `/posts/${n.reference_id}`
                  : n.reference_type === "user"
                  ? `/users/${n.reference_id}`
                  : "/";

              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkOne(n.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    !n.is_read
                      ? "bg-primary-container/5 border-primary/20 shadow-sm"
                      : "bg-surface-elevated border-border-subtle"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        {n.type === "LIKE" ? "favorite" : n.type === "COMMENT" ? "chat_bubble" : "notifications"}
                      </span>
                    </div>
                    <Link to={targetUrl} className="text-xs sm:text-sm font-medium text-on-surface hover:text-primary transition-colors">
                      {getMessage(n)}
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-outline">
                      {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <Link
                      to={targetUrl}
                      className="px-3 py-1 rounded-lg bg-surface hover:bg-surface-container border border-border-subtle text-xs font-semibold text-on-surface"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-surface-elevated rounded-2xl border border-dashed border-border-subtle">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">notifications_none</span>
            <p className="text-sm font-bold text-on-surface">No Notifications</p>
            <p className="text-xs text-on-surface-variant mt-1">You have no unread alerts or notices at this time.</p>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          hasNext={page < totalPages}
          hasPrevious={page > 1}
          onPageChange={(p) => setPage(p)}
        />
      </main>
    </AppShell>
  );
};
