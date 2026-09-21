import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { TopNavBar } from "./TopNavBar";
import { AuthModal } from "../../pages/AuthModal";
import { PrivacyTermsModal } from "../common/PrivacyTermsModal";
import { notificationsApi, chatApi } from "../../api";
import { useAuth } from "../../context/AuthContext";

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
  const { isAuthenticated, openAuthModal } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);

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
    <div className="bg-[#faf7ee] text-[#2b3a4f] min-h-screen flex flex-col font-sans selection:bg-[#3f6f52]/20 selection:text-[#0f1926] w-full">
      <TopNavBar
        onSearch={onSearch}
        searchQuery={searchQuery}
        unreadCount={unreadCount}
        unreadMessages={unreadMessages}
      />

      <div className="pt-[72px] flex-grow flex flex-col w-full">
        {children}
      </div>

      {/* Floating Chat / Messages FAB (52px sized, kept from covering content) */}
      {!hideChatFab && (
        isAuthenticated ? (
          <Link
            to="/messages"
            aria-label="Direct Messages"
            className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-full shadow-xl shadow-[#3f6f52]/30 border border-[#3f6f52]/40 flex items-center justify-center hover:scale-105 transition-all active:scale-95 z-40 group"
            title="Direct Messages"
          >
            <MessageSquare className="w-5.5 h-5.5 group-hover:scale-110 transition-transform" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#b5462f] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#faf7ee]">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            aria-label="Direct Messages"
            className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-full shadow-xl shadow-[#3f6f52]/30 border border-[#3f6f52]/40 flex items-center justify-center hover:scale-105 transition-all active:scale-95 z-40 group cursor-pointer"
            title="Sign In to Message"
          >
            <MessageSquare className="w-5.5 h-5.5 group-hover:scale-110 transition-transform" />
          </button>
        )
      )}

      {/* Modern SaaS Footer */}
      <footer className="w-full border-t border-[#e3dccd] bg-[#faf7ee]/90 backdrop-blur-md py-8 px-[clamp(24px,4vw,64px)] mt-auto">
        <div className="max-w-[1680px] mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-[13px] text-[#5f6e82]">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#0f1926] text-sm">PrepShare</span>
            <span className="text-[#e3dccd]">•</span>
            <span>Real Interview Intelligence & Mentorship</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-[#3f6f52] transition-colors">
              Explore Feed
            </Link>
            {isAuthenticated ? (
              <Link to="/draft" className="hover:text-[#3f6f52] transition-colors">
                Share Experience
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="hover:text-[#3f6f52] transition-colors text-left cursor-pointer"
              >
                Share Experience
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsPrivacyTermsOpen(true)}
              className="hover:text-[#3f6f52] transition-colors text-left cursor-pointer"
            >
              Privacy & Terms
            </button>
          </div>
        </div>
      </footer>

      <AuthModal />
      <PrivacyTermsModal
        isOpen={isPrivacyTermsOpen}
        onClose={() => setIsPrivacyTermsOpen(false)}
      />
    </div>
  );
};
