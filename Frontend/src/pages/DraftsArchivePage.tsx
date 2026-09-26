import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Calendar, FileEdit, Layers, Lock } from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { Pagination } from "../components/common/Pagination";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LINK_PRIMARY,
  LINK_SECONDARY,
  PageHeader,
  SkeletonList,
} from "../components/ui";
import { Scene, Section } from "../motion";
import { PostListItem } from "../types";
import { usersApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { absoluteDate, errorMessage } from "../lib/format";

/** The five panels that can occupy the list region — one slot, one rhythm. */
type Slot = "signed-out" | "loading" | "error" | "empty" | "list";

/**
 * Unpublished drafts.
 *
 * Guest handling: the fetch bails out BEFORE any request and releases the
 * loading flag; guests get a sign-in state instead of a spinner that could
 * never resolve.
 *
 * LIST LANGUAGE (identical on Bookmarks / Notifications / Completed questions):
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
 * ROW ANATOMY (the one this page owns): status eyebrow (chips left, nothing
 * competing on the right) → title as the primary line → metadata where labels
 * recede and values hold → actions trailing. The card is not itself a link,
 * so its hover is colour-only (border strengthens, title warms) — transform is
 * reserved for the real actions inside it, which keeps touch devices free of
 * sticky hover lift.
 */
export const DraftsArchivePage: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await usersApi.getMyDrafts(page, 10);
      setDrafts(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err: unknown) {
      // Keep the previous page on screen — an error is not "empty".
      setLoadError(errorMessage(err, "Failed to load drafts."));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const slot: Slot = !isAuthLoading && !isAuthenticated
    ? "signed-out"
    : isAuthLoading || loading
    ? "loading"
    : loadError
    ? "error"
    : drafts.length === 0
    ? "empty"
    : "list";

  return (
    <>
      <PageContainer width="list">
        <Scene>
          <Section key="header">
            <PageHeader
              title="Draft experiences"
              description="Unpublished experiences and interview posts saved in your private workspace."
              icon={<FileEdit size={20} aria-hidden="true" />}
              actions={
                isAuthenticated && !loading && total > 0 ? (
                  <Badge tone="primary">
                    {total} {total === 1 ? "draft" : "drafts"}
                  </Badge>
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
                art="rounds"
                title="Sign in to see your drafts"
                description="Drafts stay private to your account until you publish them."
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
              <ErrorState description={loadError} onRetry={fetchDrafts} />
            ) : slot === "empty" ? (
              <EmptyState
                art="stack"
                title="No drafts yet"
                description="All your interview experiences are published and live on the feed."
                action={
                  <Button
                    icon={<FileEdit size={16} aria-hidden="true" />}
                    onClick={() => navigate("/draft")}
                  >
                    Start a draft
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-4">
                {drafts.map((d) => (
                  <li key={d.id}>
                    <Card className="group transition-colors duration-fast ease-swift hover:border-line-strong">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-3">
                          {/* Eyebrow: what this file is and where it came from */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="warning">Draft</Badge>
                            <CategoryBadge category={d.post_category} size="xs" />
                            {d.company_name && (
                              <Badge
                                tone="neutral"
                                icon={<Building2 size={12} aria-hidden="true" />}
                              >
                                {d.company_name}
                              </Badge>
                            )}
                          </div>

                          {/* Primary line */}
                          <h2 className="text-lg font-semibold tracking-tight text-heading transition-colors duration-fast ease-swift group-hover:text-primary">
                            {d.title}
                          </h2>

                          {/* Metadata: labels recede, values hold */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <span className="flex items-center gap-1.5 text-faint">
                              <Calendar size={14} aria-hidden="true" />
                              Created{" "}
                              <time className="tabular font-medium text-body" dateTime={d.created_at}>
                                {absoluteDate(d.created_at)}
                              </time>
                            </span>
                            <span className="flex items-center gap-1.5 text-faint">
                              <Layers size={14} aria-hidden="true" />
                              <span className="tabular font-medium text-body">{d.round_count}</span>{" "}
                              {d.round_count === 1 ? "round" : "rounds"} configured
                            </span>
                          </div>
                        </div>

                        {/* Trailing affordances — every action is a real link */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Link to={`/posts/${d.id}`} className={LINK_SECONDARY}>
                            View draft
                          </Link>
                          <Link to="/draft" className={LINK_PRIMARY}>
                            Continue editing
                            <ArrowRight
                              size={14}
                              className="transition-transform duration-fast ease-swift group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
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
                noun="draft"
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
