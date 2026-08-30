import React, { useState } from "react";
import { QuestionOut } from "../../types";
import { DifficultyVoter } from "./DifficultyVoter";
import { interactionsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

interface QuestionItemProps {
  question: QuestionOut;
  index: number;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({ question, index }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to update completion status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-elevated rounded-xl border border-border-subtle p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* Header with Question Index, Verification & Solved Toggle */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-primary bg-primary-container/10 px-2.5 py-1 rounded-full">
            Question #{index + 1}
          </span>
          {question.is_verified && (
            <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#15803d] border border-[#22C55E]/20 text-[11px] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              Verified
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleToggleComplete}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            completed
              ? "bg-[#22C55E]/15 text-[#15803d] border border-[#22C55E]/30 shadow-sm"
              : "bg-surface text-on-surface-variant hover:text-on-surface border border-border-subtle hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {completed ? "check_circle" : "radio_button_unchecked"}
          </span>
          <span>{completed ? "Solved" : "Mark as Solved"}</span>
        </button>
      </div>

      {/* Question Problem Statement */}
      <div className="text-sm sm:text-base text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
        {question.question_text || "No problem statement provided."}
      </div>

      {/* Attachment link if available */}
      {question.attachment_url && (
        <div className="p-3 bg-surface rounded-xl border border-border-subtle text-xs">
          <a
            href={question.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-2 font-medium"
          >
            <span className="material-symbols-outlined text-base">attachment</span>
            <span>View Attached Material / Document</span>
          </a>
        </div>
      )}

      {/* Difficulty Voter */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between flex-wrap gap-3">
        <DifficultyVoter
          questionId={question.id}
          initialEasy={question.easy_count}
          initialMedium={question.medium_count}
          initialHard={question.hard_count}
        />
      </div>
    </div>
  );
};

