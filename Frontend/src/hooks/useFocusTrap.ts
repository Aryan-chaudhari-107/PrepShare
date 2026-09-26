import React, { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) =>
      !el.hasAttribute("aria-hidden") &&
      el.getAttribute("tabindex") !== "-1" &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement)
  );
}

/**
 * Traps Tab/Shift+Tab inside `ref`, moves focus in on open, closes on Escape
 * and restores focus to whatever was focused before. This is what makes
 * dialogs keyboard- and screen-reader-navigable instead of merely modal-looking.
 */
export function useFocusTrap<T extends HTMLElement>(
  ref: React.RefObject<T>,
  active: boolean,
  onClose?: () => void
): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const initial = focusables(node)[0];
    (initial ?? node).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables(node);
      if (items.length === 0) {
        event.preventDefault();
        node.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey) {
        if (activeEl === first || !node.contains(activeEl)) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !node.contains(activeEl)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, ref]);
}

/** Locks body scroll while a modal or drawer owns the screen. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [active]);
}
