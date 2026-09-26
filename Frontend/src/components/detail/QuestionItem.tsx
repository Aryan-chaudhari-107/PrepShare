import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, HelpCircle, Paperclip, ShieldCheck } from "lucide-react";
import { QuestionOut } from "../../types";
import { SPRING } from "../../motion";
import { DifficultyVoter } from "./DifficultyVoter";
import { getMediaUrl } from "../../utils/media";
import { interactionsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/format";
import { cn } from "../../lib/cn";

interface QuestionItemProps {
  question: QuestionOut;
  index: number;
}

/**
 * One question inside a round: statement, optional attachment, completion
 * toggle and the difficulty voter.
 *
 * The card itself is deliberately STILL — it is revealed by the round's
 * disclosure, so giving it its own entrance would double up on a gesture the
 * reader already watched. Motion here is reserved for the one moment that
 * deserves it: marking a question solved stamps the icon into place.
 *
 * The completion control is a real toggle (`aria-pressed`) rather than a
 * decorative chip.
 */
export const QuestionItem: React.FC<QuestionItemProps> = ({ question, index }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const [completed, setCompleted] = useState(Boolean(question.is_completed));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCompleted(Boolean(question.is_completed));
  }, [question.is_completed]);

  const handleToggleComplete = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setLoading(true);
    try {
      const res = await interactionsApi.toggleQuestionComplete(question.id);
      setCompleted(res.data.completed);
      success(res.data.message, res.data.completed ? "Marked Completed" : "Unmarked");
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to update completion status."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-6">
      {/* Header: question index, verification badge and the solved toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Question #{index + 1}
          </span>
          {question.is_verified && (
            <span className="flex items-center gap-1 rounded-full border border-success/25 bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={loading}
          aria-pressed={completed}
          aria-label={
            completed
              ? `Question ${index + 1} marked as solved`
              : `Mark question ${index + 1} as solved`
          }
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold",
            "transition-[color,background-color,border-color,transform] duration-fast ease-swift",
            "active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
            completed
              ? "border-success/30 bg-success-soft text-success"
              : "border-line bg-sunken text-muted hover:border-line-strong hover:bg-surface hover:text-heading"
          )}
        >
          {/* Re-keys on change, so confirming stamps the mark into place. */}
          <motion.span
            key={completed ? "solved" : "unsolved"}
            className="inline-flex"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING.bouncy}
          >
            {completed ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4" aria-hidden="true" />
            )}
          </motion.span>
          <span>{completed ? "Solved" : "Mark as Solved"}</span>
        </button>
      </div>

      {/* Problem statement */}
      <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-heading sm:text-base">
        {question.question_text || "No problem statement provided."}
      </div>

      {/* Attachment link, if any */}
      {question.attachment_url && (
        <div className="rounded-xl border border-line bg-raised p-3 text-xs">
          <a
            href={getMediaUrl(question.attachment_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium text-primary transition-colors duration-fast ease-swift hover:underline"
          >
            <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>View Attached Material / Document</span>
          </a>
        </div>
      )}

      {/* Difficulty voter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <DifficultyVoter
          questionId={question.id}
          initialEasy={question.easy_count}
          initialMedium={question.medium_count}
          initialHard={question.hard_count}
          initialMyVote={question.my_vote}
        />
      </div>
    </article>
  );
};
