import React, { useState } from "react";
import { Modal } from "./Modal";
import { reportsApi } from "../../api";
import { useToast } from "../../context/ToastContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      error("Please enter a detailed reason (minimum 3 characters).", "Invalid Reason");
      return;
    }

    try {
      setIsSubmitting(true);
      await reportsApi.create({
        post_id: postId,
        reason: reason.trim(),
      });
      success("Report submitted for moderation review.", "Report Received");
      setReason("");
      onClose();
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to submit moderation report.", "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Experience"
      subtitle={`Flagging: ${postTitle}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-on-surface-variant">
          If you believe this interview report violates community standards, contains false information, or exposes confidential personal data, please specify below.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please describe why this report should be reviewed..."
          className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface placeholder-on-surface-variant/60 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none h-28"
          required
          minLength={3}
        />

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold bg-error text-on-error hover:bg-error/90 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Report</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
