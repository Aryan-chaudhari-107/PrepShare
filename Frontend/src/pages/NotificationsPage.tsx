import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  FileText,
  CheckCheck,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { NotificationOut } from "../types";
import { notificationsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/common/Pagination";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="w-4 h-4 text-[#b5462f]" />;
      case "COMMENT":
        return <MessageSquare className="w-4 h-4 text-[#3f6f52]" />;
      case "FOLLOW":
        return <UserPlus className="w-4 h-4 text-[#3f6f9e]" />;
      case "NEW_POST":
        return <FileText className="w-4 h-4 text-[#b26a00]" />;
      default:
        return <Bell className="w-4 h-4 text-[#3f6f52]" />;
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

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col gap-6 flex-1">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-[#e3dccd] pb-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2f6b47] mb-1">
              <Bell className="w-4 h-4 text-[#3f6f52]" />
              <span className="uppercase tracking-wider">ACTIVITY CENTER</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f1926]">
              Notifications {unreadCount > 0 && `(${unreadCount} Unread)`}
            </h1>
            <p className="text-xs text-[#5f6e82] mt-0.5">
              Stay updated on discussions, likes, and profile followers.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-white border border-[#e3dccd] hover:bg-[#f3eee1] text-xs font-semibold text-[#2f6b47] transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}
        </motion.div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#5f6e82] animate-pulse">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2.5"
          >
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
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkOne(n.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    !n.is_read
                      ? "bg-[#3f6f52]/10 border-[#3f6f52]/30 shadow-xs"
                      : "bg-white border-[#e3dccd] hover:border-[#3f6f52]/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#f3eee1] border border-[#e3dccd] flex items-center justify-center shrink-0 shadow-xs">
                      {getNotificationIcon(n.type)}
                    </div>
                    <Link
                      to={targetUrl}
                      className="text-xs sm:text-sm font-medium text-[#0f1926] hover:text-[#2f6b47] transition-colors leading-relaxed"
                    >
                      {getMessage(n)}
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-[#5f6e82]">
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <Link
                      to={targetUrl}
                      className="px-3 py-1 rounded-xl bg-[#f3eee1] hover:bg-white border border-[#e3dccd] text-xs font-semibold text-[#2b3a4f] hover:text-[#0f1926] flex items-center gap-1 transition-all"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 text-center bg-white rounded-2xl border border-dashed border-[#e3dccd] flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 flex items-center justify-center text-[#3f6f52]">
              <Inbox className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-[#0f1926]">No Notifications</p>
            <p className="text-xs text-[#5f6e82] mt-0.5">You have no unread alerts or activity updates at this time.</p>
          </motion.div>
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
