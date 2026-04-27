import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
        'dm-sans': ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        footer: {
          DEFAULT: "hsl(var(--footer-bg))",
          foreground: "hsl(var(--footer-foreground))",
        },
        icon: {
          bg: "hsl(var(--icon-bg))",
          DEFAULT: "hsl(var(--icon-color))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "var(--card-shadow)",
        "card-hover": "var(--card-shadow-hover)",
      },
      backgroundImage: {
        "hero-gradient": "var(--hero-gradient)",
        "cta-gradient": "linear-gradient(135deg, hsl(213 80% 50%), hsl(200 75% 48%))",
        "echo-blue": "var(--echo-blue)",
        "echo-warm": "var(--echo-warm)",
        "echo-blend": "var(--echo-blend)",
        "echo-primary-soft": "var(--echo-primary-soft)",
        "echo-warm-visible": "var(--echo-warm-visible)",
        "echo-pink-soft": "var(--echo-pink-soft)",
        "section-divider": "linear-gradient(90deg, transparent 0%, hsl(213 60% 90% / 0.5) 50%, transparent 100%)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--accent) / 0.45), 0 4px 12px -2px hsl(var(--accent) / 0.35)" },
          "50%": { boxShadow: "0 0 0 8px hsl(var(--accent) / 0), 0 8px 20px -4px hsl(var(--accent) / 0.55)" },
        },
        "float-up": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "soft-pulse": "soft-pulse 2.4s ease-in-out infinite",
        "soft-pulse-static": "soft-pulse-static 2.4s ease-in-out infinite",
        "float-up": "float-up 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
