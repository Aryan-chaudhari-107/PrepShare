import React, { useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useFocusTrap, useScrollLock } from "../../hooks/useFocusTrap";
import { DURATION, EASE, veil } from "../../motion";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  /** Which edge the panel slides from. */
  side?: "left" | "right" | "bottom";
  /** Panel width on left/right variants. */
  width?: string;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Sliding panel with the same dialog semantics as <Modal/>. Three call sites
 * previously each hand-rolled their own drawer with no aria-modal, no focus
 * trap and inconsistent close affordances.
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = "right",
  width = "w-full sm:max-w-md",
  footer,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useFocusTrap(panelRef, isOpen, onClose);
  useScrollLock(isOpen);

  const position =
    side === "bottom"
      ? "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t"
      : side === "left"
        ? "inset-y-0 left-0 w-full border-r"
        : "inset-y-0 right-0 w-full border-l";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-drawer">
          <motion.div
            initial="hidden"
            animate="show"
            exit="exit"
            variants={veil}
            onClick={onClose}
            className="absolute inset-0 bg-heading/45 backdrop-blur-veil"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={
              side === "bottom"
                ? { opacity: 0, y: "100%" }
                : { opacity: 1, x: side === "left" ? "-100%" : "100%" }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={
              side === "bottom"
                ? {
                    opacity: 0,
                    y: "100%",
                    transition: { duration: DURATION.fast, ease: EASE.exit },
                  }
                : {
                    opacity: 1,
                    x: side === "left" ? "-100%" : "100%",
                    transition: { duration: DURATION.fast, ease: EASE.exit },
                  }
            }
            transition={{ duration: DURATION.slow, ease: EASE.enter }}
            className={cn(
              "absolute flex flex-col border-line bg-surface shadow-2xl",
              position,
              side === "bottom" ? "mx-auto max-w-lg" : width,
              className
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 id={titleId} className="truncate text-base font-semibold tracking-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-heading"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-slim">{children}</div>

            {footer && (
              <div className="border-t border-line bg-raised px-5 py-4">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
