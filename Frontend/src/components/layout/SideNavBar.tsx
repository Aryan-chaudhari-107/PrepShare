import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
      notificationsApi.list(1, 1).then((res) => {
        setUnreadNotifs(res.data.unread_count || 0);
      }).catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const navItems = [
    { label: "FIELD REPORTS", path: "/", icon: "description" },
    { label: "COMPLETED QUESTIONS", path: "/completed-questions", icon: "check_circle", authRequired: true },
    { label: "MY BOOKMARKS", path: "/bookmarks", icon: "bookmark", authRequired: true },
    { label: "INBOX & ALERTS", path: "/notifications", icon: "notifications", authRequired: true, badge: unreadNotifs > 0 ? unreadNotifs : undefined },
    { label: "DRAFT ARCHIVE", path: "/drafts", icon: "edit_document", authRequired: true },
    { label: "OPERATIVE DOSSIER", path: "/profile", icon: "badge", authRequired: true },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Operative Header Badge */}
        <div className="mb-6 px-2 pt-2">
          {isAuthenticated && user ? (
            <Link
              to="/profile"
              onClick={onCloseMobile}
              className="flex items-center gap-3 p-2 border-2 border-primary bg-surface shadow-[2px_2px_0px_0px_rgba(5,14,26,1)] hover:bg-surface-container transition-colors"
            >
              <div className="w-10 h-10 border-2 border-primary overflow-hidden shrink-0 bg-primary text-on-primary font-mono font-bold flex items-center justify-center">
                {user.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  user.username.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-mono text-xs font-bold text-primary truncate uppercase">
                  {user.username}
                </div>
                <div className="font-mono text-[10px] text-primary/70 truncate">
                  SCORE: {user.contribution_score} PTS
                </div>
              </div>
            </Link>
          ) : (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                openAuthModal("login");
              }}
              className="w-full text-left flex items-center gap-3 p-2 border-2 border-primary bg-surface shadow-[2px_2px_0px_0px_rgba(5,14,26,1)] hover:bg-secondary-container transition-colors"
            >
              <div className="w-10 h-10 border-2 border-primary bg-primary text-on-primary font-mono font-bold flex items-center justify-center">
                ?
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-primary uppercase">GUEST OPERATIVE</div>
                <div className="font-mono text-[10px] text-secondary font-bold underline">LOGIN / REGISTER →</div>
              </div>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-1.5 px-2 font-mono text-xs">
          {navItems.map((item) => {
            if (item.authRequired && !isAuthenticated) return null;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2 border-2 border-primary font-bold uppercase transition-all ${
                    isActive
                      ? "bg-secondary-container text-on-secondary-container shadow-[3px_3px_0px_0px_rgba(5,14,26,1)] translate-x-1"
                      : "bg-surface text-primary hover:bg-surface-container-high hover:translate-x-0.5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 border border-error bg-error-container text-on-error-container text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* System Classification Footer */}
      <div className="p-3 border-t-2 border-primary bg-surface-container font-mono text-[10px] text-primary/70 flex flex-col gap-1">
        <div className="flex items-center justify-between font-bold">
          <span>CLASSIFICATION</span>
          <span className="px-1 border border-primary bg-surface">PUBLIC DOSSIER</span>
        </div>
        <div>STITCH CORE v1.0.4</div>
        <div className="text-[9px] opacity-60">CONFIDENTIAL INTERVIEW ARCHIVE</div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-40 bg-primary/60 backdrop-blur-sm flex">
        <div className="w-72 bg-surface-container border-r-2 border-primary h-full shadow-2xl flex flex-col">
          <div className="p-4 border-b-2 border-primary flex justify-between items-center bg-background">
            <span className="font-mono font-bold text-sm text-primary uppercase">NAVIGATION MENU</span>
            <button onClick={onCloseMobile} className="p-1 border border-primary font-mono text-xs">✕</button>
          </div>
          <div className="flex-grow overflow-y-auto py-4">
            {content}
          </div>
        </div>
        <div className="flex-grow" onClick={onCloseMobile}></div>
      </div>
    );
  }

  return (
    <nav className="hidden md:flex flex-col w-64 border-r-2 border-primary bg-surface-container shrink-0 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto z-20">
      {content}
    </nav>
  );
};
