import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Edit3, Trash2, CornerDownRight } from "lucide-react";
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
    <div className="flex flex-col h-full bg-[#faf7ee]/80">
      {/* Discussion Header */}
      <div className="p-4 sm:p-5 border-b border-[#e3dccd] flex items-center justify-between sticky top-0 bg-[#faf7ee]/95 backdrop-blur-md z-10">
        <h2 className="text-base font-bold text-[#0f1926] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#2f6b47]" />
          <span>Discussion</span>
        </h2>
        <span className="text-xs font-semibold text-[#2f6b47] bg-[#3f6f52]/10 border border-[#3f6f52]/20 px-2.5 py-0.5 rounded-full">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </span>
      </div>

      {/* Discussion Content */}
      <div className="p-4 sm:p-5 flex flex-col gap-5 flex-1">
        {/* Comment Input Box */}
        <form onSubmit={handleAddComment} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#3f6f52] overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs text-white shadow-xs mt-1">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : "?"}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                isAuthenticated
                  ? "Ask a question about the rounds or share thoughts..."
                  : "Sign in to join the discussion..."
              }
              disabled={!isAuthenticated || submitting}
              className="w-full bg-white border border-[#e3dccd] rounded-xl p-3 text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:border-[#3f6f52] outline-none transition-all resize-none"
            />
            <div className="flex justify-end">
              {isAuthenticated ? (
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-2 bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Posting..." : "Post Comment"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="px-4 py-2 bg-[#3f6f52] hover:bg-[#345c44] text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  Sign In to Comment
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="h-px bg-[#e3dccd]"></div>

        {/* Comments List */}
        {loading ? (
          <div className="py-8 text-center text-xs text-[#5f6e82] animate-pulse">
            Loading discussion...
          </div>
        ) : topLevel.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {topLevel.map((comment) => {
              const replies = getReplies(comment.id);
              const isOwner = user && comment.user_id === user.id;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={comment.id}
                  className="bg-white rounded-xl p-4 border border-[#e3dccd] shadow-xs flex flex-col gap-2.5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <AuthorDisplay author={comment.author} size="sm" />
                    <div className="flex items-center gap-2 text-[11px] text-[#5f6e82]">
                      {comment.is_edited && <span className="italic text-[#5f6e82]">(edited)</span>}
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
                            className="text-[#2f6b47] hover:text-[#3f6f52] p-0.5 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[#b5462f] hover:text-[#963723] p-0.5 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Body */}
                  {editingId === comment.id ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <textarea
                        rows={2}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="p-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-lg text-xs text-[#0f1926] focus:outline-none focus:ring-1 focus:ring-[#3f6f52]"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-lg border border-[#e3dccd] text-xs text-[#5f6e82] hover:bg-[#f3eee1] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          className="px-3 py-1 rounded-lg bg-[#3f6f52] text-white text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#2b3a4f] leading-relaxed whitespace-pre-wrap">
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
                      className="text-[#2f6b47] hover:text-[#3f6f52] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Reply input box */}
                  <AnimatePresence>
                    {replyToId === comment.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-3 pl-3 border-l-2 border-[#3f6f52] flex flex-col gap-2 pt-2"
                      >
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          className="p-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-lg text-xs text-[#0f1926] focus:ring-1 focus:ring-[#3f6f52] outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setReplyToId(null)}
                            className="px-3 py-1 rounded-lg border border-[#e3dccd] text-xs text-[#5f6e82] hover:bg-[#f3eee1] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={submitting || !replyText.trim()}
                            onClick={() => handleAddReply(comment.id)}
                            className="px-3 py-1 rounded-lg bg-[#3f6f52] hover:bg-[#345c44] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                          >
                            Post Reply
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Threaded Replies */}
                  {replies.length > 0 && (
                    <div className="ml-3 pl-3 border-l-2 border-[#e3dccd] flex flex-col gap-2.5 mt-2">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-[#faf7ee] p-3 rounded-lg flex flex-col gap-1.5 border border-[#e3dccd]"
                        >
                          <div className="flex items-center justify-between">
                            <AuthorDisplay author={reply.author} size="sm" />
                            <span className="text-[10px] text-[#5f6e82]">
                              {new Date(reply.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-[#2b3a4f] leading-relaxed whitespace-pre-wrap">
                            {reply.comment_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-[#e3dccd] text-center text-xs text-[#5f6e82] flex flex-col items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#5f6e82]" />
            <span>No comments in this discussion yet. Be the first to ask a question or leave notes.</span>
          </div>
        )}
      </div>
    </div>
  );
};
