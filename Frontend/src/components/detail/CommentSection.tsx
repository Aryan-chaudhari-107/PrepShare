import React, { useState, useEffect, useCallback } from "react";
import { CommentOut } from "../../types";
import { commentsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { AuthorDisplay } from "../common/AuthorDisplay";

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentCountChange,
}) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [comments, setComments] = useState<CommentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await commentsApi.listForPost(postId, 1, 100);
      const items = res.data.items || [];
      setComments(items);
      if (onCommentCountChange) {
        onCommentCountChange(items.length);
      }
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
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to post comment.");
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
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to post reply.");
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
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to edit comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await commentsApi.deleteComment(commentId);
      success("Comment deleted.", "Deleted");
      await fetchComments();
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to delete comment.");
    }
  };

  // Group top-level comments and replies
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_comment_id === parentId);

  return (
    <div className="flex flex-col h-full">
      {/* Discussion Header */}
      <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between sticky top-0 bg-surface-elevated/95 backdrop-blur-sm z-10">
        <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <span>Discussion</span>
        </h2>
        <span className="text-xs font-semibold text-primary bg-primary-container/10 px-2.5 py-0.5 rounded-full">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </span>
      </div>

      {/* Discussion Content */}
      <div className="p-4 sm:p-5 flex flex-col gap-6 flex-1">
        {/* Comment Input Box */}
        <form onSubmit={handleAddComment} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs text-primary mt-1">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : "?"}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                isAuthenticated
                  ? "Ask a question about the rounds or share your experience..."
                  : "Sign in to join the discussion..."
              }
              disabled={!isAuthenticated || submitting}
              className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-xs sm:text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
            />
            <div className="flex justify-end">
              {isAuthenticated ? (
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container transition-all active:scale-95 disabled:opacity-40 shadow-sm"
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container transition-all active:scale-95 shadow-sm"
                >
                  Sign In to Comment
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="h-px bg-border-subtle"></div>

        {/* Comments List */}
        {loading ? (
          <div className="py-8 text-center text-xs text-on-surface-variant">
            Loading discussion...
          </div>
        ) : topLevel.length > 0 ? (
          <div className="flex flex-col gap-4">
            {topLevel.map((comment) => {
              const replies = getReplies(comment.id);
              const isOwner = user && comment.user_id === user.id;

              return (
                <div
                  key={comment.id}
                  className="bg-surface rounded-xl p-4 border border-border-subtle shadow-sm flex flex-col gap-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <AuthorDisplay author={comment.author} size="sm" />
                    <div className="flex items-center gap-2 text-[11px] text-outline">
                      {comment.is_edited && <span className="italic">(edited)</span>}
                      <span>
                        {new Date(comment.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {isOwner && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditText(comment.comment_text);
                            }}
                            className="text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-error hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Body */}
                  {editingId === comment.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={2}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="p-2.5 bg-surface-elevated border border-border-subtle rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-lg border border-border-subtle text-xs text-on-surface-variant hover:bg-surface-container"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          className="px-3 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                      {comment.comment_text}
                    </p>
                  )}

                  {/* Reply Button */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          openAuthModal("login");
                          return;
                        }
                        setReplyToId(replyToId === comment.id ? null : comment.id);
                        setReplyText("");
                      }}
                      className="text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">reply</span>
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Reply input box */}
                  {replyToId === comment.id && (
                    <div className="ml-4 pl-3 border-l-2 border-primary flex flex-col gap-2 pt-2 animate-in fade-in">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="p-2.5 bg-surface-elevated border border-border-subtle rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setReplyToId(null)}
                          className="px-3 py-1 rounded-lg border border-border-subtle text-xs text-on-surface-variant hover:bg-surface-container"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={submitting || !replyText.trim()}
                          onClick={() => handleAddReply(comment.id)}
                          className="px-3 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-40"
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Threaded Replies */}
                  {replies.length > 0 && (
                    <div className="ml-4 pl-3 border-l-2 border-border-subtle flex flex-col gap-3 mt-2">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-surface-container/40 p-3 rounded-lg flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <AuthorDisplay author={reply.author} size="sm" />
                            <span className="text-[10px] text-outline">
                              {new Date(reply.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                            {reply.comment_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-border-subtle text-center text-xs text-on-surface-variant">
            No comments in this discussion yet. Be the first to ask a question or leave notes.
          </div>
        )}
      </div>
    </div>
  );
};

