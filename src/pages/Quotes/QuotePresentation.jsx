import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { ArrowLeft, Copy, Check, Printer } from "lucide-react"

const STATUS_STYLES = {
  Borrador:  "bg-border/50 text-text-muted",
  Enviada:   "bg-blue-500/15 text-blue-400",
  Aprobada:  "bg-green-500/15 text-green-400",
  Rechazada: "bg-red-500/15 text-red-400",
}

const fmt = (n, decimals = 2) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const QuotePresentation = () => {
  const { id }         = useParams()
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const [quote,  setQuote]  = useState(null)
  const [company,setCompany]= useState(null)
  const [loading,setLoading]= useState(true)
  const [copied, setCopied] = useState(false)
  const [error,  setError]  = useState(false)

  useEffect(() => {
    if (!user || !id) return
    loadData()
  }, [user, id])

  const loadData = async () => {
    try {
      const [qSnap, cSnap] = await Promise.all([
        getDoc(doc(db, "quotes", id)),
        getDoc(doc(db, "company_profiles", user.uid)),
      ])
      if (!qSnap.exists() || qSnap.data().uid !== user.uid) {
        setError(true)
        return
      }
      setQuote({ id: qSnap.id, ...qSnap.data() })
      if (cSnap.exists()) setCompany(cSnap.data())
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href)
      } else {
        // Fallback para Android WebView sin Clipboard API
        const el = document.createElement("textarea")
        el.value = window.location.href
        el.style.cssText = "position:fixed;opacity:0"
        document.body.appendChild(el)
        el.focus(); el.select()
        document.execCommand("copy")
        document.body.removeChild(el)
      }
    } catch { /* silencioso */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-main font-semibold mb-2">Cotización no encontrada</p>
        <button onClick={() => navigate("/quotes")} className="text-primary-light text-sm hover:underline">
          Volver a cotizaciones
        </button>
      </div>
    </div>
  )

  const subtotal = quote.servicios?.reduce((acc, s) => acc + (s.precio * s.cantidad || 0), 0) || quote.total || 0
  const today    = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-bg-main">

      {/* Toolbar (no se imprime) */}
      <div className="print:hidden sticky top-0 z-20 bg-bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate("/quotes")}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition text-sm"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[quote.estado] || STATUS_STYLES.Borrador}`}>
            {quote.estado || "Borrador"}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main border border-border px-3 py-1.5 rounded-xl hover:bg-bg-hover transition"
          >
            {copied ? <><Check size={14} className="text-green-400" /> Copiado</> : <><Copy size={14} /> Copiar enlace</>}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm bg-primary text-white px-3 py-1.5 rounded-xl hover:bg-primary-light transition"
          >
            <Printer size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Documento */}
      <div className="max-w-3xl mx-auto px-6 py-10 print:py-6 print:px-8">
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden print:border-0 print:rounded-none print:shadow-none shadow-xl">

          {/* Header empresa */}
          <div className="px-8 py-8 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                {company?.logoBase64 && (
                  <img src={company.logoBase64} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-border bg-bg-input" />
                )}
                <div>
                  <h1 className="text-text-main font-bold text-xl leading-tight">{company?.nombre || "Mi Empresa"}</h1>
                  {company?.tagline && <p className="text-text-muted text-sm mt-0.5">{company.tagline}</p>}
                  {company?.email && <p className="text-text-muted/70 text-xs mt-1">{company.email}</p>}
                  {company?.telefono && <p className="text-text-muted/70 text-xs">{company.telefono}</p>}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <p className="text-primary-light font-bold text-lg">COT-{quote.numero || quote.id?.slice(0,6).toUpperCase()}</p>
                  <p className="text-text-muted text-xs mt-0.5">Fecha: {today}</p>
                  {quote.validez && (
                    <p className="text-text-muted text-xs">Válida hasta: {new Date(quote.validez).toLocaleDateString("es-ES")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Para */}
          <div className="px-8 py-6 border-b border-border">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-3">Cotización para</p>
            <div className="flex items-start gap-6 flex-wrap">
              <div>
                <p className="text-text-main font-bold text-lg">{quote.cliente}</p>
                {quote.email && <p className="text-text-muted text-sm">{quote.email}</p>}
                {quote.telefono && <p className="text-text-muted text-sm">{quote.telefono}</p>}
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="px-8 py-6">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-4">Servicios</p>
            <div className="rounded-xl overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-hover">
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold uppercase tracking-wider">Descripción</th>
                    <th className="text-center px-4 py-3 text-text-muted text-xs font-semibold uppercase tracking-wider w-20">Cant.</th>
                    <th className="text-right px-4 py-3 text-text-muted text-xs font-semibold uppercase tracking-wider w-28">Precio</th>
                    <th className="text-right px-4 py-3 text-text-muted text-xs font-semibold uppercase tracking-wider w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(quote.servicios || []).map((s, i) => (
                    <tr key={i} className="hover:bg-bg-hover/50 transition">
                      <td className="px-4 py-3 text-text-main">{s.descripcion}</td>
                      <td className="px-4 py-3 text-text-main text-center">{s.cantidad}</td>
                      <td className="px-4 py-3 text-text-main text-right">{quote.moneda} {fmt(s.precio)}</td>
                      <td className="px-4 py-3 text-text-main text-right font-medium">{quote.moneda} {fmt(s.precio * s.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mt-4">
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-6 py-4 text-right min-w-48">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total</p>
                <p className="text-primary-light font-bold text-2xl">{quote.moneda} {fmt(subtotal)}</p>
              </div>
            </div>
          </div>

          {/* Nota */}
          {quote.nota && (
            <div className="px-8 pb-6">
              <div className="bg-bg-input border border-border rounded-xl px-5 py-4">
                <p className="text-text-muted text-xs uppercase tracking-widest mb-2">Notas</p>
                <p className="text-text-main text-sm leading-relaxed whitespace-pre-line">{quote.nota}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-5 bg-bg-hover border-t border-border text-center">
            <p className="text-text-muted/60 text-xs">
              Generado con <span className="text-primary-light font-medium">Stratega Planner</span>
              {company?.web && <> · <a href={company.web} className="hover:text-primary-light transition">{company.web}</a></>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotePresentation
