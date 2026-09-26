import React, { useId, useState } from "react";
import { AlertTriangle, Flag } from "lucide-react";
import { Modal } from "./Modal";
import { Button, Field } from "../ui";
import { reportsApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/format";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
}

const MIN_REASON_LENGTH = 3;

/**
 * Moderation report dialog. Rendering through `<Modal>` gives it
 * role="dialog", aria-modal, a focus trap, Escape-to-close and correct body
 * scroll restore. Submit stays disabled until the reason is long enough, shows
 * a loading state while the request is in flight, and only closes on success.
 */
export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const formId = useId();
  const reasonId = `${formId}-reason`;

  const trimmedReason = reason.trim();
  const remaining = MIN_REASON_LENGTH - trimmedReason.length;
  const isValid = remaining <= 0;

  const hint =
    remaining > 0
      ? `Add ${remaining} more character${remaining === 1 ? "" : "s"} before submitting.`
      : "Thanks — this reason is ready to submit.";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      error(
        `Please enter a detailed reason (minimum ${MIN_REASON_LENGTH} characters).`,
        "Invalid Reason"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await reportsApi.create({
        post_id: postId,
        reason: trimmedReason,
      });
      success("Report submitted for moderation review.", "Report Received");
      setReason("");
      onClose();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to submit moderation report."));
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
      maxWidth="max-w-lg"
      dismissOnBackdrop={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="danger"
            icon={<Flag size={16} />}
            loading={isSubmitting}
            disabled={!isValid}
          >
            Submit Report
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            If you believe this interview report violates community standards, contains false
            information, or exposes confidential personal data, please specify below.
          </p>
        </div>

        <Field label="Reason" htmlFor={reasonId} hint={hint} required>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Please describe why this report should be reviewed..."
            required
            minLength={MIN_REASON_LENGTH}
            className="field min-h-[112px] resize-y"
          />
        </Field>
      </form>
    </Modal>
  );
};
