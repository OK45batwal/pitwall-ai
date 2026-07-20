import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbon: "#090b10",
        panel: "#101620",
        line: "rgba(148, 163, 184, 0.18)",
        signalRed: "#e8002d",
        electricBlue: "#00b8ff",
        racingGreen: "#00da7a",
        amber: "#ffb800",
        accent: "#ff8700",
        "accent-dark": "#cc6d00",
        mclaren: "#ff8000",
        redbull: "#0600ef",
        ferrari: "#dc0000",
        mercedes: "#00d2be",
        alpine: "#ff87bc",
        williams: "#005aff",
        haas: "#ffffff",
        rb: "#6692ff",
        stake: "#27e4a6",
      },
      boxShadow: {
        glowBlue: "0 0 30px rgba(0, 184, 255, 0.24)",
        glowRed: "0 0 30px rgba(232, 0, 45, 0.22)",
        glowOrange: "0 0 24px rgba(255, 135, 0, 0.35)",
        "glass-sm": "0 4px 16px rgba(0,0,0,0.3)",
        "glass-md": "0 8px 32px rgba(0,0,0,0.4)",
        "glass-lg": "0 20px 60px rgba(0,0,0,0.5)",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      backgroundImage: {
        carbon:
          "linear-gradient(135deg, rgba(255,255,255,.035) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,.025) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,.035) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,.025) 25%, transparent 25%)",
        "carbon-light":
          "linear-gradient(135deg, rgba(255,255,255,.06) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,.04) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,.06) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,.04) 25%, transparent 25%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "border-flow": "border-flow 3s linear infinite",
        "scan-line": "scan-line 3s linear infinite",
        "ping-fast": "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.6" },
          "100%": { opacity: "1" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "scan-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
