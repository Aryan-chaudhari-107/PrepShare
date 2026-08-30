import React, { useState } from "react";
import { RoundOut } from "../../types";
import { QuestionItem } from "./QuestionItem";

interface RoundAccordionProps {
  round: RoundOut;
}

export const RoundAccordion: React.FC<RoundAccordionProps> = ({ round }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm overflow-hidden mb-5">
      {/* Round Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 bg-surface border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 text-left hover:bg-surface-container/50 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-sm">
            {round.round_number}
          </span>
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-on-surface">
              {round.name || `Round ${round.round_number}`}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant mt-0.5">
              {round.mode && (
                <span className="capitalize font-medium text-primary bg-primary-container/10 px-2 py-0.5 rounded-md">
                  {round.mode} Mode
                </span>
              )}
              {round.duration_minutes && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  {round.duration_minutes} mins
                </span>
              )}
              <span>•</span>
              <span>{round.questions.length} {round.questions.length === 1 ? "Question" : "Questions"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {/* Questions list */}
      {expanded && (
        <div className="p-5 flex flex-col gap-4 bg-surface-bright">
          {round.questions.length > 0 ? (
            round.questions.map((q, idx) => (
              <QuestionItem key={q.id} question={q} index={idx} />
            ))
          ) : (
            <div className="p-6 text-center text-xs text-on-surface-variant italic bg-surface rounded-xl border border-dashed border-border-subtle">
              No technical questions were logged for this round.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

