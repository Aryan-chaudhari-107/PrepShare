import React from "react";
import { cn } from "../../lib/cn";
import { initials } from "../../lib/format";
import { getMediaUrl } from "../../utils/media";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; text: string }> = {
  xs: { box: "h-6 w-6 text-xs", text: "" },
  sm: { box: "h-8 w-8 text-xs", text: "" },
  md: { box: "h-10 w-10 text-sm", text: "" },
  lg: { box: "h-14 w-14 text-lg", text: "" },
  xl: { box: "h-20 w-20 text-2xl", text: "" },
};

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: Size;
  /** Draws the ring that marks the signed-in user's own avatar. */
  ring?: boolean;
  /**
   * Accessible name, for the rare case where the avatar stands alone with no
   * visible name beside it. Omit it when a name is already on screen — the
   * image is decorative there and is hidden from assistive tech so the name
   * is not announced twice.
   */
  alt?: string;
  className?: string;
}

/**
 * Image with an initials fallback and a graceful error fallback, so a broken
 * or missing profile photo degrades to initials instead of a broken-image icon.
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = "md",
  ring,
  alt,
  className,
}) => {
  const [failed, setFailed] = React.useState(false);
  const url = src ? getMediaUrl(src) : null;
  const { box, text } = SIZES[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-primary-soft font-semibold uppercase text-primary",
        box,
        text,
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
        className
      )}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : "true"}
    >
      {url && !failed ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
};
