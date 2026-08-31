/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F7F8",
        panel: "#FFFFFF",
        ink: "#1B2A4A",
        "ink-muted": "#55606E",
        grid: "#D8DEE4",
        pass: "#2F6B4F",
        fail: "#B33A3A",
        flag: "#C08A2E",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-paper":
          "linear-gradient(#D8DEE4 1px, transparent 1px), linear-gradient(90deg, #D8DEE4 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
      keyframes: {
        "stamp-down": {
          "0%": { transform: "scale(1.6) rotate(-3deg)", opacity: "0" },
          "60%": { transform: "scale(0.95) rotate(-3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-3deg)", opacity: "1" },
        },
      },
      animation: {
        "stamp-down": "stamp-down 320ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
      },
    },
  },
  plugins: [],
};
