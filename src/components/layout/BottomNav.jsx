import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { logout } from "../../firebase/auth"
import LanguageSwitcher from "../shared/LanguageSwitcher"
import NotificationBell from "../shared/NotificationBell"
import { clearReminderBadge, getReminderBadgeCount } from "../../hooks/useReminderNotifications"
import {
  LayoutDashboard, CalendarDays, Image, Bell,
  MoreHorizontal, FolderOpen, FileText, Wallet,
  Users, Settings, Crown, LogOut, X
} from "lucide-react"

const BottomNav = () => {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { t }     = useTranslation()
  const { user }  = useAuth()
  const [moreOpen,      setMoreOpen]      = useState(false)
  const [avatar,        setAvatar]        = useState(null)
  const [reminderBadge, setReminderBadge] = useState(() => getReminderBadgeCount())

  useEffect(() => {
    const handler = (e) => setReminderBadge(e.detail)
    window.addEventListener("reminder-badge", handler)
    return () => window.removeEventListener("reminder-badge", handler)
  }, [])

  useEffect(() => {
    if (location.pathname === "/reminders" && reminderBadge > 0) {
      clearReminderBadge()
    }
  }, [location.pathname, reminderBadge])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists() && snap.data().avatar) setAvatar(snap.data().avatar)
    })
  }, [user])

  // Cierra drawer al navegar
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  // Bloquea scroll del body cuando drawer está abierto
  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [moreOpen])

  const tabs = [
    { icon: LayoutDashboard, label: t("sidebar.dashboard"), path: "/dashboard" },
    { icon: CalendarDays,    label: t("sidebar.planner"),   path: "/planner"   },
    { icon: Image,           label: t("sidebar.feed"),      path: "/feed"      },
    { icon: Bell,            label: t("sidebar.reminders"), path: "/reminders" },
  ]

  const moreItems = [
    { icon: FolderOpen, label: t("sidebar.folders"),     path: "/folders",      iconColor: "text-amber-500",   bg: "bg-amber-500/10"  },
    { icon: FileText,   label: t("sidebar.quotes"),      path: "/quotes",       iconColor: "text-blue-500",    bg: "bg-blue-500/10"   },
    { icon: Wallet,     label: t("sidebar.accounting"),  path: "/accounting",   iconColor: "text-green-500",   bg: "bg-green-500/10"  },
    { icon: Users,      label: t("sidebar.team"),        path: "/team",         iconColor: "text-purple-400",  bg: "bg-purple-500/10" },
    { icon: Settings,   label: t("sidebar.settings"),    path: "/settings",     iconColor: "text-text-muted",  bg: "bg-bg-hover"      },
    { icon: Crown,      label: t("sidebar.subscription"),path: "/subscription", iconColor: "text-primary-light",bg: "bg-primary/10"   },
  ]

  const moreActive = ["/folders","/quotes","/accounting","/team","/settings","/subscription"]
    .includes(location.pathname)

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario"
  const initials  = (user?.displayName || user?.email || "U").slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    setMoreOpen(false)
    await logout()
    navigate("/login")
  }

  return (
    <>
      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="bg-bg-card/96 backdrop-blur-xl border-t border-border h-16 flex items-stretch">

          {tabs.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path
            const badge  = path === "/reminders" ? reminderBadge : 0
            return (
              <Link
                key={path}
                to={path}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] active:opacity-60 transition-opacity duration-100 select-none"
              >
                <div className={`
                  relative flex items-center justify-center w-11 h-7 rounded-2xl transition-all duration-200
                  ${active ? "bg-primary/15" : ""}
                `}>
                  <Icon size={21} className={`transition-colors duration-200 ${active ? "text-primary" : "text-text-muted"}`} strokeWidth={active ? 2.2 : 1.8} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-none transition-colors duration-200 ${active ? "text-primary" : "text-text-muted"}`}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Más */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] active:opacity-60 transition-opacity duration-100 select-none"
          >
            <div className={`flex items-center justify-center w-11 h-7 rounded-2xl transition-all duration-200 ${moreActive ? "bg-primary/15" : ""}`}>
              <MoreHorizontal size={21} className={`transition-colors duration-200 ${moreActive ? "text-primary" : "text-text-muted"}`} strokeWidth={moreActive ? 2.2 : 1.8} />
            </div>
            <span className={`text-[10px] font-semibold leading-none transition-colors duration-200 ${moreActive ? "text-primary" : "text-text-muted"}`}>
              Más
            </span>
          </button>

        </div>
      </nav>

      {/* ── More drawer ─────────────────────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden animate-fade-in-fast"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-bg-card rounded-t-[28px] shadow-2xl animate-slide-up overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 20px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-[5px] rounded-full bg-border" />
            </div>

            {/* User row */}
            <div className="flex items-center gap-3 px-5 pt-3 pb-4">
              <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-primary/25">
                {avatar
                  ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold">{initials}</div>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-text-main font-bold text-sm truncate">{firstName}</p>
                <p className="text-text-muted text-[11px] truncate">{user?.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <NotificationBell />
                <button
                  onClick={() => setMoreOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg-hover border border-border text-text-muted active:opacity-60"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="h-px bg-border mx-5 mb-4" />

            {/* Grid de secciones */}
            <div className="grid grid-cols-3 gap-3 px-5 mb-4">
              {moreItems.map(({ icon: Icon, label, path, iconColor, bg }) => {
                const active = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`
                      flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95
                      ${active
                        ? "bg-primary/10 border-primary/35 shadow-sm"
                        : "bg-bg-input border-border active:bg-bg-hover"
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-primary/15" : bg}`}>
                      <Icon size={20} className={active ? "text-primary" : iconColor} strokeWidth={1.8} />
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight px-1 ${active ? "text-primary" : "text-text-muted"}`}>
                      {label}
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Idioma + Logout */}
            <div className="flex items-center gap-3 px-5 pb-2">
              <div className="flex-1">
                <LanguageSwitcher variant="compact" />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold active:opacity-70 transition-opacity"
              >
                <LogOut size={15} />
                <span>{t("sidebar.logout")}</span>
              </button>
            </div>

          </div>
        </>
      )}
    </>
  )
}

export default BottomNav
