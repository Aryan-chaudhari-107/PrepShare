import React, { useEffect, useId, useRef, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { interactionsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/format";
import { cn } from "../../lib/cn";

type Difficulty = "easy" | "medium" | "hard";

interface DifficultyVoterProps {
  questionId: string;
  initialEasy: number;
  initialMedium: number;
  initialHard: number;
  initialMyVote?: Difficulty | null;
  onVoteChange?: (easy: number, med: number, hard: number, myVote: Difficulty | null) => void;
}

/**
 * One choice out of three, so it is modelled as a radio group rather than
 * three independent toggles — exactly one option can hold `aria-checked`.
 * Each icon matches its difficulty direction (down = easy, flat = medium,
 * up = hard) and the colours come from the status tokens.
 */
const OPTIONS = [
  {
    value: "easy",
    label: "Easy",
    Icon: TrendingDown,
    active: "border-success/30 bg-success-soft text-success",
    idle: "border-transparent text-muted hover:bg-surface hover:text-success",
    iconTone: "text-success",
  },
  {
    value: "medium",
    label: "Medium",
    Icon: Minus,
    active: "border-warning/30 bg-warning-soft text-warning",
    idle: "border-transparent text-muted hover:bg-surface hover:text-warning",
    iconTone: "text-warning",
  },
  {
    value: "hard",
    label: "Hard",
    Icon: TrendingUp,
    active: "border-danger/30 bg-danger-soft text-danger",
    idle: "border-transparent text-muted hover:bg-surface hover:text-danger",
    iconTone: "text-danger",
  },
] as const;

const ARROW_KEYS = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];

export const DifficultyVoter: React.FC<DifficultyVoterProps> = ({
  questionId,
  initialEasy,
  initialMedium,
  initialHard,
  initialMyVote = null,
  onVoteChange,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const groupRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const [easyCount, setEasyCount] = useState(initialEasy);
  const [medCount, setMedCount] = useState(initialMedium);
  const [hardCount, setHardCount] = useState(initialHard);
  const [myVote, setMyVote] = useState<Difficulty | null>(initialMyVote);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEasyCount(initialEasy);
    setMedCount(initialMedium);
    setHardCount(initialHard);
    setMyVote(initialMyVote);
  }, [initialEasy, initialMedium, initialHard, initialMyVote]);

  const handleVote = async (difficulty: Difficulty) => {
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
      onVoteChange?.(data.easy_count, data.medium_count, data.hard_count, data.difficulty);
      success(data.message || "Difficulty vote recorded.", "Vote Recorded");
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to record difficulty evaluation."));
    } finally {
      setLoading(false);
    }
  };

  /** Roving tabindex: only the checked radio (or the first one) is tabbable. */
  const rovingValue = myVote ?? "easy";

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ARROW_KEYS.includes(event.key)) return;
    event.preventDefault();

    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    if (!buttons || buttons.length === 0) return;
    const list = Array.from(buttons);

    const focusedIndex = list.indexOf(document.activeElement as HTMLButtonElement);
    const checkedIndex = list.findIndex((button) => button.getAttribute("aria-checked") === "true");
    const current = focusedIndex >= 0 ? focusedIndex : Math.max(checkedIndex, 0);

    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (current + 1) % list.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (current - 1 + list.length) % list.length;
        break;
      case "Home":
        next = 0;
        break;
      default:
        next = list.length - 1;
        break;
    }
    list[next]?.focus();
  };

  const counts: Record<Difficulty, number> = {
    easy: easyCount,
    medium: medCount,
    hard: hardCount,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span id={labelId} className="text-xs font-semibold text-heading">
        Rate Difficulty:
      </span>

      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={handleKeyDown}
        // min-w-0 + flex-wrap: at ~375px the three options exceed the room the
        // accordion card leaves (its overflow-hidden would clip them), so the
        // group lets the buttons wrap onto a second line instead of escaping.
        className="inline-flex min-w-0 flex-wrap gap-1 rounded-lg border border-line bg-sunken p-1"
      >
        {OPTIONS.map((option) => {
          const selected = myVote === option.value;
          const count = counts[option.value];
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={rovingValue === option.value ? 0 : -1}
              disabled={loading}
              onClick={() => handleVote(option.value)}
              title={`${option.label} — ${count} ${count === 1 ? "vote" : "votes"}`}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium",
                "transition-[color,background-color,border-color,transform] duration-fast ease-swift",
                "active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
                selected ? option.active : option.idle
              )}
            >
              {/* Only the cast vote carries its status colour — a track of three
                  permanently tinted icons read as noise, not information. */}
              <option.Icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-colors duration-fast ease-swift",
                  selected ? option.iconTone : "text-faint"
                )}
                aria-hidden="true"
              />
              <span>{option.label}</span>
              <span className="tabular font-normal text-muted">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
