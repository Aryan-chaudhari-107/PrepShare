import React, { createContext, useContext, useState, useCallback } from "react";

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
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string, title = "CONFIRMED") => toast(message, "success", title), [toast]);
  const error = useCallback((message: string, title = "ALERT / ERROR") => toast(message, "error", title), [toast]);
  const info = useCallback((message: string, title = "INTELLIGENCE") => toast(message, "info", title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Dossier Tactical Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let badgeClass = "border-primary bg-surface text-primary";
          let stampClass = "stamp-medium";
          if (t.type === "success") {
            badgeClass = "border-tertiary bg-tertiary-fixed text-tertiary";
            stampClass = "stamp-easy";
          } else if (t.type === "error") {
            badgeClass = "border-error bg-error-container text-on-error-container";
            stampClass = "stamp-hard";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 border-2 border-primary bg-surface shadow-[4px_4px_0px_0px_rgba(5,14,26,1)] flex flex-col gap-1 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border ${badgeClass} ${stampClass}`}>
                  {t.title || t.type}
                </span>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-primary/60 hover:text-primary font-mono text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="font-mono text-xs text-on-surface mt-1 leading-relaxed">{t.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
