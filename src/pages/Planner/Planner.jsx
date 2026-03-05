import { useState, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"

const PRIORIDADES = [
  { label: "Urgente", color: "#EF4444", bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  { label: "Importante", color: "#F59E0B", bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  { label: "Normal", color: "#6022EC", bg: "bg-primary/20", text: "text-primary-light", border: "border-primary/30" },
]

const Planner = () => {
  const { user } = useAuth()
  const [eventos, setEventos] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    objetivo: "",
    prioridad: "Normal",
    hora: "09:00",
  })

  const fetchEventos = async () => {
    if (!user) return
    const q = query(collection(db, "planners"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    const data = snap.docs.map(doc => {
      const d = doc.data()
      const prioridad = PRIORIDADES.find(p => p.label === d.prioridad)
      return {
        id: doc.id,
        title: d.titulo,
        date: d.fecha,
        backgroundColor: prioridad?.color || "#6022EC",
        borderColor: prioridad?.color || "#6022EC",
        extendedProps: d
      }
    })
    setEventos(data)
  }

  useEffect(() => { fetchEventos() }, [user])

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr)
    setSelectedEvent(null)
    setForm({ titulo: "", descripcion: "", objetivo: "", prioridad: "Normal", hora: "09:00" })
    setModalOpen(true)
  }

  const handleEventClick = (info) => {
    const props = info.event.extendedProps
    setSelectedEvent(info.event.id)
    setSelectedDate(props.fecha)
    setForm({
      titulo: info.event.title,
      descripcion: props.descripcion,
      objetivo: props.objetivo,
      prioridad: props.prioridad,
      hora: props.hora,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) return
    await addDoc(collection(db, "planners"), {
      uid: user.uid,
      titulo: form.titulo,
      descripcion: form.descripcion,
      objetivo: form.objetivo,
      prioridad: form.prioridad,
      hora: form.hora,
      fecha: selectedDate,
      creadoEn: new Date()
    })
    setModalOpen(false)
    fetchEventos()
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    await deleteDoc(doc(db, "planners", selectedEvent))
    setModalOpen(false)
    fetchEventos()
  }

  const prioridadActual = PRIORIDADES.find(p => p.label === form.prioridad)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main">Planner 📅</h1>
        <p className="text-text-muted text-sm mt-1">Organiza tus objetivos y tareas</p>
      </div>

      {/* Leyenda de prioridades */}
      <div className="flex gap-3 mb-6">
        {PRIORIDADES.map(p => (
          <div key={p.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${p.bg} ${p.border}`}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className={`text-xs font-medium ${p.text}`}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6">
        <style>{`
          .fc { color: #EEEEF2; font-family: 'Rubik', sans-serif; }
          .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: #2A2A3E; }
          .fc-col-header-cell { background: #1E1E2E; padding: 10px 0; }
          .fc-col-header-cell-cushion { color: #8B8BA7; font-size: 12px; font-weight: 500; text-decoration: none; }
          .fc-daygrid-day { background: transparent; }
          .fc-daygrid-day:hover { background: #1E1E2E; }
          .fc-daygrid-day-number { color: #8B8BA7; font-size: 13px; text-decoration: none; }
          .fc-day-today { background: #1a1a3e !important; }
          .fc-day-today .fc-daygrid-day-number { color: #A78BFA; font-weight: 700; }
          .fc-button { background: #1E1E2E !important; border: 1px solid #2A2A3E !important; color: #EEEEF2 !important; font-size: 13px !important; border-radius: 10px !important; }
          .fc-button:hover { background: #2A2A3E !important; }
          .fc-button-active { background: #6022EC !important; border-color: #6022EC !important; }
          .fc-toolbar-title { color: #EEEEF2; font-size: 18px; font-weight: 600; }
          .fc-event { border-radius: 6px; font-size: 12px; padding: 2px 6px; }
          .fc-timegrid-slot { border-color: #2A2A3E; }
          .fc-timegrid-axis { color: #8B8BA7; font-size: 12px; }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek"
          }}
          buttonText={{ today: "Hoy", month: "Mes", week: "Semana" }}
          events={eventos}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          editable={false}
          selectable={true}
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 w-full max-w-md shadow-2xl">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">
                {selectedEvent ? "Ver entrada" : "Nueva entrada"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Publicar en Instagram"
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Objetivo</label>
                <input
                  type="text"
                  value={form.objetivo}
                  onChange={e => setForm({ ...form, objetivo: e.target.value })}
                  placeholder="¿Qué quieres lograr?"
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Hora</label>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={e => setForm({ ...form, hora: e.target.value })}
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

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
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${prioridadActual.bg} ${prioridadActual.border}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prioridadActual.color }} />
                <span className={`text-xs ${prioridadActual.text}`}>Prioridad: {form.prioridad}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {selectedEvent && (
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-xl hover:bg-red-500/20 transition text-sm"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-[#0D0D18] border border-[#2A2A3E] text-text-muted font-medium py-2.5 rounded-xl hover:bg-[#1E1E2E] transition text-sm"
              >
                Cancelar
              </button>
              {!selectedEvent && (
                <button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
                >
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Planner
