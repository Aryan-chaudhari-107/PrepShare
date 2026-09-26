import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Calendar, CheckCircle2, Lock } from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import { Pagination } from "../components/common/Pagination";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LINK_SECONDARY,
  PageHeader,
  SkeletonList,
} from "../components/ui";
import { Scene, Section } from "../motion";
import { CompletedQuestionItem } from "../types";
import { interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { absoluteDate, errorMessage } from "../lib/format";

/** The five panels that can occupy the list region — one slot, one rhythm. */
type Slot = "signed-out" | "loading" | "error" | "empty" | "list";

/**
 * Personal archive of questions marked as completed.
 *
 * Guest handling: the fetch bails out BEFORE any request and releases the
 * loading flag; guests get a sign-in state instead of a spinner that could
 * never resolve.
 *
 * LIST LANGUAGE (identical on Bookmarks / Notifications / Drafts):
 *  - the page is a `Scene`: header → list → pagination cascade on the design
 *    system's own `item` rhythm, so no page carries a private timing literal;
 *  - all five states share ONE keyed `Section` slot. Nothing waits to leave —
 *    the outgoing panel unmounts instantly instead of sitting through a
 *    `mode="wait"` exit — and the incoming panel mounts immediately and
 *    settles with `item`. The loading placeholder is `still`: skeletons paint
 *    at once, resolved content lands.
 *  - rows carry no per-row stagger. A utility list arrives as one surface, so
 *    refetches and page changes never re-fire a cascade.
 *
 * ROW ANATOMY (the one this page owns): status eyebrow with the date filed at
 * the far right → the question as the single primary line → a footer that
 * sources it. The card is not itself a link, so its hover is colour-only (border
 * strengthens, question warms); transform belongs to the real action, which
 * keeps touch devices free of sticky hover lift.
 */
export const CompletedQuestionsPage: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<CompletedQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await interactionsApi.getMyCompletedQuestions(undefined, undefined, page, 15);
      setQuestions(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err: unknown) {
      // Keep the previous page on screen — an error is not "empty".
      setLoadError(errorMessage(err, "Failed to load completed questions."));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const slot: Slot = !isAuthLoading && !isAuthenticated
    ? "signed-out"
    : isAuthLoading || loading
    ? "loading"
    : loadError
    ? "error"
    : questions.length === 0
    ? "empty"
    : "list";

  return (
    <>
      <PageContainer width="list">
        <Scene>
          <Section key="header">
            <PageHeader
              title="Completed questions"
              description="Personal repository of coding problems and interview questions you have marked as completed."
              icon={<CheckCircle2 size={20} aria-hidden="true" />}
              actions={
                isAuthenticated && !loading && total > 0 ? (
                  <Badge tone="success">{total} completed</Badge>
                ) : null
              }
            >
              {/* The rule the index hangs from: chrome above, content below. */}
              <Divider className="mt-5" />
            </PageHeader>
          </Section>

          <Section key={slot} still={slot === "loading"}>
            {slot === "signed-out" ? (
              <EmptyState
                art="stack"
                title="Sign in to see your completed questions"
                description="Your progress is tracked per account, so sign in to pick up where you left off."
                action={
                  <Button
                    icon={<Lock size={16} aria-hidden="true" />}
                    onClick={() => openAuthModal("login")}
                  >
                    Sign in
                  </Button>
                }
              />
            ) : slot === "loading" ? (
              <SkeletonList count={5} />
            ) : slot === "error" ? (
              <ErrorState description={loadError} onRetry={fetchQuestions} />
            ) : slot === "empty" ? (
              <EmptyState
                art="rounds"
                title="No completed questions yet"
                description="Browse interview posts and mark the questions you have practised — they will collect here."
                action={
                  <Button
                    iconRight={<ArrowRight size={16} aria-hidden="true" />}
                    onClick={() => navigate("/feed")}
                  >
                    Explore the feed
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {questions.map((q) => (
                  <li key={q.question_id}>
                    <Card className="group transition-colors duration-fast ease-swift hover:border-line-strong">
                      {/* Eyebrow: status, classification, and when it was filed */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="success" icon={<CheckCircle2 size={12} aria-hidden="true" />}>
                          Completed
                        </Badge>
                        {q.company_name && (
                          <Badge tone="neutral" icon={<Building2 size={12} aria-hidden="true" />}>
                            {q.company_name}
                          </Badge>
                        )}
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-faint">
                          <Calendar size={14} aria-hidden="true" />
                          <time className="tabular text-muted" dateTime={q.completed_at}>
                            {absoluteDate(q.completed_at)}
                          </time>
                        </span>
                      </div>

                      {/* Primary line */}
                      <p className="mt-3 whitespace-pre-wrap text-base font-medium leading-relaxed text-heading transition-colors duration-fast ease-swift group-hover:text-primary">
                        {q.question_text ?? "—"}
                      </p>

                      {/* Footer: sources the question, then the one action */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                        <span className="min-w-0 truncate text-xs text-faint">
                          From{" "}
                          <span className="text-sm font-medium text-heading">{q.post_title}</span>
                        </span>
                        <Link to={`/posts/${q.post_id}`} className={LINK_SECONDARY}>
                          View experience
                          <ArrowRight
                            size={14}
                            className="transition-transform duration-fast ease-swift group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {isAuthenticated && !loadError && (
            <Section key="pagination" className="mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                noun="completed question"
                isLoading={loading}
                onPageChange={(p) => setPage(p)}
              />
            </Section>
          )}
        </Scene>
      </PageContainer>
    </>
  );
};
