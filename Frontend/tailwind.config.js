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
        // Stitch Core Palette (Academic Nexus / MentorshipHub)
        "primary": "#004ac6",
        "primary-container": "#2563eb",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#eeefff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        "inverse-primary": "#b4c5ff",

        "secondary": "#5c5f61",
        "secondary-container": "#e0e3e5",
        "secondary-fixed": "#e0e3e5",
        "secondary-fixed-dim": "#c4c7c9",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#626567",
        "on-secondary-fixed": "#191c1e",
        "on-secondary-fixed-variant": "#444749",

        "tertiary": "#46566c",
        "tertiary-container": "#5e6e85",
        "tertiary-fixed": "#d3e4fe",
        "tertiary-fixed-dim": "#b7c8e1",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#e9f0ff",
        "on-tertiary-fixed": "#0b1c30",
        "on-tertiary-fixed-variant": "#38485d",

        "background": "#f9f9ff",
        "on-background": "#111c2d",

        "surface": "#f9f9ff",
        "surface-dim": "#cfdaf2",
        "surface-bright": "#f9f9ff",
        "surface-variant": "#d8e3fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e7eeff",
        "surface-container-high": "#dee8ff",
        "surface-container-highest": "#d8e3fb",
        "surface-elevated": "#FFFFFF",
        "surface-tint": "#0053db",
        "on-surface": "#111c2d",
        "on-surface-variant": "#434655",
        "inverse-surface": "#263143",
        "inverse-on-surface": "#ecf1ff",

        "outline": "#737686",
        "outline-variant": "#c3c6d7",
        "border-subtle": "#E2E8F0",

        // Domain Badges & Statuses
        "campus-badge": "#7C3AED",
        "off-campus-badge": "#0EA5E9",
        "difficulty-easy": "#22C55E",
        "difficulty-medium": "#F59E0B",
        "difficulty-hard": "#EF4444",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
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
