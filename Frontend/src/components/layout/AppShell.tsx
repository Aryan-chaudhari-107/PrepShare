import React, { useState, useEffect } from "react";
import { TopNavBar } from "./TopNavBar";
import { AuthModal } from "../../pages/AuthModal";
import { notificationsApi, chatApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

interface AppShellProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  hideChatFab?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onSearch,
  searchQuery,
  hideChatFab = false,
}) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi
        .list(1, 1)
        .then((res) => setUnreadCount(res.data?.unread_count || 0))
        .catch(() => {});

      chatApi
        .getUnreadCount()
        .then((res) => setUnreadMessages(res.data?.unread_count || 0))
        .catch(() => {});
    } else {
      setUnreadCount(0);
      setUnreadMessages(0);
    }
  }, [isAuthenticated]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      <TopNavBar
        onSearch={onSearch}
        searchQuery={searchQuery}
        unreadCount={unreadCount}
        unreadMessages={unreadMessages}
      />

      <div className="pt-16 flex-grow flex flex-col w-full">
        {children}
      </div>

      {/* Floating Chat / Messages FAB (Stitch design) */}
      {!hideChatFab && (
        <Link
          to="/messages"
          aria-label="Direct Messages"
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95 z-40 group"
          title="Direct Messages"
        >
          <span
            className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chat
          </span>
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </Link>
      )}

      {/* Modern Academic SaaS Footer */}
      <footer className="w-full border-t border-border-subtle bg-surface py-6 px-4 sm:px-6 lg:px-8 xl:px-10 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">PrepShare</span>
            <span>•</span>
            <span>Real Interview Intelligence & Mentorship Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-primary transition-colors">
              Feed
            </Link>
            <Link to="/draft" className="hover:text-primary transition-colors">
              Create Post
            </Link>
            <Link to="/messages" className="hover:text-primary transition-colors">
              Messages
            </Link>
            <a
              href="#terms"
              onClick={(e) => e.preventDefault()}
              className="hover:text-primary transition-colors"
            >
              Privacy & Terms
            </a>
          </div>
        </div>
      </footer>

      <AuthModal />
    </div>
  );
};

