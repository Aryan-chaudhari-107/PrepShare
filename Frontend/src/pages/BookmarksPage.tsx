import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "../components/layout/AppShell";
import { PostCard } from "../components/feed/PostCard";
import { PostListItem } from "../types";
import { interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/common/Pagination";

export const BookmarksPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { error } = useToast();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setLoading(true);
    try {
      const res = await interactionsApi.getMyBookmarks(page, 10);
      setPosts(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to load bookmarks.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, openAuthModal, error]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col gap-6 flex-1">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <span className="material-symbols-outlined text-sm">bookmark</span>
            <span>SAVED FOR PREPARATION</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            Saved Experiences ({total})
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Interview experiences and technical dossiers bookmarked for quick review.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant animate-pulse">
            Loading bookmarks...
          </div>
        ) : posts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-surface-elevated rounded-2xl border border-dashed border-border-subtle">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">bookmark_border</span>
            <p className="text-sm font-bold text-on-surface">No Saved Experiences</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Click the bookmark icon on any post to save it to your personal study list.
            </p>
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
