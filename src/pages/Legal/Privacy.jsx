import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-base font-bold text-text-main mb-3 pb-2 border-b border-border">{title}</h2>
    <div className="space-y-3 text-sm text-text-muted leading-relaxed">{children}</div>
  </div>
)

const Privacy = () => {
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
          <h1 className="text-3xl font-extrabold text-text-main mb-2">Política de Privacidad</h1>
          <p className="text-text-muted text-sm">Última actualización: 25 de marzo de 2026 · Versión 2.0</p>
        </div>

        {/* Intro */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-10 text-sm text-text-muted leading-relaxed">
          En Stratega Planner nos tomamos en serio tu privacidad. Esta política explica qué datos recopilamos, cómo los usamos, con quién los compartimos y cuáles son tus derechos. Te recomendamos leerla completa.
        </div>

        <Section title="1. Responsable del Tratamiento">
          <div className="bg-bg-card border border-border rounded-xl p-4 space-y-1">
            <p><strong className="text-text-main">Producto:</strong> Stratega Planner</p>
            <p><strong className="text-text-main">Empresa:</strong> Virtual Studios</p>
            <p><strong className="text-text-main">Email de contacto:</strong>{" "}
              <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline">
                strategaplanner@gmail.com
              </a>
            </p>
          </div>
        </Section>

        <Section title="2. Datos que Recopilamos">
          <p><strong className="text-text-main">Datos de cuenta:</strong> Nombre, dirección de correo electrónico y, si usas registro social, el nombre público e imagen de perfil de tu cuenta de Google o Facebook.</p>
          <p><strong className="text-text-main">Datos de uso:</strong> Contenido que creas dentro de la aplicación: eventos del planner, publicaciones del feed, recordatorios, cotizaciones, registros contables, archivos en carpetas y datos del equipo.</p>
          <p><strong className="text-text-main">Datos técnicos:</strong> Tipo de dispositivo, sistema operativo, versión de la app, dirección IP (de forma anónima), preferencias de idioma y tema visual.</p>
          <p><strong className="text-text-main">Datos de pago:</strong> No almacenamos datos de tarjetas de crédito ni información financiera completa. Los pagos son gestionados íntegramente por PayPal, que cuenta con sus propias políticas de privacidad y seguridad PCI-DSS. Solo recibimos el identificador de suscripción y el estado del pago.</p>
          <p><strong className="text-text-main">Notificaciones push:</strong> Si otorgas permiso, almacenamos un token de dispositivo para enviarte recordatorios y notificaciones.</p>
        </Section>

        <Section title="3. Cómo Usamos tus Datos">
          <p>Usamos tu información exclusivamente para los siguientes fines:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Crear y gestionar tu cuenta de usuario</li>
            <li>Proveer, operar y mejorar las funcionalidades de Stratega Planner</li>
            <li>Procesar y gestionar tu suscripción y los pagos asociados</li>
            <li>Enviarte notificaciones de recordatorios que hayas configurado</li>
            <li>Responder tus solicitudes de soporte y atención al cliente</li>
            <li>Enviarte comunicaciones relacionadas con el servicio (actualizaciones importantes, cambios en términos, facturas)</li>
            <li>Detectar y prevenir fraudes o usos abusivos del servicio</li>
            <li>Cumplir obligaciones legales aplicables</li>
          </ul>
          <p>No usamos tus datos para publicidad de terceros ni para perfilado comercial.</p>
        </Section>

        <Section title="4. Compartición de Datos con Terceros">
          <p>No vendemos, alquilamos ni compartimos tus datos personales con terceros para fines propios de dichos terceros. Únicamente compartimos información con los siguientes proveedores de servicios esenciales:</p>
          <div className="space-y-3 mt-2">
            {[
              { name: "Google Firebase", purpose: "Base de datos (Firestore), autenticación, almacenamiento de archivos y mensajería push (FCM). Certificado ISO 27001 y SOC 2 Tipo II." },
              { name: "PayPal", purpose: "Procesamiento de pagos y gestión de suscripciones. Cumple con PCI-DSS Nivel 1. Consulta su política en paypal.com." },
              { name: "Google (Sign-In)", purpose: "Autenticación opcional mediante cuenta de Google." },
              { name: "Facebook (Login)", purpose: "Autenticación opcional mediante cuenta de Facebook/Meta." },
            ].map(p => (
              <div key={p.name} className="bg-bg-card border border-border rounded-xl p-3">
                <p className="text-text-main font-semibold text-sm">{p.name}</p>
                <p className="text-xs mt-0.5">{p.purpose}</p>
              </div>
            ))}
          </div>
          <p>Todos nuestros proveedores están obligados contractualmente a tratar tus datos conforme a esta política y a la normativa de protección de datos aplicable.</p>
          <p>Podemos divulgar tus datos si así lo exige una orden judicial, requerimiento legal o para proteger los derechos legítimos de Stratega Planner o de terceros.</p>
        </Section>

        <Section title="5. Almacenamiento y Seguridad">
          <p>Tus datos se almacenan en los servidores de Google Firebase ubicados en centros de datos con certificaciones de seguridad internacionales (ISO 27001, SOC 1/2/3).</p>
          <p>Implementamos las siguientes medidas de seguridad:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Cifrado en tránsito mediante TLS 1.2+</li>
            <li>Cifrado en reposo de los datos almacenados</li>
            <li>Autenticación de dos factores disponible para tu cuenta</li>
            <li>Reglas de acceso a Firestore que impiden lectura de datos de otros usuarios</li>
            <li>Credenciales de servicios de terceros almacenadas en Google Cloud Secret Manager</li>
          </ul>
          <p>Aunque aplicamos las mejores prácticas de seguridad, ningún sistema es 100% inviolable. En caso de una brecha de seguridad significativa que afecte tus datos, te notificaremos en los plazos que exija la legislación aplicable.</p>
        </Section>

        <Section title="6. Retención de Datos">
          <p>Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, procederemos a borrar todos tus datos personales y contenido en un plazo máximo de 30 días, salvo que la ley requiera conservarlos por un período determinado (por ejemplo, datos de facturación).</p>
          <p>Los datos anonimizados o agregados (estadísticas de uso sin identificación personal) pueden conservarse indefinidamente para mejorar el servicio.</p>
        </Section>

        <Section title="7. Tus Derechos">
          <p>Dependiendo de tu ubicación, puedes tener los siguientes derechos sobre tus datos personales:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-text-main">Acceso:</strong> Solicitar una copia de los datos que tenemos sobre ti</li>
            <li><strong className="text-text-main">Rectificación:</strong> Corregir datos inexactos desde tu perfil en Configuración</li>
            <li><strong className="text-text-main">Eliminación:</strong> Solicitar el borrado de tu cuenta y todos tus datos desde Configuración → Cuenta → Eliminar cuenta</li>
            <li><strong className="text-text-main">Portabilidad:</strong> Solicitar tus datos en formato legible por máquina</li>
            <li><strong className="text-text-main">Oposición:</strong> Oponerte a ciertos tipos de procesamiento</li>
            <li><strong className="text-text-main">Revocación del consentimiento:</strong> Retirar tu consentimiento para el procesamiento basado en él</li>
          </ul>
          <p>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline">strategaplanner@gmail.com</a>. Responderemos en un plazo de 30 días.</p>
        </Section>

        <Section title="8. Cookies y Tecnologías Similares">
          <p>Usamos las siguientes tecnologías de almacenamiento local:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-text-main">LocalStorage:</strong> Para guardar tus preferencias de tema, idioma y configuración de la interfaz</li>
            <li><strong className="text-text-main">IndexedDB (Firebase Cache):</strong> Para funcionalidad offline y carga más rápida de tus datos</li>
            <li><strong className="text-text-main">Cookies de sesión de Firebase:</strong> Para mantener tu sesión iniciada</li>
          </ul>
          <p>No utilizamos cookies de rastreo publicitario ni compartimos datos de comportamiento con plataformas publicitarias.</p>
        </Section>

        <Section title="9. Menores de Edad">
          <p>Stratega Planner no está dirigido a personas menores de 16 años. No recopilamos conscientemente datos de menores. Si tienes conocimiento de que un menor nos ha proporcionado información, contáctanos para proceder a su eliminación inmediata.</p>
        </Section>

        <Section title="10. Transferencias Internacionales">
          <p>Tus datos pueden ser procesados en servidores ubicados fuera de tu país de residencia (principalmente en Estados Unidos, donde opera Google Firebase). Estas transferencias se realizan bajo mecanismos legales adecuados como las Cláusulas Contractuales Tipo de la Comisión Europea u otros mecanismos equivalentes.</p>
        </Section>

        <Section title="11. Cambios en esta Política">
          <p>Podemos actualizar esta Política de Privacidad periódicamente. Cuando realicemos cambios materiales, te notificaremos por correo electrónico con al menos 15 días de antelación. La fecha de "última actualización" en la parte superior indica la versión vigente.</p>
        </Section>

        <Section title="12. Contacto y Reclamaciones">
          <p>Para cualquier consulta, solicitud o reclamación relacionada con el tratamiento de tus datos personales:</p>
          <div className="bg-bg-card border border-border rounded-xl p-4 mt-3 space-y-1">
            <p><strong className="text-text-main">Email:</strong>{" "}
              <a href="mailto:strategaplanner@gmail.com" className="text-primary-light hover:underline">
                strategaplanner@gmail.com
              </a>
            </p>
            <p><strong className="text-text-main">Soporte:</strong>{" "}
              <Link to="/support" className="text-primary-light hover:underline">Centro de Ayuda</Link>
            </p>
          </div>
          <p>Si consideras que el tratamiento de tus datos infringe la normativa aplicable, tienes derecho a presentar una reclamación ante la autoridad de control de protección de datos competente en tu país.</p>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-border pt-8 mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
          <Link to="/terms" className="hover:text-primary-light transition">Términos de Servicio</Link>
          <Link to="/refunds" className="hover:text-primary-light transition">Política de Reembolsos</Link>
          <Link to="/support" className="hover:text-primary-light transition">Centro de Ayuda</Link>
          <Link to="/contact" className="hover:text-primary-light transition">Contacto</Link>
        </div>
      </div>
    </div>
  )
}

export default Privacy
