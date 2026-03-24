import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Privacy = () => {
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
          Política de Privacidad
        </h1>
        <p style={{ color: "#7878A0", fontSize: 13, marginBottom: 40 }}>Última actualización: marzo 2026</p>

        {[
          ["Datos que recopilamos", "Recopilamos los datos que proporcionas al crear tu cuenta (nombre, correo electrónico), el contenido que creas dentro de la app (eventos, notas, carpetas) y datos de uso para mejorar el servicio."],
          ["Cómo usamos tus datos", "Usamos tus datos exclusivamente para operar y mejorar Stratega Planner. No vendemos ni compartimos tu información con terceros salvo proveedores esenciales (Firebase/Google para autenticación y almacenamiento, Lemon Squeezy para pagos)."],
          ["Almacenamiento", "Tus datos se almacenan en Google Firebase, que cumple con estándares de seguridad internacionales (ISO 27001, SOC 2)."],
          ["Cookies", "Usamos cookies esenciales para mantener tu sesión activa. No usamos cookies de rastreo publicitario."],
          ["Tus derechos", "Puedes solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento desde Configuración → Cuenta → Eliminar cuenta."],
          ["Menores", "Stratega Planner no está dirigido a menores de 16 años. No recopilamos conscientemente datos de menores."],
          ["Cambios", "Te notificaremos por correo si realizamos cambios significativos en esta política."],
          ["Contacto", "Para consultas sobre privacidad: ceovirtualstudios@gmail.com"],
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

export default Privacy
