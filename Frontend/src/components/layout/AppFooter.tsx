import React from "react";
import { Link } from "react-router-dom";

/** Site footer — mounted once inside the app shell, below the route outlet. */
export const AppFooter: React.FC<{
  isAuthenticated: boolean;
  onSignIn: () => void;
  onOpenPrivacy: () => void;
}> = ({ isAuthenticated, onSignIn, onOpenPrivacy }) => (
  /* pb-24 keeps footer links clear of the fixed Messages FAB's
     bottom-right band (68px) when the page is scrolled to its end;
     from 2xl up the viewport is wide enough that the centered shell
     never reaches the FAB, so the original rhythm returns. */
  <footer className="mt-auto border-t border-line bg-surface/60 px-4 pb-24 pt-7 sm:px-6 lg:px-8 2xl:pb-7">
    <div className="mx-auto flex w-full max-w-shell flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-heading">PrepShare</span>
        <span aria-hidden="true" className="text-faint">
          ·
        </span>
        <span>Real interview intelligence &amp; mentorship</span>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <Link to="/feed" className="transition-colors hover:text-primary">
          Explore Feed
        </Link>
        {isAuthenticated ? (
          <Link to="/draft" className="transition-colors hover:text-primary">
            Share Experience
          </Link>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="transition-colors hover:text-primary"
          >
            Share Experience
          </button>
        )}
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="transition-colors hover:text-primary"
        >
          Privacy &amp; Terms
        </button>
      </nav>
    </div>
  </footer>
);
