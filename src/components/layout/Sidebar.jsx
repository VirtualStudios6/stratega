import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { logout } from "../../firebase/auth"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import LanguageSwitcher from "../shared/LanguageSwitcher"
import {
  LayoutDashboard, CalendarDays, Image, Bell, FolderOpen,
  FileText, Wallet, Users, Settings, Crown, LogOut, Eye, EyeOff
} from "lucide-react"

const NavLink = ({ item, isActive, onClick, collapsed }) => (
  <Link
    to={item.path}
    onClick={onClick}
    title={item.label}
    className={`
      relative flex items-center w-full rounded-xl text-sm font-medium
      transition-all duration-200 group
      ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"}
      ${isActive
        ? "bg-primary/15 text-primary-light"
        : "text-text-muted hover:bg-bg-hover hover:text-text-main"
      }
    `}
  >
    {/* Active indicator */}
    {isActive && (
      <span className={`
        absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-r-full
        ${collapsed ? "w-1 h-6" : "w-0.5 h-5"}
      `} />
    )}

    {/* Icon */}
    <span className="w-5 flex-shrink-0 flex items-center justify-center">
      {item.icon}
    </span>

    {/* Label */}
    {!collapsed && (
      <span className="truncate leading-none">{item.label}</span>
    )}

    {/* Tooltip cuando está colapsado */}
    {collapsed && (
      <div className="
        absolute left-full ml-3 px-2.5 py-1.5 bg-bg-card border border-border
        rounded-lg text-xs text-text-main font-medium whitespace-nowrap
        opacity-0 group-hover:opacity-100 pointer-events-none
        transition-opacity duration-150 shadow-lg z-50
      ">
        {item.label}
      </div>
    )}
  </Link>
)

const Sidebar = ({ open, onClose, collapsed = false, isMobile = false }) => {
  const location = useLocation()
  const navigate  = useNavigate()
  const { t }     = useTranslation()
  const { user }  = useAuth()

  const [avatar,    setAvatar]    = useState(null)
  const [showEmail, setShowEmail] = useState(() =>
    localStorage.getItem("sidebar_show_email") !== "false"
  )

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists() && snap.data().avatar) setAvatar(snap.data().avatar)
    })
  }, [user])

  const toggleEmail = (e) => {
    e.stopPropagation()
    setShowEmail(prev => {
      localStorage.setItem("sidebar_show_email", String(!prev))
      return !prev
    })
  }

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario"
  const initials  = (user?.displayName || user?.email || "U").slice(0, 2).toUpperCase()

  const menuItems = [
    { icon: <LayoutDashboard size={16} />, label: t("sidebar.dashboard"),  path: "/dashboard" },
    { icon: <CalendarDays    size={16} />, label: t("sidebar.planner"),    path: "/planner"   },
    { icon: <Image           size={16} />, label: t("sidebar.feed"),       path: "/feed"      },
    { icon: <Bell            size={16} />, label: t("sidebar.reminders"),  path: "/reminders" },
    { icon: <FolderOpen      size={16} />, label: t("sidebar.folders"),    path: "/folders"   },
    { icon: <FileText        size={16} />, label: t("sidebar.quotes"),     path: "/quotes"    },
    { icon: <Wallet          size={16} />, label: t("sidebar.accounting"), path: "/accounting"},
    { icon: <Users           size={16} />, label: t("sidebar.team"),       path: "/team"      },
  ]

  const bottomItems = [
    { icon: <Settings size={16} />, label: t("sidebar.settings"),     path: "/settings"     },
    { icon: <Crown    size={16} />, label: t("sidebar.subscription"), path: "/subscription" },
  ]

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const showText = isMobile ? true : !collapsed

  return (
    <aside className={`
      ${isMobile
        ? `fixed left-0 top-0 h-screen w-64 bg-bg-card border-r border-border
           flex flex-col z-50 transition-transform duration-300 ease-in-out
           ${open ? "translate-x-0" : "-translate-x-full"} lg:hidden`
        : "h-full w-full bg-bg-card flex flex-col overflow-hidden"
      }
    `}>

      {/* ── Logo ── */}
      <div className={`
        flex items-center border-b border-border flex-shrink-0 h-16 px-4
        ${showText ? "justify-between" : "justify-center"}
      `}>
        <div className={`flex items-center ${showText ? "gap-3" : ""}`}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <img src="/logos/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          {showText && (
            <div>
              <p className="text-sm font-bold text-text-main leading-tight">Stratega</p>
              <p className="text-[10px] text-primary-light font-semibold tracking-widest">PLANNER</p>
            </div>
          )}
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-hover border border-border text-text-muted hover:text-text-main transition text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Nav principal ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <div className={`${collapsed ? "px-2" : "px-3"} space-y-0.5`}>
          {showText && (
            <p className="text-[10px] text-text-muted/40 uppercase tracking-[0.15em] px-3 mb-2 font-semibold">
              {t("nav.features")}
            </p>
          )}
          {collapsed && <div className="h-3" />}

          {menuItems.map(item => (
            <NavLink
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              onClick={isMobile ? onClose : undefined}
              collapsed={!showText}
            />
          ))}
        </div>
      </nav>

      {/* ── Sección inferior ── */}
      <div className={`${collapsed ? "px-2" : "px-3"} pb-3 border-t border-border pt-3 flex-shrink-0 space-y-0.5`}>
        {showText && (
          <p className="text-[10px] text-text-muted/40 uppercase tracking-[0.15em] px-3 mb-2 font-semibold">
            {t("sidebar.support")}
          </p>
        )}
        {collapsed && <div className="h-3" />}

        {bottomItems.map(item => (
          <NavLink
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={isMobile ? onClose : undefined}
            collapsed={!showText}
          />
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={t("sidebar.logout")}
          className={`
            w-full flex items-center rounded-xl text-sm font-medium
            text-red-400/70 hover:bg-red-500/10 hover:text-red-400
            transition-all duration-200 py-2.5 group relative
            ${showText ? "gap-3 px-3" : "justify-center px-0"}
          `}
        >
          <span className="w-5 flex-shrink-0 flex items-center justify-center"><LogOut size={16} /></span>
          {showText && <span className="truncate">{t("sidebar.logout")}</span>}
          {!showText && (
            <div className="
              absolute left-full ml-3 px-2.5 py-1.5 bg-bg-card border border-border
              rounded-lg text-xs text-text-main font-medium whitespace-nowrap
              opacity-0 group-hover:opacity-100 pointer-events-none
              transition-opacity duration-150 shadow-lg z-50
            ">
              {t("sidebar.logout")}
            </div>
          )}
        </button>

        {/* Language switcher — solo cuando está expandido */}
        {showText && (
          <div className="px-1 pt-1">
            <LanguageSwitcher variant="compact" />
          </div>
        )}

        {/* ── Avatar ── */}
        <button
          onClick={() => navigate("/settings")}
          className={`
            w-full flex items-center rounded-xl bg-bg-input border border-border
            mt-2 px-2.5 py-2 hover:border-primary/30 hover:bg-bg-hover transition-all
            ${showText ? "gap-2.5" : "justify-center"}
          `}
        >
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
            {avatar
              ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            }
          </div>
          {showText && (
            <div className="min-w-0 flex-1 overflow-hidden text-left">
              <p className="text-text-main text-xs font-semibold truncate">{firstName}</p>
              {showEmail
                ? <p className="text-text-muted text-[10px] truncate">{user?.email}</p>
                : <p className="text-text-muted text-[10px]">••••••••••</p>
              }
            </div>
          )}
          {showText && (
            <button
              onClick={toggleEmail}
              className="flex-shrink-0 text-text-muted/50 hover:text-text-muted transition p-0.5"
              title={showEmail ? "Ocultar correo" : "Mostrar correo"}
            >
              {showEmail ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
