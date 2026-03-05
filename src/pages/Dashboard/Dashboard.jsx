import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import { collection, getDocs, query, where } from "firebase/firestore"
import { askGroq } from "../../services/groq"

const StatCard = ({ icon, label, value, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-5 ${onClick ? "cursor-pointer hover:border-primary/30 transition" : ""}`}
  >
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color}`}>
      <span className="text-xl">{icon}</span>
    </div>
    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-bold text-text-main">{value}</p>
  </div>
)

const PRIORIDAD_COLORS = {
  Urgente: "bg-red-500/20 text-red-400 border-red-500/30",
  Importante: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Normal: "bg-primary/20 text-primary-light border-primary/30",
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario"

  const [stats, setStats] = useState({ tareas: 0, recordatorios: 0, posts: 0, carpetas: 0 })
  const [reminders, setReminders] = useState([])
  const [quotes, setQuotes] = useState([])
  const [balance, setBalance] = useState({ ingresos: 0, gastos: 0 })
  const [aiResumen, setAiResumen] = useState("")
  const [loadingAi, setLoadingAi] = useState(false)

  useEffect(() => {
    if (user) fetchAllData()
  }, [user])

  const fetchAllData = async () => {
    const uid = user.uid

    // Recordatorios pendientes
    const remQ = query(collection(db, "reminders"), where("uid", "==", uid), where("completado", "==", false))
    const remSnap = await getDocs(remQ)
    const remData = remSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 4)
    setReminders(remData)

    // Posts feed
    const feedQ = query(collection(db, "feed_posts"), where("uid", "==", uid))
    const feedSnap = await getDocs(feedQ)

    // Carpetas
    const foldQ = query(collection(db, "folders"), where("uid", "==", uid))
    const foldSnap = await getDocs(foldQ)

    // Cotizaciones recientes
    const quotQ = query(collection(db, "quotes"), where("uid", "==", uid))
    const quotSnap = await getDocs(quotQ)
    const quotData = quotSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.creadoEn?.toDate?.() || 0) - new Date(a.creadoEn?.toDate?.() || 0))
      .slice(0, 3)
    setQuotes(quotData)

    // Contabilidad del mes
    const accQ = query(collection(db, "accounting"), where("uid", "==", uid))
    const accSnap = await getDocs(accQ)
    const now = new Date()
    const accData = accSnap.docs.map(d => d.data()).filter(t => {
      const f = new Date(t.fecha)
      return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()
    })
    const ingresos = accData.filter(t => t.tipo === "ingreso").reduce((acc, t) => acc + t.monto, 0)
    const gastos = accData.filter(t => t.tipo === "gasto").reduce((acc, t) => acc + t.monto, 0)
    setBalance({ ingresos, gastos })

    setStats({
      tareas: remData.length,
      recordatorios: remSnap.docs.length,
      posts: feedSnap.docs.length,
      carpetas: foldSnap.docs.length,
    })
  }

  const handleAiResumen = async () => {
    setLoadingAi(true)
    setAiResumen("")
    try {
      const prompt = `Soy un community manager. Hoy tengo ${stats.recordatorios} recordatorios pendientes, ${stats.posts} imágenes en mi feed de Instagram, ${quotes.length} cotizaciones recientes y un balance mensual de $${balance.ingresos.toFixed(2)} en ingresos y $${balance.gastos.toFixed(2)} en gastos. Dame un resumen motivador y consejos rápidos para organizar bien mi día hoy.`
      const res = await askGroq(prompt, "Eres un asistente de productividad para community managers. Responde en español, de forma concisa, motivadora y con emojis. Máximo 4 puntos clave.")
      setAiResumen(res)
    } catch {
      setAiResumen("❌ Error al conectar con la IA.")
    }
    setLoadingAi(false)
  }

  const balanceTotal = balance.ingresos - balance.gastos

  return (
    <DashboardLayout>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Bienvenido, {firstName} 👋</h1>
          <p className="text-text-muted text-sm mt-1">Aquí tienes un resumen de tu día</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-xl px-4 py-2 text-sm text-text-muted">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {firstName[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon="🔔" label="Recordatorios" value={stats.recordatorios} color="bg-yellow-500/20" onClick={() => navigate("/reminders")} />
        <StatCard icon="🖼️" label="Posts en feed" value={stats.posts} color="bg-blue-500/20" onClick={() => navigate("/feed")} />
        <StatCard icon="📁" label="Carpetas" value={stats.carpetas} color="bg-purple-500/20" onClick={() => navigate("/folders")} />
        <StatCard
          icon="💰"
          label="Balance mes"
          value={`$${(balance.ingresos - balance.gastos).toFixed(0)}`}
          color={balanceTotal >= 0 ? "bg-green-500/20" : "bg-red-500/20"}
          onClick={() => navigate("/accounting")}
        />
      </div>

      {/* Resumen IA */}
      <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
              <span>🤖</span>
            </div>
            <div>
              <p className="text-text-main text-sm font-medium">Resumen IA del día</p>
              <p className="text-text-muted text-xs">Strat analiza tu día y te da consejos</p>
            </div>
          </div>
          <button
            onClick={handleAiResumen}
            disabled={loadingAi}
            className="bg-primary/20 border border-primary/30 text-primary-light text-sm px-4 py-2 rounded-xl hover:bg-primary/30 transition disabled:opacity-50"
          >
            {loadingAi ? "Analizando..." : "Analizar mi día"}
          </button>
        </div>
        {aiResumen && (
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-text-main text-sm whitespace-pre-line">{aiResumen}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Recordatorios pendientes */}
        <div className="col-span-2 bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-text-main font-semibold">Recordatorios pendientes</h2>
            <button
              onClick={() => navigate("/reminders")}
              className="text-xs text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/20 transition"
            >
              Ver todos
            </button>
          </div>
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl mb-3">🔔</span>
              <p className="text-text-muted text-sm">Sin recordatorios pendientes</p>
              <p className="text-text-muted/50 text-xs mt-1">¡Estás al día!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-[#0D0D18] border border-[#2A2A3E] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="text-text-main text-sm font-medium">{r.titulo}</p>
                      <p className="text-text-muted text-xs">
                        {new Date(r.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORIDAD_COLORS[r.prioridad] || PRIORIDAD_COLORS.Normal}`}>
                    {r.prioridad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cotizaciones recientes */}
        <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-text-main font-semibold">Cotizaciones</h2>
            <button
              onClick={() => navigate("/quotes")}
              className="text-xs text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/20 transition"
            >
              Ver todas
            </button>
          </div>
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-text-muted text-sm">Sin cotizaciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map(q => (
                <div key={q.id} className="bg-[#0D0D18] border border-[#2A2A3E] rounded-xl px-4 py-3">
                  <p className="text-text-main text-sm font-medium truncate">{q.cliente}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-primary-light text-sm font-bold">{q.moneda} {q.total?.toFixed(2)}</p>
                    <span className="text-text-muted text-xs font-mono">{q.numero}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Balance del mes */}
        <div className="col-span-2 bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-text-main font-semibold">Balance del mes</h2>
            <button
              onClick={() => navigate("/accounting")}
              className="text-xs text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/20 transition"
            >
              Ver detalle
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <p className="text-green-400 text-xs mb-1">Ingresos</p>
              <p className="text-green-400 font-bold text-lg">+${balance.ingresos.toFixed(2)}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400 text-xs mb-1">Gastos</p>
              <p className="text-red-400 font-bold text-lg">-${balance.gastos.toFixed(2)}</p>
            </div>
            <div className={`${balanceTotal >= 0 ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"} border rounded-xl p-4 text-center`}>
              <p className="text-text-muted text-xs mb-1">Balance</p>
              <p className={`font-bold text-lg ${balanceTotal >= 0 ? "text-primary-light" : "text-red-400"}`}>
                ${balanceTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Plan actual */}
        <div className="bg-gradient-to-r from-primary/20 to-primary-light/10 border border-primary/30 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs text-primary-light uppercase tracking-wider mb-1">Plan actual</p>
            <h3 className="text-text-main font-bold text-lg">Plan Gratuito</h3>
            <p className="text-text-muted text-sm mt-1">Actualiza para desbloquear todas las funciones</p>
          </div>
          <button
            onClick={() => navigate("/subscription")}
            className="mt-4 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
          >
            Ver planes
          </button>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default Dashboard
