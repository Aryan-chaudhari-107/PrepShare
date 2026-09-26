import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { DURATION, EASE } from "../motion";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/** Hard cap so a burst of failures cannot bury the UI. */
const MAX_VISIBLE = 4;
const DISMISS_AFTER_MS = 4500;

const TONE: Record<ToastType, { icon: React.ElementType; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: "text-success", ring: "border-success/25" },
  error: { icon: AlertCircle, accent: "text-danger", ring: "border-danger/25" },
  warning: { icon: AlertTriangle, accent: "text-warning", ring: "border-warning/25" },
  info: { icon: Info, accent: "text-accent", ring: "border-accent/25" },
};

/**
 * Toasts stack BELOW the app bar (top-right) rather than bottom-right —
 * the previous bottom-right stack sat directly on top of the floating
 * Messages button and hid it behind every notification.
 *
 * Announced through a polite/assertive live region so feedback reaches
 * screen-reader users, not just sighted ones.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduceMotion = useReducedMotion();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dismiss timers must not outlive the provider (route changes, HMR, logout).
  const timersRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, type, title, message }].slice(-MAX_VISIBLE));
      const timer = window.setTimeout(() => removeToast(id), DISMISS_AFTER_MS);
      timersRef.current.add(timer);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title = "Success") => toast(message, "success", title),
    [toast]
  );
  const error = useCallback(
    (message: string, title = "Error") => toast(message, "error", title),
    [toast]
  );
  const info = useCallback(
    (message: string, title = "Info") => toast(message, "info", title),
    [toast]
  );
  const warning = useCallback(
    (message: string, title = "Warning") => toast(message, "warning", title),
    [toast]
  );

  const hasError = toasts.some((t) => t.type === "error");

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 top-header z-toast flex flex-col items-stretch gap-2 px-4 sm:left-auto sm:right-6 sm:w-[380px] sm:px-0"
        // The region itself is silent; each toast announces individually.
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        <span className="sr-only" aria-live={hasError ? "assertive" : "polite"}>
          {hasError ? "An error occurred" : ""}
        </span>

        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, accent, ring } = TONE[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                role={t.type === "error" ? "alert" : "status"}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: -8,
                        scale: 0.97,
                        transition: { duration: DURATION.fast, ease: EASE.exit },
                      }
                }
                transition={{ duration: DURATION.base, ease: EASE.enter }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${ring} bg-surface p-3.5 shadow-lg`}
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${accent}`} aria-hidden="true" />

                <div className="min-w-0 flex-1">
                  {t.title && (
                    <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-heading">
                      {t.title}
                    </p>
                  )}
                  <p className="break-words text-sm leading-snug text-body">{t.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  aria-label="Dismiss notification"
                  className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-sunken hover:text-heading"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
