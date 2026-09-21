import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  CheckCircle2,
  Bookmark,
  Bell,
  FileEdit,
  User as UserIcon,
  Award,
  LogIn,
  X,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { notificationsApi } from "../../api";

interface SideNavBarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ isMobile = false, onCloseMobile }) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const location = useLocation();
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi
        .list(1, 1)
        .then((res) => {
          setUnreadNotifs(res.data.unread_count || 0);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const navItems = [
    { label: "Experience Feed", path: "/", icon: Compass },
    {
      label: "Completed Questions",
      path: "/completed-questions",
      icon: CheckCircle2,
      authRequired: true,
    },
    { label: "My Bookmarks", path: "/bookmarks", icon: Bookmark, authRequired: true },
    {
      label: "Notifications",
      path: "/notifications",
      icon: Bell,
      authRequired: true,
      badge: unreadNotifs > 0 ? unreadNotifs : undefined,
    },
    { label: "Draft Archive", path: "/drafts", icon: FileEdit, authRequired: true },
    { label: "My Profile", path: "/profile", icon: UserIcon, authRequired: true },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="flex flex-col gap-6">
        {/* User Card */}
        <div className="p-3.5 rounded-2xl border border-[#e3dccd] bg-white shadow-sm">
          {isAuthenticated && user ? (
            <Link
              to="/profile"
              onClick={onCloseMobile}
              className="flex items-center gap-3 group transition-transform active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-[#3f6f52] text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:bg-[#345c44] transition-colors">
                {user.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.username.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="text-sm font-bold text-[#0f1926] truncate group-hover:text-[#3f6f52] transition-colors">
                  {user.full_name || user.username}
                </div>
                <div className="text-xs text-[#b26a00] font-medium flex items-center gap-1 truncate">
                  <Award className="w-3 h-3 shrink-0" />
                  {user.contribution_score || 0} Contribution Pts
                </div>
              </div>
            </Link>
          ) : (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                openAuthModal("login");
              }}
              className="w-full text-left flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f3eee1] border border-[#e3dccd] text-[#2b3a4f] font-bold flex items-center justify-center group-hover:border-[#3f6f52] transition-colors">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0f1926]">Welcome, Guest</div>
                <div className="text-[11px] text-[#2f6b47] font-medium hover:underline">
                  Sign in to interact →
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6e82] px-3 mb-1">
            Menu
          </span>
          {navItems.map((item) => {
            if (item.authRequired && !isAuthenticated) return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? "bg-[#3f6f52]/10 text-[#2f6b47] border border-[#3f6f52]/25 shadow-sm"
                    : "text-[#2b3a4f] hover:text-[#0f1926] hover:bg-[#f3eee1]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#2f6b47]" : "text-[#5f6e82] group-hover:text-[#0f1926]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-[#b5462f] text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Badge */}
      <div className="p-3 rounded-xl border border-[#e3dccd] bg-white text-[11px] text-[#5f6e82] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#2f6b47]" />
          <span>PrepShare Verified</span>
        </div>
        <span className="text-[10px] font-mono text-[#5f6e82]">v2.0</span>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-[#0f1926]/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-72 bg-[#faf7ee] border-r border-[#e3dccd] h-full shadow-2xl flex flex-col z-10"
          >
            <div className="p-4 border-b border-[#e3dccd] flex justify-between items-center bg-white">
              <span className="font-bold text-sm text-[#0f1926]">Navigation</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-[#5f6e82] hover:text-[#0f1926] hover:bg-[#f3eee1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">{content}</div>
          </motion.aside>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-[#e3dccd] bg-[#faf7ee]/80 backdrop-blur-xl shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-20">
      {content}
    </aside>
  );
};
