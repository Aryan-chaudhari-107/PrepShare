import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface TopNavBarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onToggleMobileMenu?: () => void;
  unreadCount?: number;
  unreadMessages?: number;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onSearch,
  searchQuery = "",
  onToggleMobileMenu,
  unreadCount = 0,
  unreadMessages = 0,
}) => {
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch);
    } else {
      navigate(`/?search=${encodeURIComponent(localSearch)}`);
    }
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-[#faf7ee]/90 backdrop-blur-xl border-b border-[#e3dccd] shadow-xs h-[72px]">
      <div className="flex items-center justify-between px-[clamp(24px,4vw,64px)] h-full w-full max-w-[1680px] mx-auto gap-4">
        {/* Left: Mobile Toggle, Brand & Search */}
        <div className="flex items-center gap-6 lg:gap-8 flex-1">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-[#5f6e82] hover:text-[#0f1926] hover:bg-[#f3eee1] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform active:scale-98 shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#3f6f52] text-white flex items-center justify-center font-black text-base shadow-sm group-hover:bg-[#345c44] transition-colors">
              PS
            </div>
            <span className="text-[22px] font-extrabold tracking-tight text-[#0f1926]">
              PrepShare
            </span>
          </Link>

          {/* Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center bg-[#f3eee1] rounded-xl px-4 h-[44px] w-[460px] lg:w-[520px] xl:w-[560px] border border-[#e3dccd] focus-within:border-[#3f6f52] focus-within:ring-2 focus-within:ring-[#3f6f52]/20 focus-within:bg-white transition-all shadow-inner"
          >
            <Search className="w-4.5 h-4.5 text-[#5f6e82] mr-3 shrink-0" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search companies, roles, topics..."
              className="bg-transparent border-none focus:ring-0 text-[15px] text-[#0f1926] w-full placeholder-[#5f6e82] focus:outline-none"
            />
          </form>
        </div>

        {/* Right: Actions & User Controls (Pushed to the far right) */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* Create Post CTA */}
          {isAuthenticated ? (
            <Link
              to="/draft"
              className="flex items-center gap-2 px-5 h-[44px] bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-xl text-[15px] font-semibold hover:brightness-105 active:scale-95 shadow-sm transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Share Experience</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openAuthModal("login")}
                className="flex items-center gap-2 px-5 h-[44px] bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-xl text-[15px] font-semibold hover:brightness-105 active:scale-95 shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4.5 h-4.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openAuthModal("register")}
                className="hidden sm:inline-flex items-center px-4 h-[44px] rounded-xl text-[15px] font-semibold text-[#2b3a4f] hover:text-[#0f1926] hover:bg-[#f3eee1] border border-transparent hover:border-[#e3dccd] transition-all cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

          {isAuthenticated && (
            <>
              {/* Direct Messages */}
              <Link
                to="/messages"
                className="relative text-[#2b3a4f] hover:text-[#0f1926] transition-colors p-2.5 rounded-xl hover:bg-[#f3eee1] active:scale-95 flex items-center justify-center h-[44px] w-[44px]"
                title="Direct Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-[#3f6f52] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#faf7ee]">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative text-[#2b3a4f] hover:text-[#0f1926] transition-colors p-2.5 rounded-xl hover:bg-[#f3eee1] active:scale-95 flex items-center justify-center h-[44px] w-[44px]"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-[#b5462f] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#faf7ee]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Avatar with Spring Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-[#e3dccd] bg-[#f3eee1] flex items-center justify-center hover:ring-2 hover:ring-[#3f6f52]/40 transition-all text-xs font-bold text-[#0f1926] cursor-pointer"
                  aria-label="User profile menu"
                >
                  {user?.profile_photo_url ? (
                    <img
                      src={user.profile_photo_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.username?.slice(0, 2).toUpperCase() || "ME"}</span>
                  )}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#e3dccd] shadow-xl py-2 z-50 text-[14.5px] overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[#e3dccd] bg-[#faf7ee]">
                        <p className="font-bold text-[#0f1926] truncate">
                          {user?.full_name || user?.username}
                        </p>
                        <p className="text-xs text-[#5f6e82] truncate mt-0.5">@{user?.username}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2b3a4f] hover:text-[#0f1926] hover:bg-[#f3eee1] transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-[#3f6f52]" />
                          My Profile
                        </Link>
                        <Link
                          to="/drafts"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2b3a4f] hover:text-[#0f1926] hover:bg-[#f3eee1] transition-colors"
                        >
                          <FileText className="w-4 h-4 text-[#3f6f52]" />
                          Drafts Archive
                        </Link>
                        <Link
                          to="/bookmarks"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2b3a4f] hover:text-[#0f1926] hover:bg-[#f3eee1] transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-[#b26a00]" />
                          Bookmarks
                        </Link>
                        <Link
                          to="/completed-questions"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2b3a4f] hover:text-[#0f1926] hover:bg-[#f3eee1] transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 text-[#2f7d52]" />
                          Completed Questions
                        </Link>
                      </div>
                      <div className="border-t border-[#e3dccd] my-1"></div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-[#b5462f] hover:bg-[#b5462f]/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
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
