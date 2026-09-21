import React, { useState } from "react";
import { Flag, AlertTriangle } from "lucide-react";
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
        <div className="p-3 bg-[#b26a00]/10 border border-[#b26a00]/20 rounded-xl text-xs text-[#b26a00] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#b26a00]" />
          <p className="leading-relaxed font-medium">
            If you believe this interview report violates community standards, contains false information, or exposes confidential personal data, please specify below.
          </p>
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please describe why this report should be reviewed..."
          className="w-full bg-[#f3eee1] border border-[#e3dccd] rounded-xl p-3 text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:border-[#3f6f52] outline-none resize-none h-28"
          required
          minLength={3}
        />

        <div className="flex justify-end gap-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#5f6e82] hover:text-[#0f1926] hover:bg-[#f3eee1] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold bg-[#b5462f] text-white hover:bg-[#963723] rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Flag className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
