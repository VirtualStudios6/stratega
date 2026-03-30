import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerWithEmail, loginWithGoogle, loginWithFacebook } from "../../firebase/auth"
import { db } from "../../firebase/config"
import { doc, setDoc } from "firebase/firestore"
import { useTranslation } from "react-i18next"

const Register = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

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
    } catch (err) {
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
    } catch (err) {
      setError(t(errorKey))
    }
  }

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center px-4 relative overflow-hidden">

      <div className="absolute w-72 h-72 bg-primary opacity-20 rounded-full blur-3xl -top-10 -right-10 pointer-events-none animate-fade-in" />
      <div className="absolute w-72 h-72 bg-primary-light opacity-5 rounded-full blur-3xl bottom-0 left-0 pointer-events-none animate-fade-in" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="bg-bg-card border border-border rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8 animate-fade-in" style={{animationDelay:"0.1s"}}>
            <img
              src="/logos/logo.png"
              alt="Stratega Planner"
              className="w-20 h-20 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-text-main tracking-tight">{t("auth.register_title")}</h1>
            <p className="text-text-muted text-sm mt-1">{t("auth.register_subtitle")}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 animate-slide-up" style={{animationDelay:"0.18s"}}>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">{t("auth.name_label")}</label>
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
                placeholder={t("auth.password_min_placeholder")}
                required
                className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("auth.creating") : t("auth.create_free")}
            </button>
          </form>

          <div className="flex items-center my-6 gap-4 animate-fade-in" style={{animationDelay:"0.28s"}}>
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-text-muted">o</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="flex flex-col gap-3 animate-slide-up" style={{animationDelay:"0.32s"}}>
            <button
              onClick={() => handleSocialRegister(loginWithGoogle, "auth.error_google_register")}
              className="w-full bg-bg-input border border-border rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-bg-hover transition"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
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

          <p className="text-center text-xs text-text-muted mt-6 animate-fade-in" style={{animationDelay:"0.4s"}}>
            {t("auth.have_account")}{" "}
            <Link to="/login" className="text-primary-light font-medium hover:text-accent transition">
              {t("auth.login_link")}
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

export default Register
