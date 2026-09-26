import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, resolving Tailwind conflicts so the last
 * variant always wins (e.g. `cn("p-4", condition && "p-2")` → `p-2`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
