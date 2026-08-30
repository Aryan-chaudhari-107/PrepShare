import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  unreadCount = 0,
  unreadMessages = 0,
}) => {
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch);
    } else {
      navigate(`/?search=${encodeURIComponent(localSearch)}`);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-border-subtle shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 h-16 w-full max-w-[1600px] mx-auto">
        {/* Brand & Search */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-xl font-bold text-primary flex items-center gap-2 hover:opacity-95 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
              PS
            </span>
            <span className="tracking-tight font-headline">PrepShare</span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center bg-surface-container rounded-full px-4 py-1.5 w-72 border border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
          >
            <span className="material-symbols-outlined text-outline text-lg mr-2 select-none">
              search
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search experiences..."
              className="bg-transparent border-none focus:ring-0 text-sm text-on-surface w-full placeholder-outline focus:outline-none"
            />
          </form>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Create Post Button */}
          {isAuthenticated ? (
            <Link
              to="/draft"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary-container transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="hidden sm:inline">Create Post</span>
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal("login")}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary-container transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {isAuthenticated ? (
            <>
              {/* Direct Messages */}
              <Link
                to="/messages"
                className="relative text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container active:scale-95"
                title="Direct Messages"
              >
                <span className="material-symbols-outlined text-2xl">chat</span>
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications Bell */}
              <Link
                to="/notifications"
                className="relative text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container active:scale-95"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-2xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Bookmarks */}
              <Link
                to="/bookmarks"
                className="hidden sm:flex text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container active:scale-95"
                title="Bookmarks"
              >
                <span className="material-symbols-outlined text-2xl">bookmark</span>
              </Link>

              {/* Solved Questions */}
              <Link
                to="/completed-questions"
                className="hidden sm:flex text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container active:scale-95"
                title="Completed Questions"
              >
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </Link>

              {/* User Avatar with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full overflow-hidden border border-border-subtle bg-surface-container-high flex items-center justify-center hover:ring-2 hover:ring-primary transition-all cursor-pointer text-xs font-bold text-primary"
                >
                  {user?.profile_photo_url ? (
                    <img
                      src={user.profile_photo_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.username?.slice(0, 2).toUpperCase() || "OP"}</span>
                  )}
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-surface-elevated rounded-xl border border-border-subtle shadow-lg py-2 z-50 text-sm animate-in fade-in slide-in-from-top-1"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-border-subtle">
                      <p className="font-semibold text-on-surface truncate">
                        {user?.full_name || user?.username}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        @{user?.username}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">person</span>
                      My Profile
                    </Link>
                    <Link
                      to="/drafts"
                      className="flex items-center gap-2 px-4 py-2 text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">draft</span>
                      My Drafts
                    </Link>
                    <Link
                      to="/bookmarks"
                      className="flex items-center gap-2 px-4 py-2 text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">bookmark</span>
                      Saved Bookmarks
                    </Link>
                    <Link
                      to="/completed-questions"
                      className="flex items-center gap-2 px-4 py-2 text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">task_alt</span>
                      Completed Questions
                    </Link>
                    <div className="border-t border-border-subtle my-1"></div>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-error hover:bg-error-container/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => openAuthModal("register")}
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-sm font-medium text-primary hover:bg-surface-container transition-colors"
            >
              Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

