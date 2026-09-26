import React from "react";
import { motion } from "framer-motion";
import { EASE } from "../../motion";
import { NEUTRAL_CHIP, POSITIVE_CHIP } from "./constants";

/* ── Offer gauge ───────────────────────────────────────────────────────── */

export const OfferGauge: React.FC<{ offers: number; without: number; total: number }> = ({
  offers,
  without,
  total,
}) => {
  const pct = total > 0 ? Math.round((offers / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-[132px] w-[132px]"
        role="img"
        aria-label={`${pct}% offers — ${pct} percent of ${total} experiences ended with an offer`}
      >
        <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90" aria-hidden="true">
          <circle cx="66" cy="66" r="54" fill="none" stroke="rgb(var(--raised))" strokeWidth="12" />
          <motion.circle
            cx="66"
            cy="66"
            r="54"
            fill="none"
            stroke="rgb(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
            transition={{ duration: 1, ease: EASE.enter, delay: 0.25 }}
            style={{ filter: "drop-shadow(0 0 6px rgb(var(--primary) / 0.5))" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <div className="tabular text-2xl font-bold leading-none text-heading">{pct}%</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">offers</div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <span className={POSITIVE_CHIP}>{offers} offer received</span>
        <span className={NEUTRAL_CHIP}>{without} in progress</span>
      </div>
    </div>
  );
};
