import { createContext, useContext, useState, useEffect } from "react"

export const THEMES = {
  oscuro: {
    id: "oscuro",
    nombre: "Oscuro",
    emoji: "⚫",
    vars: {
      "--bg-main": "#080810",
      "--bg-card": "#13131F",
      "--bg-input": "#0D0D18",
      "--bg-hover": "#1E1E2E",
      "--border": "#2A2A3E",
      "--primary": "#6022EC",
      "--primary-light": "#8B5CF6",
      "--text-main": "#EEEEF2",
      "--text-muted": "#6B6B8A",
      "--scrollbar-track": "#13131F",
      "--scrollbar-thumb": "#2A2A3E",
      "--glow-primary": "0 0 28px rgba(96, 34, 236, 0.35)",
      "--glow-primary-hover": "0 0 38px rgba(96, 34, 236, 0.55)",
      "--card-shadow": "0 8px 32px rgba(0, 0, 0, 0.35)",
      "--border-primary": "rgba(96, 34, 236, 0.22)",
      "--gradient-text": "linear-gradient(135deg, #F5A623, #FF6B7A, #8B5CF6)",
    }
  },
  claro: {
    id: "claro",
    nombre: "Claro",
    emoji: "☀️",
    vars: {
      "--bg-main": "#F2F2F7",
      "--bg-card": "#FFFFFF",
      "--bg-input": "#EAEAF2",
      "--bg-hover": "#E0E0EC",
      "--border": "#D4D4E4",
      "--primary": "#5B1FD9",
      "--primary-light": "#7C4DEC",
      "--text-main": "#12122A",
      "--text-muted": "#6868A0",
      "--scrollbar-track": "#EAEAF2",
      "--scrollbar-thumb": "#C8C8DC",
      "--glow-primary": "0 0 20px rgba(91, 31, 217, 0.14)",
      "--glow-primary-hover": "0 0 28px rgba(91, 31, 217, 0.24)",
      "--card-shadow": "0 4px 20px rgba(91, 31, 217, 0.07)",
      "--border-primary": "rgba(91, 31, 217, 0.20)",
      "--gradient-text": "linear-gradient(135deg, #D97706, #DC2626, #6D28D9)",
    }
  },
  rosa: {
    id: "rosa",
    nombre: "Rosa Pastel",
    emoji: "🌸",
    vars: {
      "--bg-main": "#FFF0F5",
      "--bg-card": "#FFFFFF",
      "--bg-input": "#FDE8F0",
      "--bg-hover": "#FAD4E4",
      "--border": "#F5C0D8",
      "--primary": "#E05C8A",
      "--primary-light": "#F08AAE",
      "--text-main": "#3D1A28",
      "--text-muted": "#A06080",
      "--scrollbar-track": "#FDE8F0",
      "--scrollbar-thumb": "#F5C0D8",
      "--glow-primary": "0 0 20px rgba(224, 92, 138, 0.18)",
      "--glow-primary-hover": "0 0 28px rgba(224, 92, 138, 0.32)",
      "--card-shadow": "0 4px 20px rgba(224, 92, 138, 0.09)",
      "--border-primary": "rgba(224, 92, 138, 0.22)",
      "--gradient-text": "linear-gradient(135deg, #F59E0B, #E05C8A, #A855F7)",
    }
  },
  azul: {
    id: "azul",
    nombre: "Azul Pastel",
    emoji: "🩵",
    vars: {
      "--bg-main": "#EEF4FF",
      "--bg-card": "#FFFFFF",
      "--bg-input": "#E2EDFF",
      "--bg-hover": "#D0E2FF",
      "--border": "#B8D0F8",
      "--primary": "#3B7DE8",
      "--primary-light": "#6B9EF5",
      "--text-main": "#0F1F3D",
      "--text-muted": "#5A7AAA",
      "--scrollbar-track": "#E2EDFF",
      "--scrollbar-thumb": "#B8D0F8",
      "--glow-primary": "0 0 20px rgba(59, 125, 232, 0.18)",
      "--glow-primary-hover": "0 0 28px rgba(59, 125, 232, 0.32)",
      "--card-shadow": "0 4px 20px rgba(59, 125, 232, 0.09)",
      "--border-primary": "rgba(59, 125, 232, 0.22)",
      "--gradient-text": "linear-gradient(135deg, #F59E0B, #3B7DE8, #6B9EF5)",
    }
  }
}

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("stratega-theme") || "oscuro"
  })

  useEffect(() => {
    const vars = THEMES[theme]?.vars || THEMES.oscuro.vars
    const root = document.documentElement
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    root.setAttribute("data-theme", theme)
    document.body.style.backgroundColor = vars["--bg-main"]
    document.body.style.color = vars["--text-main"]
    localStorage.setItem("stratega-theme", theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
