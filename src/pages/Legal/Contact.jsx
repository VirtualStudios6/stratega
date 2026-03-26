import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Mail, MessageSquare, Clock, HelpCircle } from "lucide-react"

const SUBJECTS = [
  "Consulta sobre planes y precios",
  "Problema técnico con la app",
  "Cancelación o reembolso",
  "Reportar un error (bug)",
  "Sugerencia o mejora",
  "Solicitud de datos personales",
  "Colaboraciones o partnerships",
  "Otro",
]

const Contact = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const body = `Nombre: ${form.name}%0AEmail: ${form.email}%0AAsunto: ${form.subject}%0A%0AMensaje:%0A${encodeURIComponent(form.message)}`
    window.location.href = `mailto:strategaplanner@gmail.com?subject=${encodeURIComponent(`[Stratega Planner] ${form.subject}`)}&body=${body}`
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      <div className="max-w-2xl mx-auto px-5 py-12">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-main text-sm mb-10 transition"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        {/* Header */}
        <div className="mb-10">
          <p className="text-primary-light text-xs font-semibold uppercase tracking-widest mb-2">Contacto</p>
          <h1 className="text-3xl font-extrabold text-text-main mb-2">¿En qué podemos ayudarte?</h1>
          <p className="text-text-muted text-sm">
            Completa el formulario o escríbenos directamente. Respondemos en menos de 24 horas en días hábiles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {[
            { icon: <Clock size={16} />, title: "Respuesta rápida", desc: "Menos de 24 h en días hábiles" },
            { icon: <MessageSquare size={16} />, title: "Soporte real", desc: "Atención personalizada, sin bots" },
            { icon: <HelpCircle size={16} />, title: "Centro de ayuda", desc: <Link to="/support" className="text-primary-light hover:underline">Ver preguntas frecuentes</Link> },
          ].map(card => (
            <div key={card.title} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-primary-light mb-2">{card.icon}</div>
              <p className="text-text-main text-sm font-semibold">{card.title}</p>
              <p className="text-text-muted text-xs mt-0.5">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        {sent ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
            <span className="text-4xl block mb-4">✅</span>
            <h2 className="text-text-main font-bold text-lg mb-2">¡Mensaje enviado!</h2>
            <p className="text-text-muted text-sm mb-6">
              Se abrió tu cliente de correo con el mensaje listo. Si no se abrió automáticamente, escríbenos directamente a{" "}
              <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline">
                strategaplanner@gmail.com
              </a>
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-text-muted hover:text-text-main transition underline"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-text-main font-bold text-base mb-1">Enviar mensaje</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre"
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@email.com"
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                Asunto *
              </label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              >
                <option value="" disabled>Selecciona un asunto...</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                Mensaje *
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Describe tu consulta con el mayor detalle posible..."
                className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
              <p className="text-text-muted/60 text-xs">
                Al enviar aceptas nuestra{" "}
                <Link to="/privacy" className="text-primary-light hover:underline">Política de Privacidad</Link>.
              </p>
              <button
                type="submit"
                className="w-full sm:w-auto bg-primary text-white font-semibold px-8 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/20 text-sm"
              >
                Enviar mensaje →
              </button>
            </div>
          </form>
        )}

        {/* Direct contact */}
        <div className="mt-8 bg-bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-primary-light" />
          </div>
          <div className="flex-1">
            <p className="text-text-main font-semibold text-sm">Contacto directo</p>
            <p className="text-text-muted text-xs mt-0.5">
              También puedes escribirnos directamente a{" "}
              <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline font-medium">
                strategaplanner@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer nav */}
        <div className="border-t border-border pt-8 mt-8 flex flex-wrap gap-4 text-xs text-text-muted">
          <Link to="/terms" className="hover:text-primary-light transition">Términos de Servicio</Link>
          <Link to="/privacy" className="hover:text-primary-light transition">Política de Privacidad</Link>
          <Link to="/refunds" className="hover:text-primary-light transition">Política de Reembolsos</Link>
          <Link to="/support" className="hover:text-primary-light transition">Centro de Ayuda</Link>
        </div>
      </div>
    </div>
  )
}

export default Contact
