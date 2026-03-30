import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter as BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import "./i18n/index.js"
import "./index.css"
import App from "./App.jsx"

// Capacitor: registra el listener del botón "atrás" de Android al iniciar
if (typeof window !== "undefined") {
  import("@capacitor/app").then(({ App: CapApp }) => {
    CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        CapApp.exitApp()
      }
    })
  }).catch(() => {
    // No es entorno Capacitor (web normal) — se ignora silenciosamente
  })
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
