import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerWithEmail, loginWithGoogle, loginWithFacebook } from "../../firebase/auth"
import { db } from "../../firebase/config"
import { doc, setDoc } from "firebase/firestore"
import { useTranslation } from "react-i18next"
import { useTheme, THEMES } from "../../context/ThemeContext"
import { Palette, Check, CalendarDays, Users, Sparkles, BarChart3 } from "lucide-react"
import { useRef } from "react"

// ── Selector de tema flotante (mismo que en Login) ─────────────────────────
const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const [open, setOpen]     = useState(false)
  const btnRef              = useRef(null)
  const [pos, setPos]       = useState({ top: 0, right: 0 })

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`fixed top-4 right-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center border transition-all
          ${open
            ? "bg-primary/20 border-primary/40 text-primary-light"
            : "bg-bg-card border-border text-text-muted hover:text-text-main shadow-sm"
          }`}
      >
        <Palette size={15} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-bg-card border border-border rounded-2xl shadow-2xl p-2 w-48 animate-scale-in"
            style={{ top: pos.top, right: pos.right }}
          >
            <p className="text-[10px] text-text-muted uppercase tracking-widest px-2 pb-1.5">Tema</p>
            <div className="max-h-72 overflow-y-auto space-y-0.5">
              {Object.values(THEMES).map(th => (
                <button
                  key={th.id}
                  onClick={() => { setTheme(th.id); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all text-left
                    ${theme === th.id ? "bg-primary/10" : "hover:bg-bg-hover"}`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex-shrink-0 border border-black/10 flex items-center justify-center"
                    style={{ backgroundColor: th.vars["--bg-card"] }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: th.vars["--primary"] }} />
                  </div>
                  <span className={`text-xs font-medium flex-1 ${theme === th.id ? "text-primary-light" : "text-text-muted"}`}>
                    {th.emoji} {th.nombre}
                  </span>
                  {theme === th.id && <Check size={12} className="text-primary-light flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}

const FEATURES = [
  { icon: CalendarDays, text: "Planner y calendario editorial" },
  { icon: Users,        text: "Colaboración con tu equipo" },
  { icon: BarChart3,    text: "Cotizaciones y contabilidad" },
  { icon: Sparkles,     text: "Strat AI para tu contenido" },
]

const Register = () => {
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()
  const { t }                   = useTranslation()

  const buildTrialData = () => {
    const trialStartDate = new Date()
    const trialEndDate   = new Date(trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    return { trialStartDate, trialEndDate, subscriptionStatus: "trial", plan: "trial" }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await registerWithEmail(email, password)
      await setDoc(doc(db, "users", result.user.uid), {
        name, email, createdAt: new Date(), ...buildTrialData()
      })
      navigate("/dashboard")
    } catch {
      setError(t("auth.error_register"))
    }
    setLoading(false)
  }

  const handleSocialRegister = async (providerFn, errorKey) => {
    try {
      const result = await providerFn()
      await setDoc(doc(db, "users", result.user.uid), {
        name: result.user.displayName,
        email: result.user.email,
        createdAt: new Date(),
        ...buildTrialData()
      }, { merge: true })
      navigate("/dashboard")
    } catch {
      setError(t(errorKey))
    }
  }

  return (
    <div className="min-h-screen bg-bg-main flex">

      <ThemeSwitcher />

      {/* ── Panel izquierdo — branding (solo en desktop) ──────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-bg-card border-r border-border px-14 py-12">

        <div className="flex items-center gap-3">
          <img
            src="/logos/logo2d-512x512-sin-fondo.png"
            alt="Stratega Planner"
            className="w-10 h-10 object-contain"
            onError={(e) => { if (e.target.src.includes('.png')) e.target.src = '/logos/logo.png' }}
          />
          <span className="text-text-main font-bold text-lg tracking-tight">Stratega Planner</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
              <Sparkles size={13} className="text-primary-light" />
              <span className="text-primary-light text-xs font-medium">5 días gratis · Sin tarjeta</span>
            </div>
            <h2 className="text-4xl font-bold text-text-main leading-tight">
              Bienvenido al modo<br />
              Estratega.<br />
              <span className="gradient-text">Empieza a programar</span><br />
              tu contenido.
            </h2>
            <p className="text-text-muted text-base max-w-sm leading-relaxed">
              Únete a los community managers que ya usan Stratega para planificar mejor y trabajar en equipo.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-primary-light" />
                </div>
                <span className="text-text-muted text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-text-muted/40 text-xs">{t("auth.copyright")}</p>
      </div>

      {/* ── Panel derecho — formulario ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 animate-fade-in">

        {/* Logo visible solo en móvil */}
        <div className="flex flex-col items-center mb-8 lg:hidden">
          <img
            src="/logos/logo2d-512x512-sin-fondo.png"
            alt="Stratega Planner"
            className="w-16 h-16 object-contain mb-3"
            onError={(e) => { if (e.target.src.includes('.png')) e.target.src = '/logos/logo.png' }}
          />
          <h1 className="text-xl font-bold text-text-main tracking-tight">Stratega Planner</h1>
        </div>

        <div className="w-full max-w-sm">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-main">{t("auth.register_title")}</h2>
            <p className="text-text-muted text-sm mt-1">{t("auth.register_subtitle")}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                {t("auth.name_label")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.name_placeholder")}
                required
                className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                {t("auth.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email_placeholder")}
                required
                className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                {t("auth.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password_min_placeholder")}
                required
                className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? t("auth.creating") : t("auth.create_free")}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-text-muted">o</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleSocialRegister(loginWithGoogle, "auth.error_google_register")}
              className="w-full bg-bg-input border border-border rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-bg-hover transition"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
              <span className="text-sm font-medium text-text-main">{t("auth.google")}</span>
            </button>
            <button
              onClick={() => handleSocialRegister(loginWithFacebook, "auth.error_facebook_register")}
              className="w-full bg-[#1877F2]/10 border border-[#1877F2]/30 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-[#1877F2]/20 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-[#1877F2]">{t("auth.facebook")}</span>
            </button>
          </div>

          <p className="text-center text-xs text-text-muted mt-8">
            {t("auth.have_account")}{" "}
            <Link to="/login" className="text-primary-light font-medium hover:text-accent transition">
              {t("auth.login_link")}
            </Link>
          </p>

          <p className="text-center text-xs text-text-muted/40 mt-6 lg:hidden">
            {t("auth.copyright")}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
