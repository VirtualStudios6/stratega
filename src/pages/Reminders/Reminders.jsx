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
import { useTranslation } from "react-i18next"
import { Bell, CalendarDays, Clock, Pencil, Trash2, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

const PRIORIDADES_VALUES = ["Urgente", "Importante", "Normal"]
const CATEGORIAS = ["General", "Publicación", "Reunión", "Contenido", "Cliente", "Personal", "Empresa", "Marketing", "Negocios", "Ideas", "Pendiente"]

const PRIORIDAD_COLORS = {
  Urgente: "bg-red-500/20 text-red-400 border-red-500/30",
  Importante: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Normal: "bg-primary/20 text-primary-light border-primary/30",
}

const Reminders = () => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filtro, setFiltro] = useState("Todos")
  const [selectedDate, setSelectedDate] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "Normal",
    categoria: "General",
    folderId: "",
  })
  const [folders, setFolders] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)

  const fetchTasks = async () => {
    if (!user) return
    try {
      const q = query(collection(db, "reminders"), where("uid", "==", user.uid))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      setTasks(data)
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar los recordatorios.")
    }
  }

  const fetchFolders = async () => {
    if (!user) return
    try {
      const q = query(collection(db, "folders"), where("uid", "==", user.uid))
      const snap = await getDocs(q)
      setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchTasks(); fetchFolders() }, [user])

  // Pedir permiso de notificaciones al cargar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const resetModal = () => {
    setModalOpen(false)
    setEditingTask(null)
    setForm({ titulo: "", descripcion: "", prioridad: "Normal", categoria: "General", folderId: "" })
    setSelectedDate(null)
  }

  const handleSave = async () => {
    if (!form.titulo.trim() || !selectedDate) return
    try {
      if (editingTask) {
        await updateDoc(doc(db, "reminders", editingTask.id), {
          ...form,
          fecha: selectedDate.toISOString(),
          folderId: form.folderId || null,
        })
      } else {
        await addDoc(collection(db, "reminders"), {
          uid: user.uid,
          ...form,
          fecha: selectedDate.toISOString(),
          completado: false,
          creadoEn: new Date(),
          folderId: form.folderId || null,
        })
      }
      resetModal()
      fetchTasks()
      window.dispatchEvent(new Event("reminder-saved"))
    } catch (err) {
      console.error(err)
      toast.error("Error al guardar el recordatorio.")
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setForm({
      titulo: task.titulo,
      descripcion: task.descripcion || "",
      prioridad: task.prioridad,
      categoria: task.categoria || "General",
      folderId: task.folderId || "",
    })
    setSelectedDate(new Date(task.fecha))
    setModalOpen(true)
  }

  const handleToggle = async (task) => {
    try {
      await updateDoc(doc(db, "reminders", task.id), { completado: !task.completado })
      fetchTasks()
    } catch (err) {
      console.error(err)
      toast.error("Error al actualizar el recordatorio.")
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "reminders", id))
      fetchTasks()
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar el recordatorio.")
    }
  }

  const FILTROS = [
    { key: "Todos", label: t("common.filter") === "Filtrar" ? "Todos" : "All" },
  ]

  // Filter labels - use translation keys but keep filter values as stored DB values
  const filterLabels = {
    "Todos": i18n.language === "es" ? "Todos" : "All",
    "Pendientes": i18n.language === "es" ? "Pendientes" : "Pending",
    "Completadas": i18n.language === "es" ? "Completadas" : "Completed",
    "Urgente": i18n.language === "es" ? "Urgente" : "Urgent",
    "Importante": i18n.language === "es" ? "Importante" : "Important",
    "Normal": i18n.language === "es" ? "Normal" : "Normal",
  }

  const statsLabels = {
    Total: i18n.language === "es" ? "Total" : "Total",
    Pendientes: i18n.language === "es" ? "Pendientes" : "Pending",
    Completadas: i18n.language === "es" ? "Completadas" : "Completed",
  }

  const companyFiltered = selectedCompany ? tasks.filter(t => t.folderId === selectedCompany) : tasks
  const filtradas = filtro === "Todos" ? companyFiltered
    : filtro === "Pendientes" ? companyFiltered.filter(t => !t.completado)
    : filtro === "Completadas" ? companyFiltered.filter(t => t.completado)
    : companyFiltered.filter(t => t.prioridad === filtro)

  const pendientes = companyFiltered.filter(t => !t.completado).length
  const completadas = companyFiltered.filter(t => t.completado).length

  const datePickerLocale = i18n.language === "es" ? es : undefined

  return (
    <DashboardLayout>
      {/* Estilos del datepicker */}
      <style>{`
        .react-datepicker { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; font-family: 'Rubik', sans-serif; color: var(--text-main); }
        .react-datepicker__header { background: var(--bg-hover); border-bottom: 1px solid var(--border); border-radius: 16px 16px 0 0; }
        .react-datepicker__current-month, .react-datepicker__day-name { color: var(--text-main); }
        .react-datepicker__day { color: var(--text-muted); border-radius: 8px; }
        .react-datepicker__day:hover { background: var(--border); color: var(--text-main); }
        .react-datepicker__day--selected { background: var(--primary); color: white; }
        .react-datepicker__day--today { border: 1px solid var(--primary); color: var(--primary-light); }
        .react-datepicker__day--disabled { color: var(--border); }
        .react-datepicker__navigation-icon::before { border-color: var(--text-muted); }
        .react-datepicker__time-container { border-left: 1px solid var(--border); }
        .react-datepicker__time { background: var(--bg-card); }
        .react-datepicker__time-list-item { color: var(--text-muted); }
        .react-datepicker__time-list-item:hover { background: var(--border) !important; color: var(--text-main); }
        .react-datepicker__time-list-item--selected { background: var(--primary) !important; color: white; }
        .react-datepicker-popper { z-index: 9999; }
      `}</style>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2"><Bell size={22} className="text-text-muted" /> {t("reminders.title")}</h1>
          <p className="text-text-muted text-sm mt-1">
            {pendientes} {filterLabels["Pendientes"].toLowerCase()} · {completadas} {filterLabels["Completadas"].toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {folders.length > 0 && (
            <select
              value={selectedCompany || ""}
              onChange={e => setSelectedCompany(e.target.value || null)}
              className="bg-bg-card border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas las empresas</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
          >
            + {t("reminders.new")}
          </button>
        </div>
      </div>

      {/* Permiso notificaciones */}
      {"Notification" in window && Notification.permission === "denied" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {i18n.language === "es"
            ? "Las notificaciones están bloqueadas. Actívalas en la configuración del navegador para recibir alertas."
            : "Notifications are blocked. Enable them in your browser settings to receive alerts."}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: statsLabels.Total, value: tasks.length, color: "bg-primary/20 border-primary/30" },
          { label: statsLabels.Pendientes, value: pendientes, color: "bg-yellow-500/20 border-yellow-500/30" },
          { label: statsLabels.Completadas, value: completadas, color: "bg-green-500/20 border-green-500/30" },
        ].map((s, i) => (
          <div key={s.label} style={{ animationDelay: `${i * 80}ms` }} className={`${s.color} border rounded-2xl p-4 text-center animate-slide-up`}>
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
                : "bg-bg-card text-text-muted border-border hover:bg-bg-hover"
              }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="bg-bg-card border border-border rounded-2xl p-16 text-center">
            <Bell size={48} className="text-text-muted/25 mb-4 mx-auto" />
            <p className="text-text-muted">{t("reminders.no_reminders")}</p>
            <p className="text-text-muted/50 text-sm mt-1">{t("reminders.add_first")}</p>
          </div>
        ) : (
          filtradas.map((task, idx) => {
            const prioridadColor = PRIORIDAD_COLORS[task.prioridad] || PRIORIDAD_COLORS.Normal
            return (
              <div
                key={task.id}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={`bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 animate-slide-up
                  ${task.completado ? "opacity-50" : "hover:-translate-y-0.5"}`}
              >
                <button
                  onClick={() => handleToggle(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
                    ${task.completado ? "bg-green-500 border-green-500" : "border-border hover:border-primary"}`}
                >
                  {task.completado && <span className="text-white text-xs">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={`text-sm font-medium text-text-main ${task.completado ? "line-through" : ""}`}>
                      {task.titulo}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${prioridadColor}`}>
                      {task.prioridad}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-bg-hover text-text-muted border border-border">
                      {task.categoria}
                    </span>
                  </div>
                  {task.descripcion && (
                    <p className="text-text-muted text-xs">{task.descripcion}</p>
                  )}
                  {task.fecha && (
                    <p className="text-text-muted/60 text-xs mt-1">
                      <span className="inline-flex items-center gap-1"><CalendarDays size={11} />{new Date(task.fecha).toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric"
                      })}</span> · <span className="inline-flex items-center gap-1"><Clock size={11} />{new Date(task.fecha).toLocaleTimeString(i18n.language === "es" ? "es-ES" : "en-US", {
                        hour: "2-digit", minute: "2-digit"
                      })}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleEdit(task)}
                  className="text-text-muted hover:text-primary-light transition flex-shrink-0 mr-1 p-0.5"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-text-muted hover:text-red-400 transition flex-shrink-0 p-0.5"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">{editingTask ? (i18n.language === "es" ? "Editar recordatorio" : "Edit reminder") : t("reminders.new")}</h2>
              <button onClick={resetModal} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("reminders.title_label")}</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder={i18n.language === "es" ? "Ej: Publicar story de Instagram" : "E.g.: Post Instagram story"}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("accounting.description")}</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder={i18n.language === "es" ? "Detalles adicionales..." : "Additional details..."}
                  rows={2}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("reminders.date_label")}</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy h:mm aa"
                  locale={datePickerLocale}
                  placeholderText={i18n.language === "es" ? "Selecciona fecha y hora" : "Select date and time"}
                  minDate={editingTask ? undefined : new Date()}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("reminders.priority_label")}</label>
                  <select
                    value={form.prioridad}
                    onChange={e => setForm({ ...form, prioridad: e.target.value })}
                    className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PRIORIDADES_VALUES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
                    {i18n.language === "es" ? "Categoría" : "Category"}
                  </label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Empresa / Carpeta */}
              {folders.length > 0 && (
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Empresa / Carpeta</label>
                  <select
                    value={form.folderId}
                    onChange={e => setForm({ ...form, folderId: e.target.value })}
                    className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin empresa</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetModal}
                className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm"
              >
                {t("reminders.cancel")}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                {editingTask ? (i18n.language === "es" ? "Actualizar" : "Update") : t("reminders.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Reminders
