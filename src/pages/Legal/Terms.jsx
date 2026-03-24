import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Terms = () => {
  const navigate = useNavigate()
  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#F5F5FA",
      minHeight: "100vh",
      padding: "60px 20px",
      color: "#12122A",
    }}>
      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#7878A0", fontSize: 13, marginBottom: 40, padding: 0,
          }}
        >
          <ArrowLeft size={15} /> Volver
        </button>

        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Términos de Servicio
        </h1>
        <p style={{ color: "#7878A0", fontSize: 13, marginBottom: 40 }}>Última actualización: marzo 2026</p>

        {[
          ["1. Aceptación", "Al acceder y usar Stratega Planner aceptas estos términos. Si no estás de acuerdo, no uses el servicio."],
          ["2. Uso del servicio", "Stratega Planner está diseñado para community managers y agencias de marketing digital. No puedes usar el servicio para actividades ilegales o que violen derechos de terceros."],
          ["3. Cuentas", "Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Notifica de inmediato cualquier uso no autorizado."],
          ["4. Suscripciones y pagos", "Los planes de suscripción se cobran según el ciclo elegido (mensual o anual). Los pagos se procesan a través de Lemon Squeezy. Puedes cancelar en cualquier momento."],
          ["5. Prueba gratuita", "Ofrecemos 7 días de prueba gratis sin tarjeta de crédito. Al finalizar la prueba puedes elegir suscribirte o dejar de usar el servicio."],
          ["6. Datos y privacidad", "Tu información está protegida según nuestra Política de Privacidad. No vendemos tus datos a terceros."],
          ["7. Cambios", "Podemos actualizar estos términos. Te notificaremos de cambios importantes por correo electrónico."],
          ["8. Contacto", "Para cualquier consulta: ceovirtualstudios@gmail.com"],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
            <p style={{ fontSize: 14, color: "#4A4A6A", lineHeight: 1.75 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Terms
