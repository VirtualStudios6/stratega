import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"

export const LANGUAGES = {
  es: { flag: "🇪🇸", label: "ES", full: "Español" },
  en: { flag: "🇺🇸", label: "EN", full: "English" },
  pt: { flag: "🇧🇷", label: "PT", full: "Português" },
  fr: { flag: "🇫🇷", label: "FR", full: "Français" },
  de: { flag: "🇩🇪", label: "DE", full: "Deutsch" },
  it: { flag: "🇮🇹", label: "IT", full: "Italiano" },
  ja: { flag: "🇯🇵", label: "JA", full: "日本語" },
  zh: { flag: "🇨🇳", label: "ZH", full: "中文" },
  ar: { flag: "🇸🇦", label: "AR", full: "العربية" },
  ru: { flag: "🇷🇺", label: "RU", full: "Русский" },
  ko: { flag: "🇰🇷", label: "KO", full: "한국어" },
  nl: { flag: "🇳🇱", label: "NL", full: "Nederlands" },
  tr: { flag: "🇹🇷", label: "TR", full: "Türkçe" },
}

const changeLang = (i18n, lang) => {
  i18n.changeLanguage(lang)
  localStorage.setItem("stratega_lang", lang)
}

const LanguageSwitcher = ({ variant = "default" }) => {
  const { i18n } = useTranslation()
  const current = i18n.language
  const lang = LANGUAGES[current] || LANGUAGES.es
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Compact dropdown for sidebar/navbar
  if (variant === "compact") {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition px-2 py-1 rounded-lg hover:bg-white/5"
        >
          <span>{lang.flag}</span>
          <span className="font-medium">{lang.label}</span>
          <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-1 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
            {Object.entries(LANGUAGES).map(([code, l]) => (
              <button
                key={code}
                onClick={() => { changeLang(i18n, code); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-bg-hover ${
                  current === code ? "text-primary-light font-semibold" : "text-text-muted"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.full}</span>
                {current === code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Landing navbar dropdown (inline styles, no Tailwind)
  if (variant === "landing") {
    return (
      <div style={{ position: "relative" }} ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(193,140,53,0.08)",
            border: "1px solid rgba(193,140,53,0.22)",
            color: "#c18c35",
            padding: "7px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(193,140,53,0.14)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(193,140,53,0.08)"}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {open && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "#FFFFFF",
            border: "1px solid #D4D4E4",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 200,
            minWidth: "150px",
          }}>
            {Object.entries(LANGUAGES).map(([code, l]) => (
              <button
                key={code}
                onClick={() => { changeLang(i18n, code); setOpen(false) }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 14px",
                  fontSize: "13px",
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  border: "none",
                  background: current === code ? "rgba(193,140,53,0.08)" : "transparent",
                  color: current === code ? "#c18c35" : "#7878A0",
                  fontWeight: current === code ? "600" : "400",
                  transition: "background 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={e => { if (current !== code) e.currentTarget.style.background = "#F5F5FA" }}
                onMouseLeave={e => { if (current !== code) e.currentTarget.style.background = "transparent" }}
              >
                <span>{l.flag}</span>
                <span>{l.full}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Full grid selector for Settings page
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.entries(LANGUAGES).map(([code, l]) => (
        <button
          key={code}
          onClick={() => changeLang(i18n, code)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition ${
            current === code
              ? "bg-primary/20 border-primary/50 text-primary-light"
              : "bg-bg-input border-border text-text-muted hover:text-text-main hover:border-primary/30"
          }`}
        >
          <span className="text-xl">{l.flag}</span>
          <span>{l.full}</span>
          {current === code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light flex-shrink-0" />}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
