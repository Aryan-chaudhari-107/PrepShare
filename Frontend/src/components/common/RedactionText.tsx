import React, { useState } from "react";
import clsx from "clsx";

interface RedactionTextProps {
  text: string;
  className?: string;
  defaultRevealed?: boolean;
}

export const RedactionText: React.FC<RedactionTextProps> = ({
  text,
  className,
  defaultRevealed = false,
}) => {
  const [revealed, setRevealed] = useState(defaultRevealed);

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      title="Click to toggle declassification"
      className={clsx(
        "redaction-bar font-mono select-none px-1 py-0.5 rounded-none inline-block",
        revealed && "revealed",
        className
      )}
    >
      {text}
    </span>
  );
};
