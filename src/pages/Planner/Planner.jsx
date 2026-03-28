import { useState, useEffect } from "react"
import { CalendarDays, Clock, Pencil } from "lucide-react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"
import { FECHAS_CLAVE } from "../../data/fechasClave"
import { useTranslation } from "react-i18next"
import { THEMES, useTheme } from "../../context/ThemeContext"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const FORMATOS = ["Reel", "Carrusel", "Historia", "Video corto"]
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)
const IconYouTube = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>
)
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
)
const IconTelegram = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)
const IconTikTok = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const PLATAFORMAS = [
  { label: "Instagram", Icon: IconInstagram, color: "#E1306C" },
  { label: "YouTube",   Icon: IconYouTube,   color: "#FF0000" },
  { label: "Facebook",  Icon: IconFacebook,  color: "#1877F2" },
  { label: "Telegram",  Icon: IconTelegram,  color: "#229ED9" },
  { label: "TikTok",    Icon: IconTikTok,    color: "#010101" },
]

const Planner = () => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const primaryHex = THEMES[theme]?.vars["--primary"] || "#6022EC"

  const PRIORIDADES = [
    { value: "Urgente",    color: "#EF4444", bg: "bg-red-500/20",    text: "text-red-400",       border: "border-red-500/30" },
    { value: "Importante", color: "#F59E0B", bg: "bg-yellow-500/20", text: "text-yellow-400",    border: "border-yellow-500/30" },
    { value: "Normal",     color: primaryHex, bg: "bg-primary/20",   text: "text-primary-light", border: "border-primary/30" },
  ]
  const [eventos, setEventos] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [fechaClaveModal, setFechaClaveModal] = useState(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("planner_view") || "calendar")
  const [previewEvent, setPreviewEvent] = useState(null)
  const [showFechasClave, setShowFechasClave] = useState(() => {
    const saved = localStorage.getItem("planner_fechas_clave")
    return saved === null ? true : saved === "true"
  })
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    objetivo: "",
    hook: "",
    formato: "",
    plataforma: "",
    cta: "",
    prioridad: "Normal",
    hora: "09:00",
    folderId: "",
  })
  const [folders, setFolders] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)

  const priorityLabel = (value) => {
    const keyMap = { Urgente: "priority_urgent", Importante: "priority_important", Normal: "priority_normal" }
    return t(`planner.${keyMap[value] || "priority_normal"}`)
  }

  const fetchEventos = async () => {
    if (!user) return
    const q = query(collection(db, "planners"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    const data = snap.docs.map(document => {
      const d = document.data()
      return {
        id: document.id,
        title: d.titulo,
        date: d.fecha,
        extendedProps: { ...d, esFechaClave: false },
      }
    })
    setEventos(data)
  }

  const fetchFolders = async () => {
    if (!user) return
    const q = query(collection(db, "folders"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { fetchEventos(); fetchFolders() }, [user])

  const toggleFechasClave = () => {
    const next = !showFechasClave
    setShowFechasClave(next)
    localStorage.setItem("planner_fechas_clave", String(next))
  }

  const fechasClaveEventos = showFechasClave
    ? FECHAS_CLAVE.map(f => ({
        id: `clave-${f.date}-${f.title}`,
        title: f.title,
        date: f.date,
        backgroundColor: f.color + "22",
        borderColor: f.color,
        textColor: f.color,
        display: "block",
        extendedProps: { esFechaClave: true, sugerencia: f.sugerencia, colorOriginal: f.color },
      }))
    : []

  const applyPriorityColor = (ev) => {
    const p = PRIORIDADES.find(x => x.value === ev.extendedProps?.prioridad)
    const color = p?.color || primaryHex
    return { ...ev, backgroundColor: color, borderColor: color }
  }

  const eventosFiltrados = (selectedCompany
    ? eventos.filter(ev => ev.extendedProps?.folderId === selectedCompany)
    : eventos).map(applyPriorityColor)

  const todosLosEventos = [...eventosFiltrados, ...fechasClaveEventos]

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr)
    setSelectedEvent(null)
    setForm({ titulo: "", descripcion: "", objetivo: "", hook: "", formato: "", plataforma: "", cta: "", prioridad: "Normal", hora: "09:00", folderId: selectedCompany || "" })
    setModalOpen(true)
  }

  const handleEventClick = (info) => {
    const props = info.event.extendedProps

    if (props.esFechaClave) {
      setFechaClaveModal({
        title: info.event.title,
        sugerencia: props.sugerencia,
        color: props.colorOriginal,
      })
      return
    }

    setPreviewEvent({ id: info.event.id, title: info.event.title, ...props })
  }

  const openEditFromPreview = () => {
    if (!previewEvent) return
    setSelectedEvent(previewEvent.id)
    setSelectedDate(previewEvent.fecha)
    setForm({
      titulo: previewEvent.title,
      descripcion: previewEvent.descripcion || "",
      objetivo: previewEvent.objetivo || "",
      hook: previewEvent.hook || "",
      formato: previewEvent.formato || "",
      plataforma: previewEvent.plataforma || "",
      cta: previewEvent.cta || "",
      prioridad: previewEvent.prioridad || "Normal",
      hora: previewEvent.hora || "09:00",
      folderId: previewEvent.folderId || "",
    })
    setPreviewEvent(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) return
    await addDoc(collection(db, "planners"), {
      uid: user.uid,
      titulo: form.titulo,
      descripcion: form.descripcion,
      objetivo: form.objetivo,
      hook: form.hook,
      formato: form.formato,
      plataforma: form.plataforma,
      cta: form.cta,
      prioridad: form.prioridad,
      hora: form.hora,
      fecha: selectedDate,
      folderId: form.folderId || null,
      creadoEn: new Date(),
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

  const handleUpdate = async () => {
    if (!form.titulo.trim() || !selectedEvent) return
    await updateDoc(doc(db, "planners", selectedEvent), {
      titulo: form.titulo,
      descripcion: form.descripcion,
      objetivo: form.objetivo,
      hook: form.hook,
      formato: form.formato,
      plataforma: form.plataforma,
      cta: form.cta,
      prioridad: form.prioridad,
      hora: form.hora,
      fecha: selectedDate,
      folderId: form.folderId || null,
    })
    setModalOpen(false)
    fetchEventos()
  }

  const prioridadActual = PRIORIDADES.find(p => p.value === form.prioridad) || PRIORIDADES[2]

  const switchView = (mode) => {
    setViewMode(mode)
    localStorage.setItem("planner_view", mode)
  }

  const handleExportPDF = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const pageW = 297

    // ── Paleta neutra/minimalista
    const BLACK   = [15, 15, 15]
    const DARK    = [40, 40, 40]
    const MEDIUM  = [100, 100, 100]
    const LIGHT   = [200, 200, 200]
    const XLIGHT  = [248, 248, 248]
    const WHITE   = [255, 255, 255]

    const companyFolder = selectedCompany ? folders.find(f => f.id === selectedCompany) : null

    // ── Franja superior negra fina
    pdf.setFillColor(...BLACK)
    pdf.rect(0, 0, pageW, 10, "F")

    // ── Título en la franja
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(...WHITE)
    pdf.setCharSpace(1.5)
    pdf.text("CALENDARIO DE CONTENIDO", 14, 6.5)
    pdf.setCharSpace(0)

    // ── "Stratega Planner" a la derecha en gris claro
    pdf.setFontSize(7.5)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(180, 180, 180)
    pdf.text("Stratega Planner", pageW - 14, 6.5, { align: "right" })

    // ── Subtítulo: empresa y fecha
    pdf.setFontSize(8.5)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(...DARK)
    const empresaLabel = companyFolder ? companyFolder.nombre : "Todas las empresas"
    pdf.text(empresaLabel, 14, 18)

    pdf.setFontSize(7.5)
    pdf.setTextColor(...MEDIUM)
    pdf.text(
      `Exportado el ${new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}`,
      pageW - 14, 18, { align: "right" }
    )

    // ── Línea divisoria delgada
    pdf.setDrawColor(...LIGHT)
    pdf.setLineWidth(0.3)
    pdf.line(14, 21, pageW - 14, 21)

    // ── Badges de resumen
    const sorted = [...eventosFiltrados].sort((a, b) => new Date(a.date) - new Date(b.date))
    const urgentes    = sorted.filter(e => e.extendedProps?.prioridad === "Urgente").length
    const importantes = sorted.filter(e => e.extendedProps?.prioridad === "Importante").length
    const normales    = sorted.filter(e => e.extendedProps?.prioridad === "Normal").length

    const drawBadge = (x, y, label, count, fillRgb, textRgb) => {
      pdf.setFillColor(...fillRgb)
      pdf.roundedRect(x, y - 3.5, 42, 6, 1.5, 1.5, "F")
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(...textRgb)
      pdf.text(`${label}: ${count}`, x + 21, y + 0.5, { align: "center" })
    }

    drawBadge(14,  28, "Total",      sorted.length, [235,235,235], DARK)
    drawBadge(60,  28, "Urgentes",   urgentes,      [254,226,226], [180,30,30])
    drawBadge(106, 28, "Importantes",importantes,   [254,243,199], [146,64,14])
    drawBadge(152, 28, "Normales",   normales,      [241,245,249], [51,65,85])

    // ── Tabla de eventos
    const rows = sorted.map(ev => {
      const d = ev.extendedProps
      const fecha  = new Date(ev.date + "T12:00:00")
      const fechaStr = fecha.toLocaleDateString("es-ES", { day:"2-digit", month:"short", year:"numeric" })
      const diaStr   = fecha.toLocaleDateString("es-ES", { weekday:"long" })
      return [
        fechaStr,
        diaStr.charAt(0).toUpperCase() + diaStr.slice(1),
        ev.title || "",
        d.objetivo || "",
        d.hook ? `"${d.hook}"` : "",
        [d.formato, d.plataforma].filter(Boolean).join(" · ") || "",
        d.hora || "",
        d.prioridad || "Normal",
      ]
    })

    autoTable(pdf, {
      startY: 34,
      head: [["Fecha", "Día", "Contenido", "Objetivo", "Hook", "Formato / Red", "Hora", "Prioridad"]],
      body: rows,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        textColor: DARK,
        lineColor: [230, 230, 230],
        lineWidth: 0.25,
        font: "helvetica",
      },
      headStyles: {
        fillColor: BLACK,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: XLIGHT },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 54 },
        3: { cellWidth: 44 },
        4: { cellWidth: 40 },
        5: { cellWidth: 30 },
        6: { cellWidth: 13 },
        7: { cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === "body") {
          const p = data.cell.raw
          if (p === "Urgente")    { data.cell.styles.fillColor = [254,226,226]; data.cell.styles.textColor = [180,30,30];  data.cell.styles.fontStyle = "bold" }
          if (p === "Importante") { data.cell.styles.fillColor = [254,243,199]; data.cell.styles.textColor = [146,64,14];  data.cell.styles.fontStyle = "bold" }
          if (p === "Normal")     { data.cell.styles.fillColor = [241,245,249]; data.cell.styles.textColor = [51,65,85];   data.cell.styles.fontStyle = "normal" }
        }
      },
      willDrawPage: (data) => {
        if (data.pageNumber > 1) {
          pdf.setFillColor(...BLACK)
          pdf.rect(0, 0, pageW, 8, "F")
          pdf.setFontSize(7.5)
          pdf.setFont("helvetica", "bold")
          pdf.setTextColor(...WHITE)
          pdf.setCharSpace(1.5)
          pdf.text("CALENDARIO DE CONTENIDO", 14, 5.5)
          pdf.setCharSpace(0)
        }
      },
    })

    // ── Pie de página
    const pageCount = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(6.5)
      pdf.setTextColor(...LIGHT)
      pdf.text(`${i} / ${pageCount}`, pageW - 14, 207, { align: "right" })
      if (companyFolder) {
        pdf.text(companyFolder.nombre, 14, 207)
      }
    }

    const fileName = companyFolder
      ? `calendario_${companyFolder.nombre.replace(/\s+/g,"_").toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf`
      : `calendario_contenido_${new Date().toISOString().slice(0,10)}.pdf`
    pdf.save(fileName)
  }

  const getDiaSemana = (fecha) => {
    const d = new Date(fecha + "T12:00:00")
    return d.toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", { weekday: "long" })
  }

  const eventosOrdenados = [...eventosFiltrados].sort((a, b) => new Date(a.date) - new Date(b.date))

  const openNewForDate = (dateStr) => {
    setSelectedDate(dateStr)
    setSelectedEvent(null)
    setForm({ titulo: "", descripcion: "", objetivo: "", hook: "", formato: "", plataforma: "", cta: "", prioridad: "Normal", hora: "09:00", folderId: selectedCompany || "" })
    setModalOpen(true)
  }

  const calendarLocale = i18n.language === "es" ? "es" : "en"
  const buttonText = {
    today: t("planner.today_btn"),
    month: t("planner.month_btn"),
    week:  t("planner.week_btn"),
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2"><CalendarDays size={22} className="text-text-muted" /> Calendario</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">{t("planner.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Toggle vista */}
          <div className="flex items-center bg-bg-hover border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => switchView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "calendar"
                  ? "bg-primary text-white shadow"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {t("planner.view_calendar")}
            </button>
            <button
              onClick={() => switchView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "list"
                  ? "bg-primary text-white shadow"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
              </svg>
              {t("planner.view_list")}
            </button>
          </div>

          {/* Empresa filter */}
          {folders.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedCompany && (() => {
                const f = folders.find(x => x.id === selectedCompany)
                return f ? <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} /> : null
              })()}
              <select
                value={selectedCompany || ""}
                onChange={e => setSelectedCompany(e.target.value || null)}
                className="bg-bg-card border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Todas las empresas —</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>
          )}
          {/* Fechas clave toggle */}
          <button
            onClick={toggleFechasClave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition
              ${showFechasClave
                ? "bg-primary/20 border-primary/30 text-primary-light"
                : "bg-bg-card border-border text-text-muted hover:bg-bg-hover"
              }`}
          >
            <span>🌍</span>
            {t("planner.key_dates")}: {showFechasClave ? "ON" : "OFF"}
          </button>

          {/* Exportar PDF */}
          <button
            onClick={handleExportPDF}
            disabled={eventosFiltrados.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-bg-card border-border text-text-muted hover:bg-bg-hover hover:text-text-main transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            title="Descargar calendario como PDF"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Banner empresa activa */}
      {selectedCompany && (() => {
        const folder = folders.find(f => f.id === selectedCompany)
        if (!folder) return null
        return (
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border mb-4 text-sm"
            style={{ backgroundColor: folder.color + "12", borderColor: folder.color + "40" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color }} />
              <span className="font-medium" style={{ color: folder.color }}>{folder.nombre}</span>
              <span className="text-text-muted text-xs">— mostrando solo el calendario de esta empresa</span>
            </div>
            <button
              onClick={() => setSelectedCompany(null)}
              className="text-text-muted/60 hover:text-text-muted transition text-xs"
            >
              Ver todas
            </button>
          </div>
        )
      })()}

      {/* Leyenda de prioridades */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-nowrap overflow-x-auto scrollbar-none pb-1">
        {PRIORIDADES.map(p => (
          <div key={p.value} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${p.bg} ${p.border}`}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className={`text-xs font-medium ${p.text}`}>{priorityLabel(p.value)}</span>
          </div>
        ))}
        {showFechasClave && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-bg-hover border-border">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-xs font-medium text-text-muted">{t("planner.key_dates")}</span>
          </div>
        )}
      </div>

      {/* Calendario */}
      {viewMode === "calendar" && (
        <div className="bg-bg-card border border-border rounded-2xl p-3 sm:p-6">
          <style>{`
            .fc { color: var(--text-main); font-family: 'Rubik', sans-serif; }
            .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: var(--border); }
            .fc-col-header-cell { background: var(--bg-hover); padding: 8px 0; }
            .fc-col-header-cell-cushion { color: var(--text-muted); font-size: 11px; font-weight: 500; text-decoration: none; }
            .fc-daygrid-day { background: transparent; }
            .fc-daygrid-day:hover { background: var(--bg-hover); }
            .fc-daygrid-day-number { color: var(--text-muted); font-size: 12px; text-decoration: none; padding: 4px 6px; }
            .fc-day-today { background: color-mix(in srgb, var(--primary) 15%, transparent) !important; }
            .fc-day-today .fc-daygrid-day-number { color: var(--primary-light); font-weight: 700; }
            .fc-button { background: var(--bg-hover) !important; border: 1px solid var(--border) !important; color: var(--text-main) !important; font-size: 12px !important; border-radius: 8px !important; padding: 4px 8px !important; }
            .fc-button:hover { background: var(--border) !important; }
            .fc-button-active { background: var(--primary) !important; border-color: var(--primary) !important; }
            .fc-toolbar-title { color: var(--text-main); font-size: 15px; font-weight: 600; }
            .fc-event { border-radius: 5px; font-size: 11px; padding: 1px 4px; cursor: pointer; }
            .fc-timegrid-slot { border-color: var(--border); }
            .fc-timegrid-axis { color: var(--text-muted); font-size: 11px; }
            @media (max-width: 640px) {
              .fc-toolbar { flex-wrap: wrap; gap: 6px; }
              .fc-toolbar-chunk { display: flex; align-items: center; gap: 4px; }
              .fc-toolbar-title { font-size: 13px !important; }
              .fc-button { font-size: 11px !important; padding: 3px 6px !important; }
              .fc-daygrid-day-number { font-size: 11px; padding: 2px 4px; }
              .fc-col-header-cell-cushion { font-size: 10px; }
              .fc-event { font-size: 10px; padding: 1px 3px; }
              .fc-daygrid-event-dot { display: none; }
              .fc-daygrid-day-frame { min-height: 36px !important; }
            }
          `}</style>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={calendarLocale}
            headerToolbar={{
              left: "prev,next",
              center: "title",
              right: "today dayGridMonth,timeGridWeek",
            }}
            buttonText={buttonText}
            events={todosLosEventos}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            editable={false}
            selectable={true}
          />
        </div>
      )}

      {/* Vista lineal */}
      {viewMode === "list" && (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {/* Cabecera tabla */}
          <div className="hidden md:grid grid-cols-[90px_110px_1fr_1fr_auto] gap-0 border-b border-border bg-bg-hover px-4 py-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t("planner.col_date")}</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t("planner.col_day")}</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t("planner.col_content")}</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t("planner.col_goal")}</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider pr-2">{t("planner.col_format")}</span>
          </div>

          {eventosOrdenados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-text-muted text-sm">{t("planner.list_empty")}</p>
              <button
                onClick={() => openNewForDate(new Date().toISOString().split("T")[0])}
                className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30"
              >
                + {t("planner.new_entry")}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {eventosOrdenados.map((ev, i) => {
                const d = ev.extendedProps
                const prioridad = PRIORIDADES.find(p => p.value === d.prioridad) || PRIORIDADES[2]
                const plat = PLATAFORMAS.find(p => p.label === d.plataforma)
                const isToday = ev.date === new Date().toISOString().split("T")[0]
                return (
                  <div
                    key={ev.id}
                    onClick={() => setPreviewEvent({ id: ev.id, title: ev.title, ...d })}
                    className={`group flex flex-col md:grid md:grid-cols-[90px_110px_1fr_1fr_auto] gap-2 md:gap-0 px-4 py-4 cursor-pointer hover:bg-bg-hover transition relative ${
                      isToday ? "bg-primary/5" : i % 2 === 0 ? "" : "bg-bg-hover/30"
                    }`}
                  >
                    {/* Borde izquierdo de prioridad */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                      style={{ backgroundColor: prioridad.color }}
                    />

                    {/* Fecha */}
                    <div className="flex items-center gap-2 md:pr-3">
                      <div className={`text-xs font-semibold ${isToday ? "text-primary-light" : "text-text-main"}`}>
                        {new Date(ev.date + "T12:00:00").toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" })}
                        {isToday && <span className="ml-1 text-primary-light text-[10px]">●</span>}
                      </div>
                    </div>

                    {/* Día semana */}
                    <div className="hidden md:flex items-center md:pr-3">
                      <span className="text-xs text-text-muted capitalize">{getDiaSemana(ev.date)}</span>
                    </div>

                    {/* Contenido + hook */}
                    <div className="flex flex-col gap-1 md:pr-4 min-w-0">
                      <span className="text-sm font-medium text-text-main truncate">{ev.title}</span>
                      {d.hook && (
                        <span className="text-xs text-text-muted italic truncate">"{d.hook}"</span>
                      )}
                      {d.descripcion && (
                        <span className="text-xs text-text-muted truncate hidden md:block">{d.descripcion}</span>
                      )}
                    </div>

                    {/* Objetivo + CTA */}
                    <div className="flex flex-col gap-1 md:pr-4 min-w-0">
                      {d.objetivo && (
                        <span className="text-xs text-text-main truncate">{d.objetivo}</span>
                      )}
                      {d.cta && (
                        <span className="text-xs text-text-muted truncate">→ {d.cta}</span>
                      )}
                    </div>

                    {/* Formato + Plataforma + Prioridad */}
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                      {d.formato && (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary-light text-[11px] font-medium whitespace-nowrap">
                          {d.formato}
                        </span>
                      )}
                      {plat && (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap"
                          style={{ backgroundColor: plat.color + "22", color: plat.color, border: `1px solid ${plat.color}44` }}
                        >
                          <plat.Icon />
                          {plat.label}
                        </span>
                      )}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: prioridad.color }} title={d.prioridad} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer con botón añadir */}
          {eventosOrdenados.length > 0 && (
            <div className="px-4 py-3 border-t border-border flex justify-between items-center">
              <span className="text-xs text-text-muted">{eventosOrdenados.length} {t("planner.list_entries")}</span>
              <button
                onClick={() => openNewForDate(new Date().toISOString().split("T")[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-light transition shadow shadow-primary/30"
              >
                + {t("planner.new_entry")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal nueva entrada */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header fijo */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
              <h2 className="text-text-main font-semibold">
                {selectedEvent ? t("planner.view_entry") : t("planner.new_entry")}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            {/* Contenido scrollable */}
            <div className="overflow-y-auto px-6 py-4 space-y-5 flex-1">

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-0.5">{t("planner.title_label")}</label>
                <p className="text-xs text-text-muted mb-1.5">{t("planner.title_sublabel")}</p>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder={t("planner.title_placeholder")}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-0.5">{t("planner.goal_label")}</label>
                <p className="text-xs text-text-muted mb-1.5">{t("planner.goal_sublabel")}</p>
                <input
                  type="text"
                  value={form.objetivo}
                  onChange={e => setForm({ ...form, objetivo: e.target.value })}
                  placeholder={t("planner.goal_placeholder")}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              {/* Hook */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-0.5">{t("planner.hook_label")}</label>
                <p className="text-xs text-text-muted mb-1.5">{t("planner.hook_sublabel")}</p>
                <input
                  type="text"
                  value={form.hook}
                  onChange={e => setForm({ ...form, hook: e.target.value })}
                  placeholder={t("planner.hook_placeholder")}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              {/* Formato */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">{t("planner.format_label")}</label>
                <div className="flex flex-wrap gap-2">
                  {FORMATOS.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setForm({ ...form, formato: form.formato === f ? "" : f })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                        form.formato === f
                          ? "bg-primary/20 border-primary/50 text-primary-light"
                          : "bg-bg-input border-border text-text-muted hover:bg-bg-hover"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plataforma */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">{t("planner.platform_label")}</label>
                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map(p => {
                    const active = form.plataforma === p.label
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setForm({ ...form, plataforma: active ? "" : p.label })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                          active
                            ? "border-transparent text-white"
                            : "bg-bg-input border-border text-text-muted hover:bg-bg-hover"
                        }`}
                        style={active ? { backgroundColor: p.color + "33", borderColor: p.color + "88", color: p.color } : {}}
                      >
                        <span style={{ color: active ? p.color : undefined }}>
                          <p.Icon />
                        </span>
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* CTA */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-0.5">{t("planner.cta_label")}</label>
                <p className="text-xs text-text-muted mb-1.5">{t("planner.cta_sublabel")}</p>
                <input
                  type="text"
                  value={form.cta}
                  onChange={e => setForm({ ...form, cta: e.target.value })}
                  placeholder={t("planner.cta_placeholder")}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[t("planner.cta_ex1"), t("planner.cta_ex2"), t("planner.cta_ex3"), t("planner.cta_ex4")].map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setForm({ ...form, cta: ex })}
                      className="px-2.5 py-1 rounded-lg bg-bg-hover border border-border text-xs text-text-muted hover:text-text-main hover:bg-bg-card transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detalles / Guion */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">{t("planner.desc_label")}</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder={t("planner.desc_placeholder")}
                  rows={3}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none"
                />
              </div>

              {/* Empresa */}
              {folders.length > 0 && (
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Empresa</label>
                  {selectedCompany ? (
                    (() => {
                      const folder = folders.find(f => f.id === selectedCompany)
                      return folder ? (
                        <div
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border"
                          style={{ backgroundColor: folder.color + "15", borderColor: folder.color + "50" }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color }} />
                          <span className="text-sm font-medium flex-1" style={{ color: folder.color }}>{folder.nombre}</span>
                          <span className="text-[10px] text-text-muted/60 bg-bg-hover px-2 py-0.5 rounded-full">asignado</span>
                        </div>
                      ) : null
                    })()
                  ) : (
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
                  )}
                </div>
              )}

              {/* Hora + Prioridad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("planner.time_label")}</label>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={e => setForm({ ...form, hora: e.target.value })}
                    className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("planner.event_priority")}</label>
                  <select
                    value={form.prioridad}
                    onChange={e => setForm({ ...form, prioridad: e.target.value })}
                    className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p.value} value={p.value}>{priorityLabel(p.value)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${prioridadActual.bg} ${prioridadActual.border}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prioridadActual.color }} />
                <span className={`text-xs ${prioridadActual.text}`}>{t("planner.priority_indicator", { value: priorityLabel(form.prioridad) })}</span>
              </div>
            </div>

            {/* Footer fijo */}
            <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-bg-input border border-border text-text-muted font-medium py-2.5 rounded-xl hover:bg-bg-hover transition text-sm"
              >
                {t("planner.cancel")}
              </button>
              {selectedEvent ? (
                <>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 font-medium py-2.5 px-4 rounded-xl hover:bg-red-500/20 transition text-sm"
                  >
                    {t("planner.delete_event")}
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
                  >
                    {t("planner.save")}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
                >
                  {t("planner.save")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal preview de evento */}
      {previewEvent && (() => {
        const prioridad = PRIORIDADES.find(p => p.value === previewEvent.prioridad) || PRIORIDADES[2]
        const plat = PLATAFORMAS.find(p => p.label === previewEvent.plataforma)
        const fecha = previewEvent.fecha
          ? new Date(previewEvent.fecha + "T12:00:00").toLocaleDateString(
              i18n.language === "es" ? "es-ES" : "en-US",
              { weekday: "long", day: "numeric", month: "long" }
            )
          : ""
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

              {/* Banda de prioridad */}
              <div className="h-1 w-full" style={{ backgroundColor: prioridad.color }} />

              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xs text-text-muted capitalize mb-0.5">{fecha}</p>
                  <h2 className="text-base font-semibold text-text-main leading-snug">{previewEvent.title}</h2>
                </div>
                <button onClick={() => setPreviewEvent(null)} className="text-text-muted hover:text-text-main text-xl flex-shrink-0">✕</button>
              </div>

              {/* Chips — formato + plataforma + prioridad */}
              <div className="flex items-center gap-2 flex-wrap px-6 pb-4">
                {previewEvent.formato && (
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary-light text-xs font-medium">
                    {previewEvent.formato}
                  </span>
                )}
                {plat && (
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: plat.color + "22", color: plat.color, border: `1px solid ${plat.color}44` }}
                  >
                    <plat.Icon />
                    {plat.label}
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${prioridad.bg} ${prioridad.border} ${prioridad.text}`}>
                  {priorityLabel(previewEvent.prioridad)}
                </span>
                {previewEvent.hora && (
                  <span className="px-2.5 py-1 rounded-lg bg-bg-hover border border-border text-xs text-text-muted">
                    <Clock size={12} className="inline mr-1" />{previewEvent.hora}
                  </span>
                )}
              </div>

              {/* Cuerpo */}
              <div className="px-6 pb-5 space-y-4 border-t border-border pt-4">

                {previewEvent.objetivo && (
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">{t("planner.goal_label")}</p>
                    <p className="text-sm text-text-main">{previewEvent.objetivo}</p>
                  </div>
                )}

                {previewEvent.hook && (
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">{t("planner.hook_label")}</p>
                    <p className="text-sm text-text-main italic">"{previewEvent.hook}"</p>
                  </div>
                )}

                {previewEvent.cta && (
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">{t("planner.cta_label")}</p>
                    <p className="text-sm text-text-main">→ {previewEvent.cta}</p>
                  </div>
                )}

                {previewEvent.descripcion && (
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">{t("planner.desc_label")}</p>
                    <p className="text-sm text-text-main leading-relaxed">{previewEvent.descripcion}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => setPreviewEvent(null)}
                  className="flex-1 bg-bg-input border border-border text-text-muted font-medium py-2.5 rounded-xl hover:bg-bg-hover transition text-sm"
                >
                  {t("common.close")}
                </button>
                <button
                  onClick={openEditFromPreview}
                  className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
                >
                  <Pencil size={14} className="inline mr-1" />{t("planner.edit")}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal fecha clave */}
      {fechaClaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: fechaClaveModal.color + "22", border: `1px solid ${fechaClaveModal.color}44` }}
                >
                  <span className="text-xl">🌍</span>
                </div>
                <h2 className="text-text-main font-semibold leading-tight">{fechaClaveModal.title}</h2>
              </div>
              <button
                onClick={() => setFechaClaveModal(null)}
                className="text-text-muted hover:text-text-main text-xl flex-shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            <div
              className="rounded-xl p-4 mb-5"
              style={{ backgroundColor: fechaClaveModal.color + "11", border: `1px solid ${fechaClaveModal.color}33` }}
            >
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: fechaClaveModal.color }}>
                {t("planner.content_ideas")}
              </p>
              <p className="text-text-main text-sm leading-relaxed">{fechaClaveModal.sugerencia}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setFechaClaveModal(null)}
                className="flex-1 bg-bg-input border border-border text-text-muted font-medium py-2.5 rounded-xl hover:bg-bg-hover transition text-sm"
              >
                {t("common.close")}
              </button>
              <button
                onClick={() => {
                  const cleanTitle = fechaClaveModal.title.replace(/^\S+\s/, "")
                  setFechaClaveModal(null)
                  setSelectedDate(new Date().toISOString().split("T")[0])
                  setSelectedEvent(null)
                  setForm({ titulo: cleanTitle, descripcion: fechaClaveModal.sugerencia, objetivo: "", hook: "", formato: "", plataforma: "", cta: "", prioridad: "Normal", hora: "09:00" })
                  setModalOpen(true)
                }}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                {t("planner.create_event")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Planner
