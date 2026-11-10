import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF8F3",
        cream: "#F4EEE6",
        champagne: "#DED0C0",
        rose: { DEFAULT: "#BFA591", soft: "#E9DDD1", deep: "#805F4F" },
        sage: "#CFC0AE",
        cocoa: "#514136",
        gold: { DEFAULT: "#B99B7C", light: "#E5D6C5", dark: "#80654D" },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        script: ["var(--font-script)", "cursive"],
        khat: ["var(--font-khat)", "Amiri", "serif"],
      },
      boxShadow: {
        paper: "0 1px 1px rgba(81,65,54,.07), 0 8px 24px -8px rgba(81,65,54,.2)",
        glow: "0 0 0 1px rgba(185,155,124,.3), 0 10px 40px -10px rgba(145,112,81,.35)",
        polaroid: "0 2px 4px rgba(81,65,54,.1), 0 18px 36px -14px rgba(81,65,54,.35)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0) rotate(var(--r, 0deg))" },
          "50%": { transform: "translateY(-10px) rotate(calc(var(--r, 0deg) + 1.5deg))" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        ping2: {
          "0%": { transform: "scale(1)", opacity: ".55" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        ping2: "ping2 2.4s cubic-bezier(0,0,.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
