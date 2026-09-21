/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Alpine Olive, Warm Ivory & Deep Slate Navy Master Palette (Palette 2)
        olive: {
          50: "#f4f7f5",
          100: "#e5ede7",
          200: "#c9dbcf",
          300: "#a4c3ae",
          400: "#588b6c",
          500: "#3f6f52", // Alpine Olive Primary CTA
          600: "#345c44", // Alpine Olive Hover
          700: "#2f6b47", // Forest Olive Links/Accents
          800: "#254832",
          900: "#1a3223",
          950: "#0e1a12",
        },
        navy: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#94a3b8",
          400: "#5f6e82", // Muted Slate Meta
          500: "#475569",
          600: "#334155",
          700: "#2b3a4f", // Slate Navy Body
          800: "#1e293b",
          850: "#141f2d",
          900: "#0f1926", // Deep Navy Headings
          950: "#080e16",
        },
        cream: {
          50: "#ffffff",
          100: "#faf7ee", // Page Canvas Warm Ivory
          200: "#f3eee1", // Soft Ivory Raised / Inputs
          300: "#e3dccd", // Subtle Sand Border
          400: "#d3c8b4",
          500: "#b8aa90",
          600: "#96876c",
          700: "#74674f",
          800: "#524835",
          900: "#332c1e",
        },
        // Complementary Accent Colors
        gold: {
          DEFAULT: "#b26a00",
          light: "#d97706",
          dark: "#92400e",
        },
        terracotta: {
          DEFAULT: "#b5462f",
          light: "#dc2626",
          dark: "#991b1b",
        },
        mint: {
          DEFAULT: "#2f7d52",
          light: "#16a34a",
          dark: "#166534",
        },

        // Core UI Semantic Tokens
        "primary": "#3f6f52",
        "primary-container": "#e5ede7",
        "primary-fixed": "#f4f7f5",
        "primary-fixed-dim": "#c9dbcf",
        "on-primary": "#ffffff",
        "on-primary-container": "#0f1926",
        "on-primary-fixed": "#0e1a12",
        "on-primary-fixed-variant": "#254832",
        "inverse-primary": "#a4c3ae",

        "secondary": "#3f6f9e",
        "secondary-container": "#e0ecf8",
        "secondary-fixed": "#f0f4f8",
        "secondary-fixed-dim": "#bcccdc",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#0f1926",
        "on-secondary-fixed": "#080e16",
        "on-secondary-fixed-variant": "#2b3a4f",

        "tertiary": "#b26a00",
        "tertiary-container": "#fef3c7",
        "tertiary-fixed": "#fffbeb",
        "tertiary-fixed-dim": "#fde68a",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#0f1926",
        "on-tertiary-fixed": "#78350f",
        "on-tertiary-fixed-variant": "#92400e",

        "background": "#faf7ee",
        "on-background": "#0f1926",

        "surface": "#ffffff",
        "surface-dim": "#faf7ee",
        "surface-bright": "#ffffff",
        "surface-variant": "#f3eee1",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#faf7ee",
        "surface-container": "#f3eee1",
        "surface-container-high": "#e3dccd",
        "surface-container-highest": "#d3c8b4",
        "surface-elevated": "#ffffff",
        "surface-tint": "#3f6f52",
        "on-surface": "#0f1926",
        "on-surface-variant": "#2b3a4f",
        "inverse-surface": "#0f1926",
        "inverse-on-surface": "#faf7ee",

        "outline": "#e3dccd",
        "outline-variant": "#f3eee1",
        "border-subtle": "#e3dccd",

        // Domain Badges & Statuses
        "campus-badge": "#3f6f52",
        "off-campus-badge": "#3f6f9e",
        "difficulty-easy": "#2f7d52",
        "difficulty-medium": "#b26a00",
        "difficulty-hard": "#b5462f",

        "error": "#b5462f",
        "error-container": "#fee2e2",
        "on-error": "#ffffff",
        "on-error-container": "#7f1d1d",
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "headline": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
        "code": ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px",
      },
      spacing: {
        "gutter": "24px",
        "margin-desktop": "32px",
        "margin-mobile": "16px",
        "base": "4px",
        "form-step-gap": "48px",
      }
    },
  },
  plugins: [],
}
