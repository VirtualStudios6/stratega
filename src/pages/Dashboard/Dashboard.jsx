import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import {
  collection, getDocs, query, where,
  doc, getDoc, setDoc, updateDoc,
} from "firebase/firestore"
import SmartNotifications from "../../components/shared/SmartNotifications"
import {
  Bell, Wallet, CalendarDays, XCircle,
  CheckCircle2, FileText, Crown, TrendingUp, TrendingDown,
  DollarSign, RefreshCw, Folder, Building2
} from "lucide-react"

const fmt = (n, decimals = 2) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/* ─── Sparkline ─────────────────────────────────────────────────────────── */
const SparkLine = ({ data, positive }) => {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 72, H = 26, pad = 2
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={W} height={H} className="overflow-visible opacity-70">
      <polyline points={points} fill="none"
        stroke={positive ? "#4ade80" : "#f87171"}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle
        cx={points.split(" ").at(-1).split(",")[0]}
        cy={points.split(" ").at(-1).split(",")[1]}
        r="2.5" fill={positive ? "#4ade80" : "#f87171"}
      />
    </svg>
  )
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, gradient, onClick, loading, sparkline, sparkPositive }) => (
  <div
    onClick={onClick}
    className={`relative bg-bg-card border border-border rounded-2xl p-4 sm:p-5 overflow-hidden transition
      ${onClick ? "cursor-pointer hover:border-primary/30 hover:bg-bg-hover active:bg-bg-hover" : ""}`}
  >
    <div className="flex items-start justify-between mb-2 sm:mb-3">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
        {icon}
      </div>
      {sparkline
        ? <SparkLine data={sparkline} positive={sparkPositive} />
        : onClick && <span className="text-text-muted/30 text-xs mt-1">→</span>
      }
    </div>
    <p className="text-text-muted text-[10px] sm:text-[11px] uppercase tracking-widest mb-1 font-medium">{label}</p>
    <p className="text-xl sm:text-2xl font-bold text-text-main">
      {loading
        ? <span className="inline-block w-14 h-6 bg-border/40 rounded-lg animate-pulse" />
        : value
      }
    </p>
    {sub && !loading && (
      <p className="text-text-muted/70 text-[10px] sm:text-[11px] mt-0.5 truncate">{sub}</p>
    )}
  </div>
)

/* ─── Section Header ─────────────────────────────────────────────────────── */
const SectionHeader = ({ title, icon, onViewAll, viewAllLabel }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
      {icon && <span className="text-base">{icon}</span>}
      {title}
    </h2>
    {onViewAll && (
      <button
        onClick={onViewAll}
        className="text-xs text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/20 transition"
      >
        {viewAllLabel}
      </button>
    )}
  </div>
)

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const Skel = ({ w = "w-full", h = "h-4" }) => (
  <div className={`${w} ${h} bg-border/40 rounded-lg animate-pulse`} />
)

/* ─── Priority colors ────────────────────────────────────────────────────── */
const PRIORIDAD_COLORS = {
  Urgente:    { dot: "bg-red-400",    badge: "bg-red-500/15 text-red-400 border-red-500/25" },
  Importante: { dot: "bg-amber-400",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  Normal:     { dot: "bg-primary",    badge: "bg-primary/15 text-primary-light border-primary/25" },
}

const ESTADO_COLORS = {
  Borrador:  "text-text-muted",
  Enviada:   "text-blue-400",
  Aprobada:  "text-green-400",
  Rechazada: "text-red-400",
  Emitida:   "text-blue-400",
  Pagada:    "text-green-400",
  Anulada:   "text-red-400",
}

/* ─── Dashboard ─────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  const firstName = useMemo(() =>
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario",
    [user]
  )

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Buenos días"
    if (h < 19) return "Buenas tardes"
    return "Buenas noches"
  }, [])

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", {
      weekday: "long", day: "numeric", month: "long"
    })
  }, [i18n.language])

  const [loading,       setLoading]       = useState(true)
  const [loadError,     setLoadError]     = useState(false)
  const [userPlan,      setUserPlan]      = useState("free")

  // Data
  const [stats,         setStats]         = useState({ recordatorios: 0, quotes: 0, folders: 0 })
  const [reminders,     setReminders]     = useState([])
  const [plannerEvents, setPlannerEvents] = useState([])
  const [quotes,        setQuotes]        = useState([])
  const [folders,       setFolders]       = useState([])
  const [balance,       setBalance]       = useState({ ingresos: 0, gastos: 0 })
  const [sparklineData, setSparklineData] = useState([])

  /* ── Streak ── */
  const updateStreak = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0]
    const userRef = doc(db, "users", user.uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      await setDoc(userRef, { streakDays: 1, lastActiveDate: today }, { merge: true })
      return
    }
    const data = snap.data()
    if (data.lastActiveDate === today) return
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const newStreak = data.lastActiveDate === yesterday.toISOString().split("T")[0]
      ? (data.streakDays || 0) + 1 : 1
    await updateDoc(userRef, { streakDays: newStreak, lastActiveDate: today })
  }, [user])

  /* ── Fetch all ── */
  const fetchAllData = useCallback(async () => {
    setLoadError(false)
    setLoading(true)
    try {
      const uid = user.uid
      const today = new Date().toISOString().split("T")[0]

      const [remSnap, plannerSnap, quotSnap, accSnap, folderSnap, userSnap] = await Promise.all([
        getDocs(query(collection(db, "reminders"),  where("uid", "==", uid), where("completado", "==", false))),
        getDocs(query(collection(db, "planners"),   where("uid", "==", uid))),
        getDocs(query(collection(db, "quotes"),     where("uid", "==", uid))),
        getDocs(query(collection(db, "accounting"), where("uid", "==", uid))),
        getDocs(query(collection(db, "folders"),    where("uid", "==", uid))),
        getDoc(doc(db, "users", uid)),
      ])

      // Reminders: next 4 pending
      const remData = remSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 4)
      setReminders(remData)

      // Planner: upcoming events (today and future), next 5
      const plannerData = plannerSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(ev => ev.fecha >= today)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5)
      setPlannerEvents(plannerData)

      // Quotes: last 4
      const quotData = quotSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.creadoEn?.toDate?.() || 0) - new Date(a.creadoEn?.toDate?.() || 0))
        .slice(0, 4)
      setQuotes(quotData)

      // Folders
      const folderData = folderSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
      setFolders(folderData)

      // Accounting: current month
      const now = new Date()
      const allAcc = accSnap.docs.map(d => d.data())
      const accMonth = allAcc.filter(t => {
        const f = new Date(t.fecha)
        return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()
      })
      const ingresos = accMonth.filter(t => t.tipo === "ingreso").reduce((a, t) => a + t.monto, 0)
      const gastos   = accMonth.filter(t => t.tipo === "gasto").reduce((a, t) => a + t.monto, 0)
      setBalance({ ingresos, gastos })

      // Sparkline: net balance last 6 months
      const spark = Array.from({ length: 6 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        const m = d.getMonth(), y = d.getFullYear()
        const items = allAcc.filter(t => {
          const f = new Date(t.fecha)
          return f.getMonth() === m && f.getFullYear() === y
        })
        return items.filter(t => t.tipo === "ingreso").reduce((a, t) => a + t.monto, 0)
             - items.filter(t => t.tipo === "gasto").reduce((a, t) => a + t.monto, 0)
      })
      setSparklineData(spark)

      // User plan
      if (userSnap.exists()) setUserPlan(userSnap.data().plan || "free")

      // Stats
      const pendingQuotes = quotSnap.docs.filter(d => {
        const data = d.data()
        return data.estado === "Borrador" || data.estado === "Enviada" || data.estado === "Emitida"
      }).length

      setStats({
        recordatorios: remSnap.docs.length,
        quotes: pendingQuotes,
        folders: folderSnap.docs.length,
      })
    } catch (error) {
      console.error(error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const init = async () => { await updateStreak(); await fetchAllData() }
    init()
  }, [user, updateStreak, fetchAllData])

  const balanceTotal = useMemo(() => balance.ingresos - balance.gastos, [balance])

  const PLAT_COLORS = {
    Instagram: "#E1306C", TikTok: "#69C9D0", Facebook: "#1877F2",
    LinkedIn: "#0A66C2", Twitter: "#1DA1F2", YouTube: "#FF0000",
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted capitalize mb-0.5">{todayLabel}</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
                {greeting}, {firstName} 👋
              </h1>
              {userPlan !== "free" && (
                <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Crown size={10} /> Pro
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm mt-1">Aquí tienes el resumen de tu actividad</p>
          </div>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="self-start flex items-center gap-2 px-4 py-2 text-sm bg-bg-input border border-border rounded-xl text-text-muted hover:text-text-main hover:border-primary/30 transition disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        <SmartNotifications />

        {loadError && (
          <div className="bg-red-500/8 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-3">
            <XCircle size={18} className="flex-shrink-0" />
            <span className="flex-1">Error al cargar los datos.</span>
            <button onClick={fetchAllData} className="underline hover:text-red-300 text-xs">Reintentar</button>
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Bell size={18} className="text-amber-400" />}
            label="Recordatorios"
            value={stats.recordatorios}
            sub="pendientes activos"
            gradient="bg-amber-500/15"
            onClick={() => navigate("/reminders")}
            loading={loading}
          />
          <StatCard
            icon={<Building2 size={18} className="text-blue-400" />}
            label="Empresas"
            value={stats.folders}
            sub="clientes / proyectos"
            gradient="bg-blue-500/15"
            onClick={() => navigate("/folders")}
            loading={loading}
          />
          <StatCard
            icon={<FileText size={18} className="text-indigo-400" />}
            label="Docs activos"
            value={stats.quotes}
            sub="cotiz. y facturas abiertas"
            gradient="bg-indigo-500/15"
            onClick={() => navigate("/quotes")}
            loading={loading}
          />
          <StatCard
            icon={<Wallet size={18} className={balanceTotal >= 0 ? "text-green-400" : "text-red-400"} />}
            label="Balance del mes"
            value={`$${fmt(balanceTotal, 0)}`}
            sub={balanceTotal >= 0 ? "superávit mensual" : "déficit mensual"}
            gradient={balanceTotal >= 0 ? "bg-green-500/15" : "bg-red-500/15"}
            onClick={() => navigate("/accounting")}
            loading={loading}
            sparkline={sparklineData}
            sparkPositive={balanceTotal >= 0}
          />
        </div>

        {/* ── Main grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Próximos eventos (planner) ─────────── col 1-2 ── */}
          <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-5">
            <SectionHeader
              title="Próximos eventos"
              icon="📅"
              onViewAll={() => navigate("/planner")}
              viewAllLabel="Ver planner"
            />
            {loading ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 bg-bg-input border border-border rounded-xl px-4 py-3">
                    <Skel w="w-8" h="h-8" />
                    <div className="flex-1 space-y-1.5"><Skel w="w-1/2" /><Skel w="w-1/3" h="h-3" /></div>
                    <Skel w="w-12" h="h-5" />
                  </div>
                ))}
              </div>
            ) : plannerEvents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarDays size={34} className="text-text-muted/25 mb-3" />
                <p className="text-text-main text-sm font-medium mb-1">Sin eventos próximos</p>
                <p className="text-text-muted text-xs mb-4">Agrega contenido al planner para verlo aquí</p>
                <button
                  onClick={() => navigate("/planner")}
                  className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/20"
                >
                  + Planificar contenido
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {plannerEvents.map(ev => {
                  const pr = PRIORIDAD_COLORS[ev.prioridad] || PRIORIDAD_COLORS.Normal
                  const platColor = PLAT_COLORS[ev.plataforma] || null
                  const isToday = ev.fecha === new Date().toISOString().split("T")[0]
                  const dateStr = new Date(ev.fecha + "T12:00:00").toLocaleDateString(
                    i18n.language === "es" ? "es-ES" : "en-US",
                    { day: "2-digit", month: "short" }
                  )
                  return (
                    <div
                      key={ev.id}
                      onClick={() => navigate("/planner")}
                      className="flex items-center gap-3 bg-bg-input border border-border rounded-xl px-4 py-3 hover:border-primary/20 transition cursor-pointer"
                    >
                      {/* Priority dot */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pr.dot}`} />

                      {/* Date */}
                      <div className="flex-shrink-0 text-center min-w-[38px]">
                        <p className={`text-xs font-bold leading-tight ${isToday ? "text-primary-light" : "text-text-main"}`}>
                          {dateStr.split(" ")[0]}
                        </p>
                        <p className="text-[10px] text-text-muted capitalize">{dateStr.split(" ")[1]}</p>
                        {isToday && <span className="text-[9px] text-primary-light font-semibold">HOY</span>}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-main font-medium truncate">{ev.titulo}</p>
                        {ev.descripcion && (
                          <p className="text-xs text-text-muted truncate mt-0.5">{ev.descripcion}</p>
                        )}
                      </div>

                      {/* Platform + format — oculto en mobile, visible en sm+ */}
                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        {ev.formato && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary-light font-medium whitespace-nowrap">
                            {ev.formato}
                          </span>
                        )}
                        {ev.plataforma && platColor && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap"
                            style={{ backgroundColor: platColor + "22", color: platColor, border: `1px solid ${platColor}44` }}
                          >
                            {ev.plataforma}
                          </span>
                        )}
                        {ev.hora && (
                          <span className="text-[10px] text-text-muted whitespace-nowrap">🕐 {ev.hora}</span>
                        )}
                      </div>
                      {/* Mobile: solo hora */}
                      {ev.hora && (
                        <span className="sm:hidden text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">🕐 {ev.hora}</span>
                      )}
                    </div>
                  )
                })}
                <button
                  onClick={() => navigate("/planner")}
                  className="w-full mt-1 py-2 text-xs text-text-muted hover:text-primary-light border border-dashed border-border hover:border-primary/30 rounded-xl transition"
                >
                  + Ver todo el planner
                </button>
              </div>
            )}
          </div>

          {/* ── Empresas / Folders ────────────────── col 3 ── */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <SectionHeader
              title="Empresas"
              icon="🏢"
              onViewAll={() => navigate("/folders")}
              viewAllLabel="Ver todo"
            />
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 bg-bg-input border border-border rounded-xl px-3 py-2.5">
                    <Skel w="w-7" h="h-7" />
                    <Skel w="w-2/3" h="h-4" />
                  </div>
                ))}
              </div>
            ) : folders.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Folder size={32} className="text-text-muted/25 mb-3" />
                <p className="text-text-muted text-xs mb-4">Sin empresas aún</p>
                <button
                  onClick={() => navigate("/folders")}
                  className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/20"
                >
                  + Crear empresa
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {folders.slice(0, 6).map(f => (
                  <div
                    key={f.id}
                    onClick={() => navigate("/folders")}
                    className="flex items-center gap-3 px-3 py-2.5 bg-bg-input border border-border rounded-xl hover:border-primary/20 transition cursor-pointer"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ backgroundColor: f.color || "#6022EC" }}
                    >
                      {f.nombre?.[0]?.toUpperCase() || "E"}
                    </div>
                    <p className="text-sm text-text-main truncate font-medium">{f.nombre}</p>
                  </div>
                ))}
                {folders.length > 6 && (
                  <p className="text-xs text-text-muted text-center pt-1">+{folders.length - 6} más</p>
                )}
              </div>
            )}
          </div>

          {/* ── Recordatorios pendientes ───────────── col 1-2 ── */}
          <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-5">
            <SectionHeader
              title="Recordatorios pendientes"
              icon="🔔"
              onViewAll={() => navigate("/reminders")}
              viewAllLabel="Ver todos"
            />
            {loading ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 bg-bg-input border border-border rounded-xl px-4 py-3">
                    <Skel w="w-8" h="h-8" />
                    <div className="flex-1 space-y-1.5"><Skel w="w-3/4" /><Skel w="w-1/3" h="h-3" /></div>
                    <Skel w="w-14" h="h-5" />
                  </div>
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 size={32} className="text-green-400/50 mb-2" />
                <p className="text-text-main text-sm font-semibold mb-0.5">Todo al día</p>
                <p className="text-text-muted text-xs">No tienes recordatorios pendientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.map(r => {
                  const pr = PRIORIDAD_COLORS[r.prioridad] || PRIORIDAD_COLORS.Normal
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 bg-bg-input border border-border rounded-xl px-4 py-3 hover:border-primary/20 transition"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pr.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-text-main text-sm font-medium truncate">{r.titulo}</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {new Date(r.fecha).toLocaleString(i18n.language === "es" ? "es-ES" : "en-US", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                          {r.categoria && <span className="ml-2 opacity-60">· {r.categoria}</span>}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border flex-shrink-0 ${pr.badge}`}>
                        {r.prioridad}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Cotizaciones recientes ─────────────── col 3 ── */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <SectionHeader
              title="Documentos recientes"
              icon="📄"
              onViewAll={() => navigate("/quotes")}
              viewAllLabel="Ver todo"
            />
            {loading ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-bg-input border border-border rounded-xl px-4 py-3 space-y-2">
                    <Skel w="w-2/3" /><Skel w="w-1/2" h="h-3" />
                  </div>
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText size={32} className="text-text-muted/25 mb-3" />
                <p className="text-text-muted text-xs mb-4">Sin cotizaciones aún</p>
                <button
                  onClick={() => navigate("/quotes")}
                  className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/20"
                >
                  + Nueva cotización
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {quotes.map(q => (
                  <div
                    key={q.id}
                    onClick={() => navigate("/quotes")}
                    className="bg-bg-input border border-border rounded-xl px-4 py-3 hover:border-primary/20 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${
                        q.tipo === "factura"
                          ? "bg-green-500/15 text-green-400 border border-green-500/20"
                          : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {q.tipo === "factura" ? "Factura" : "Cotiz."}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono flex-1 truncate">{q.numero}</span>
                      <span className={`text-[10px] font-medium flex-shrink-0 ${ESTADO_COLORS[q.estado] || "text-text-muted"}`}>
                        {q.estado}
                      </span>
                    </div>
                    <p className="text-text-main text-sm font-medium truncate">{q.cliente}</p>
                    <p className="text-primary-light text-sm font-bold mt-0.5">
                      {q.moneda} {fmt(q.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Financial summary ─────────────────────────────────────── */}
        <div className="bg-bg-card border border-border rounded-2xl p-5">
          <SectionHeader
            title="Balance mensual"
            icon="💰"
            onViewAll={() => navigate("/accounting")}
            viewAllLabel="Ver contabilidad"
          />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-xl p-4 bg-bg-input border border-border space-y-2">
                  <Skel w="w-2/3" h="h-3" /><Skel w="w-full" h="h-6" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-500/8 border border-green-500/15 rounded-xl p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-green-400 text-xs font-medium mb-0.5">Ingresos</p>
                  <p className="text-green-400 font-bold text-xl">+${fmt(balance.ingresos)}</p>
                </div>
              </div>
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingDown size={16} className="text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 text-xs font-medium mb-0.5">Gastos</p>
                  <p className="text-red-400 font-bold text-xl">-${fmt(balance.gastos)}</p>
                </div>
              </div>
              <div className="bg-primary/8 border border-primary/15 rounded-xl p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={16} className="text-primary-light" />
                </div>
                <div>
                  <p className="text-primary-light text-xs font-medium mb-0.5">Balance neto</p>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-xl ${balanceTotal >= 0 ? "text-primary-light" : "text-red-400"}`}>
                      ${fmt(balanceTotal)}
                    </p>
                    <SparkLine data={sparklineData} positive={balanceTotal >= 0} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Plan upgrade ──────────────────────────────────────────── */}
        {userPlan === "free" && (
          <div className="relative bg-bg-card border border-primary/20 rounded-2xl p-5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Crown size={18} className="text-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-text-main font-bold text-sm mb-0.5">Plan gratuito activo</h3>
                  <p className="text-text-muted text-xs">Desbloquea equipos, IA ilimitada, reportes avanzados y más con el plan Pro.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/subscription")}
                className="w-full sm:w-auto flex-shrink-0 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-light transition font-semibold text-sm shadow-lg shadow-primary/25"
              >
                Ver planes →
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}

export default Dashboard
