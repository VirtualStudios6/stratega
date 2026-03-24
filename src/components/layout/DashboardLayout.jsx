import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import AIAssistant from "../shared/AIAssistant"
import OnboardingWizard from "../shared/OnboardingWizard"
import GlobalSearch from "../shared/GlobalSearch"
import NotificationBell from "../shared/NotificationBell"
import AppTour from "../shared/AppTour"
import { useTranslation } from "react-i18next"
import { Search, Menu } from "lucide-react"

const SIDEBAR_EXPANDED  = "w-64"
const SIDEBAR_COLLAPSED = "w-[72px]"

// Mapa ruta → clave de traducción
const ROUTE_KEYS = {
  "/dashboard":    "sidebar.dashboard",
  "/planner":      "sidebar.planner",
  "/feed":         "sidebar.feed",
  "/reminders":    "sidebar.reminders",
  "/folders":      "sidebar.folders",
  "/quotes":       "sidebar.quotes",
  "/accounting":   "sidebar.accounting",
  "/team":         "sidebar.team",
  "/settings":     "sidebar.settings",
  "/subscription": "sidebar.subscription",
}

const DashboardLayout = ({ children }) => {
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    return saved !== null ? saved === "true" : false
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const location  = useLocation()
  const { t, i18n } = useTranslation()

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  // Bloquear scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileSidebarOpen])

  const toggleDesktop = () => {
    setDesktopCollapsed(prev => {
      const next = !prev
      localStorage.setItem("sidebarCollapsed", String(next))
      return next
    })
  }

  const sidebarWidth = desktopCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
  const pageTitle    = t(ROUTE_KEYS[location.pathname] || "sidebar.dashboard")

  return (
    <div className="flex min-h-screen bg-bg-main">

      {/* ── Sidebar desktop fijo ── */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 h-screen
          bg-bg-card border-r border-border z-30 overflow-hidden
          transition-[width] duration-300 ease-in-out
          ${sidebarWidth}
        `}
      >
        <Sidebar
          open={true}
          onClose={() => {}}
          collapsed={desktopCollapsed}
          isMobile={false}
        />
      </aside>

      {/* Toggle pill desktop */}
      <button
        onClick={toggleDesktop}
        className={`
          hidden lg:flex fixed top-[14px] z-40
          w-8 h-8 bg-bg-card border border-border rounded-lg
          items-center justify-center shadow-sm
          text-text-muted hover:text-primary-light hover:border-primary/40
          transition-all duration-300 ease-in-out
          ${desktopCollapsed ? "left-[20px]" : "left-[220px]"}
        `}
        aria-label="Toggle sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </button>

      {/* ── Contenido principal ── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 min-h-screen
          transition-[margin-left] duration-300 ease-in-out
          ${desktopCollapsed ? "lg:ml-[72px]" : "lg:ml-64"}
        `}
      >

        {/* ── Topbar MÓVIL ── */}
        {/* sticky con top: env(safe-area-inset-top) para que el header quede
            justo debajo del status bar nativo (iOS/Android) y no se deslice bajo él al hacer scroll */}
        <header
          className="lg:hidden sticky z-30 flex items-center justify-between px-4 h-14 bg-bg-card/96 backdrop-blur-xl border-b border-border"
          style={{ top: 'env(safe-area-inset-top)' }}
        >
          {/* Hamburguesa + logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-input border border-border text-text-muted active:opacity-60 transition-opacity"
              aria-label="Abrir menú"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <img src="/logos/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
              </div>
              <span className="text-sm font-bold text-text-main">{pageTitle}</span>
            </div>
          </div>

          {/* Búsqueda + campanita */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-input border border-border text-text-muted active:opacity-60 transition-opacity"
              aria-label="Buscar"
            >
              <Search size={15} />
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* ── Topbar DESKTOP ── */}
        <header
          className="hidden lg:flex items-center justify-between px-6 h-[52px] bg-bg-card/80 backdrop-blur-md border-b border-border sticky z-20"
          style={{ top: 'env(safe-area-inset-top)' }}
        >
          <span className="text-text-muted text-sm capitalize select-none">
            {new Date().toLocaleDateString(
              i18n.language === "es" ? "es-ES" : "en-US",
              { weekday: "long", day: "numeric", month: "long" }
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
              className="flex items-center gap-2 bg-bg-input border border-border text-text-muted hover:text-text-main hover:border-primary/30 rounded-xl px-3 py-1.5 text-xs transition"
            >
              <Search size={13} />
              <span>Buscar</span>
              <kbd className="bg-bg-hover border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-text-muted/60">Ctrl K</kbd>
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* ── Página ── */}
        <main className="flex-1 px-4 pt-4 pb-6 sm:px-5 sm:pt-5 lg:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

      {/* ── Sidebar MÓVIL (overlay deslizante) ── */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <Sidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        collapsed={false}
        isMobile={true}
      />

      <AIAssistant />
      <OnboardingWizard />
      <GlobalSearch />
      <AppTour />
    </div>
  )
}

export default DashboardLayout
