import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter as BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { ErrorBoundary } from "./components/shared/ErrorBoundary"
import "./i18n/index.js"
import "./index.css"
import App from "./App.jsx"

// Capacitor: inyecta --sat (safe-area-top) como CSS variable antes de que
// React monte. En Android nativo usamos max(env(...), 28px) como mínimo
// porque env(safe-area-inset-top) puede devolver 0 en WebViews donde
// los insets no se propagan correctamente (timing race en algunos OEMs).
// En web/iOS dejamos env() puro para no añadir padding innecesario.
if (typeof window !== "undefined") {
  if (import.meta.env.DEV && window.location.hostname === "127.0.0.1") {
    const { protocol, port, pathname, search, hash } = window.location
    window.location.replace(`${protocol}//localhost${port ? `:${port}` : ""}${pathname}${search}${hash}`)
  }

  const isAndroidNative = window?.Capacitor?.getPlatform?.() === "android"
  document.documentElement.style.setProperty(
    "--sat",
    isAndroidNative
      ? "max(env(safe-area-inset-top, 0px), 28px)"
      : "env(safe-area-inset-top, 0px)"
  )
}

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
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
