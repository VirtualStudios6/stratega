import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc
} from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const MONEDAS = ["USD", "DOP", "EUR"]
const ESTADOS = [
  { label: "Borrador", color: "bg-[#1E1E2E] text-text-muted border-[#2A2A3E]" },
  { label: "Enviada", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "Aprobada", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { label: "Rechazada", color: "bg-red-500/20 text-red-400 border-red-500/30" },
]

const Quotes = () => {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [form, setForm] = useState({
    cliente: "",
    email: "",
    telefono: "",
    moneda: "USD",
    nota: "",
    validez: "",
  })
  const [servicios, setServicios] = useState([
    { descripcion: "", cantidad: 1, precio: 0 }
  ])

  const fetchQuotes = async () => {
    if (!user) return
    const q = query(collection(db, "quotes"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.creadoEn?.toDate?.() || 0) - new Date(a.creadoEn?.toDate?.() || 0))
    setQuotes(data)
  }

  useEffect(() => { fetchQuotes() }, [user])

  const calcTotal = (items) =>
    items.reduce((acc, s) => acc + (parseFloat(s.precio) || 0) * (parseInt(s.cantidad) || 0), 0)

  const handleAddServicio = () =>
    setServicios([...servicios, { descripcion: "", cantidad: 1, precio: 0 }])

  const handleRemoveServicio = (i) =>
    setServicios(servicios.filter((_, idx) => idx !== i))

  const handleServicioChange = (i, field, value) => {
    const updated = [...servicios]
    updated[i][field] = value
    setServicios(updated)
  }

  const handleSave = async () => {
    if (!form.cliente.trim()) return
    const total = calcTotal(servicios)
    await addDoc(collection(db, "quotes"), {
      uid: user.uid,
      ...form,
      servicios,
      total,
      estado: "Borrador",
      numero: `COT-${Date.now().toString().slice(-6)}`,
      creadoEn: new Date()
    })
    setModalOpen(false)
    resetForm()
    fetchQuotes()
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "quotes", id))
    setSelectedQuote(null)
    fetchQuotes()
  }

  const resetForm = () => {
    setForm({ cliente: "", email: "", telefono: "", moneda: "USD", nota: "", validez: "" })
    setServicios([{ descripcion: "", cantidad: 1, precio: 0 }])
  }

  const handleDownloadPDF = (quote) => {
    const pdf = new jsPDF()

    // Header
    pdf.setFillColor(96, 34, 236)
    pdf.rect(0, 0, 210, 40, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(22)
    pdf.setFont("helvetica", "bold")
    pdf.text("COTIZACIÓN", 14, 20)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    pdf.text(quote.numero, 14, 30)

    // Info cliente
    pdf.setTextColor(30, 30, 30)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Para:", 14, 55)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(11)
    pdf.text(quote.cliente, 14, 63)
    if (quote.email) pdf.text(quote.email, 14, 70)
    if (quote.telefono) pdf.text(quote.telefono, 14, 77)

    // Fecha y validez
    pdf.setFont("helvetica", "bold")
    pdf.text("Fecha:", 140, 55)
    pdf.setFont("helvetica", "normal")
    pdf.text(new Date().toLocaleDateString("es-ES"), 140, 63)
    if (quote.validez) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Válida hasta:", 140, 71)
      pdf.setFont("helvetica", "normal")
      pdf.text(quote.validez, 140, 79)
    }

    // Tabla de servicios
    autoTable(pdf, {
      startY: 95,
      head: [["Descripción", "Cantidad", "Precio unit.", "Total"]],
      body: quote.servicios.map(s => [
        s.descripcion,
        s.cantidad,
        `${quote.moneda} ${parseFloat(s.precio).toFixed(2)}`,
        `${quote.moneda} ${(parseFloat(s.precio) * parseInt(s.cantidad)).toFixed(2)}`
      ]),
      headStyles: { fillColor: [96, 34, 236], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      styles: { fontSize: 10, cellPadding: 6 },
    })

    // Total
    const finalY = pdf.lastAutoTable.finalY + 10
    pdf.setFillColor(96, 34, 236)
    pdf.rect(130, finalY, 66, 14, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    pdf.text(`TOTAL: ${quote.moneda} ${quote.total.toFixed(2)}`, 135, finalY + 9)

    // Nota
    if (quote.nota) {
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "italic")
      pdf.text(`Nota: ${quote.nota}`, 14, finalY + 30)
    }

    // Footer
    pdf.setTextColor(150, 150, 150)
    pdf.setFontSize(9)
    pdf.text("Generado con Stratega Planner", 14, 285)

    pdf.save(`${quote.numero}-${quote.cliente}.pdf`)
  }

  const total = calcTotal(servicios)

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Cotizaciones 📄</h1>
          <p className="text-text-muted text-sm mt-1">{quotes.length} cotizaciones creadas</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true) }}
          className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
        >
          + Nueva cotización
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Lista de cotizaciones */}
        <div className="col-span-1 space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Mis cotizaciones</p>
          {quotes.length === 0 ? (
            <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-8 text-center">
              <span className="text-3xl mb-2 block">📄</span>
              <p className="text-text-muted text-xs">Sin cotizaciones</p>
            </div>
          ) : (
            quotes.map(quote => {
              const estado = ESTADOS.find(e => e.label === quote.estado)
              return (
                <div
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className={`group flex flex-col gap-2 px-4 py-3 rounded-xl border cursor-pointer transition ${
                    selectedQuote?.id === quote.id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-[#13131F] border-[#2A2A3E] hover:bg-[#1E1E2E]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted font-mono">{quote.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${estado?.color}`}>
                      {quote.estado}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-main truncate">{quote.cliente}</p>
                  <p className="text-sm font-bold text-primary-light">
                    {quote.moneda} {quote.total?.toFixed(2)}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Detalle cotización */}
        <div className="col-span-2">
          {!selectedQuote ? (
            <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-16 text-center">
              <span className="text-5xl mb-4 block">📄</span>
              <p className="text-text-muted">Selecciona una cotización para verla</p>
            </div>
          ) : (
            <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-text-muted text-xs font-mono mb-1">{selectedQuote.numero}</p>
                  <h2 className="text-text-main font-bold text-lg">{selectedQuote.cliente}</h2>
                  {selectedQuote.email && <p className="text-text-muted text-xs">{selectedQuote.email}</p>}
                  {selectedQuote.telefono && <p className="text-text-muted text-xs">{selectedQuote.telefono}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedQuote)}
                    className="bg-primary/20 border border-primary/30 text-primary-light text-sm px-4 py-2 rounded-xl hover:bg-primary/30 transition"
                  >
                    ⬇️ PDF
                  </button>
                  <button
                    onClick={() => handleDelete(selectedQuote.id)}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-xl hover:bg-red-500/20 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Servicios */}
              <div className="bg-[#0D0D18] border border-[#2A2A3E] rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2A3E]">
                      <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase">Descripción</th>
                      <th className="text-center px-4 py-3 text-text-muted font-medium text-xs uppercase">Cant.</th>
                      <th className="text-right px-4 py-3 text-text-muted font-medium text-xs uppercase">Precio</th>
                      <th className="text-right px-4 py-3 text-text-muted font-medium text-xs uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.servicios?.map((s, i) => (
                      <tr key={i} className="border-b border-[#2A2A3E]/50">
                        <td className="px-4 py-3 text-text-main">{s.descripcion}</td>
                        <td className="px-4 py-3 text-text-muted text-center">{s.cantidad}</td>
                        <td className="px-4 py-3 text-text-muted text-right">{selectedQuote.moneda} {parseFloat(s.precio).toFixed(2)}</td>
                        <td className="px-4 py-3 text-text-main text-right font-medium">
                          {selectedQuote.moneda} {(parseFloat(s.precio) * parseInt(s.cantidad)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="flex justify-end mb-4">
                <div className="bg-primary/20 border border-primary/30 rounded-xl px-6 py-3">
                  <p className="text-text-muted text-xs mb-1">Total</p>
                  <p className="text-primary-light font-bold text-xl">
                    {selectedQuote.moneda} {selectedQuote.total?.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Nota */}
              {selectedQuote.nota && (
                <div className="bg-[#0D0D18] border border-[#2A2A3E] rounded-xl px-4 py-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Nota</p>
                  <p className="text-text-main text-sm">{selectedQuote.nota}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal nueva cotización */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">Nueva cotización</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="space-y-4">

              {/* Datos cliente */}
              <p className="text-xs text-text-muted uppercase tracking-wider">Datos del cliente</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Nombre del cliente</label>
                  <input
                    type="text"
                    value={form.cliente}
                    onChange={e => setForm({ ...form, cliente: e.target.value })}
                    placeholder="Ej: Empresa ABC"
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Correo</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="cliente@correo.com"
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+1 809 000 0000"
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Válida hasta</label>
                  <input
                    type="date"
                    value={form.validez}
                    onChange={e => setForm({ ...form, validez: e.target.value })}
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1.5">Moneda</label>
                <select
                  value={form.moneda}
                  onChange={e => setForm({ ...form, moneda: e.target.value })}
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Servicios */}
              <p className="text-xs text-text-muted uppercase tracking-wider pt-2">Servicios</p>
              <div className="space-y-3">
                {servicios.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={s.descripcion}
                      onChange={e => handleServicioChange(i, "descripcion", e.target.value)}
                      placeholder="Descripción del servicio"
                      className="col-span-6 bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                    />
                    <input
                      type="number"
                      value={s.cantidad}
                      onChange={e => handleServicioChange(i, "cantidad", e.target.value)}
                      placeholder="Cant."
                      min="1"
                      className="col-span-2 bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={s.precio}
                      onChange={e => handleServicioChange(i, "precio", e.target.value)}
                      placeholder="Precio"
                      min="0"
                      className="col-span-3 bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleRemoveServicio(i)}
                      disabled={servicios.length === 1}
                      className="col-span-1 text-red-400 hover:text-red-300 disabled:opacity-20 text-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddServicio}
                className="text-primary-light text-sm hover:text-accent transition"
              >
                + Agregar servicio
              </button>

              {/* Total preview */}
              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-3">
                  <p className="text-text-muted text-xs">Total estimado</p>
                  <p className="text-primary-light font-bold text-lg">{form.moneda} {total.toFixed(2)}</p>
                </div>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Nota (opcional)</label>
                <textarea
                  value={form.nota}
                  onChange={e => setForm({ ...form, nota: e.target.value })}
                  placeholder="Términos, condiciones o notas adicionales..."
                  rows={2}
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-[#0D0D18] border border-[#2A2A3E] text-text-muted py-2.5 rounded-xl hover:bg-[#1E1E2E] transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                Guardar cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Quotes
