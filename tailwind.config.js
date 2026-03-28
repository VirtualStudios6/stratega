/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-light": "var(--primary-light)",
        accent: "#7DF090",
        "bg-main": "var(--bg-main)",
        "bg-card": "var(--bg-card)",
        "bg-input": "var(--bg-input)",
        "bg-hover": "var(--bg-hover)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      ringColor: {
        DEFAULT: "var(--primary)",
      },
      fontFamily: {
        sans: ["Rubik", "sans-serif"],
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      animationDelay: {
        50:  "50ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
      },
      keyframes: {
        wiggle: {
          "0%,100%": { transform: "rotate(0deg)" },
          "20%":     { transform: "rotate(-20deg)" },
          "40%":     { transform: "rotate(20deg)" },
          "60%":     { transform: "rotate(-12deg)" },
          "80%":     { transform: "rotate(12deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
}
