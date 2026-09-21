import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Video, Layers } from "lucide-react";
import { RoundOut } from "../../types";
import { QuestionItem } from "./QuestionItem";

interface RoundAccordionProps {
  round: RoundOut;
}

export const RoundAccordion: React.FC<RoundAccordionProps> = ({ round }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-[#e3dccd] shadow-xs overflow-hidden mb-4">
      {/* Round Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-5 bg-white border-b border-[#e3dccd] flex flex-wrap items-center justify-between gap-3 text-left hover:bg-[#faf7ee] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <span className="w-8 h-8 rounded-xl bg-[#3f6f52] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {round.round_number}
          </span>
          <div className="flex flex-col">
            <h3 className="text-sm sm:text-base font-bold text-[#0f1926]">
              {round.name || `Round ${round.round_number}`}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6e82] mt-0.5">
              {round.mode && (
                <span className="capitalize font-medium text-[#2f6b47] bg-[#3f6f52]/10 border border-[#3f6f52]/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {round.mode} Mode
                </span>
              )}
              {round.duration_minutes && (
                <span className="flex items-center gap-1 text-[#5f6e82]">
                  <Clock className="w-3 h-3 text-[#5f6e82]" />
                  {round.duration_minutes} mins
                </span>
              )}
              <span className="text-[#e3dccd]">•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#5f6e82]" />
                {round.questions.length} {round.questions.length === 1 ? "Question" : "Questions"}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#5f6e82]"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Questions list with AnimatePresence */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 flex flex-col gap-3 bg-[#faf7ee]">
              {round.questions.length > 0 ? (
                round.questions.map((q, idx) => (
                  <QuestionItem key={q.id} question={q} index={idx} />
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#5f6e82] italic bg-white rounded-xl border border-dashed border-[#e3dccd]">
                  No technical questions were logged for this round.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
