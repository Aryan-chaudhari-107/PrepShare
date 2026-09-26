/** @type {import('tailwindcss').Config} */

// Semantic tokens read from CSS custom properties (src/index.css) so the entire
// surface / text / border / status palette can be retuned — or flipped to dark —
// in ONE place. Brand scales below stay static for gradients and precise shades.

const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Semantic, theme-aware ────────────────────────────────────────
        canvas: v("canvas"),
        surface: v("surface"),
        raised: v("raised"),
        sunken: v("sunken"),
        line: v("line"),
        "line-strong": v("line-strong"),

        heading: v("heading"),
        body: v("body"),
        muted: v("muted"),
        faint: v("faint"),
        "olive-ink": v("olive-ink"),

        primary: varScale("primary"),
        accent: varScale("accent"),
        success: varScale("success"),
        warning: varScale("warning"),
        danger: varScale("danger"),

        // ── Brand scales (static) ────────────────────────────────────────
        olive: {
          50: "#f2f7f4",
          100: "#e2ede7",
          200: "#c6dbcf",
          300: "#a4c3ae",
          400: "#6f9c80",
          500: "#3f6f52",
          600: "#345c44",
          700: "#2f6b47",
          800: "#254832",
          900: "#1a3223",
          950: "#0e1a12",
        },
        navy: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#94a3b8",
          400: "#5f6e82",
          500: "#475569",
          600: "#334155",
          700: "#2b3a4f",
          800: "#1e293b",
          900: "#0f1926",
          950: "#080e16",
        },
        cream: {
          50: "#ffffff",
          100: "#faf7ee",
          200: "#f3eee1",
          300: "#e3dccd",
          400: "#d3c8b4",
          500: "#b8aa90",
          600: "#96876c",
          700: "#74674f",
          800: "#524835",
          900: "#332c1e",
        },
        gold: { DEFAULT: "#b26a00", light: "#d97706", dark: "#92400e" },
        terracotta: { DEFAULT: "#b5462f", light: "#dc2626", dark: "#991b1b" },
        mint: { DEFAULT: "#2f7d52", light: "#16a34a", dark: "#166534" },
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        // Floor of 12px — no sub-legible text anywhere.
        xs: ["12px", { lineHeight: "18px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["15px", { lineHeight: "24px" }],
        lg: ["16px", { lineHeight: "26px" }],
        xl: ["18px", { lineHeight: "28px" }],
        "2xl": ["22px", { lineHeight: "30px" }],
        "3xl": ["26px", { lineHeight: "34px" }],
        "4xl": ["32px", { lineHeight: "40px" }],
        "5xl": ["40px", { lineHeight: "46px", letterSpacing: "-0.022em" }],
        "6xl": ["48px", { lineHeight: "54px", letterSpacing: "-0.024em" }],
      },

      borderRadius: {
        DEFAULT: "6px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
        full: "9999px",
      },

      boxShadow: {
        xs: "0 1px 2px 0 rgb(13 18 25 / 0.05)",
        sm: "0 1px 3px -1px rgb(13 18 25 / 0.07), 0 1px 2px -1px rgb(13 18 25 / 0.05)",
        DEFAULT: "0 4px 12px -4px rgb(13 18 25 / 0.08), 0 2px 4px -2px rgb(13 18 25 / 0.04)",
        md: "0 8px 20px -8px rgb(13 18 25 / 0.12), 0 2px 6px -3px rgb(13 18 25 / 0.06)",
        lg: "0 16px 32px -12px rgb(13 18 25 / 0.16), 0 6px 12px -6px rgb(13 18 25 / 0.08)",
        xl: "0 28px 56px -20px rgb(13 18 25 / 0.20), 0 10px 20px -10px rgb(13 18 25 / 0.10)",
        "2xl": "0 40px 80px -28px rgb(13 18 25 / 0.26)",
        focus: "0 0 0 3px rgb(var(--primary) / 0.18)",
        none: "none",
      },

      // Direct-manipulation press feedback. Two tiers so a press carries the
      // same weight everywhere: `press` for controls (buttons, tabs, chips),
      // `nudge` for full-width rows that only need to acknowledge the touch.
      // `recede` is NOT a press — it is the resting inset of a collapsed
      // surface, so the two must not share a value.
      scale: {
        press: "0.98",
        nudge: "0.995",
        recede: "0.99",
      },

      // Blur tiers. `veil` is the scrim behind Modal/Drawer — deliberately
      // light, enough to detach the dialog without smearing the page.
      backdropBlur: {
        veil: "2px",
      },

      spacing: {
        // Single source of truth for the app bar height. Every sticky offset
        // and scroll-margin in the app derives from --navbar-height in
        // src/index.css, so this can never drift per page again.
        header: "var(--navbar-height)",
      },

      maxWidth: {
        shell: "1400px",
        list: "1120px",
        prose: "760px",
        wizard: "860px",
      },

      // NOTE: there is no `shimmer` entry under keyframes/animation here on
      // purpose — the skeleton sweep's keyframe and `.shimmer` recipe live in
      // src/index.css (MOTION UTILITIES) so they always ship, regardless of
      // which utilities happen to appear in scanned source.

      // Named duration tiers. Pair with the timing functions below so CSS
      // transitions follow the exact same scale as framer-motion's DURATION.
      transitionDuration: {
        instant: "80ms",
        fast: "140ms",
        base: "240ms",
        slow: "380ms",
        cinematic: "640ms",
      },

      transitionTimingFunction: {
        swift: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        enter: "cubic-bezier(0.16, 1, 0.3, 1)",
        exit: "cubic-bezier(0.7, 0, 0.84, 0)",
        emphasized: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      zIndex: {
        drawer: "60",
        modal: "70",
        toast: "80",
      },
    },
  },
  plugins: [],
};

// Theme-aware colour family: DEFAULT (the hue), -fg (text drawn on it) and
// -soft (a tinted background). All read CSS variables so one block in
// src/index.css retunes — or flips — every status colour in the app.
function varScale(name) {
  return {
    DEFAULT: v(name),
    fg: v(`${name}-fg`),
    soft: v(`${name}-soft`),
  };
}
