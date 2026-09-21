import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileEdit, Layers, ArrowRight, Inbox, Building2, Calendar } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { PostListItem } from "../types";
import { usersApi } from "../api";
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-[#e3dccd] pb-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2f6b47] mb-1">
            <FileEdit className="w-4 h-4 text-[#3f6f52]" />
            <span className="uppercase tracking-wider">UNPUBLISHED POSTS</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f1926]">
            Draft Experiences ({total})
          </h1>
          <p className="text-xs text-[#5f6e82] mt-1">
            Unpublished experiences and interview posts saved in your private workspace.
          </p>
        </motion.div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#5f6e82] animate-pulse">
            Loading drafts...
          </div>
        ) : drafts.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
          >
            {drafts.map((d) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={d.id}
                className="p-5 sm:p-6 bg-white rounded-2xl border border-[#e3dccd] shadow-sm flex flex-col gap-3.5 group hover:border-[#3f6f52]/40 transition-all"
              >
                <div className="flex items-center justify-between border-b border-[#e3dccd] pb-2.5 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#b26a00]/10 border border-[#b26a00]/20 text-[#b26a00] text-xs font-bold">
                      Draft
                    </span>
                    <span className="font-semibold text-[#0f1926] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#5f6e82]" />
                      {d.company_name || "Unlisted Company"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5f6e82] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#5f6e82]" />
                    {new Date(d.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h2 className="text-base font-bold text-[#0f1926] group-hover:text-[#2f6b47] transition-colors">
                  {d.title}
                </h2>

                <div className="flex justify-between items-center pt-2 border-t border-[#e3dccd] text-xs flex-wrap gap-2">
                  <span className="text-[#5f6e82] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#5f6e82]" />
                    {d.round_count} Round(s) Configured
                  </span>
                  <Link
                    to={`/posts/${d.id}`}
                    className="px-4 py-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-semibold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5 group/btn"
                  >
                    <span>Resume Editing</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 text-center bg-white rounded-2xl border border-dashed border-[#e3dccd] flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 flex items-center justify-center text-[#3f6f52]">
              <Inbox className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-[#0f1926]">No Active Drafts</p>
            <p className="text-xs text-[#5f6e82] mt-0.5">All your interview experiences are published and live on the feed.</p>
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
