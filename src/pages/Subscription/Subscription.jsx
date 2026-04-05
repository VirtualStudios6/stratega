import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import useSubscriptionGuard from "../../hooks/useSubscriptionGuard"
import { invalidateSubscriptionCache } from "../../hooks/useSubscriptionGuard"
import { usePaddle } from "../../hooks/usePaddle"
import { CheckCircle2, XCircle, ShieldCheck, Globe, X } from "lucide-react"

// Price IDs de Paddle (Billing v2)
const PADDLE_PRICES = {
  basico: {
    mensual: "pri_01kmna6c9abcr6n96f27ytey15",
    anual:   "pri_01kmna88v8dqgb2vdqw323wp86",
  },
  pro: {
    mensual: "pri_01kmnaam2a1t269x2dnnf63z78",
    anual:   "pri_01kmnabym9jdxvq8my0yr5a6n3",
  },
}

// ---------------------------------------------------------------------------
// Planes UI
// ---------------------------------------------------------------------------
const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    descripcion: "Para community managers que están comenzando",
    mensual: { precio: 6.99 },
    anual:   { precio: 67, ahorro: "20%" },
    color: "border-border",
    badge: null,
    features: [
      { included: true,  text: "Planner y Calendario" },
      { included: true,  text: "Organizador de Feed" },
      { included: true,  text: "Recordatorios" },
      { included: true,  text: "Carpetas (5 GB)" },
      { included: true,  text: "Hasta 3 miembros de equipo" },
      { included: true,  text: "Cotizaciones" },
      { included: true,  text: "Contabilidad" },
      { included: false, text: "Descarga de PDF" },
      { included: false, text: "Strat AI" },
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    descripcion: "Para profesionales que quieren todas las herramientas",
    mensual: { precio: 11.99 },
    anual:   { precio: 115, ahorro: "20%" },
    color: "border-primary/50",
    badge: "Más popular",
    features: [
      { included: true, text: "Todo lo del plan Básico" },
      { included: true, text: "Cotizaciones ilimitadas + PDF" },
      { included: true, text: "Contabilidad completa + reportes" },
      { included: true, text: "Strat AI integrada" },
      { included: true, text: "Miembros ilimitados" },
      { included: true, text: "20 GB de almacenamiento" },
      { included: true, text: "Soporte prioritario" },
      { included: true, text: "Nuevas funciones primero" },
    ],
  },
]

// ---------------------------------------------------------------------------
// Botón de suscripción Paddle por plan
// ---------------------------------------------------------------------------
const PlanPaddleButton = ({ planId, planNombre, billing, uid, userEmail }) => {
  const navigate = useNavigate()
  const { ready, openCheckout } = usePaddle()
  const [loading, setLoading] = useState(false)

  const handleCheckout = () => {
    if (!ready) return
    setLoading(true)

    const priceId = PADDLE_PRICES[planId][billing]

    openCheckout({
      priceId,
      email:  userEmail,
      userId: uid,
      onSuccess: async (data) => {
        try {
          await setDoc(
            doc(db, "users", uid),
            {
              plan:               planId,
              ciclo:              billing,
              subscriptionID:     data?.subscription?.id || data?.transaction?.id || null,
              subscriptionStatus: "active",
              subscriptionDate:   new Date(),
              paymentProvider:    "paddle",
            },
            { merge: true }
          )
          invalidateSubscriptionCache()
          toast.success(`¡Suscripción activada! Bienvenido al plan ${planNombre} 🎉`)
          setTimeout(() => navigate("/dashboard"), 2000)
        } catch (err) {
          console.error("[Paddle] Error guardando suscripción:", err)
          toast.error("Pago procesado. Contacta soporte si no se activa tu cuenta.")
        } finally {
          setLoading(false)
        }
      },
      onError: (data) => {
        console.error("[Paddle] Error en checkout:", data)
        toast.error("Error al procesar el pago. Revisa la consola para más detalles.")
        setLoading(false)
      },
      onClose: () => {
        setLoading(false)
      },
    })
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={!ready || loading}
      className={`mt-4 w-full py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
        ready && !loading
          ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/30"
          : "bg-border/40 text-text-muted cursor-not-allowed"
      }`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Abriendo checkout…
        </>
      ) : !ready ? (
        "Cargando…"
      ) : (
        `Suscribirse — ${billing === "mensual" ? "mensual" : "anual"}`
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Sección de suscripción activa
// ---------------------------------------------------------------------------
const ActiveSubscription = ({ subData, onCancelScheduled }) => {
  const [cancelling, setCancelling]     = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const planLabel  = subData.plan  === "pro"   ? "Pro"    : "Básico"
  const cicloLabel = subData.ciclo === "anual" ? "Anual"  : "Mensual"
  const isScheduled = !!subData.cancellationScheduled

  const handleCancel = async () => {
    setCancelling(true)
    setShowConfirm(false)
    try {
      const cancelFn = httpsCallable(getFunctions(), "cancelPaddleSubscription")
      await cancelFn({ subscriptionID: subData.subscriptionID })
      toast.success("Cancelación programada. Seguirás teniendo acceso hasta fin del período.")
      onCancelScheduled()
    } catch (err) {
      console.error(err)
      toast.error(err?.message || "No se pudo cancelar. Inténtalo más tarde.")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto bg-bg-card border-2 border-primary/40 rounded-2xl p-6 text-center space-y-4">
        <span className="text-4xl">{isScheduled ? "⏳" : "🎉"}</span>
        <h2 className="text-text-main font-bold text-xl">Plan {planLabel} {isScheduled ? "" : "activo"}</h2>
        <p className="text-text-muted text-sm">
          Ciclo: <span className="text-primary-light font-medium">{cicloLabel}</span>
        </p>

        {/* Aviso de cancelación programada */}
        {isScheduled && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-left">
            <p className="text-yellow-400 text-xs font-medium">Cancelación programada</p>
            <p className="text-text-muted text-xs mt-1">
              Tu acceso se mantiene activo hasta el final del período pagado. No se renovará automáticamente.
            </p>
          </div>
        )}

        {subData.subscriptionID && (
          <p className="text-text-muted/60 text-xs break-all">ID: {subData.subscriptionID}</p>
        )}

        {!isScheduled && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={cancelling}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition disabled:opacity-50"
          >
            {cancelling ? "Cancelando…" : "Cancelar suscripción"}
          </button>
        )}
      </div>

      {/* Modal de confirmación (reemplaza window.confirm que no funciona en Capacitor) */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-text-main font-bold text-lg">¿Cancelar suscripción?</h3>
            <p className="text-text-muted text-sm">
              Seguirás teniendo acceso hasta el final del período pagado. No se aplican reembolsos parciales.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border text-text-muted bg-bg-hover hover:bg-border/40 transition"
              >
                Mantener plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition disabled:opacity-50"
              >
                {cancelling ? "Cancelando…" : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const Subscription = () => {
  const { user }                          = useAuth()
  const { status, daysLeft }              = useSubscriptionGuard()
  const [billing, setBilling]             = useState("mensual")
  const [subData, setSubData]             = useState(null)
  const [loadingSub, setLoadingSub]       = useState(true)

  // Precarga Paddle en cuanto se monta la página (no bloquea la UI)
  usePaddle()

  const fetchSubData = () => {
    if (!user?.uid) { setLoadingSub(false); return }
    setLoadingSub(true)
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data()
          // Mostrar tarjeta activa también si la cancelación está programada
          if (data.subscriptionStatus === "active") setSubData(data)
          else setSubData(null)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSub(false))
  }

  useEffect(() => { fetchSubData() }, [user])

  return (
    <DashboardLayout>
      {/* Encabezado */}
      <div className="mb-6 text-center px-2">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main">Planes y Precios 💳</h1>
        <p className="text-text-muted text-sm mt-2">Empieza gratis 7 días. Cancela cuando quieras.</p>
      </div>

      {/* Banner de trial */}
      {status === "trial" && (
        <div
          className={`max-w-3xl mx-auto mb-6 px-4 py-3 rounded-xl border flex items-center gap-3 ${
            daysLeft <= 2
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          }`}
        >
          <span className="text-xl flex-shrink-0">{daysLeft <= 2 ? "🚨" : "⏳"}</span>
          <p className="text-sm font-medium">
            {daysLeft > 0
              ? `Te quedan ${daysLeft} día${daysLeft !== 1 ? "s" : ""} de prueba gratis. Suscríbete ahora para no perder el acceso.`
              : "Tu período de prueba ha terminado. Elige un plan para continuar."}
          </p>
        </div>
      )}

      {/* Estado de carga */}
      {loadingSub ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-border border-t-primary animate-spin opacity-60" />
        </div>
      ) : subData ? (
        /* Usuario ya suscrito (activo o con cancelación programada) */
        <ActiveSubscription
          subData={subData}
          onCancelScheduled={() => {
            invalidateSubscriptionCache()
            fetchSubData()
          }}
        />
      ) : (
        <>
          {/* Toggle mensual / anual */}
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

          {/* Cards de planes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-8">
            {PLANES.map((plan) => {
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
                      <p className="text-green-400 text-xs mt-1">
                        Ahorra {plan.anual.ahorro} vs mensual
                      </p>
                    )}
                    <p className="text-text-muted/60 text-xs mt-1">
                      7 días gratis · {plan.id === "basico" ? "5 GB" : "20 GB"} almacenamiento
                    </p>
                  </div>

                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`text-sm flex items-center gap-2 ${f.included ? "text-text-muted" : "text-text-muted/40"}`}>
                        {f.included
                          ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                          : <XCircle size={14} className="text-text-muted/30 flex-shrink-0" />
                        }
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <PlanPaddleButton
                    planId={plan.id}
                    planNombre={plan.nombre}
                    billing={billing}
                    uid={user?.uid}
                    userEmail={user?.email}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Garantía y trust badges */}
      <div className="max-w-3xl mx-auto mt-2">
        <div className="bg-bg-card border border-border rounded-2xl p-5 text-center">
          <span className="text-3xl mb-3 block">🛡️</span>
          <h3 className="text-text-main font-semibold mb-2">Garantía de 30 días</h3>
          <p className="text-text-muted text-sm">
            Si no estás satisfecho en los primeros 30 días, te devolvemos el dinero sin preguntas.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { icon: <ShieldCheck size={20} className="text-green-400" />, text: "Pago seguro con SSL" },
            { icon: <X size={20} className="text-primary-light" />,       text: "Cancela cuando quieras" },
            { icon: <Globe size={20} className="text-blue-400" />,        text: "Tarjetas internacionales" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center"
            >
              <span className="flex justify-center mb-1">{item.icon}</span>
              <p className="text-text-muted text-[10px] sm:text-xs">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Subscription
