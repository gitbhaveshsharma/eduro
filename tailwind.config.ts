import type { Config } from "tailwindcss"

const config: Config = {
  // darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // 👇 ADD THIS SECTION HERE - Right at the start of extend
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Brand Colors - Exact hex values from specification
        brand: {
          primary: "#1D4ED8",      // Deep Blue - Trust, authority, professional
          secondary: "#3B82F6",    // Sky Blue - Friendly & fresh
          highlight: "#F97316",    // Orange - Attention-grabbing CTA
        },

        // Status Colors
        success: "#10B981",        // Green - Success messages, confirmations
        warning: "#F59E0B",        // Amber - Warnings, unpaid fees
        error: "#EF4444",          // Red - Errors, failed actions

        // Neutral Colors
        neutral: {
          bg: "#F3F4F6",           // Light Gray - Main background
          card: "#FFFFFF",         // White - Card/Panel backgrounds
          text: {
            primary: "#111827",    // Dark Gray - Primary text
            secondary: "#6B7280",  // Medium Gray - Secondary text
          },
          border: "#E5E7EB",       // Light Gray - Borders/dividers
        },

        // ShadCN component overrides
        primary: {
          DEFAULT: "#1D4ED8",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#F97316",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
