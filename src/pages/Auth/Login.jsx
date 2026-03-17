import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginWithEmail, loginWithGoogle, loginWithFacebook } from "../../firebase/auth"
import { useTranslation } from "react-i18next"
import { useTheme, THEMES } from "../../context/ThemeContext"
import { Palette, Check } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [themeOpen, setThemeOpen] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate("/dashboard")
    } catch (err) {
      setError(t("auth.error_credentials"))
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
      navigate("/dashboard")
    } catch (err) {
      setError(t("auth.error_google_login"))
    }
  }

  const handleFacebook = async () => {
    try {
      await loginWithFacebook()
      navigate("/dashboard")
    } catch (err) {
      setError(t("auth.error_facebook_login"))
    }
  }

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center px-4 relative overflow-hidden">

      <div className="absolute w-72 h-72 bg-primary opacity-20 rounded-full blur-3xl -top-10 -left-10 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-primary-light opacity-10 rounded-full blur-3xl bottom-0 right-0 pointer-events-none" />

      {/* ── Selector de tema ── */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setThemeOpen(o => !o)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all
            ${themeOpen
              ? "bg-primary/20 border-primary/40 text-primary-light"
              : "bg-bg-card/80 backdrop-blur-sm border-border text-text-muted hover:text-text-main hover:border-border/80"
            }`}
        >
          <Palette size={15} />
        </button>

        {themeOpen && (
          <>
            {/* Cierre al hacer clic fuera */}
            <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />

            <div className="absolute top-11 right-0 z-50 bg-bg-card border border-border rounded-2xl shadow-2xl p-2 w-44 animate-scale-in">
              <p className="text-[10px] text-text-muted uppercase tracking-widest px-2 pb-2">Tema</p>
              {Object.values(THEMES).map(th => (
                <button
                  key={th.id}
                  onClick={() => { setTheme(th.id); setThemeOpen(false) }}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all text-left
                    ${theme === th.id ? "bg-primary/10" : "hover:bg-bg-hover"}`}
                >
                  {/* Mini preview */}
                  <div
                    className="w-7 h-7 rounded-lg flex-shrink-0 border border-white/10 flex items-center justify-center"
                    style={{ backgroundColor: th.vars["--bg-card"] }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: th.vars["--primary"] }}
                    />
                  </div>
                  <span className={`text-xs font-medium flex-1 ${theme === th.id ? "text-primary-light" : "text-text-muted"}`}>
                    {th.nombre}
                  </span>
                  {theme === th.id && <Check size={12} className="text-primary-light flex-shrink-0" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-bg-card border border-border rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8">
            <img
              src="/logos/logo.png"
              alt="Stratega Planner"
              className="w-20 h-20 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Stratega Planner</h1>
            <p className="text-text-muted text-sm mt-1">{t("auth.login_tagline")}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">{t("auth.email")}</label>
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
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password_placeholder")}
                required
                className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-text-muted hover:text-primary-light transition">
                {t("auth.forgot_password")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("auth.logging_in") : t("auth.login")}
            </button>
          </form>

          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-text-muted">o</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogle}
              className="w-full bg-bg-input border border-border rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-bg-hover transition"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
              <span className="text-sm font-medium text-text-main">{t("auth.google")}</span>
            </button>
            <button
              onClick={handleFacebook}
              className="w-full bg-[#1877F2]/10 border border-[#1877F2]/30 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-[#1877F2]/20 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-[#1877F2]">{t("auth.facebook")}</span>
            </button>
          </div>

          <p className="text-center text-xs text-text-muted mt-6">
            {t("auth.no_account")}{" "}
            <Link to="/register" className="text-primary-light font-medium hover:text-accent transition">
              {t("auth.register_link")}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          {t("auth.copyright")}
        </p>
      </div>
    </div>
  )
}

export default Login
