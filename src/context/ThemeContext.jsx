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
    }
  },
  claro: {
    id: "claro",
    nombre: "Claro",
    emoji: "☀️",
    vars: {
      "--bg-main": "#F4F4F8",
      "--bg-card": "#FFFFFF",
      "--bg-input": "#F0F0F5",
      "--bg-hover": "#E8E8F0",
      "--border": "#DDDDE8",
      "--primary": "#6022EC",
      "--primary-light": "#8B5CF6",
      "--text-main": "#1A1A2E",
      "--text-muted": "#6B6B8A",
      "--scrollbar-track": "#F0F0F5",
      "--scrollbar-thumb": "#DDDDE8",
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
