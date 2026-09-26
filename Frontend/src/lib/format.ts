/**
 * Single source of truth for every date, currency and number rendering in the
 * app. Previously these were re-implemented inline in 6+ files with drifting
 * formats (some omitted the year, some used different month styles).
 */

/** "Today" / "1d ago" / "3d ago" / "12 Mar 2025" — used on feed cards. */
export function relativeDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return absoluteDate(d);
}

/** "12 Mar 2025" — always includes the year. */
export function absoluteDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "12 Mar 2025, 14:05" — for tooltips and title attributes. */
export function fullDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "₹ 12,00,000 LPA" / "$ 120,000" — returns null when there is no amount. */
export function formatPackage(
  amount?: number | null,
  currency?: string | null
): string | null {
  if (amount === undefined || amount === null) return null;
  const cur = (currency || "INR").toUpperCase();
  const symbol = cur === "INR" ? "₹" : "$";
  const suffix = cur === "INR" ? " LPA" : "";
  return `${symbol} ${amount.toLocaleString()}${suffix}`;
}

/** "1.2k" / "34k" for compact counters; plain digits below 1000. */
export function compactCount(n?: number | null): string {
  const value = n ?? 0;
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}m`;
}

/** First two initials, uppercased, stable across avatar implementations. */
export function initials(name?: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Readable fallback copy for API failures. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { detail?: unknown } } }).response;
    const detail = response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Stable, collision-free key for local list rows before a server id exists. */
export function localId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
