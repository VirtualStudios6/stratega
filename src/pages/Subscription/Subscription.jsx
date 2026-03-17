import { useState } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { useAuth } from "../../context/AuthContext"

const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    descripcion: "Para community managers que están comenzando",
    mensual: { precio: 6.99, variantId: import.meta.env.VITE_LS_BASIC_MONTHLY },
    anual: { precio: 67, variantId: import.meta.env.VITE_LS_BASIC_ANNUAL, ahorro: "20%" },
    color: "border-border",
    badge: null,
    features: [
      "✅ Planner y Calendario",
      "✅ Organizador de Feed",
      "✅ Recordatorios",
      "✅ Carpetas (5GB)",
      "✅ Hasta 3 miembros de equipo",
      "❌ Cotizaciones",
      "❌ Contabilidad",
      "❌ Strat AI",
    ]
  },
  {
    id: "pro",
    nombre: "Pro",
    descripcion: "Para profesionales que quieren todas las herramientas",
    mensual: { precio: 11.99, variantId: import.meta.env.VITE_LS_PRO_MONTHLY },
    anual: { precio: 115, variantId: import.meta.env.VITE_LS_PRO_ANNUAL, ahorro: "20%" },
    color: "border-primary/50",
    badge: "Más popular",
    features: [
      "✅ Todo lo del plan Básico",
      "✅ Cotizaciones ilimitadas + PDF",
      "✅ Contabilidad completa",
      "✅ Strat AI integrada",
      "✅ Miembros ilimitados",
      "✅ 20GB de almacenamiento",
      "✅ Soporte prioritario",
      "✅ Nuevas funciones primero",
    ]
  }
]

const Subscription = () => {
  const { user } = useAuth()
  const [billing, setBilling] = useState("mensual")

  const handleCheckout = (variantId) => {
    const email = user?.email || ""
    const url = `https://strategaplanner.lemonsqueezy.com/checkout/buy/${variantId}?checkout[email]=${email}&checkout[custom][user_id]=${user?.uid}`
    window.open(url, "_blank")
  }

  return (
    <DashboardLayout>
      <div className="mb-6 text-center px-2">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main">Planes y Precios 💳</h1>
        <p className="text-text-muted text-sm mt-2">Empieza gratis 7 días. Cancela cuando quieras.</p>
      </div>

      {/* Toggle mensual/anual */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setBilling("mensual")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${
            billing === "mensual"
              ? "bg-primary/20 text-primary-light border-primary/30"
              : "bg-bg-card text-text-muted border-border hover:bg-bg-hover"
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setBilling("anual")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition flex items-center gap-2 ${
            billing === "anual"
              ? "bg-primary/20 text-primary-light border-primary/30"
              : "bg-bg-card text-text-muted border-border hover:bg-bg-hover"
          }`}
        >
          Anual
          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">
            −20%
          </span>
        </button>
      </div>

      {/* Planes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-8">
        {PLANES.map(plan => {
          const info = billing === "mensual" ? plan.mensual : plan.anual
          return (
            <div
              key={plan.id}
              className={`relative bg-bg-card border-2 ${plan.color} rounded-2xl p-5 sm:p-6 flex flex-col`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg shadow-primary/30">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-text-main font-bold text-xl">{plan.nombre}</h2>
                <p className="text-text-muted text-xs mt-1">{plan.descripcion}</p>
              </div>

              <div className="mb-5">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-text-main">${info.precio}</span>
                  <span className="text-text-muted text-sm mb-1">
                    /{billing === "mensual" ? "mes" : "año"}
                  </span>
                </div>
                {billing === "anual" && (
                  <p className="text-green-400 text-xs mt-1">Ahorra {plan.anual.ahorro} vs mensual</p>
                )}
                <p className="text-text-muted/60 text-xs mt-1">7 días gratis, sin tarjeta requerida</p>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-text-muted">{f}</li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(info.variantId)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                  plan.id === "pro"
                    ? "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/30 active:bg-primary-light"
                    : "bg-bg-hover text-text-main border border-border hover:bg-border"
                }`}
              >
                Empezar gratis 7 días
              </button>
            </div>
          )
        })}
      </div>

      {/* Garantía */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-bg-card border border-border rounded-2xl p-5 text-center">
          <span className="text-3xl mb-3 block">🛡️</span>
          <h3 className="text-text-main font-semibold mb-2">Garantía de 30 días</h3>
          <p className="text-text-muted text-sm">
            Si no estás satisfecho en los primeros 30 días, te devolvemos el dinero sin preguntas.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { icon: "🔒", text: "Pago seguro con SSL" },
            { icon: "❌", text: "Cancela cuando quieras" },
            { icon: "🌍", text: "Tarjetas internacionales" },
          ].map((item, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
              <span className="text-lg sm:text-xl block mb-1">{item.icon}</span>
              <p className="text-text-muted text-[10px] sm:text-xs">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Subscription
