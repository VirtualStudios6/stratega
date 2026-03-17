import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import { collection, getDocs, query, where } from "firebase/firestore"
import { Search, X, Bell, FileText, Folder, Calendar } from "lucide-react"

const ICONS = {
  reminder:  { icon: Bell,     color: "text-amber-400",  bg: "bg-amber-500/15",  label: "Recordatorio", path: "/reminders" },
  quote:     { icon: FileText, color: "text-blue-400",   bg: "bg-blue-500/15",   label: "Cotización",   path: "/quotes"    },
  folder:    { icon: Folder,   color: "text-primary-light", bg: "bg-primary/15", label: "Carpeta",      path: "/folders"   },
  planner:   { icon: Calendar, color: "text-green-400",  bg: "bg-green-500/15",  label: "Planificador", path: "/planner"   },
}

const GlobalSearch = () => {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [open,       setOpen]       = useState(false)
  const [query_,     setQuery]      = useState("")
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [selected,   setSelected]   = useState(0)
  const inputRef     = useRef(null)
  const allDataRef   = useRef(null)

  /* ── Ctrl+K listener ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  /* ── Cargar datos al abrir ── */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      if (!allDataRef.current) loadAllData()
    } else {
      setQuery("")
      setResults([])
      setSelected(0)
    }
  }, [open])

  const loadAllData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const uid = user.uid
      const [remSnap, quoSnap, folSnap, planSnap] = await Promise.all([
        getDocs(query(collection(db, "reminders"),  where("uid", "==", uid))),
        getDocs(query(collection(db, "quotes"),     where("uid", "==", uid))),
        getDocs(query(collection(db, "folders"),    where("uid", "==", uid))),
        getDocs(query(collection(db, "planners"),   where("uid", "==", uid))),
      ])

      allDataRef.current = [
        ...remSnap.docs.map(d => ({ id: d.id, type: "reminder", title: d.data().titulo,     sub: d.data().prioridad })),
        ...quoSnap.docs.map(d => ({ id: d.id, type: "quote",    title: d.data().cliente,    sub: `${d.data().moneda || ""} ${d.data().total || 0}` })),
        ...folSnap.docs.map(d => ({ id: d.id, type: "folder",   title: d.data().nombre,     sub: "Carpeta" })),
        ...planSnap.docs.map(d=>({ id: d.id, type: "planner",  title: d.data().titulo,     sub: d.data().fecha })),
      ]
    } catch {}
    setLoading(false)
  }

  /* ── Filtrar ── */
  useEffect(() => {
    if (!query_.trim() || !allDataRef.current) { setResults([]); return }
    const q = query_.toLowerCase()
    const filtered = allDataRef.current
      .filter(item => item.title?.toLowerCase().includes(q) || item.sub?.toLowerCase().includes(q))
      .slice(0, 8)
    setResults(filtered)
    setSelected(0)
  }, [query_])

  /* ── Navegación con teclado ── */
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === "Enter" && results[selected]) goTo(results[selected])
  }

  const goTo = useCallback((item) => {
    navigate(ICONS[item.type].path)
    setOpen(false)
  }, [navigate])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={18} className="text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query_}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar cotizaciones, recordatorios, carpetas..."
            className="flex-1 bg-transparent text-text-main text-sm outline-none placeholder:text-text-muted/50"
          />
          {query_ && (
            <button onClick={() => setQuery("")} className="text-text-muted hover:text-text-main transition">
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-text-muted/50 text-xs border border-border px-1.5 py-0.5 rounded-md font-mono">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-80 overflow-y-auto py-2">
          {loading && (
            <p className="text-text-muted text-sm text-center py-6">Cargando...</p>
          )}

          {!loading && !query_.trim() && (
            <div className="px-4 py-5 text-center">
              <Search size={32} className="text-text-muted/20 mx-auto mb-2" />
              <p className="text-text-muted text-sm">Escribe para buscar en toda la app</p>
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                {Object.entries(ICONS).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <span key={type} className="flex items-center gap-1.5 text-text-muted/60 text-xs">
                      <Icon size={12} /> {cfg.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && query_.trim() && results.length === 0 && (
            <p className="text-text-muted text-sm text-center py-6">Sin resultados para "{query_}"</p>
          )}

          {results.map((item, i) => {
            const cfg  = ICONS[item.type]
            const Icon = cfg.icon
            return (
              <button
                key={item.id}
                onClick={() => goTo(item)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  i === selected ? "bg-bg-hover" : "hover:bg-bg-hover"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={15} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-main text-sm font-medium truncate">{item.title}</p>
                  <p className="text-text-muted text-xs truncate">{cfg.label} · {item.sub}</p>
                </div>
                <span className="text-text-muted/30 text-xs">↵</span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-text-muted/40 text-xs">
          <span className="flex items-center gap-1"><kbd className="border border-border px-1 rounded font-mono">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="border border-border px-1 rounded font-mono">↵</kbd> abrir</span>
          <span className="flex items-center gap-1"><kbd className="border border-border px-1 rounded font-mono">ESC</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}

export default GlobalSearch
