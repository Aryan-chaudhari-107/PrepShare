import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CompletedQuestionItem } from "../types";
import { interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/common/Pagination";

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
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <span className="material-symbols-outlined text-sm">task_alt</span>
            <span>PREPARATION REPOSITORY</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            Solved Questions Archive ({total})
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Personal repository of coding problems and interview questions you have marked as completed.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant animate-pulse">
            Loading solved questions...
          </div>
        ) : questions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {questions.map((q) => (
              <div
                key={q.question_id}
                className="p-5 bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#15803d] text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Solved
                    </span>
                    {q.company_name && (
                      <span className="font-semibold text-on-surface">{q.company_name}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-outline">
                    {new Date(q.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-sm font-medium text-on-surface leading-relaxed whitespace-pre-wrap">
                  {q.question_text}
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-border-subtle text-xs">
                  <span className="text-on-surface-variant text-xs truncate max-w-md">
                    From: {q.post_title}
                  </span>
                  <Link
                    to={`/posts/${q.post_id}`}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-all shadow-sm active:scale-95"
                  >
                    View Experience →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-surface-elevated rounded-2xl border border-dashed border-border-subtle">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">task_alt</span>
            <p className="text-sm font-bold text-on-surface">No Questions Solved Yet</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Browse interview posts and mark solved questions to track your study progress.
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
