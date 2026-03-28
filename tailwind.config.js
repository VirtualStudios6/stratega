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
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        badgePop: {
          "0%":   { transform: "scale(0)" },
          "70%":  { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        wiggle:      "wiggle 0.5s ease-in-out",
        "fade-in":   "fadeIn 0.35s ease-out both",
        "slide-up":  "slideUp 0.35s ease-out both",
        "slide-down":"slideDown 0.25s ease-out both",
        "scale-in":  "scaleIn 0.25s ease-out both",
        shimmer:     "shimmer 1.6s linear infinite",
        "badge-pop": "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  plugins: [],
}
