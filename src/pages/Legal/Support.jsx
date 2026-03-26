import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, ChevronDown, ChevronUp, Mail } from "lucide-react"

const faqs = [
  {
    category: "🚀 Primeros pasos",
    items: [
      {
        q: "¿Cómo empiezo a usar Stratega Planner?",
        a: "Crea una cuenta gratuita en strategaplanner.app. Tienes 7 días de prueba con acceso completo a todas las funciones. No se requiere tarjeta de crédito para el período de prueba.",
      },
      {
        q: "¿Qué incluye la prueba gratuita de 7 días?",
        a: "La prueba incluye acceso completo a todas las funciones del plan que elijas: planner, calendario, organizador de feed, recordatorios, carpetas, cotizaciones, contabilidad, equipo y Strat AI. Sin restricciones.",
      },
      {
        q: "¿Necesito instalar algo?",
        a: "Stratega Planner funciona directamente desde el navegador web. También disponemos de app nativa para Android e iOS que puedes descargar desde las tiendas oficiales. Ambas versiones sincronizan tus datos en tiempo real.",
      },
      {
        q: "¿Puedo usar Stratega Planner sin conexión a internet?",
        a: "Sí, parcialmente. La app guarda en caché tus datos recientes para que puedas consultar y editar contenido sin conexión. Los cambios se sincronizan automáticamente cuando vuelves a conectarte.",
      },
      {
        q: "¿Cuántos dispositivos puedo usar simultáneamente?",
        a: "Puedes acceder a tu cuenta desde todos los dispositivos que necesites. Los cambios se sincronizan en tiempo real entre todos ellos.",
      },
    ],
  },
  {
    category: "💳 Suscripción y Pagos",
    items: [
      {
        q: "¿Cuáles son los planes disponibles?",
        a: "Ofrecemos dos planes: Básico ($6.99/mes o $67/año) y Pro ($11.99/mes o $115/año). El plan anual incluye un ahorro del 20%. Puedes ver las diferencias en detalle en la página de Suscripción.",
      },
      {
        q: "¿Cómo proceso mi pago?",
        a: "Los pagos se realizan de forma segura a través de PayPal. Puedes pagar con tu saldo de PayPal, tarjeta de crédito/débito o cualquier método disponible en tu cuenta de PayPal.",
      },
      {
        q: "¿Mi suscripción se renueva automáticamente?",
        a: "Sí, las suscripciones se renuevan automáticamente al final de cada período. PayPal te enviará un aviso antes de cada cobro. Puedes cancelar en cualquier momento desde la app.",
      },
      {
        q: "¿Cómo cancelo mi suscripción?",
        a: "Ve a Configuración → Suscripción → Cancelar suscripción. La cancelación es inmediata y conservas el acceso hasta el final del período pagado. No se realizan cargos adicionales.",
      },
      {
        q: "¿Tienen garantía de devolución?",
        a: "Sí. Ofrecemos garantía de devolución de 30 días en tu primera suscripción paga. Si no estás satisfecho, contáctanos a strategaplanner@gmail.com dentro de ese plazo y te reembolsamos el importe completo.",
      },
      {
        q: "¿Puedo cambiar de plan mensual a anual o de Básico a Pro?",
        a: "Sí. Para cambiar de plan, cancela tu suscripción actual y activa el nuevo plan desde la página de Suscripción. El acceso con tu plan anterior se mantiene hasta que expire el período pagado.",
      },
      {
        q: "¿Qué pasa con mis datos si cancelo?",
        a: "Tus datos permanecen guardados durante 30 días tras la cancelación. Si reactivas tu suscripción en ese período, recuperas todo. Después de 30 días, los datos se eliminan permanentemente.",
      },
    ],
  },
  {
    category: "🛠️ Funcionalidades",
    items: [
      {
        q: "¿Qué es el Planner y para qué sirve?",
        a: "El Planner es un calendario de contenido donde puedes organizar todas tus publicaciones por fecha, red social, cliente y estado. Incluye vista mensual, semanal y lista para adaptarse a tu flujo de trabajo.",
      },
      {
        q: "¿Puedo gestionar varios clientes o marcas?",
        a: "Sí. Puedes organizar tu trabajo por clientes o proyectos usando etiquetas, carpetas y filtros. En el plan Pro puedes agregar miembros del equipo para colaborar.",
      },
      {
        q: "¿Cómo funciona Strat AI?",
        a: "Strat AI (disponible en Plan Pro) es un asistente de inteligencia artificial que te ayuda a generar ideas de contenido, redactar copys para redes sociales, crear hashtags y analizar tendencias. Está integrado directamente en tu flujo de trabajo.",
      },
      {
        q: "¿Puedo generar cotizaciones en PDF?",
        a: "Sí, en el Plan Pro puedes crear cotizaciones profesionales con tu branding y exportarlas en PDF para enviar a tus clientes. El Plan Básico no incluye esta función.",
      },
      {
        q: "¿Qué capacidad de almacenamiento tengo?",
        a: "El Plan Básico incluye 5GB de almacenamiento para carpetas y archivos. El Plan Pro incluye 20GB.",
      },
      {
        q: "¿Los recordatorios funcionan cuando la app está cerrada?",
        a: "Sí. Utilizamos notificaciones push del sistema (a través de Firebase Cloud Messaging) para enviarte recordatorios incluso cuando la app está cerrada o en segundo plano. Debes otorgar permiso de notificaciones en tu dispositivo.",
      },
    ],
  },
  {
    category: "🔒 Cuenta y Seguridad",
    items: [
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Ve a Configuración → Cuenta → Cambiar contraseña. Si iniciaste sesión con Google o Facebook, la contraseña se gestiona desde esas plataformas. También puedes usar la opción '¿Olvidaste tu contraseña?' en la pantalla de inicio de sesión.",
      },
      {
        q: "¿Cómo elimino mi cuenta?",
        a: "Ve a Configuración → Cuenta → Eliminar cuenta. Esta acción es irreversible: elimina permanentemente tu cuenta y todos tus datos. Si tienes una suscripción activa, cancélala primero desde la sección de Suscripción.",
      },
      {
        q: "¿Mis datos están seguros?",
        a: "Sí. Usamos Google Firebase para el almacenamiento, que cuenta con certificaciones ISO 27001 y SOC 2. Todos los datos se transmiten cifrados (TLS) y se almacenan con cifrado en reposo. Consulta nuestra Política de Privacidad para más detalles.",
      },
      {
        q: "¿Puedo exportar mis datos?",
        a: "Sí. Puedes solicitar una exportación de todos tus datos escribiendo a strategaplanner@gmail.com. Procesamos la solicitud en un plazo máximo de 30 días.",
      },
    ],
  },
  {
    category: "📱 App Móvil",
    items: [
      {
        q: "¿En qué sistemas operativos está disponible la app?",
        a: "Stratega Planner está disponible para iOS (iPhone/iPad) y Android. También funciona como Progressive Web App (PWA) en cualquier navegador moderno.",
      },
      {
        q: "¿La app móvil es gratuita?",
        a: "Descargar la app es gratuito. El acceso a las funciones requiere la misma suscripción que la versión web. Tu cuenta funciona en todas las plataformas simultáneamente.",
      },
      {
        q: "La app se cierra o no carga. ¿Qué hago?",
        a: "Prueba los siguientes pasos: (1) Cierra y vuelve a abrir la app. (2) Revisa tu conexión a internet. (3) Limpia la caché de la app en los ajustes de tu dispositivo. (4) Desinstala y vuelve a instalar la app. Si el problema persiste, contáctanos con detalles del dispositivo y versión del sistema operativo.",
      },
    ],
  },
]

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left bg-bg-card hover:bg-bg-hover transition"
      >
        <span className="text-sm font-medium text-text-main">{q}</span>
        <span className="flex-shrink-0 text-text-muted">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="px-4 py-3.5 text-sm text-text-muted leading-relaxed bg-bg-main border-t border-border">
          {a}
        </div>
      )}
    </div>
  )
}

const Support = () => {
  const navigate = useNavigate()

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
          <p className="text-primary-light text-xs font-semibold uppercase tracking-widest mb-2">Ayuda</p>
          <h1 className="text-3xl font-extrabold text-text-main mb-2">Centro de Soporte</h1>
          <p className="text-text-muted text-sm">Encuentra respuestas rápidas a las preguntas más frecuentes.</p>
        </div>

        {/* Contact card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-primary-light" />
          </div>
          <div className="flex-1">
            <p className="text-text-main font-semibold text-sm">¿No encuentras lo que buscas?</p>
            <p className="text-text-muted text-xs mt-0.5">Nuestro equipo responde en menos de 24 horas en días hábiles.</p>
          </div>
          <a
            href="mailto:strategaplanner@gmail.com"
            className="flex-shrink-0 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-light transition"
          >
            Escribir al soporte
          </a>
        </div>

        {/* FAQ sections */}
        <div className="space-y-10">
          {faqs.map(section => (
            <div key={section.category}>
              <h2 className="text-sm font-bold text-text-main mb-4">{section.category}</h2>
              <div className="space-y-2">
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-text-main font-semibold mb-1">¿Sigues necesitando ayuda?</p>
          <p className="text-text-muted text-sm mb-4">
            Escríbenos directamente y te ayudamos a resolver cualquier problema.
          </p>
          <a
            href="mailto:strategaplanner@gmail.com?subject=Soporte Stratega Planner"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/20"
          >
            <Mail size={15} />
            strategaplanner@gmail.com
          </a>
          <p className="text-text-muted/50 text-xs mt-3">Tiempo de respuesta: menos de 24 h en días hábiles</p>
        </div>

        {/* Footer nav */}
        <div className="border-t border-border pt-8 mt-8 flex flex-wrap gap-4 text-xs text-text-muted">
          <Link to="/terms" className="hover:text-primary-light transition">Términos de Servicio</Link>
          <Link to="/privacy" className="hover:text-primary-light transition">Política de Privacidad</Link>
          <Link to="/contact" className="hover:text-primary-light transition">Contacto</Link>
        </div>
      </div>
    </div>
  )
}

export default Support
