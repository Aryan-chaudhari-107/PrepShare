import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PostListItem } from "../types";
import { usersApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/common/Pagination";

export const DraftsArchivePage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { error } = useToast();

  const [drafts, setDrafts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDrafts = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setLoading(true);
    try {
      const res = await usersApi.getMyDrafts(page, 10);
      setDrafts(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to load drafts.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, openAuthModal, error]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col gap-6 flex-1">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <span className="material-symbols-outlined text-sm">edit_document</span>
            <span>UNPUBLISHED POSTS</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            Draft Experiences ({total})
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Unpublished experiences and interview posts saved in your private workspace.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant animate-pulse">
            Loading drafts...
          </div>
        ) : drafts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="p-5 bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-border-subtle pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-secondary text-xs font-semibold">
                      Draft
                    </span>
                    <span className="font-semibold text-on-surface">{d.company_name || "Unlisted Company"}</span>
                  </div>
                  <span className="text-[11px] text-outline">
                    {new Date(d.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h2 className="text-base font-bold text-on-surface">{d.title}</h2>

                <div className="flex justify-between items-center pt-2 border-t border-border-subtle text-xs">
                  <span className="text-on-surface-variant">{d.round_count} Round(s) Configured</span>
                  <Link
                    to={`/posts/${d.id}`}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-all shadow-sm active:scale-95"
                  >
                    Resume Editing →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-surface-elevated rounded-2xl border border-dashed border-border-subtle">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">drafts</span>
            <p className="text-sm font-bold text-on-surface">No Active Drafts</p>
            <p className="text-xs text-on-surface-variant mt-1">All your interview experiences are published.</p>
          </div>
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
