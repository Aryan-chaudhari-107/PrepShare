import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ShieldCheck, Paperclip, HelpCircle } from "lucide-react";
import { QuestionOut } from "../../types";
import { DifficultyVoter } from "./DifficultyVoter";
import { getMediaUrl } from "../../utils/media";
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#e3dccd] p-5 sm:p-6 shadow-xs flex flex-col gap-4 relative group"
    >
      {/* Header with Question Index, Verification & Solved Toggle */}
      <div className="flex items-center justify-between border-b border-[#e3dccd] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-[#2f6b47] bg-[#3f6f52]/10 border border-[#3f6f52]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#2f6b47]" />
            Question #{index + 1}
          </span>
          {question.is_verified && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#2f7d52]/10 text-[#2f7d52] border border-[#2f7d52]/20 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2f7d52]" />
              Verified
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          disabled={loading}
          onClick={handleToggleComplete}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            completed
              ? "bg-[#2f7d52]/15 text-[#2f7d52] border border-[#2f7d52]/30 shadow-xs"
              : "bg-[#f3eee1] text-[#5f6e82] hover:text-[#0f1926] border border-[#e3dccd] hover:bg-white"
          }`}
        >
          {completed ? (
            <CheckCircle2 className="w-4 h-4 text-[#2f7d52]" />
          ) : (
            <Circle className="w-4 h-4 text-[#5f6e82]" />
          )}
          <span>{completed ? "Solved" : "Mark as Solved"}</span>
        </motion.button>
      </div>

      {/* Question Problem Statement */}
      <div className="text-sm sm:text-base text-[#0f1926] leading-relaxed whitespace-pre-wrap font-medium">
        {question.question_text || "No problem statement provided."}
      </div>

      {/* Attachment link if available */}
      {question.attachment_url && (
        <div className="p-3 bg-[#faf7ee] rounded-xl border border-[#e3dccd] text-xs">
          <a
            href={getMediaUrl(question.attachment_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2f6b47] hover:text-[#3f6f52] flex items-center gap-2 font-medium transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            <span>View Attached Material / Document</span>
          </a>
        </div>
      )}

      {/* Difficulty Voter */}
      <div className="pt-3 border-t border-[#e3dccd] flex items-center justify-between flex-wrap gap-3">
        <DifficultyVoter
          questionId={question.id}
          initialEasy={question.easy_count}
          initialMedium={question.medium_count}
          initialHard={question.hard_count}
        />
      </div>
    </motion.div>
  );
};
