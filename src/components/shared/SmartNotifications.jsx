import useSmartNotifications from "../../hooks/useSmartNotifications"

const SmartNotifications = () => {
  const { notifications, dismiss } = useSmartNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mb-6">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm transition-all
            ${n.tipo === "warning"
              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
              : "bg-primary/10 border-primary/20 text-primary-light"
            }`}
        >
          <span className="flex-shrink-0 mt-0.5">
            {n.tipo === "warning" ? "⚠️" : "💡"}
          </span>
          <p className="flex-1 leading-snug">{n.mensaje}</p>
          <button
            onClick={() => dismiss(n.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition text-base leading-none ml-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default SmartNotifications
