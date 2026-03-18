import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { db, storage } from "../../firebase/config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { updateProfile } from "firebase/auth"
import {
  ChevronRight, Check, X, ImagePlus,
  LayoutDashboard, CalendarDays, Image as ImageIcon,
  Bell, FileText, Wallet, Sparkles, Users,
} from "lucide-react"

const TOUR_KEY = "stratega_tour_done"

const FEATURES = [
  { icon: LayoutDashboard, bg: "bg-blue-500/20",    text: "text-blue-400",     title: "Dashboard",    desc: "Resumen de tu actividad diaria" },
  { icon: CalendarDays,    bg: "bg-primary/20",      text: "text-primary-light",title: "Planner",      desc: "Calendario de contenido visual" },
  { icon: FileText,        bg: "bg-indigo-500/20",   text: "text-indigo-400",   title: "Cotizaciones", desc: "Presupuestos y facturas en PDF" },
  { icon: Wallet,          bg: "bg-green-500/20",    text: "text-green-400",    title: "Contabilidad", desc: "Ingresos, gastos y balance" },
  { icon: Bell,            bg: "bg-amber-500/20",    text: "text-amber-400",    title: "Recordatorios",desc: "Alertas para fechas clave" },
  { icon: ImageIcon,       bg: "bg-pink-500/20",     text: "text-pink-400",     title: "Feed",         desc: "Preview de tu feed de Instagram" },
  { icon: Users,           bg: "bg-teal-500/20",     text: "text-teal-400",     title: "Equipo",       desc: "Gestiona clientes y colaboradores" },
  { icon: Sparkles,        bg: "bg-primary/20",      text: "text-primary-light", title: "Stratega IA",  desc: "Asistente de marketing con IA" },
]

const TOTAL_STEPS = 3

const OnboardingWizard = () => {
  const { user, refreshUser } = useAuth()
  const [show,    setShow]    = useState(false)
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [nombre,  setNombre]  = useState("")
  const [avatar,  setAvatar]  = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (!snap.exists() || !snap.data().onboardingCompleted) {
        setNombre(user.displayName || "")
        setShow(true)
      }
    })
  }, [user])

  const finish = async () => {
    await setDoc(doc(db, "users", user.uid), { onboardingCompleted: true }, { merge: true })
    localStorage.setItem(TOUR_KEY, "1")
    setShow(false)
  }

  const handleStep0 = async () => {
    if (!nombre.trim()) return
    setLoading(true)
    try {
      await updateProfile(user, { displayName: nombre.trim() })
      await setDoc(doc(db, "users", user.uid), { name: nombre.trim() }, { merge: true })
      await refreshUser()
      setStep(1)
    } catch {}
    setLoading(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleStep1 = async () => {
    setLoading(true)
    try {
      if (avatar) {
        const storageRef = ref(storage, `avatars/${user.uid}`)
        await uploadBytes(storageRef, avatar)
        const url = await getDownloadURL(storageRef)
        await setDoc(doc(db, "users", user.uid), { avatar: url }, { merge: true })
      }
      setStep(2)
    } catch {}
    setLoading(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
      <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <img src="/logos/logo.png" alt="" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-xs text-primary-light font-bold uppercase tracking-widest">Stratega Planner</span>
          </div>
          <button
            onClick={finish}
            title="Saltar configuración"
            className="text-text-muted hover:text-text-main transition p-1.5 rounded-lg hover:bg-bg-hover"
          >
            <X size={15} />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="flex gap-1.5 px-6 mt-5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 space-y-5">

          {/* ── PASO 1 — Nombre ── */}
          {step === 0 && (
            <>
              <div>
                <h2 className="text-text-main font-bold text-xl">¡Bienvenido!</h2>
                <p className="text-text-muted text-sm mt-1">Cuéntanos cómo te llamas para personalizar tu experiencia.</p>
              </div>
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Tu nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleStep0()}
                  placeholder="Tu nombre completo"
                  autoFocus
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>
              <button
                onClick={handleStep0}
                disabled={!nombre.trim() || loading}
                className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-light transition disabled:opacity-40 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
              >
                Continuar <ChevronRight size={15} />
              </button>
            </>
          )}

          {/* ── PASO 2 — Foto de perfil ── */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-text-main font-bold text-xl">Tu foto de perfil</h2>
                <p className="text-text-muted text-sm mt-1">Agrega una foto para que te reconozcan. Puedes cambiarla en cualquier momento desde Ajustes.</p>
              </div>

              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-primary/50 bg-bg-input transition group"
                >
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                      <ImagePlus size={22} className="text-text-muted group-hover:text-primary-light transition" />
                      <span className="text-[10px] text-text-muted">Subir foto</span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {preview && (
                  <button
                    onClick={() => { setAvatar(null); setPreview(null) }}
                    className="text-xs text-text-muted/60 hover:text-red-400 transition"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm"
                >
                  Saltar
                </button>
                <button
                  onClick={handleStep1}
                  disabled={loading}
                  className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-light transition disabled:opacity-40 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
                >
                  {avatar ? "Guardar y continuar" : "Continuar"} <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {/* ── PASO 3 — Recorrido ── */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-text-main font-bold text-xl">Todo en un solo lugar</h2>
                <p className="text-text-muted text-sm mt-1">Esto es lo que puedes hacer con Stratega Planner.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map(({ icon: Icon, bg, text, title, desc }) => (
                  <div
                    key={title}
                    className={`${bg} rounded-xl p-3 border border-white/5`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={13} className={text} />
                      <span className={`text-xs font-semibold ${text}`}>{title}</span>
                    </div>
                    <p className="text-text-muted text-[11px] leading-snug">{desc}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={finish}
                disabled={loading}
                className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-light transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
              >
                <Check size={15} /> ¡Empezar!
              </button>
            </>
          )}

          <p className="text-center text-text-muted/30 text-xs">
            Paso {step + 1} de {TOTAL_STEPS} · Puedes saltar y configurar esto después
          </p>
        </div>
      </div>
    </div>
  )
}

export default OnboardingWizard
