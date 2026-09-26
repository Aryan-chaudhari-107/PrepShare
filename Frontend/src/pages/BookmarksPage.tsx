import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Compass, Lock } from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import { PostCard } from "../components/feed/PostCard";
import { Pagination } from "../components/common/Pagination";
import {
  Badge,
  Button,
  Divider,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
} from "../components/ui";
import { Scene, Section } from "../motion";
import { PostListItem } from "../types";
import { interactionsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/format";

/** The five panels that can occupy the list region — one slot, one rhythm. */
type Slot = "signed-out" | "loading" | "error" | "empty" | "list";

/**
 * Bookmarked experiences.
 *
 * Guest handling: the fetch bails out BEFORE any request and releases the
 * loading flag, and the signed-out state renders below. The old code returned
 * here while `loading` stayed `true`, so a guest who dismissed the auth modal
 * sat on "Loading…" forever.
 *
 * LIST LANGUAGE (identical on Notifications / Drafts / Completed questions):
 *  - the page is a `Scene`: header → list → pagination cascade on the design
 *    system's own `item` rhythm, so no page carries a private timing literal;
 *  - all five states share ONE keyed `Section` slot. Nothing waits to leave —
 *    the outgoing panel unmounts instantly instead of sitting through a
 *    `mode="wait"` exit — and the incoming panel mounts immediately and
 *    settles with `item`. The loading placeholder is `still`: skeletons paint
 *    at once, resolved content lands.
 *  - rows carry no per-row stagger. A utility list arrives as one surface, so
 *    refetches and page changes never re-fire a cascade.
 */
export const BookmarksPage: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await interactionsApi.getMyBookmarks(page, 10);
      setPosts(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err: unknown) {
      // Keep whatever we already have on screen — an error is not "empty".
      setLoadError(errorMessage(err, "Failed to load bookmarks."));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const slot: Slot = !isAuthLoading && !isAuthenticated
    ? "signed-out"
    : isAuthLoading || loading
    ? "loading"
    : loadError
    ? "error"
    : posts.length === 0
    ? "empty"
    : "list";

  return (
    <>
      <PageContainer width="list">
        <Scene>
          <Section key="header">
            <PageHeader
              title="Bookmarks"
              description="Interview experiences you've saved for quick review and preparation."
              icon={<Bookmark size={20} aria-hidden="true" />}
              actions={
                isAuthenticated && !loading && total > 0 ? (
                  <Badge tone="primary">{total} saved</Badge>
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
                title="Sign in to see your bookmarks"
                description="Your saved interview experiences are private to your account."
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
              <Loading label="Loading bookmarks…" />
            ) : slot === "error" ? (
              <ErrorState description={loadError} onRetry={fetchBookmarks} />
            ) : slot === "empty" ? (
              <EmptyState
                art="stack"
                title="No bookmarks yet"
                description="Use the bookmark icon on any post to save it to your personal review list."
                action={
                  <Button
                    icon={<Compass size={16} aria-hidden="true" />}
                    onClick={() => navigate("/feed")}
                  >
                    Explore the feed
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} />
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
                noun="bookmark"
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
