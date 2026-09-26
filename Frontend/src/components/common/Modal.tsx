import React, { useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useFocusTrap, useScrollLock } from "../../hooks/useFocusTrap";
import { panel, veil } from "../../motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Tailwind max-width utility, e.g. "max-w-lg". */
  maxWidth?: string;
  /** Hides the header close button for multi-step flows that supply their own. */
  hideClose?: boolean;
  /** Rendered in the header, next to the close button. */
  headerAction?: React.ReactNode;
  /** Rendered in a sticky footer bar. */
  footer?: React.ReactNode;
  /** Clicking the backdrop closes the dialog. Off for destructive flows. */
  dismissOnBackdrop?: boolean;
  className?: string;
}

/**
 * A real dialog: role="dialog" + aria-modal, focus trapped inside on open,
 * Escape closes, focus restores to the trigger on close, body scroll locked,
 * and the backdrop cannot be clicked through to the page underneath.
 *
 * Replaces the previous version, which had no role, no aria-modal, no focus
 * management and could leave the page unscrollable if unmounted mid-open.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
  hideClose,
  headerAction,
  footer,
  dismissOnBackdrop = true,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useFocusTrap(dialogRef, isOpen, onClose);
  useScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
          <motion.div
            initial="hidden"
            animate="show"
            exit="exit"
            variants={veil}
            onClick={dismissOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-heading/45 backdrop-blur-veil"
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? descId : undefined}
            tabIndex={-1}
            initial="hidden"
            animate="show"
            exit="exit"
            variants={panel}
            className={cn(
              "relative z-10 w-full rounded-t-2xl border border-line bg-surface shadow-2xl",
              "sm:rounded-2xl",
              maxWidth,
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p id={descId} className="mt-0.5 text-sm text-muted">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {headerAction}
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-heading"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5 scrollbar-slim sm:px-6">
              {children}
            </div>

            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-raised px-5 py-4 sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
