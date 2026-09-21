import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Building2, Calendar, ArrowRight } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { CompletedQuestionItem } from "../types";
import { interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/common/Pagination";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const CompletedQuestionsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { error } = useToast();

  const [questions, setQuestions] = useState<CompletedQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchQuestions = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setLoading(true);
    try {
      const res = await interactionsApi.getMyCompletedQuestions(undefined, undefined, page, 15);
      setQuestions(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to load completed questions.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, openAuthModal, error]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col gap-6 flex-1">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-[#e3dccd] pb-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2f7d52] mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#2f7d52]" />
            <span className="uppercase tracking-wider">PREPARATION REPOSITORY</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f1926]">
            Solved Questions Archive ({total})
          </h1>
          <p className="text-xs text-[#5f6e82] mt-1">
            Personal repository of coding problems and interview questions you have marked as completed.
          </p>
        </motion.div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#5f6e82] animate-pulse">
            Loading solved questions...
          </div>
        ) : questions.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {questions.map((q) => (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                key={q.question_id}
                className="p-5 bg-white rounded-2xl border border-[#e3dccd] shadow-sm flex flex-col gap-3 group hover:border-[#3f6f52]/40 transition-all"
              >
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2f7d52]/10 border border-[#2f7d52]/20 text-[#2f7d52] text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2f7d52]" />
                      Solved
                    </span>
                    {q.company_name && (
                      <span className="font-semibold text-[#0f1926] flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#5f6e82]" />
                        {q.company_name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#5f6e82] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#5f6e82]" />
                    {new Date(q.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-sm font-medium text-[#0f1926] leading-relaxed whitespace-pre-wrap">
                  {q.question_text}
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-[#e3dccd] text-xs flex-wrap gap-2">
                  <span className="text-[#5f6e82] text-xs truncate max-w-md">
                    From: <span className="text-[#0f1926] font-medium">{q.post_title}</span>
                  </span>
                  <Link
                    to={`/posts/${q.post_id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 text-[#2f6b47] font-semibold text-xs hover:bg-[#3f6f52]/20 transition-all shadow-xs active:scale-95 flex items-center gap-1 group/btn"
                  >
                    <span>View Experience</span>
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
            <div className="w-14 h-14 rounded-2xl bg-[#2f7d52]/10 border border-[#2f7d52]/20 flex items-center justify-center text-[#2f7d52]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-[#0f1926]">No Questions Solved Yet</p>
            <p className="text-xs text-[#5f6e82] max-w-sm">
              Browse interview posts and mark solved questions to track your study progress.
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
