import { Link, useLocation, useNavigate } from "react-router-dom"
import { logout } from "../../firebase/auth"

const menuItems = [
  { icon: "⚡", label: "Dashboard", path: "/dashboard" },
  { icon: "📅", label: "Planner", path: "/planner" },
  { icon: "🖼️", label: "Feed", path: "/feed" },
  { icon: "🔔", label: "Recordatorios", path: "/reminders" },
  { icon: "📁", label: "Carpetas", path: "/folders" },
  { icon: "📄", label: "Cotizaciones", path: "/quotes" },
  { icon: "💰", label: "Contabilidad", path: "/accounting" },
  { icon: "👥", label: "Equipo", path: "/team" },
]

const bottomItems = [
  { icon: "⚙️", label: "Configuración", path: "/settings" },
  { icon: "💎", label: "Planes", path: "/subscription" },
]

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#13131F] border-r border-[#2A2A3E] flex flex-col z-50">

      {/* Logo */}
      <div className="p-6 border-b border-[#2A2A3E]">
        <div className="flex items-center gap-3">
          <img src="/logos/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-sm font-bold text-text-main leading-tight">Stratega</h1>
            <p className="text-xs text-text-muted">Planner</p>
          </div>
        </div>
      </div>

      {/* Menú principal */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs text-text-muted uppercase tracking-wider px-3 mb-3">Menú</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? "bg-primary/20 text-primary-light border border-primary/30"
                  : "text-text-muted hover:bg-[#1E1E2E] hover:text-text-main"
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Menú inferior */}
      <div className="p-4 border-t border-[#2A2A3E] space-y-1">
        <p className="text-xs text-text-muted uppercase tracking-wider px-3 mb-3">Soporte</p>
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? "bg-primary/20 text-primary-light border border-primary/30"
                  : "text-text-muted hover:bg-[#1E1E2E] hover:text-text-main"
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span className="text-base">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
