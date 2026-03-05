import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { es } from "date-fns/locale"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc, updateDoc
} from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"

const PRIORIDADES = [
  { label: "Urgente", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { label: "Importante", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { label: "Normal", color: "bg-primary/20 text-primary-light border-primary/30" },
]

const CATEGORIAS = ["General", "Publicación", "Reunión", "Contenido", "Cliente", "Personal"]

const Reminders = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filtro, setFiltro] = useState("Todos")
  const [selectedDate, setSelectedDate] = useState(null)
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "Normal",
    categoria: "General",
  })

  const fetchTasks = async () => {
    if (!user) return
    const q = query(collection(db, "reminders"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    setTasks(data)
  }

  useEffect(() => { fetchTasks() }, [user])

  // Pedir permiso de notificaciones al cargar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Revisar recordatorios cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date()
      tasks.forEach(task => {
        if (task.completado) return
        const fechaTask = new Date(task.fecha)
        const diffMs = fechaTask - ahora
        const diffMin = Math.round(diffMs / 60000)
        // Notificar 5 minutos antes
        if (diffMin === 5) {
          dispararNotificacion(task, "en 5 minutos")
        }
        // Notificar en el momento exacto
        if (diffMin === 0) {
          dispararNotificacion(task, "¡ahora!")
        }
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [tasks])

  const dispararNotificacion = (task, tiempo) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`⏰ ${task.titulo}`, {
        body: `${task.descripcion || "Recordatorio"} — ${tiempo}`,
        icon: "/logos/logo.png",
      })
    }
  }

  const handleSave = async () => {
    if (!form.titulo.trim() || !selectedDate) return
    await addDoc(collection(db, "reminders"), {
      uid: user.uid,
      ...form,
      fecha: selectedDate.toISOString(),
      completado: false,
      creadoEn: new Date()
    })
    setModalOpen(false)
    setForm({ titulo: "", descripcion: "", prioridad: "Normal", categoria: "General" })
    setSelectedDate(null)
    fetchTasks()
  }

  const handleToggle = async (task) => {
    await updateDoc(doc(db, "reminders", task.id), { completado: !task.completado })
    fetchTasks()
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "reminders", id))
    fetchTasks()
  }

  const filtradas = filtro === "Todos" ? tasks
    : filtro === "Pendientes" ? tasks.filter(t => !t.completado)
    : filtro === "Completadas" ? tasks.filter(t => t.completado)
    : tasks.filter(t => t.prioridad === filtro)

  const pendientes = tasks.filter(t => !t.completado).length
  const completadas = tasks.filter(t => t.completado).length

  return (
    <DashboardLayout>
      {/* Estilos del datepicker */}
      <style>{`
        .react-datepicker { background: #13131F; border: 1px solid #2A2A3E; border-radius: 16px; font-family: 'Rubik', sans-serif; color: #EEEEF2; }
        .react-datepicker__header { background: #1E1E2E; border-bottom: 1px solid #2A2A3E; border-radius: 16px 16px 0 0; }
        .react-datepicker__current-month, .react-datepicker__day-name { color: #EEEEF2; }
        .react-datepicker__day { color: #8B8BA7; border-radius: 8px; }
        .react-datepicker__day:hover { background: #2A2A3E; color: #EEEEF2; }
        .react-datepicker__day--selected { background: #6022EC; color: white; }
        .react-datepicker__day--today { border: 1px solid #6022EC; color: #A78BFA; }
        .react-datepicker__day--disabled { color: #2A2A3E; }
        .react-datepicker__navigation-icon::before { border-color: #8B8BA7; }
        .react-datepicker__time-container { border-left: 1px solid #2A2A3E; }
        .react-datepicker__time { background: #13131F; }
        .react-datepicker__time-list-item { color: #8B8BA7; }
        .react-datepicker__time-list-item:hover { background: #2A2A3E !important; color: #EEEEF2; }
        .react-datepicker__time-list-item--selected { background: #6022EC !important; color: white; }
        .react-datepicker-popper { z-index: 9999; }
      `}</style>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Recordatorios 🔔</h1>
          <p className="text-text-muted text-sm mt-1">{pendientes} pendientes · {completadas} completadas</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
        >
          + Nuevo recordatorio
        </button>
      </div>

      {/* Permiso notificaciones */}
      {"Notification" in window && Notification.permission === "denied" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-4 py-3 rounded-xl mb-6">
          ⚠️ Las notificaciones están bloqueadas. Actívalas en la configuración del navegador para recibir alertas.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: tasks.length, color: "bg-primary/20 border-primary/30" },
          { label: "Pendientes", value: pendientes, color: "bg-yellow-500/20 border-yellow-500/30" },
          { label: "Completadas", value: completadas, color: "bg-green-500/20 border-green-500/30" },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold text-text-main">{s.value}</p>
            <p className="text-text-muted text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["Todos", "Pendientes", "Completadas", "Urgente", "Importante", "Normal"].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition
              ${filtro === f
                ? "bg-primary/20 text-primary-light border-primary/30"
                : "bg-[#13131F] text-text-muted border-[#2A2A3E] hover:bg-[#1E1E2E]"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-16 text-center">
            <span className="text-5xl mb-4 block">🔔</span>
            <p className="text-text-muted">No hay recordatorios aquí</p>
            <p className="text-text-muted/50 text-sm mt-1">Crea tu primer recordatorio</p>
          </div>
        ) : (
          filtradas.map(task => {
            const prioridad = PRIORIDADES.find(p => p.label === task.prioridad)
            return (
              <div
                key={task.id}
                className={`bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-4 flex items-center gap-4 transition
                  ${task.completado ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => handleToggle(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
                    ${task.completado ? "bg-green-500 border-green-500" : "border-[#2A2A3E] hover:border-primary"}`}
                >
                  {task.completado && <span className="text-white text-xs">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={`text-sm font-medium text-text-main ${task.completado ? "line-through" : ""}`}>
                      {task.titulo}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${prioridad?.color}`}>
                      {task.prioridad}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E1E2E] text-text-muted border border-[#2A2A3E]">
                      {task.categoria}
                    </span>
                  </div>
                  {task.descripcion && (
                    <p className="text-text-muted text-xs">{task.descripcion}</p>
                  )}
                  {task.fecha && (
                    <p className="text-text-muted/60 text-xs mt-1">
                      📅 {new Date(task.fecha).toLocaleDateString("es-ES", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric"
                      })} · 🕐 {new Date(task.fecha).toLocaleTimeString("es-ES", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-text-muted hover:text-red-400 transition text-lg flex-shrink-0"
                >
                  🗑️
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">Nuevo recordatorio</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Publicar story de Instagram"
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={2}
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Fecha y hora</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  locale={es}
                  placeholderText="Selecciona fecha y hora"
                  minDate={new Date()}
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={e => setForm({ ...form, prioridad: e.target.value })}
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
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

export default Reminders
