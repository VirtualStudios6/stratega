import { useTranslation } from "react-i18next"

const flags = {
  es: "🇪🇸",
  en: "🇺🇸",
}

const labels = {
  es: "ES",
  en: "EN",
}

const LanguageSwitcher = ({ variant = "default" }) => {
  const { i18n } = useTranslation()
  const current = i18n.language

  const toggle = () => {
    const next = current === "es" ? "en" : "es"
    i18n.changeLanguage(next)
    localStorage.setItem("stratega_lang", next)
  }

  // Compact version for navbar/sidebar
  if (variant === "compact") {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition px-2 py-1 rounded-lg hover:bg-white/5"
        title={current === "es" ? "Switch to English" : "Cambiar a Español"}
      >
        <span>{flags[current]}</span>
        <span className="font-medium">{labels[current]}</span>
      </button>
    )
  }

  // Full version for Landing navbar
  if (variant === "landing") {
    return (
      <button
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#F0F0F8",
          padding: "7px 14px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
      >
        <span>{flags[current]}</span>
        <span>{labels[current]}</span>
      </button>
    )
  }

  // Full selector for Settings page
  return (
    <div className="flex gap-3">
      {["es", "en"].map(lang => (
        <button
          key={lang}
          onClick={() => {
            i18n.changeLanguage(lang)
            localStorage.setItem("stratega_lang", lang)
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition ${
            current === lang
              ? "bg-primary/20 border-primary/50 text-primary-light"
              : "bg-bg-input border-border text-text-muted hover:text-text-main hover:border-border-hover"
          }`}
        >
          <span className="text-lg">{flags[lang]}</span>
          <span>{lang === "es" ? "Español" : "English"}</span>
          {current === lang && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary-light" />
          )}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
