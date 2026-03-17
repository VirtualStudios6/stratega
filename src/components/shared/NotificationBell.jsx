import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import { collection, getDocs, query, where } from "firebase/firestore"
import { Bell, CheckCircle2, X, AlertCircle, Clock } from "lucide-react"

const PRIORITY_COLORS = {
  Urgente:    "bg-red-500/15 text-red-400 border-red-500/25",
  Importante: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Normal:     "bg-primary/15 text-primary-light border-primary/25",
}

const NotificationBell = () => {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const panelRef    = useRef(null)

  const [open,    setOpen]    = useState(false)
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(false)
  const [pulse,   setPulse]   = useState(false)

  // Fetch reminders on mount and on open
  const fetchReminders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const snap = await getDocs(
        query(collection(db, "reminders"), where("uid", "==", user.uid), where("completado", "==", false))
      )
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 15)
      setItems(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchReminders() }, [user])

  // Pulse the bell when a reminder fires
  useEffect(() => {
    const handler = () => {
      setPulse(true)
      fetchReminders()           // refresh list so "¡Ahora!" appears
      setTimeout(() => setPulse(false), 4000)
    }
    window.addEventListener("reminder-fired", handler)
    return () => window.removeEventListener("reminder-fired", handler)
  }, [user])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const now = new Date()

  // Badge count = only reminders whose time has already passed (overdue)
  const urgent = items.filter(t => new Date(t.fecha) < now)

  const formatDate = (iso) => {
    try {
      const d    = new Date(iso)
      const diff = d - now
      if (diff <= 0)                       return "¡Ahora!"
      if (diff < 60 * 60 * 1000)           return `En ${Math.round(diff / 60000)} min`
      if (diff < 24 * 60 * 60 * 1000)     return `En ${Math.round(diff / 3600000)} h`
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    } catch { return "" }
  }

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchReminders() }}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl bg-bg-input border transition
          ${pulse
            ? "border-primary/60 text-primary-light bg-primary/10"
            : "border-border text-text-muted hover:text-text-main hover:border-primary/30"
          }`}
        title="Notificaciones"
      >
        <Bell size={16} className={pulse ? "animate-bounce" : ""} />

        {urgent.length > 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none
            ${pulse ? "bg-red-500 animate-pulse" : "bg-primary"}`}>
            {urgent.length > 9 ? "9+" : urgent.length}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-primary-light" />
              <p className="text-text-main text-sm font-semibold">Recordatorios</p>
              {urgent.length > 0 && (
                <span className="bg-red-500/15 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {urgent.length} vencido{urgent.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-text-muted hover:text-text-main transition p-1 rounded-lg hover:bg-bg-hover"
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="py-8 text-center text-text-muted text-sm">Cargando...</div>
            )}

            {!loading && items.length === 0 && (
              <div className="py-8 text-center">
                <CheckCircle2 size={32} className="text-green-400/40 mx-auto mb-2" />
                <p className="text-text-main text-sm font-medium">Todo al día</p>
                <p className="text-text-muted text-xs mt-0.5">No tienes recordatorios pendientes</p>
              </div>
            )}

            {items.map(item => {
              const d        = new Date(item.fecha)
              const isNow    = d - now <= 0
              const isSoon   = d - now <= 60 * 60 * 1000 && d - now > 0
              const label    = formatDate(item.fecha)

              return (
                <button
                  key={item.id}
                  onClick={() => { navigate("/reminders"); setOpen(false) }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-bg-hover transition text-left border-b border-border/50 last:border-0"
                >
                  {isNow
                    ? <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    : isSoon
                      ? <Clock size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      : <div className="w-2 h-2 rounded-full bg-border flex-shrink-0 mt-1.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-text-main text-xs font-medium truncate">{item.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[item.prioridad] || PRIORITY_COLORS.Normal}`}>
                        {item.prioridad}
                      </span>
                      <span className={`text-[10px] font-medium ${isNow ? "text-red-400" : isSoon ? "text-amber-400" : "text-text-muted"}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border">
            <button
              onClick={() => { navigate("/reminders"); setOpen(false) }}
              className="w-full text-center text-primary-light text-xs hover:text-primary font-medium transition"
            >
              Ver todos los recordatorios →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
