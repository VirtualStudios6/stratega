import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-base font-bold text-text-main mb-3 pb-2 border-b border-border">{title}</h2>
    <div className="space-y-3 text-sm text-text-muted leading-relaxed">{children}</div>
  </div>
)

const Refunds = () => {
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
          <h1 className="text-3xl font-extrabold text-text-main mb-2">Política de Reembolsos</h1>
          <p className="text-text-muted text-sm">Última actualización: 25 de marzo de 2026 · Versión 1.0</p>
        </div>

        {/* Garantía destacada */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-10 flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">🛡️</span>
          <div>
            <p className="text-text-main font-bold text-sm mb-1">Garantía de devolución de 30 días</p>
            <p className="text-text-muted text-sm leading-relaxed">
              Si no estás satisfecho con Stratega Planner dentro de los primeros 30 días desde tu primera suscripción paga, te devolvemos el importe completo sin preguntas y sin complicaciones.
            </p>
          </div>
        </div>

        <Section title="1. Período de Prueba Gratuita">
          <p>Todos los usuarios nuevos tienen acceso a <strong className="text-text-main">7 días de prueba gratuita</strong> con todas las funciones disponibles. Durante este período no se realiza ningún cargo.</p>
          <p>La prueba no requiere tarjeta de crédito. Al finalizar los 7 días, el acceso se restringe hasta que el usuario elija y active un plan de forma voluntaria. Por tanto, no aplican reembolsos por el período de prueba ya que este es completamente gratuito.</p>
        </Section>

        <Section title="2. Garantía de Satisfacción de 30 Días">
          <p>Ofrecemos una garantía de devolución del 100% del importe pagado en tu <strong className="text-text-main">primera suscripción paga</strong>, siempre que:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>La solicitud se realice dentro de los <strong className="text-text-main">30 días calendario</strong> desde la fecha del primer cobro</li>
            <li>Sea la primera vez que contratas un plan de pago en Stratega Planner</li>
            <li>Envíes la solicitud desde el correo registrado en tu cuenta</li>
          </ul>
          <p>No pedimos justificaciones. Si el servicio no cumplió tus expectativas, te reembolsamos sin preguntas.</p>
        </Section>

        <Section title="3. Reembolsos Fuera del Período de Garantía">
          <p>Pasados los 30 días de garantía, <strong className="text-text-main">no se realizan reembolsos</strong> por los siguientes conceptos:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Períodos de suscripción ya iniciados (mensual o anual)</li>
            <li>Tiempo no utilizado de un período activo tras la cancelación</li>
            <li>Renovaciones automáticas ya procesadas</li>
            <li>Cambios de planes dentro del mismo período</li>
          </ul>
          <p>Al cancelar tu suscripción, conservas el acceso completo hasta el final del período ya pagado. No se generan cargos adicionales tras la cancelación.</p>
        </Section>

        <Section title="4. Excepciones y Casos Especiales">
          <p>Evaluaremos reembolsos fuera del período de garantía estándar en las siguientes situaciones excepcionales:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-text-main">Cobro duplicado o error técnico:</strong> Si se procesó un cobro incorrecto o duplicado por un error de nuestra plataforma, realizaremos el reembolso completo en todos los casos.</li>
            <li><strong className="text-text-main">Interrupción prolongada del servicio:</strong> Si el servicio estuvo inaccesible por más de 72 horas consecutivas por causas imputables a Stratega Planner, evaluaremos una compensación proporcional.</li>
            <li><strong className="text-text-main">Renovación no deseada:</strong> Si no recibiste el aviso previo de renovación y contactas dentro de los 7 días siguientes al cargo, estudiaremos tu caso.</li>
            <li><strong className="text-text-main">Fallecimiento o incapacidad grave:</strong> Gestionaremos la cancelación y reembolso proporcional previa acreditación.</li>
          </ul>
          <p>Cada caso excepcional se evalúa individualmente. Escríbenos a <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline">strategaplanner@gmail.com</a> con los detalles.</p>
        </Section>

        <Section title="5. Cómo Solicitar un Reembolso">
          <p>El proceso es sencillo:</p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>Envía un correo a <a href="mailto:strategaplanner@gmail.com?subject=Solicitud de reembolso - Stratega Planner" className="text-primary-light hover:underline">strategaplanner@gmail.com</a> con el asunto: <em>"Solicitud de reembolso"</em></li>
            <li>Incluye el correo electrónico asociado a tu cuenta de Stratega Planner</li>
            <li>Indica el ID de suscripción de PayPal si lo tienes disponible (opcional)</li>
            <li>Recibirás confirmación de la solicitud en menos de 24 horas hábiles</li>
            <li>El reembolso se procesa en PayPal en un plazo de <strong className="text-text-main">5 a 10 días hábiles</strong></li>
          </ol>
        </Section>

        <Section title="6. Procesamiento del Reembolso">
          <p>Los reembolsos se realizan a través de <strong className="text-text-main">PayPal</strong>, el mismo método utilizado para el cobro original.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>El importe se acredita en tu cuenta de PayPal o en la tarjeta original según la configuración de tu cuenta</li>
            <li>El plazo de acreditación puede variar entre 5 y 10 días hábiles dependiendo de tu entidad bancaria</li>
            <li>No se aplican penalizaciones, comisiones ni cargos por la devolución</li>
            <li>Recibirás un correo de confirmación cuando el reembolso sea procesado</li>
          </ul>
        </Section>

        <Section title="7. Cancelación de la Suscripción">
          <p>Cancelar tu suscripción es diferente a solicitar un reembolso:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>La cancelación detiene las renovaciones futuras pero <strong className="text-text-main">no genera un reembolso automático</strong></li>
            <li>Puedes cancelar en cualquier momento desde la app: <em>Suscripción → Cancelar suscripción</em></li>
            <li>Tras cancelar, el acceso se mantiene hasta el final del período pagado</li>
            <li>Si además deseas un reembolso, debes solicitarlo expresamente siguiendo el proceso del punto 5</li>
          </ul>
        </Section>

        <Section title="8. Derecho de Desistimiento (Usuarios de la UE)">
          <p>Si eres residente en la Unión Europea, tienes derecho a desistir del contrato en un plazo de <strong className="text-text-main">14 días naturales</strong> desde la contratación, conforme a la Directiva 2011/83/UE sobre derechos de los consumidores.</p>
          <p>Para ejercer este derecho antes de que hayan transcurrido los 14 días, contáctanos a <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline">strategaplanner@gmail.com</a> indicando tu deseo de desistir del contrato. Ten en cuenta que si solicitaste expresamente el inicio inmediato del servicio, el reembolso puede ser proporcional al uso realizado.</p>
          <p>Nuestra garantía de 30 días es más amplia que el mínimo legal exigido, por lo que en la mayoría de los casos cubre y supera los requisitos de la normativa europea.</p>
        </Section>

        <Section title="9. Contacto">
          <p>Para cualquier consulta sobre esta política o para iniciar una solicitud de reembolso:</p>
          <div className="bg-bg-card border border-border rounded-xl p-4 mt-3 space-y-1">
            <p><strong className="text-text-main">Email:</strong>{" "}
              <a href="mailto:strategaplanner@gmail.com?subject=Solicitud de reembolso - Stratega Planner" className="text-primary-light hover:underline">
                strategaplanner@gmail.com
              </a>
            </p>
            <p><strong className="text-text-main">Tiempo de respuesta:</strong> Menos de 24 horas en días hábiles</p>
            <p><strong className="text-text-main">Soporte:</strong>{" "}
              <Link to="/support" className="text-primary-light hover:underline">Centro de Ayuda</Link>
            </p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-border pt-8 mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
          <Link to="/terms" className="hover:text-primary-light transition">Términos de Servicio</Link>
          <Link to="/privacy" className="hover:text-primary-light transition">Política de Privacidad</Link>
          <Link to="/support" className="hover:text-primary-light transition">Centro de Ayuda</Link>
          <Link to="/contact" className="hover:text-primary-light transition">Contacto</Link>
        </div>
      </div>
    </div>
  )
}

export default Refunds
