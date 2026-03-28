import { useLocation, useNavigate } from "react-router-dom"
import useSubscriptionGuard from "../../hooks/useSubscriptionGuard"

// Rutas siempre accesibles (no requieren suscripción activa)
const UNGUARDED_ROUTES = ["/subscription", "/settings"]

// Rutas accesibles también en plan gratuito (trial)
const FREE_ROUTES = ["/dashboard", "/planner", "/settings", "/subscription"]

const SubscriptionGuard = ({ children }) => {
  const { status, isActive, daysLeft, loading } = useSubscriptionGuard()
  const location = useLocation()
  const navigate = useNavigate()

  // Estas rutas nunca se bloquean
  if (UNGUARDED_ROUTES.includes(location.pathname)) return children

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin opacity-60" />
      </div>
    )
  }

  // ── Suscripción expirada / cancelada / suspendida → paywall total ────────────
  if (!isActive) {
    const statusMessages = {
      expired:        { title: "Tu período de prueba ha terminado", sub: "Elige un plan para seguir usando Stratega Planner." },
      cancelled:      { title: "Tu suscripción fue cancelada",      sub: "Reactiva tu plan para volver a acceder." },
      suspended:      { title: "Tu suscripción está suspendida",    sub: "Reactiva tu plan para volver a acceder." },
      payment_failed: { title: "Hubo un problema con tu pago",      sub: "Actualiza tu método de pago para continuar." },
    }
    const msg = statusMessages[status] ?? statusMessages.expired

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
          <span className="text-4xl">🔒</span>
        </div>
        <h2 className="text-text-main font-bold text-xl sm:text-2xl mb-2">{msg.title}</h2>
        <p className="text-text-muted text-sm max-w-xs mb-1">{msg.sub}</p>
        {status === "expired" && daysLeft === 0 && (
          <p className="text-text-muted/50 text-xs mb-6">Tu prueba gratuita de 7 días ha concluido.</p>
        )}
        <button
          onClick={() => navigate("/subscription")}
          className="mt-4 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
        >
          Ver planes →
        </button>
        <p className="text-text-muted/40 text-xs mt-4">Desde $6.99/mes · Cancela cuando quieras</p>
      </div>
    )
  }

  // ── Trial activo intentando acceder a ruta de pago ───────────────────────────
  if (status === "trial" && !FREE_ROUTES.includes(location.pathname)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">

        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <span className="text-4xl">⭐</span>
        </div>

        <h2 className="text-text-main font-bold text-xl sm:text-2xl mb-2">
          Esta función requiere un plan
        </h2>
        <p className="text-text-muted text-sm max-w-sm mb-1">
          Durante el período de prueba tienes acceso al <strong className="text-text-main">Dashboard y Planner</strong>.
          Suscríbete a cualquier plan para desbloquear el resto de funciones.
        </p>

        {daysLeft > 0 && (
          <p className="text-yellow-400 text-xs mt-2 mb-4">
            ⏳ Te quedan {daysLeft} día{daysLeft !== 1 ? "s" : ""} de prueba gratuita
          </p>
        )}

        <button
          onClick={() => navigate("/subscription")}
          className="mt-4 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
        >
          Ver planes →
        </button>

        <button
          onClick={() => navigate("/planner")}
          className="mt-3 text-text-muted text-xs hover:text-text-main transition"
        >
          Volver al Calendario
        </button>

        <p className="text-text-muted/40 text-xs mt-4">Desde $6.99/mes · Cancela cuando quieras</p>
      </div>
    )
  }

  return children
}

export default SubscriptionGuard
