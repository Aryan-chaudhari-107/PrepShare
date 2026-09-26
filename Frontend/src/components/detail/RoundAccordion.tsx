import React, { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Clock, Layers, Video } from "lucide-react";
import { cn } from "../../lib/cn";
import { RoundOut } from "../../types";
import { disclosure } from "../../motion";
import { QuestionItem } from "./QuestionItem";

interface RoundAccordionProps {
  round: RoundOut;
}

/**
 * Disclosure for one interview round — and one sheet of the round STACK.
 *
 * Depth is entirely transform + the existing shadow scale: the open round sits
 * at full size with an elevated shadow, closed rounds settle back a single
 * percent and drop to the resting shadow, and the whole stack lives in a
 * recessed well (see ReportDetailPage). No glow, no animated box-shadow, no
 * layout shift — the surrounding sheet never moves under you.
 *
 * The header is a real `<button>` nested inside the `<h3>` (headings may only
 * contain phrasing content, so the button cannot wrap the heading) and carries
 * `aria-expanded` / `aria-controls` so the expanded state is announced instead
 * of being purely visual.
 */
export const RoundAccordion: React.FC<RoundAccordionProps> = ({ round }) => {
  const [expanded, setExpanded] = useState(true);
  const baseId = useId();
  const titleId = `${baseId}-round-title`;
  const panelId = `${baseId}-round-panel`;
  const questionCount = round.questions.length;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border bg-surface origin-top",
        "transition-[transform,box-shadow,border-color] duration-base ease-swift",
        expanded ? "border-line-strong shadow-md" : "border-line scale-recede shadow-xs"
      )}
    >
      <h3>
        <button
          type="button"
          id={titleId}
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={cn(
            "flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-4 text-left sm:px-5",
            "transition-[background-color,transform] duration-fast ease-swift",
            "hover:bg-raised active:scale-nudge",
            expanded ? "border-b border-line" : "border-b-0"
          )}
        >
          <span className="flex min-w-0 items-center gap-3.5">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-xs",
                "transition-colors duration-fast ease-swift",
                expanded ? "bg-primary text-primary-fg" : "bg-primary-soft text-primary"
              )}
            >
              {round.round_number}
            </span>

            <span className="flex min-w-0 flex-col">
              <span className="text-base font-semibold text-heading sm:text-lg">
                {round.name || `Round ${round.round_number}`}
              </span>

              <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                {round.mode && (
                  <span className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary-soft px-2 py-0.5 font-medium text-primary">
                    <Video className="h-3 w-3" aria-hidden="true" />
                    {round.mode} Mode
                  </span>
                )}
                {round.duration_minutes ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {round.duration_minutes} mins
                  </span>
                ) : null}
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" aria-hidden="true" />
                  {questionCount} {questionCount === 1 ? "Question" : "Questions"}
                </span>
              </span>
            </span>
          </span>

          <span
            aria-hidden="true"
            className={cn(
              "shrink-0 text-muted transition-transform duration-fast ease-swift",
              expanded && "rotate-90"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={titleId}
            variants={disclosure}
            initial="hidden"
            animate="show"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 bg-raised p-4 sm:p-5">
              {questionCount > 0 ? (
                round.questions.map((question, index) => (
                  <QuestionItem key={question.id} question={question} index={index} />
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-line bg-surface p-6 text-center text-xs italic text-muted">
                  No technical questions were logged for this round.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
