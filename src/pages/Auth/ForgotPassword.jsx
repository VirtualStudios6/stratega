import { useState } from "react"
import { Link } from "react-router-dom"
import { resetPassword } from "../../firebase/auth"
import { useTranslation } from "react-i18next"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const handleReset = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    try {
      await resetPassword(email)
      setMessage(t("auth.reset_success"))
    } catch (err) {
      setError(t("auth.error_no_account"))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center px-4 relative overflow-hidden">

      <div className="absolute w-72 h-72 bg-primary opacity-15 rounded-full blur-3xl top-10 left-1/2 -translate-x-1/2 pointer-events-none animate-fade-in" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="bg-bg-card border border-border rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8 animate-fade-in" style={{animationDelay:"0.1s"}}>
            <img
              src="/logos/logo.png"
              alt="Stratega Planner"
              className="w-20 h-20 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-text-main tracking-tight">{t("auth.forgot_title")}</h1>
            <p className="text-text-muted text-sm mt-1">{t("auth.forgot_subtitle")}</p>
          </div>

          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-5">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4 animate-slide-up" style={{animationDelay:"0.18s"}}>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {loading ? t("auth.sending") : t("auth.send_reset")}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-6 animate-fade-in" style={{animationDelay:"0.28s"}}>
            <Link to="/login" className="text-primary-light font-medium hover:text-accent transition">
              ← {t("auth.back_to_login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
