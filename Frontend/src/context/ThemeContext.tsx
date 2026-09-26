import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";

// v2: the redesign ships dark-first — a versioned key deliberately ignores any
// stale "light"/"system" value written by earlier builds so the new default
// applies everywhere, while still respecting choices made AFTER this release.
const STORAGE_KEY = "prepshare_theme_v2";

interface ThemeContextType {
  /** The user's stored choice — may be "system". */
  theme: Theme;
  /** What is actually painted right now after resolving "system". */
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  /** Convenience for a header toggle: light ⇄ dark, keeping "system" → dark. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* storage blocked — fall through to the default */
  }
  // Dark-first default: the platform ships as a dark UI. "system" remains
  // selectable from the header, but a fresh visitor (or a stale pre-redesign
  // stored value) lands on the intended dark environment every time.
  return "dark";
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Owns the `dark` class on <html>, which flips every token in
 * src/index.css. Resolves "system" live, so a user changing their OS
 * appearance sees the app follow immediately rather than after a reload.
 *
 * The signed-in user's `theme_preference` from `GET /users/me/settings`
 * should be applied via `setTheme` once their profile loads.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(readStored);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Track OS preference changes while "system" is selected.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#0c0f14" : "#f7f7f4");
  }, [resolved]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked — the choice still applies for this session */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
