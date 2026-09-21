import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

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
    }, 4500);
  }, [removeToast]);

  const success = useCallback((message: string, title = "SUCCESS") => toast(message, "success", title), [toast]);
  const error = useCallback((message: string, title = "ERROR") => toast(message, "error", title), [toast]);
  const info = useCallback((message: string, title = "INFO") => toast(message, "info", title), [toast]);
  const warning = useCallback((message: string, title = "WARNING") => toast(message, "warning", title), [toast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-[#2f7d52]/30 bg-white shadow-md";
      case "error":
        return "border-[#b5462f]/30 bg-white shadow-md";
      case "warning":
        return "border-[#b26a00]/30 bg-white shadow-md";
      case "info":
      default:
        return "border-[#3f6f9e]/30 bg-white shadow-md";
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Premium Floating Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, x: 20, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-xl ${getBorderColor(
                t.type
              )} flex items-start gap-3 text-[#2b3a4f]`}
            >
              {getIcon(t.type)}
              <div className="flex-1 min-w-0">
                {t.title && (
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#0f1926] mb-0.5">
                    {t.title}
                  </h5>
                )}
                <p className="text-sm text-[#2b3a4f] leading-snug break-words">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[#5f6e82] hover:text-[#0f1926] transition-colors p-0.5 -mr-1 -mt-1 rounded-md cursor-pointer"
                aria-label="Close toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
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
