import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc
} from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts"

const CATEGORIAS_INGRESO = ["Servicio", "Cotización", "Consultoría", "Producto", "Otro"]
const CATEGORIAS_GASTO = ["Herramientas", "Publicidad", "Personal", "Oficina", "Transporte", "Otro"]

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const Accounting = () => {
  const { user } = useAuth()
  const [transacciones, setTransacciones] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [tipo, setTipo] = useState("ingreso")
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth())
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear())
  const [form, setForm] = useState({
    descripcion: "",
    monto: "",
    categoria: "Servicio",
    fecha: new Date().toISOString().split("T")[0],
    nota: "",
  })

  const fetchTransacciones = async () => {
    if (!user) return
    const q = query(collection(db, "accounting"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    setTransacciones(data)
  }

  useEffect(() => { fetchTransacciones() }, [user])

  const handleSave = async () => {
    if (!form.descripcion.trim() || !form.monto) return
    await addDoc(collection(db, "accounting"), {
      uid: user.uid,
      tipo,
      ...form,
      monto: parseFloat(form.monto),
      creadoEn: new Date()
    })
    setModalOpen(false)
    setForm({ descripcion: "", monto: "", categoria: "Servicio", fecha: new Date().toISOString().split("T")[0], nota: "" })
    fetchTransacciones()
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "accounting", id))
    fetchTransacciones()
  }

  // Filtrar por mes y año
  const filtradas = transacciones.filter(t => {
    const fecha = new Date(t.fecha)
    return fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAnio
  })

  const ingresos = filtradas.filter(t => t.tipo === "ingreso").reduce((acc, t) => acc + t.monto, 0)
  const gastos = filtradas.filter(t => t.tipo === "gasto").reduce((acc, t) => acc + t.monto, 0)
  const balance = ingresos - gastos

  // Datos para la gráfica (últimos 6 meses)
  const graficaData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const mes = d.getMonth()
    const anio = d.getFullYear()
    const delMes = transacciones.filter(t => {
      const f = new Date(t.fecha)
      return f.getMonth() === mes && f.getFullYear() === anio
    })
    return {
      mes: MESES[mes],
      Ingresos: delMes.filter(t => t.tipo === "ingreso").reduce((acc, t) => acc + t.monto, 0),
      Gastos: delMes.filter(t => t.tipo === "gasto").reduce((acc, t) => acc + t.monto, 0),
    }
  })

  const categorias = tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Contabilidad 💰</h1>
          <p className="text-text-muted text-sm mt-1">Control de ingresos y gastos</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
        >
          + Nueva transacción
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
          <p className="text-green-400 text-xs uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-2xl font-bold text-green-400">+${ingresos.toFixed(2)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <p className="text-red-400 text-xs uppercase tracking-wider mb-1">Gastos</p>
          <p className="text-2xl font-bold text-red-400">-${gastos.toFixed(2)}</p>
        </div>
        <div className={`${balance >= 0 ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"} border rounded-2xl p-5`}>
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-primary-light" : "text-red-400"}`}>
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfica */}
      <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 mb-6">
        <h2 className="text-text-main font-semibold mb-6">Últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={graficaData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#8B8BA7", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#8B8BA7", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#13131F", border: "1px solid #2A2A3E", borderRadius: "12px", color: "#EEEEF2" }}
              cursor={{ fill: "#2A2A3E" }}
            />
            <Legend wrapperStyle={{ color: "#8B8BA7", fontSize: 12 }} />
            <Bar dataKey="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Gastos" fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtro mes */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={filtroMes}
          onChange={e => setFiltroMes(parseInt(e.target.value))}
          className="bg-[#13131F] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select
          value={filtroAnio}
          onChange={e => setFiltroAnio(parseInt(e.target.value))}
          className="bg-[#13131F] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-text-muted text-sm">{filtradas.length} transacciones</span>
      </div>

      {/* Lista transacciones */}
      <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl mb-4 block">💰</span>
            <p className="text-text-muted">No hay transacciones este mes</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A3E]">
                <th className="text-left px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Descripción</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Categoría</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Fecha</th>
                <th className="text-right px-6 py-4 text-text-muted font-medium text-xs uppercase tracking-wider">Monto</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(t => (
                <tr key={t.id} className="border-b border-[#2A2A3E]/50 hover:bg-[#1E1E2E] transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                        t.tipo === "ingreso" ? "bg-green-500/20" : "bg-red-500/20"
                      }`}>
                        {t.tipo === "ingreso" ? "⬆️" : "⬇️"}
                      </div>
                      <div>
                        <p className="text-text-main text-sm font-medium">{t.descripcion}</p>
                        {t.nota && <p className="text-text-muted text-xs">{t.nota}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 rounded-lg bg-[#1E1E2E] text-text-muted border border-[#2A2A3E]">
                      {t.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-muted text-sm">
                    {new Date(t.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold text-sm ${
                    t.tipo === "ingreso" ? "text-green-400" : "text-red-400"
                  }`}>
                    {t.tipo === "ingreso" ? "+" : "-"}${t.monto.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-text-muted hover:text-red-400 transition"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">Nueva transacción</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            {/* Tipo */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => { setTipo("ingreso"); setForm({ ...form, categoria: "Servicio" }) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                  tipo === "ingreso"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-[#0D0D18] text-text-muted border-[#2A2A3E] hover:bg-[#1E1E2E]"
                }`}
              >
                ⬆️ Ingreso
              </button>
              <button
                onClick={() => { setTipo("gasto"); setForm({ ...form, categoria: "Herramientas" }) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                  tipo === "gasto"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-[#0D0D18] text-text-muted border-[#2A2A3E] hover:bg-[#1E1E2E]"
                }`}
              >
                ⬇️ Gasto
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Pago de cliente ABC"
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Monto (USD)</label>
                  <input
                    type="number"
                    value={form.monto}
                    onChange={e => setForm({ ...form, monto: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm({ ...form, fecha: e.target.value })}
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Nota (opcional)</label>
                <input
                  type="text"
                  value={form.nota}
                  onChange={e => setForm({ ...form, nota: e.target.value })}
                  placeholder="Detalles adicionales..."
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-[#0D0D18] border border-[#2A2A3E] text-text-muted py-2.5 rounded-xl hover:bg-[#1E1E2E] transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Accounting
