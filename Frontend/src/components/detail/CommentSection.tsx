import React, { useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownRight, Edit3, MessageSquare, Send, Trash2 } from "lucide-react";
import { CommentOut } from "../../types";
import { commentsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { AuthorDisplay } from "../common/AuthorDisplay";
import { Avatar, Button, ConfirmDialog, Divider, EmptyState, IconButton, Loading } from "../ui";
import { DURATION, EASE, disclosure } from "../../motion";
import { errorMessage, fullDate, relativeDate } from "../../lib/format";

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

/**
 * Threaded discussion for one experience. Timestamps go through
 * `relativeDate` / `fullDate` so a null or malformed `createdAt` renders "—"
 * instead of "Invalid Date", and destructive deletion is confirmed through
 * `ConfirmDialog` instead of `window.confirm()`.
 */
export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentCountChange,
}) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const baseId = useId();

  const [comments, setComments] = useState<CommentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await commentsApi.listForPost(postId, 1, 100);
      const items = res.data.items || [];
      setComments(items);
      onCommentCountChange?.(items.length);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId, onCommentCountChange]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await commentsApi.addComment(postId, { comment_text: commentText.trim() });
      setCommentText("");
      success("Comment posted to discussion.", "Comment Added");
      await fetchComments();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to post comment."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      await commentsApi.addComment(postId, {
        comment_text: replyText.trim(),
        parent_comment_id: parentCommentId,
      });
      setReplyText("");
      setReplyToId(null);
      success("Reply posted successfully.", "Reply Added");
      await fetchComments();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to post reply."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await commentsApi.editComment(commentId, { comment_text: editText.trim() });
      setEditingId(null);
      success("Comment updated successfully.", "Comment Updated");
      await fetchComments();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to edit comment."));
    }
  };

  const confirmDeleteComment = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await commentsApi.deleteComment(pendingDeleteId);
      setPendingDeleteId(null);
      success("Comment deleted.", "Deleted");
      await fetchComments();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to delete comment."));
    } finally {
      setDeleting(false);
    }
  };

  // Group top-level comments and their replies.
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_comment_id === parentId);

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Discussion header */}
      <div className="hidden sticky top-0 z-10 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-4 backdrop-blur sm:px-5 lg:flex">
        <h2 className="flex items-center gap-2 text-base font-semibold text-heading">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Discussion</span>
        </h2>
        <span className="rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">
        {/* New comment */}
        <form onSubmit={handleAddComment} className="flex gap-3">
          <Avatar size="sm" name={user?.username} className="mt-1" />
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor={`${baseId}-comment`} className="sr-only">
              Your comment
            </label>
            <textarea
              id={`${baseId}-comment`}
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                isAuthenticated
                  ? "Ask a question about the rounds or share thoughts..."
                  : "Sign in to join the discussion..."
              }
              disabled={!isAuthenticated || submitting}
              className="field min-h-[84px] resize-none"
            />
            <div className="flex justify-end">
              {isAuthenticated ? (
                <Button
                  type="submit"
                  size="sm"
                  icon={<Send size={14} />}
                  loading={submitting}
                  disabled={!commentText.trim()}
                >
                  Post Comment
                </Button>
              ) : (
                <Button type="button" size="sm" variant="secondary" onClick={() => openAuthModal("login")}>
                  Sign In to Comment
                </Button>
              )}
            </div>
          </div>
        </form>

        <Divider />

        {/* Comments list */}
        {loading ? (
          <Loading compact label="Loading discussion..." />
        ) : topLevel.length > 0 ? (
          <div className="scrollbar-slim flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto pr-1">
            {topLevel.map((comment) => {
              const replies = getReplies(comment.id);
              const isOwner = Boolean(
                user && (comment.author?.user_id === user.id || comment.user_id === user.id)
              );

              return (
                <motion.article
                  key={comment.id}
                  // Fades ONCE when it mounts (first paint, or a comment you
                  // just posted). No travel: the discussion rail is a reading
                  // surface, and rows that slide while you scroll feel sticky.
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: DURATION.fast, ease: EASE.enter }}
                  className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-4 shadow-xs"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
                    <AuthorDisplay author={comment.author} size="sm" />
                    <div className="flex ml-auto shrink-0 items-center gap-1.5 text-xs text-muted">
                      {comment.is_edited && <span className="italic">(edited)</span>}
                      <time
                        dateTime={comment.created_at}
                        title={fullDate(comment.created_at)}
                        className="tabular"
                      >
                        {relativeDate(comment.created_at)}
                      </time>
                      {isOwner && (
                        <span className="ml-1 flex items-center gap-0.5">
                          <IconButton
                            label="Edit comment"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditText(comment.comment_text);
                            }}
                          >
                            <Edit3 size={14} aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            label="Delete comment"
                            tone="danger"
                            onClick={() => setPendingDeleteId(comment.id)}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </IconButton>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  {editingId === comment.id ? (
                    <div className="mt-1 flex flex-col gap-2">
                      <label htmlFor={`${baseId}-edit`} className="sr-only">
                        Edit your comment
                      </label>
                      <textarea
                        id={`${baseId}-edit`}
                        rows={2}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="field min-h-[64px] resize-y"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editText.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-body">
                      {comment.comment_text}
                    </p>
                  )}

                  {/* Reply trigger */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          openAuthModal("login");
                          return;
                        }
                        setReplyToId(replyToId === comment.id ? null : comment.id);
                        setReplyText("");
                      }}
                      className="flex cursor-pointer items-center gap-1 font-semibold text-primary transition-colors hover:underline"
                    >
                      <CornerDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Reply composer */}
                  <AnimatePresence initial={false}>
                    {replyToId === comment.id && (
                      <motion.div
                        variants={disclosure}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="ml-3 flex flex-col gap-2 overflow-hidden border-l-2 border-primary/40 pl-3 pt-2"
                      >
                        <label htmlFor={`${baseId}-reply`} className="sr-only">
                          Your reply
                        </label>
                        <textarea
                          id={`${baseId}-reply`}
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          className="field min-h-[64px] resize-y"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setReplyToId(null)}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            loading={submitting}
                            disabled={!replyText.trim()}
                            onClick={() => handleAddReply(comment.id)}
                          >
                            Post Reply
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Threaded replies */}
                  {replies.length > 0 && (
                    <div className="ml-3 mt-2 flex flex-col gap-2.5 border-l-2 border-line pl-3">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="flex flex-col gap-1.5 rounded-lg border border-line bg-raised p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
                            <AuthorDisplay author={reply.author} size="sm" />
                            <time
                              dateTime={reply.created_at}
                              title={fullDate(reply.created_at)}
                              className="tabular ml-auto shrink-0 text-xs text-muted"
                            >
                              {relativeDate(reply.created_at)}
                            </time>
                          </div>
                          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs leading-relaxed text-body">
                            {reply.comment_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            art="chat"
            title="No comments yet"
            description="Be the first to ask a question about this round or leave notes for other candidates."
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDeleteComment}
        title="Delete this comment?"
        message="The comment is removed from the discussion immediately. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
};
