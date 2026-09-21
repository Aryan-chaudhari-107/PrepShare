import React, { useState } from "react";
import { motion } from "framer-motion";
import { Smile, Meh, Frown } from "lucide-react";
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
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-[#0f1926]">Rate Difficulty:</span>
      <div className="flex bg-[#f3eee1] rounded-xl p-1 gap-1 border border-[#e3dccd]">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={loading}
          onClick={() => handleVote("easy")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            myVote === "easy"
              ? "bg-[#2f7d52]/15 text-[#2f7d52] font-bold border border-[#2f7d52]/30 shadow-xs"
              : "text-[#5f6e82] hover:text-[#2f7d52] hover:bg-white"
          }`}
          title={`Vote Easy (Current: ${easyCount})`}
        >
          <Smile className="w-3.5 h-3.5 text-[#2f7d52]" />
          <span>Easy</span>
          <span className="text-[10px] text-[#5f6e82] font-normal">({easyCount})</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={loading}
          onClick={() => handleVote("medium")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            myVote === "medium"
              ? "bg-[#b26a00]/15 text-[#b26a00] font-bold border border-[#b26a00]/30 shadow-xs"
              : "text-[#5f6e82] hover:text-[#b26a00] hover:bg-white"
          }`}
          title={`Vote Medium (Current: ${medCount})`}
        >
          <Meh className="w-3.5 h-3.5 text-[#b26a00]" />
          <span>Medium</span>
          <span className="text-[10px] text-[#5f6e82] font-normal">({medCount})</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={loading}
          onClick={() => handleVote("hard")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            myVote === "hard"
              ? "bg-[#b5462f]/15 text-[#b5462f] font-bold border border-[#b5462f]/30 shadow-xs"
              : "text-[#5f6e82] hover:text-[#b5462f] hover:bg-white"
          }`}
          title={`Vote Hard (Current: ${hardCount})`}
        >
          <Frown className="w-3.5 h-3.5 text-[#b5462f]" />
          <span>Hard</span>
          <span className="text-[10px] text-[#5f6e82] font-normal">({hardCount})</span>
        </motion.button>
      </div>
    </div>
  );
};
