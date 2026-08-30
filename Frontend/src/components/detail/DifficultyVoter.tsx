import React, { useState } from "react";
import { interactionsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

interface DifficultyVoterProps {
  questionId: string;
  initialEasy: number;
  initialMedium: number;
  initialHard: number;
}

export const DifficultyVoter: React.FC<DifficultyVoterProps> = ({
  questionId,
  initialEasy,
  initialMedium,
  initialHard,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [easyCount, setEasyCount] = useState(initialEasy);
  const [medCount, setMedCount] = useState(initialMedium);
  const [hardCount, setHardCount] = useState(initialHard);
  const [myVote, setMyVote] = useState<"easy" | "medium" | "hard" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVote = async (difficulty: "easy" | "medium" | "hard") => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setLoading(true);
    try {
      const res = await interactionsApi.voteQuestionDifficulty(questionId, difficulty);
      const data = res.data;
      setEasyCount(data.easy_count);
      setMedCount(data.medium_count);
      setHardCount(data.hard_count);
      setMyVote(data.difficulty);
      success(data.message || "Difficulty vote recorded.", "Vote Recorded");
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to record difficulty evaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-on-surface-variant">Rate Difficulty:</span>
      <div className="flex bg-surface-container rounded-xl p-1 gap-1">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleVote("easy")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
            myVote === "easy"
              ? "bg-surface text-[#15803d] font-bold shadow-sm"
              : "text-on-surface-variant hover:text-[#15803d] hover:bg-surface/50"
          }`}
          title={`Vote Easy (Current: ${easyCount})`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
          <span>Easy</span>
          <span className="text-[10px] text-outline">({easyCount})</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleVote("medium")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
            myVote === "medium"
              ? "bg-surface text-[#b45309] font-bold shadow-sm"
              : "text-on-surface-variant hover:text-[#b45309] hover:bg-surface/50"
          }`}
          title={`Vote Medium (Current: ${medCount})`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
          <span>Medium</span>
          <span className="text-[10px] text-outline">({medCount})</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleVote("hard")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
            myVote === "hard"
              ? "bg-surface text-error font-bold shadow-sm"
              : "text-on-surface-variant hover:text-error hover:bg-surface/50"
          }`}
          title={`Vote Hard (Current: ${hardCount})`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
          <span>Hard</span>
          <span className="text-[10px] text-outline">({hardCount})</span>
        </button>
      </div>
    </div>
  );
};

