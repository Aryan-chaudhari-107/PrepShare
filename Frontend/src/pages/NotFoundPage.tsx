import React from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

export const NotFoundPage: React.FC = () => {
  return (
    <AppShell>
      <main className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-border-subtle bg-surface-elevated shadow-sm text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-container/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
          404
        </div>
        <h1 className="text-xl font-bold text-on-surface">Page Not Found</h1>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          The page or interview experience you requested does not exist or has been removed.
        </p>
        <Link
          to="/"
          className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-all active:scale-95 shadow-sm"
        >
          Return to Feed
        </Link>
      </main>
    </AppShell>
  );
};

