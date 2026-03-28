import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc, updateDoc
} from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts"
import { Wallet, ArrowUp, ArrowDown, Pencil, Trash2, X, FileBarChart2, Lock } from "lucide-react"
import toast from "react-hot-toast"
import useSubscriptionGuard from "../../hooks/useSubscriptionGuard"

const CATEGORIAS_SUGERIDAS = [
  "Servicio", "Cotización", "Consultoría", "Producto",
  "Herramientas", "Publicidad", "Personal", "Oficina", "Transporte", "Otro"
]

const MESES       = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

const PIE_COLORS = ["#10B981","#3B82F6","#F59E0B","#EC4899","#EF4444","#14B8A6","#F97316","#06B6D4","#A3A3A3","#64748B"]

const fmt = (n, decimals = 2) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

// ── Categoria breakdown helper ─────────────────────────────────────────────
const buildCatData = (items) => {
  const map = {}
  items.forEach(t => {
    const key = t.categoria || "Sin categoría"
    map[key] = (map[key] || 0) + t.monto
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const Accounting = () => {
  const { user }  = useAuth()
  const { plan }  = useSubscriptionGuard()
  const isPro     = plan === "pro"
  const [transacciones, setTransacciones]   = useState([])
  const [modalOpen, setModalOpen]           = useState(false)
  const [reporteOpen, setReporteOpen]       = useState(false)
  const [editingTrans, setEditingTrans]     = useState(null)
  const [tipo, setTipo]                     = useState("ingreso")
  const [filtroMes, setFiltroMes]           = useState(new Date().getMonth())
  const [filtroAnio, setFiltroAnio]         = useState(new Date().getFullYear())
  const [reporteMes, setReporteMes]         = useState(new Date().getMonth())
  const [reporteAnio, setReporteAnio]       = useState(new Date().getFullYear())
  const [form, setForm] = useState({
    descripcion: "",
    monto: "",
    categoria: "",
    fecha: new Date().toISOString().split("T")[0],
    nota: "",
  })

  const fetchTransacciones = async () => {
    if (!user) return
    try {
      const q    = query(collection(db, "accounting"), where("uid", "==", user.uid))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      setTransacciones(data)
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar la contabilidad.")
    }
  }

  useEffect(() => { fetchTransacciones() }, [user])

  const handleEdit = (t) => {
    setEditingTrans(t)
    setTipo(t.tipo)
    setForm({ descripcion: t.descripcion, monto: String(t.monto), categoria: t.categoria, fecha: t.fecha, nota: t.nota || "" })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.descripcion.trim() || !form.monto) return
    const payload = { tipo, ...form, monto: parseFloat(form.monto) }
    if (editingTrans) {
      await updateDoc(doc(db, "accounting", editingTrans.id), payload)
    } else {
      await addDoc(collection(db, "accounting"), { uid: user.uid, ...payload, creadoEn: new Date() })
    }
    setModalOpen(false)
    setEditingTrans(null)
    setForm({ descripcion: "", monto: "", categoria: "", fecha: new Date().toISOString().split("T")[0], nota: "" })
    fetchTransacciones()
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "accounting", id))
    fetchTransacciones()
  }

  // ── Computed ────────────────────────────────────────────────────────────
  const filtradas = transacciones.filter(t => {
    const f = new Date(t.fecha)
    return f.getMonth() === filtroMes && f.getFullYear() === filtroAnio
  })

  const ingresos = filtradas.filter(t => t.tipo === "ingreso").reduce((a, t) => a + t.monto, 0)
  const gastos   = filtradas.filter(t => t.tipo === "gasto").reduce((a, t) => a + t.monto, 0)
  const balance  = ingresos - gastos

  // Últimos 6 meses para la gráfica principal
  const graficaData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const mes  = d.getMonth()
    const anio = d.getFullYear()
    const del  = transacciones.filter(t => { const f = new Date(t.fecha); return f.getMonth() === mes && f.getFullYear() === anio })
    return {
      mes: MESES_CORTO[mes],
      Ingresos: del.filter(t => t.tipo === "ingreso").reduce((a, t) => a + t.monto, 0),
      Gastos:   del.filter(t => t.tipo === "gasto").reduce((a, t) => a + t.monto, 0),
    }
  })

  // ── Reporte mensual ─────────────────────────────────────────────────────
  const reporteFiltradas = transacciones.filter(t => {
    const f = new Date(t.fecha)
    return f.getMonth() === reporteMes && f.getFullYear() === reporteAnio
  })
  const rIngresos    = reporteFiltradas.filter(t => t.tipo === "ingreso").reduce((a, t) => a + t.monto, 0)
  const rGastos      = reporteFiltradas.filter(t => t.tipo === "gasto").reduce((a, t) => a + t.monto, 0)
  const rBalance     = rIngresos - rGastos
  const rCatIngresos = buildCatData(reporteFiltradas.filter(t => t.tipo === "ingreso"))
  const rCatGastos   = buildCatData(reporteFiltradas.filter(t => t.tipo === "gasto"))

  // All unique categories (predefined + used)
  const todasCategorias = [...new Set([...CATEGORIAS_SUGERIDAS, ...transacciones.map(t => t.categoria).filter(Boolean)])]

  return (
    <DashboardLayout>
      <div className="mb-5 flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2">
            <Wallet size={20} className="text-primary-light" />Contabilidad
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">Control de ingresos y gastos</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isPro ? (
            <button
              onClick={() => { setReporteMes(filtroMes); setReporteAnio(filtroAnio); setReporteOpen(true) }}
              className="flex items-center gap-1.5 bg-bg-card border border-border text-text-muted hover:text-text-main hover:border-primary/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition text-xs sm:text-sm"
            >
              <FileBarChart2 size={14} /><span className="hidden sm:inline">Reporte mensual</span><span className="sm:hidden">Reporte</span>
            </button>
          ) : (
            <button
              onClick={() => {}}
              title="Disponible en plan Pro"
              className="flex items-center gap-1.5 bg-bg-card border border-border text-text-muted/40 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm cursor-default"
            >
              <Lock size={14} /><span className="hidden sm:inline">Reporte mensual</span><span className="sm:hidden">Reporte</span>
            </button>
          )}
          <button
            onClick={() => { setEditingTrans(null); setModalOpen(true) }}
            className="bg-primary text-white font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-xs sm:text-sm"
          >
            + Registrar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 sm:p-5">
          <p className="text-green-400 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-lg sm:text-2xl font-bold text-green-400">+${fmt(ingresos)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 sm:p-5">
          <p className="text-red-400 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Gastos</p>
          <p className="text-lg sm:text-2xl font-bold text-red-400">-${fmt(gastos)}</p>
        </div>
        <div className={`${balance >= 0 ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"} border rounded-2xl p-3 sm:p-5`}>
          <p className="text-text-muted text-[10px] sm:text-xs uppercase tracking-wider mb-1">Balance</p>
          <p className={`text-lg sm:text-2xl font-bold ${balance >= 0 ? "text-primary-light" : "text-red-400"}`}>${fmt(balance)}</p>
        </div>
      </div>

      {/* Gráfica */}
      <div className="bg-bg-card border border-border rounded-2xl p-4 sm:p-6 mb-6">
        <h2 className="text-text-main font-semibold mb-4 sm:mb-6 text-sm sm:text-base">Últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={graficaData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text-main)" }} cursor={{ fill: "var(--border)" }} />
            <Legend wrapperStyle={{ color: "var(--text-muted)", fontSize: 11 }} />
            <Bar dataKey="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Gastos"   fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtro mes */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
        <select value={filtroMes} onChange={e => setFiltroMes(parseInt(e.target.value))} className="bg-bg-card border border-border text-text-main rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          {MESES_CORTO.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={filtroAnio} onChange={e => setFiltroAnio(parseInt(e.target.value))} className="bg-bg-card border border-border text-text-main rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-text-muted text-xs sm:text-sm">{filtradas.length} transacciones</span>
      </div>

      {/* Lista transacciones */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="p-10 sm:p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-hover border border-border flex items-center justify-center mx-auto mb-4">
              <Wallet size={24} className="text-text-muted" />
            </div>
            <p className="text-text-muted text-sm">No hay transacciones este mes</p>
          </div>
        ) : (
          <>
            {/* Tabla — solo en desktop */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Descripción</th>
                  <th className="text-left px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Categoría</th>
                  <th className="text-left px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-right px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-bg-hover transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.tipo === "ingreso" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                          {t.tipo === "ingreso" ? <ArrowUp size={14} className="text-green-400" /> : <ArrowDown size={14} className="text-red-400" />}
                        </div>
                        <div>
                          <p className="text-text-main text-sm font-medium">{t.descripcion}</p>
                          {t.nota && <p className="text-text-muted text-xs">{t.nota}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-lg bg-bg-hover text-text-muted border border-border">{t.categoria}</span>
                    </td>
                    <td className="px-6 py-4 text-text-muted text-sm">
                      {new Date(t.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-sm ${t.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                      {t.tipo === "ingreso" ? "+" : "-"}${fmt(t.monto)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(t)} className="text-text-muted hover:text-primary-light transition"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(t.id)} className="text-text-muted hover:text-red-400 transition"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cards — solo en mobile */}
            <div className="sm:hidden divide-y divide-border">
              {filtradas.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.tipo === "ingreso" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                    {t.tipo === "ingreso" ? <ArrowUp size={15} className="text-green-400" /> : <ArrowDown size={15} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-main text-sm font-medium truncate">{t.descripcion}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{t.categoria}</span>
                      <span className="text-[10px] text-text-muted/60">·</span>
                      <span className="text-xs text-text-muted">
                        {new Date(t.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold ${t.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                      {t.tipo === "ingreso" ? "+" : "-"}${fmt(t.monto)}
                    </span>
                    <button onClick={() => handleEdit(t)} className="text-text-muted hover:text-primary-light transition p-1"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(t.id)} className="text-text-muted hover:text-red-400 transition p-1"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal registrar / editar ──────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">{editingTrans ? "Editar movimiento" : "Registrar movimiento"}</h2>
              <button onClick={() => { setModalOpen(false); setEditingTrans(null) }} className="text-text-muted hover:text-text-main"><X size={18} /></button>
            </div>

            {/* Tipo */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setTipo("ingreso")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${tipo === "ingreso" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-bg-input text-text-muted border-border hover:bg-bg-hover"}`}
              >
                <ArrowUp size={14} className="inline mr-1" />Ingreso
              </button>
              <button
                onClick={() => setTipo("gasto")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${tipo === "gasto" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-bg-input text-text-muted border-border hover:bg-bg-hover"}`}
              >
                <ArrowDown size={14} className="inline mr-1" />Gasto
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Pago de cliente Rancho Chito" className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40" />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Monto</label>
                <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00" min="0" className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40" />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Categoría</label>
                <input
                  type="text"
                  list="cat-suggestions"
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ej: Servicio, Publicidad, Renta..."
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
                <datalist id="cat-suggestions">
                  {todasCategorias.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Detalles</label>
                <input type="text" value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Información adicional" className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalOpen(false); setEditingTrans(null) }} className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30">{editingTrans ? "Guardar cambios" : "Registrar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal reporte mensual ─────────────────────────────────────────── */}
      {reporteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6 overflow-y-auto animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl my-auto animate-scale-in">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FileBarChart2 size={16} className="text-primary-light" />
                </div>
                <div>
                  <h2 className="text-text-main font-semibold">Reporte mensual</h2>
                  <p className="text-text-muted text-xs">{MESES[reporteMes]} {reporteAnio}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={reporteMes} onChange={e => setReporteMes(parseInt(e.target.value))} className="bg-bg-input border border-border text-text-main rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={reporteAnio} onChange={e => setReporteAnio(parseInt(e.target.value))} className="bg-bg-input border border-border text-text-main rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                  {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button onClick={() => setReporteOpen(false)} className="text-text-muted hover:text-text-main transition p-1"><X size={18} /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2 sm:p-4 text-center">
                  <p className="text-green-400 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1">Ingresos</p>
                  <p className="text-sm sm:text-xl font-bold text-green-400 truncate">+${fmt(rIngresos)}</p>
                  <p className="text-text-muted text-[9px] sm:text-[10px] mt-1">{reporteFiltradas.filter(t => t.tipo === "ingreso").length} mov.</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 sm:p-4 text-center">
                  <p className="text-red-400 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1">Gastos</p>
                  <p className="text-sm sm:text-xl font-bold text-red-400 truncate">-${fmt(rGastos)}</p>
                  <p className="text-text-muted text-[9px] sm:text-[10px] mt-1">{reporteFiltradas.filter(t => t.tipo === "gasto").length} mov.</p>
                </div>
                <div className={`${rBalance >= 0 ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"} border rounded-xl p-2 sm:p-4 text-center`}>
                  <p className="text-text-muted text-[9px] sm:text-[10px] uppercase tracking-wider mb-1">Balance</p>
                  <p className={`text-sm sm:text-xl font-bold truncate ${rBalance >= 0 ? "text-primary-light" : "text-red-400"}`}>${fmt(rBalance)}</p>
                  <p className="text-text-muted text-[9px] sm:text-[10px] mt-1">{reporteFiltradas.length} total</p>
                </div>
              </div>

              {reporteFiltradas.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-text-muted">Sin movimientos en {MESES[reporteMes]} {reporteAnio}</p>
                </div>
              ) : (
                <>
                  {/* Gráfica ingresos vs gastos por día */}
                  {(() => {
                    const diasMap = {}
                    reporteFiltradas.forEach(t => {
                      const d = new Date(t.fecha).getDate()
                      if (!diasMap[d]) diasMap[d] = { dia: `${d}`, Ingresos: 0, Gastos: 0 }
                      if (t.tipo === "ingreso") diasMap[d].Ingresos += t.monto
                      else diasMap[d].Gastos += t.monto
                    })
                    const diasData = Object.values(diasMap).sort((a, b) => parseInt(a.dia) - parseInt(b.dia))
                    return (
                      <div className="bg-bg-input border border-border rounded-xl p-4">
                        <p className="text-text-main text-sm font-semibold mb-4">Movimientos por día</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={diasData} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="dia" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-main)", fontSize: 12 }} cursor={{ fill: "var(--border)" }} />
                            <Legend wrapperStyle={{ color: "var(--text-muted)", fontSize: 11 }} />
                            <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Gastos"   fill="#EF4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  })()}

                  {/* Categorías */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Ingresos por categoría */}
                    <div className="bg-bg-input border border-border rounded-xl p-4">
                      <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-4">Ingresos por categoría</p>
                      {rCatIngresos.length === 0 ? (
                        <p className="text-text-muted text-xs text-center py-4">Sin ingresos</p>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                              <Pie data={rCatIngresos} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                {rCatIngresos.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-main)", fontSize: 11 }} formatter={(v) => `$${fmt(v)}`} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-1.5 mt-2">
                            {rCatIngresos.map((c, i) => (
                              <div key={c.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span className="text-text-muted text-[11px] truncate max-w-[90px]">{c.name}</span>
                                </div>
                                <span className="text-text-main text-[11px] font-medium">${fmt(c.value, 0)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Gastos por categoría */}
                    <div className="bg-bg-input border border-border rounded-xl p-4">
                      <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-4">Gastos por categoría</p>
                      {rCatGastos.length === 0 ? (
                        <p className="text-text-muted text-xs text-center py-4">Sin gastos</p>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                              <Pie data={rCatGastos} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                {rCatGastos.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-main)", fontSize: 11 }} formatter={(v) => `$${fmt(v)}`} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-1.5 mt-2">
                            {rCatGastos.map((c, i) => (
                              <div key={c.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span className="text-text-muted text-[11px] truncate max-w-[90px]">{c.name}</span>
                                </div>
                                <span className="text-text-main text-[11px] font-medium">${fmt(c.value, 0)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 pb-5">
              <button onClick={() => setReporteOpen(false)} className="w-full bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Accounting
