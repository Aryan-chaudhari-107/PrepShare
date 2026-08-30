import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "error" | "campus" | "off-campus" | "success";
  size?: "xs" | "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "outline",
  size = "sm",
  className,
}) => {
  const base = "inline-flex items-center gap-1 font-semibold rounded-full";
  const sizes = {
    xs: "text-[10px] px-2 py-0.5",
    sm: "text-xs px-2.5 py-0.5",
    md: "text-sm px-3 py-1",
  };
  const variants = {
    primary: "bg-primary text-on-primary",
    secondary: "bg-surface-container text-on-surface-variant",
    tertiary: "bg-tertiary-container/10 text-tertiary border border-tertiary/20",
    outline: "border border-border-subtle bg-surface text-on-surface-variant",
    error: "bg-error/10 text-error border border-error/20",
    campus: "bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 font-bold",
    "off-campus": "bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 font-bold",
    success: "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 font-bold",
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
};

