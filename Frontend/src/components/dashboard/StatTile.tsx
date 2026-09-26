import React from "react";
import { Card } from "../ui/Card";

/* ── Sparkline ─────────────────────────────────────────────────────────── */

export const Sparkline: React.FC<{ values: number[]; label: string }> = ({ values, label }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 38 - (value / max) * 34;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="h-9 w-full overflow-visible"
      role="img"
      aria-label={label}
    >
      <polyline
        points={points}
        fill="none"
        stroke="rgb(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.85"
      />
    </svg>
  );
};

/* ── Tiles ─────────────────────────────────────────────────────────────── */

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  chip?: React.ReactNode;
  spark?: React.ReactNode;
  icon: React.ReactNode;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, sub, chip, spark, icon }) => (
  <Card className="flex h-full flex-col justify-between gap-3">
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </span>
    </div>
    <div className="min-w-0">
      <div className="tabular text-3xl font-bold leading-none tracking-tight text-heading">
        {value}
      </div>
      {sub && <p className="mt-2 text-xs leading-snug text-muted">{sub}</p>}
      {spark}
      {chip && <div className="mt-2">{chip}</div>}
    </div>
  </Card>
);
