import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";

/**
 * Floating Messages button — toast notifications render below the app
 * bar precisely so they can never cover this control.
 *
 * The root is an <aside> (a labelled landmark) rather than a plain <div> so
 * this page-level floating control is still "inside a landmark" for the WCAG
 * region rule, even though it is mounted outside <main>/<footer>.
 */
export const ChatFab: React.FC<{
  isAuthenticated: boolean;
  unreadMessages: number;
  onSignIn: () => void;
}> = ({ isAuthenticated, unreadMessages, onSignIn }) => (
  <aside className="fixed bottom-5 right-5 z-40" aria-label="Messages shortcut">
    {isAuthenticated ? (
      <Link
        to="/messages"
        aria-label={`Direct messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ""}`}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg transition-all duration-base ease-swift hover:bg-[rgb(var(--primary-hover))] hover:shadow-xl active:scale-95"
      >
        <MessageSquare size={20} aria-hidden="true" />
        {unreadMessages > 0 && (
          <span className="tabular absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 py-0.5 text-xs font-bold leading-none text-white ring-2 ring-canvas">
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
      </Link>
    ) : (
      <button
        type="button"
        onClick={onSignIn}
        aria-label="Sign in to send messages"
        title="Sign in to message"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg transition-all duration-base ease-swift hover:bg-[rgb(var(--primary-hover))] hover:shadow-xl active:scale-95"
      >
        <MessageSquare size={20} aria-hidden="true" />
      </button>
    )}
  </aside>
);
