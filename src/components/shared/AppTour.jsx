import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import {
  LayoutDashboard, CalendarDays, Image, Bell,
  FolderOpen, FileText, Wallet, Sparkles, X, ChevronRight, ChevronLeft, Check
} from "lucide-react"

const TOUR_KEY = "stratega_tour_done"

const STEPS = [
  {
    icon: LayoutDashboard,
    color: "bg-blue-500/20 text-blue-400",
    title: "Tu Panel de Control",
    desc:  "Aquí tienes un resumen de todo: recordatorios pendientes, balance del mes, cotizaciones recientes y más. Tu punto de partida cada día.",
  },
  {
    icon: CalendarDays,
    color: "bg-primary/20 text-primary-light",
    title: "Planner de Contenido",
    desc:  "Planifica tus publicaciones y campañas en un calendario visual. Nunca más improvises tu contenido.",
  },
  {
    icon: Image,
    color: "bg-pink-500/20 text-pink-400",
    title: "Preview del Feed",
    desc:  "Visualiza cómo quedará tu feed de Instagram antes de publicar. Sube imágenes y reordénalas con drag & drop.",
  },
  {
    icon: Bell,
    color: "bg-amber-500/20 text-amber-400",
    title: "Recordatorios",
    desc:  "Crea recordatorios con prioridad y fecha. Recibirás notificaciones del navegador cuando se acerque la hora.",
  },
  {
    icon: FolderOpen,
    color: "bg-teal-500/20 text-teal-400",
    title: "Carpetas de Clientes",
    desc:  "Organiza archivos, imágenes y documentos por cliente o proyecto. Todo en un solo lugar.",
  },
  {
    icon: FileText,
    color: "bg-indigo-500/20 text-indigo-400",
    title: "Cotizaciones Profesionales",
    desc:  "Genera cotizaciones con tu marca, exporta en PDF y usa el modo presentación para mostrarlas a tus clientes.",
  },
  {
    icon: Wallet,
    color: "bg-green-500/20 text-green-400",
    title: "Contabilidad Simple",
    desc:  "Registra ingresos y gastos, ve tu balance mensual y analiza tus tendencias financieras en segundos.",
  },
  {
    icon: Sparkles,
    color: "bg-purple-500/20 text-purple-400",
    title: "Stratega IA — Tu Asistente",
    desc:  "Disponible en todas las páginas. Consulta estrategias de redes sociales, redacción de captions, precios y más. ¡Siempre a tu lado!",
  },
]

const AppTour = () => {
  const location      = useLocation()
  const [show,  setShow]  = useState(false)
  const [step,  setStep]  = useState(0)

  useEffect(() => {
    // No mostrar si el onboarding nuevo ya lo marcó como visto
    if (location.pathname === "/dashboard") {
      const done = localStorage.getItem(TOUR_KEY)
      if (!done) setShow(true)
    }
  }, [location.pathname])

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "1")
    setShow(false)
  }

  if (!show) return null

  const current = STEPS[step]
  const Icon    = current.icon
  const isLast  = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[95] flex items-center justify-center px-4">
      <div className="bg-bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Barra de progreso superior */}
        <div className="flex gap-0.5 p-1 bg-bg-main">
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              className={`flex-1 h-1 rounded-full cursor-pointer transition-all ${i <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${current.color.split(" ")[0]}`}>
              <Icon size={26} className={current.color.split(" ")[1]} />
            </div>
            <button
              onClick={finish}
              className="text-text-muted hover:text-text-main transition p-1.5 rounded-lg hover:bg-bg-hover"
            >
              <X size={15} />
            </button>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-3 ${current.color.split(" ")[0]} ${current.color.split(" ")[1]}`}>
            <Icon size={11} />
            {current.title}
          </div>

          <p className="text-text-muted text-sm leading-relaxed">
            {current.desc}
          </p>

          <div className="flex items-center justify-between mt-6">
            <span className="text-text-muted/40 text-xs">
              {step + 1} / {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 text-text-muted hover:text-text-main border border-border px-3 py-1.5 rounded-xl text-xs transition hover:bg-bg-hover"
                >
                  <ChevronLeft size={13} /> Anterior
                </button>
              )}
              {!isLast ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary-light transition"
                >
                  Siguiente <ChevronRight size={13} />
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary-light transition"
                >
                  <Check size={13} /> ¡Empezar!
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Skip */}
        <div className="border-t border-border px-6 py-3 text-center">
          <button onClick={finish} className="text-text-muted/40 text-xs hover:text-text-muted transition">
            Saltar guía
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppTour
