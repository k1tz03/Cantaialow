import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--accent)",
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        muted: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "var(--success)",
        },
        danger: {
          DEFAULT: "var(--danger)",
        },
        info: {
          DEFAULT: "var(--info)",
        },
        card: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--text-primary)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
      width: {
        sidebar: "240px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 150ms ease-out",
        "accordion-up": "accordion-up 150ms ease-out",
      },
    },
  },
  plugins: [tailwindAnimate],
};
export default config;
