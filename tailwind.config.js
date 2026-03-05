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
      fontFamily: {
        sans: ["Rubik", "sans-serif"],
      },
    },
  },
  plugins: [],
}
