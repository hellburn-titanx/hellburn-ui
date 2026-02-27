/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fire: { 1: "#ff4500", 2: "#ff6b35", 3: "#ffa500", ember: "#ff2d00" },
        dark: { 1: "#050508", 2: "#0a0a12", 3: "#12121e", 4: "#1a1a2e", 5: "#24243a" },
        txt: { 1: "#f0ece4", 2: "#8a8692", 3: "#5a566a" },
      },
      fontFamily: {
        display: ["'Unbounded'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        pulse_slow: "pulse 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: { "0%": { left: "-100%" }, "100%": { left: "100%" } },
      },
    },
  },
  plugins: [],
};
