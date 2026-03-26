import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-base font-bold text-text-main mb-3 pb-2 border-b border-border">{title}</h2>
    <div className="space-y-3 text-sm text-text-muted leading-relaxed">{children}</div>
  </div>
)

const Terms = () => {
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
          <p className="text-primary-light text-xs font-semibold uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-extrabold text-text-main mb-2">Términos de Servicio</h1>
          <p className="text-text-muted text-sm">Última actualización: 25 de marzo de 2026 · Versión 2.0</p>
        </div>

        {/* Intro */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-10 text-sm text-text-muted leading-relaxed">
          Por favor, lee estos Términos de Servicio detenidamente antes de usar Stratega Planner. Al acceder o utilizar nuestros servicios, confirmas que has leído, entendido y aceptado quedar vinculado por estos términos.
        </div>

        <Section title="1. Descripción del Servicio">
          <p>Stratega Planner es una plataforma de gestión para community managers y agencias de marketing digital que ofrece herramientas de planificación de contenido, organización de feed, recordatorios, gestión de carpetas, cotizaciones, contabilidad y asistencia con inteligencia artificial.</p>
          <p>El servicio se presta mediante suscripción mensual o anual. Ofrecemos un período de prueba gratuito de 7 días para nuevos usuarios.</p>
        </Section>

        <Section title="2. Aceptación de los Términos">
          <p>Al crear una cuenta, acceder o usar cualquier función de Stratega Planner, aceptas estos Términos de Servicio y nuestra Política de Privacidad. Si no estás de acuerdo con alguna parte, no debes usar el servicio.</p>
          <p>Si usas Stratega Planner en nombre de una empresa u organización, declaras que tienes autoridad para vincular a dicha entidad a estos términos.</p>
        </Section>

        <Section title="3. Registro y Seguridad de la Cuenta">
          <p>Para usar Stratega Planner debes crear una cuenta proporcionando información verídica, precisa y completa. Puedes registrarte con correo electrónico y contraseña, o mediante Google o Facebook.</p>
          <p>Eres el único responsable de:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Mantener la confidencialidad de tus credenciales de acceso</li>
            <li>Todas las actividades que ocurran bajo tu cuenta</li>
            <li>Notificarnos de inmediato ante cualquier uso no autorizado a <span className="text-primary-light">strategaplanner@gmail.com</span></li>
          </ul>
          <p>No debes compartir tu cuenta con terceros ni crear cuentas múltiples para eludir restricciones del servicio.</p>
        </Section>

        <Section title="4. Período de Prueba Gratuita">
          <p>Los nuevos usuarios tienen acceso a todas las funciones del servicio de forma gratuita durante 7 días calendario desde la fecha de registro.</p>
          <p>Al finalizar el período de prueba, el acceso se restringirá hasta que elijas y actives un plan de suscripción. No realizamos cargos automáticos al terminar la prueba; la suscripción requiere acción explícita del usuario.</p>
        </Section>

        <Section title="5. Planes de Suscripción y Facturación">
          <p>Stratega Planner ofrece los siguientes planes pagos:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-text-main">Plan Básico Mensual:</strong> $6.99 USD/mes</li>
            <li><strong className="text-text-main">Plan Básico Anual:</strong> $67.00 USD/año (ahorro del 20%)</li>
            <li><strong className="text-text-main">Plan Pro Mensual:</strong> $11.99 USD/mes</li>
            <li><strong className="text-text-main">Plan Pro Anual:</strong> $115.00 USD/año (ahorro del 20%)</li>
          </ul>
          <p className="mt-2">Los pagos se procesan a través de <strong className="text-text-main">PayPal</strong>, plataforma segura y certificada internacionalmente. Al suscribirte, autorizas a PayPal a cobrar el importe correspondiente de manera recurrente según el ciclo elegido.</p>
          <p>Los precios están expresados en dólares estadounidenses (USD) e incluyen los impuestos aplicables en tu jurisdicción donde sea requerido por ley.</p>
        </Section>

        <Section title="6. Cancelación y Reembolsos">
          <p>Puedes cancelar tu suscripción en cualquier momento desde el panel de Suscripción dentro de la aplicación. La cancelación es inmediata en nuestra plataforma; el acceso a funciones premium se mantiene hasta el fin del período ya pagado.</p>
          <p><strong className="text-text-main">Garantía de 30 días:</strong> Si cancelas dentro de los primeros 30 días desde tu primera suscripción paga y no estás satisfecho con el servicio, te reembolsamos el importe completo sin preguntas. Contacta a <span className="text-primary-light">strategaplanner@gmail.com</span> para solicitarlo.</p>
          <p>Después de los 30 días, no se realizan reembolsos por períodos parciales de suscripción, excepto cuando lo requiera la legislación aplicable.</p>
        </Section>

        <Section title="7. Uso Aceptable">
          <p>Aceptas no usar Stratega Planner para:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Actividades ilegales o que violen leyes locales, nacionales o internacionales</li>
            <li>Infringir derechos de propiedad intelectual de terceros</li>
            <li>Distribuir contenido malicioso, spam o engañoso</li>
            <li>Intentar acceder sin autorización a sistemas, datos o cuentas de otros usuarios</li>
            <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente del servicio</li>
            <li>Revender, sublicenciar o explotar comercialmente el servicio sin autorización expresa</li>
          </ul>
          <p>Nos reservamos el derecho de suspender o cancelar cuentas que violen estas condiciones sin previo aviso y sin derecho a reembolso.</p>
        </Section>

        <Section title="8. Propiedad Intelectual">
          <p><strong className="text-text-main">Nuestro contenido:</strong> Stratega Planner, incluyendo su nombre, logo, diseño, código, textos y todas las funcionalidades, es propiedad exclusiva de Virtual Studios y está protegido por leyes de derechos de autor, marcas registradas y otras leyes de propiedad intelectual.</p>
          <p><strong className="text-text-main">Tu contenido:</strong> Retienes todos los derechos sobre el contenido que creas y almacenas en Stratega Planner (planes, textos, imágenes, cotizaciones). Nos otorgas una licencia limitada, no exclusiva y revocable para almacenar y procesar dicho contenido únicamente con el fin de prestar el servicio.</p>
        </Section>

        <Section title="9. Privacidad y Protección de Datos">
          <p>El tratamiento de tus datos personales está regido por nuestra <Link to="/privacy" className="text-primary-light hover:underline">Política de Privacidad</Link>, que forma parte integral de estos Términos. Al usar el servicio, consientes el tratamiento de tus datos conforme a dicha política.</p>
        </Section>

        <Section title="10. Disponibilidad y Modificaciones del Servicio">
          <p>Nos esforzamos por mantener Stratega Planner disponible las 24 horas del día. Sin embargo, no garantizamos una disponibilidad ininterrumpida. Podemos realizar mantenimientos programados notificando con antelación razonable.</p>
          <p>Nos reservamos el derecho de modificar, suspender o descontinuar funcionalidades del servicio con 30 días de aviso previo a los usuarios activos.</p>
        </Section>

        <Section title="11. Limitación de Responsabilidad">
          <p>Stratega Planner se proporciona "tal cual" sin garantías de ningún tipo. En la máxima medida permitida por la ley aplicable:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>No somos responsables por pérdida de datos, lucro cesante o daños indirectos derivados del uso del servicio</li>
            <li>Nuestra responsabilidad total ante cualquier reclamación no superará el importe pagado por el usuario en los últimos 3 meses</li>
            <li>No garantizamos que el servicio satisfaga todos tus requisitos específicos de negocio</li>
          </ul>
        </Section>

        <Section title="12. Cambios en los Términos">
          <p>Podemos actualizar estos Términos ocasionalmente. Cuando lo hagamos, actualizaremos la fecha indicada en la parte superior de este documento y te notificaremos por correo electrónico con al menos 15 días de antelación ante cambios materiales.</p>
          <p>El uso continuado del servicio tras la notificación constituye aceptación de los nuevos términos.</p>
        </Section>

        <Section title="13. Ley Aplicable y Resolución de Conflictos">
          <p>Estos Términos se rigen por las leyes aplicables en el domicilio del prestador del servicio. Ante cualquier disputa, las partes se comprometen a buscar primero una resolución amistosa mediante comunicación directa. Si no se alcanza acuerdo, se someterán a la jurisdicción de los tribunales competentes.</p>
        </Section>

        <Section title="14. Contacto">
          <p>Si tienes preguntas, comentarios o reclamaciones sobre estos Términos, contáctanos:</p>
          <div className="bg-bg-card border border-border rounded-xl p-4 mt-3 space-y-1">
            <p><strong className="text-text-main">Producto:</strong> Stratega Planner</p>
            <p><strong className="text-text-main">Empresa:</strong> Virtual Studios</p>
            <p><strong className="text-text-main">Email:</strong>{" "}
              <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline">
                strategaplanner@gmail.com
              </a>
            </p>
            <p><strong className="text-text-main">Soporte:</strong>{" "}
              <Link to="/support" className="text-primary-light hover:underline">Centro de Ayuda</Link>
            </p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-border pt-8 mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
          <Link to="/privacy" className="hover:text-primary-light transition">Política de Privacidad</Link>
          <Link to="/refunds" className="hover:text-primary-light transition">Política de Reembolsos</Link>
          <Link to="/support" className="hover:text-primary-light transition">Centro de Ayuda</Link>
          <Link to="/contact" className="hover:text-primary-light transition">Contacto</Link>
        </div>
      </div>
    </div>
  )
}

export default Terms
