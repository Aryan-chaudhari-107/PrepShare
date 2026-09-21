import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";

export const NotFoundPage: React.FC = () => {
  return (
    <AppShell>
      <main className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-[#e3dccd] bg-white shadow-sm text-center flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 flex items-center justify-center text-[#3f6f52] font-extrabold text-2xl"
        >
          404
        </motion.div>
        <h1 className="text-xl font-bold text-[#0f1926]">Page Not Found</h1>
        <p className="text-xs text-[#5f6e82] leading-relaxed max-w-xs">
          The page or interview experience you requested does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-semibold text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Feed</span>
        </Link>
      </main>
    </AppShell>
  );
};
