import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bookmark, Compass } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { PostCard } from "../components/feed/PostCard";
import { PostListItem } from "../types";
import { interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/common/Pagination";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-[#e3dccd] pb-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2f6b47] mb-1">
            <Bookmark className="w-4 h-4 text-[#3f6f52]" />
            <span className="uppercase tracking-wider">SAVED FOR PREPARATION</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f1926]">
            Saved Experiences ({total})
          </h1>
          <p className="text-xs text-[#5f6e82] mt-1">
            Interview experiences and technical dossiers bookmarked for quick review and preparation.
          </p>
        </motion.div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#5f6e82] animate-pulse">
            Loading bookmarks...
          </div>
        ) : posts.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
          >
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 text-center bg-white rounded-2xl border border-dashed border-[#e3dccd] flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 flex items-center justify-center text-[#3f6f52]">
              <Compass className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-[#0f1926]">No Saved Experiences</p>
            <p className="text-xs text-[#5f6e82] max-w-sm">
              Click the bookmark icon on any post to save it to your personal study and review list.
            </p>
          </motion.div>
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
