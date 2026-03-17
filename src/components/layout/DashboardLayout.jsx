import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import AIAssistant from "../shared/AIAssistant"
import OnboardingWizard from "../shared/OnboardingWizard"
import GlobalSearch from "../shared/GlobalSearch"
import NotificationBell from "../shared/NotificationBell"
import AppTour from "../shared/AppTour"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"

const SIDEBAR_EXPANDED = "w-64"
const SIDEBAR_COLLAPSED = "w-[72px]"

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen]   = useState(false)
  const [desktopCollapsed,   setDesktopCollapsed]   = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    return saved !== null ? saved === "true" : false
  })

  const location     = useLocation()
  const { i18n }     = useTranslation()

  // Cerrar mobile al navegar
  useEffect(() => { setMobileSidebarOpen(false) }, [location.pathname])

  // Bloquear scroll cuando mobile está abierto
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : ""
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

  return (
    <div className="flex min-h-screen bg-bg-main">

      {/* ── Sidebar mobile ── */}
      <Sidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        collapsed={false}
        isMobile={true}
      />

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

      {/* ── Toggle pill ── fuera del aside para no quedar clipeado */}
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

      {/* ── Overlay mobile ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Contenido principal ── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 min-h-screen
          transition-[margin-left] duration-300 ease-in-out
          ${desktopCollapsed ? "lg:ml-[72px]" : "lg:ml-64"}
        `}
      >

        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-bg-card/90 backdrop-blur-md border-b border-border">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-input border border-border text-text-main hover:border-primary/30 transition"
            aria-label="Abrir menú"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <img src="/logos/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-sm font-bold text-text-main">Stratega</span>
          </div>

          <div className="w-9" />
        </header>

        {/* Topbar desktop */}
        <header className="hidden lg:flex items-center justify-between px-6 h-[52px] bg-bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
          <span className="text-text-muted text-sm capitalize select-none">
            {new Date().toLocaleDateString(
              i18n.language === "es" ? "es-ES" : "en-US",
              { weekday: "long", day: "numeric", month: "long" }
            )}
          </span>

          <div className="flex items-center gap-2">
            {/* Botón búsqueda */}
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
              className="flex items-center gap-2 bg-bg-input border border-border text-text-muted hover:text-text-main hover:border-primary/30 rounded-xl px-3 py-1.5 text-xs transition"
            >
              <Search size={13} />
              <span>Buscar</span>
              <kbd className="bg-bg-hover border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-text-muted/60">Ctrl K</kbd>
            </button>

            {/* Campanita */}
            <NotificationBell />
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      <AIAssistant />
      <OnboardingWizard />
      <GlobalSearch />
      <AppTour />
    </div>
  )
}

export default DashboardLayout
