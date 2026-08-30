import React from "react";
import clsx from "clsx";

interface StampProps {
  text: string;
  type?: "hard" | "medium" | "easy" | "offer" | "classified" | "custom";
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({ text, type = "classified", className }) => {
  const styles = {
    hard: "stamp-hard font-mono text-xs uppercase font-bold px-2 py-0.5 tracking-widest",
    medium: "stamp-medium font-mono text-xs uppercase font-bold px-2 py-0.5 tracking-widest",
    easy: "stamp-easy font-mono text-xs uppercase font-bold px-2 py-0.5 tracking-widest",
    offer: "stamp-offer font-mono text-xs uppercase font-bold px-2 py-0.5 tracking-widest",
    classified: "stamp-classified font-mono text-xs uppercase font-bold px-2 py-0.5 tracking-widest",
    custom: "border-2 border-primary text-primary font-mono text-xs uppercase font-bold px-2 py-0.5 tracking-widest",
  };

  return (
    <div className={clsx("inline-block select-none", styles[type], className)}>
      {text}
    </div>
  );
};
