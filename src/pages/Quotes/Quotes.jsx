import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc, setDoc, getDoc, updateDoc, runTransaction
} from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"
import useSubscriptionGuard from "../../hooks/useSubscriptionGuard"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { FileText, Building2, Pencil, Receipt, Monitor, Download, Trash2, X, ImagePlus, Palette, Pipette, Lock } from "lucide-react"

const MONEDAS = [
  // Más usadas
  "USD", "EUR", "GBP", "CAD", "AUD", "CHF", "JPY",
  // América Latina & Caribe
  "DOP", "MXN", "COP", "CLP", "ARS", "BRL", "PEN",
  "BOB", "PYG", "UYU", "CRC", "GTQ", "HNL", "NIO", "PAB", "CUP",
  // Asia / Pacífico
  "CNY", "INR", "KRW", "SGD", "HKD", "NZD", "TWD", "THB", "MYR", "IDR",
  // Europa
  "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "TRY", "RUB",
  // Medio Oriente & África
  "AED", "SAR", "QAR", "KWD", "ZAR",
]
const ESTADOS = [
  { label: "Borrador",  color: "bg-bg-hover text-text-muted border-border" },
  { label: "Enviada",   color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "Aprobada",  color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { label: "Rechazada", color: "bg-red-500/20 text-red-400 border-red-500/30" },
]
const ESTADOS_FACTURA = [
  { label: "Borrador",  color: "bg-bg-hover text-text-muted border-border" },
  { label: "Emitida",   color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "Pagada",    color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { label: "Anulada",   color: "bg-red-500/20 text-red-400 border-red-500/30" },
]

const TEMPLATES = [
  { id: "minimal", name: "Minimal",   desc: "Limpio y moderno",      bg: "#FFFFFF" },
  { id: "dark",    name: "Dark Pro",  desc: "Elegante oscuro",        bg: "#0D0D18" },
  { id: "classic", name: "Classic",   desc: "Profesional clásico",   bg: "#F0F4FF" },
]

const FONTS = [
  { id: "helvetica",  pdfFont: "helvetica", label: "Helvetica",        desc: "Sans-serif moderna" },
  { id: "arial",      pdfFont: "helvetica", label: "Arial",            desc: "Sans-serif limpia" },
  { id: "opensans",   pdfFont: "helvetica", label: "Open Sans",        desc: "Sans-serif amigable" },
  { id: "lato",       pdfFont: "helvetica", label: "Lato",             desc: "Sans-serif profesional" },
  { id: "times",      pdfFont: "times",     label: "Times New Roman",  desc: "Serif clásica" },
  { id: "georgia",    pdfFont: "times",     label: "Georgia",          desc: "Serif legible" },
  { id: "garamond",   pdfFont: "times",     label: "Garamond",         desc: "Serif editorial" },
  { id: "courier",    pdfFont: "courier",   label: "Courier New",      desc: "Monoespaciada" },
]

const resolvePdfFont = (id) =>
  (FONTS.find(f => f.id === id || f.pdfFont === id) || FONTS[0]).pdfFont

// ── Color helpers ─────────────────────────────────────────────────────────
const hexToRgb = (hex = "#6022EC") => {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const lighten = (rgb, factor = 0.92) =>
  rgb.map(c => Math.round(c + (255 - c) * factor))

// Interpola entre un array de colores en t ∈ [0,1]
const interpolateColors = (hexColors, t) => {
  if (hexColors.length === 1) return hexToRgb(hexColors[0])
  const segCount = hexColors.length - 1
  const seg = Math.min(Math.floor(t * segCount), segCount - 1)
  const segT = t * segCount - seg
  const c1 = hexToRgb(hexColors[seg])
  const c2 = hexToRgb(hexColors[seg + 1])
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * segT),
    Math.round(c1[1] + (c2[1] - c1[1]) * segT),
    Math.round(c1[2] + (c2[2] - c1[2]) * segT),
  ]
}

// Dibuja un degradado simulado (horizontal o vertical) en el PDF
const drawGradientRect = (pdf, hexColors, x, y, w, h, dir = "h") => {
  if (!hexColors || hexColors.length < 2) {
    pdf.setFillColor(...hexToRgb(hexColors?.[0] || "#6022EC"))
    pdf.rect(x, y, w, h, "F")
    return
  }
  const steps = 60
  if (dir === "h") {
    const slice = w / steps
    for (let i = 0; i < steps; i++) {
      pdf.setFillColor(...interpolateColors(hexColors, i / (steps - 1)))
      pdf.rect(x + i * slice, y, slice + 0.5, h, "F")
    }
  } else {
    const slice = h / steps
    for (let i = 0; i < steps; i++) {
      pdf.setFillColor(...interpolateColors(hexColors, i / (steps - 1)))
      pdf.rect(x, y + i * slice, w, slice + 0.5, "F")
    }
  }
}

// Extrae 2–4 colores dominantes y visualmente distintos del logo
const extractColorsFromImage = (src) =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 120; canvas.height = 120
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, 120, 120)
      const data = ctx.getImageData(0, 0, 120, 120).data
      const map = {}
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i+1], data[i+2], data[i+3]]
        if (a < 120) continue
        if (r > 228 && g > 228 && b > 228) continue // skip near-white
        if (r < 28 && g < 28 && b < 28) continue   // skip near-black
        // Quantize in 28-step buckets
        const k = `${Math.round(r/28)*28},${Math.round(g/28)*28},${Math.round(b/28)*28}`
        map[k] = (map[k] || 0) + 1
      }
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
      const toHex = ([r, g, b]) =>
        `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`
      const toHsl = ([r, g, b]) => {
        const rn = r/255, gn = g/255, bn = b/255
        const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
        const l = (max + min) / 2
        if (max === min) return [0, 0, l]
        const d = max - min
        const s = d / (l > 0.5 ? 2 - max - min : max + min)
        let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0)
              : max === gn ? (bn - rn) / d + 2
              :               (rn - gn) / d + 4
        return [h / 6, s, l]
      }
      // Pick colors that are visually distinct (Euclidean dist > 55 in RGB space)
      const picked = []
      for (const [key] of sorted) {
        if (picked.length >= 4) break
        const rgb = key.split(",").map(Number)
        const distinct = picked.every(p => {
          const [dr, dg, db] = [rgb[0]-p[0], rgb[1]-p[1], rgb[2]-p[2]]
          return Math.sqrt(dr*dr + dg*dg + db*db) > 55
        })
        if (distinct || picked.length === 0) picked.push(rgb)
      }
      if (picked.length === 0) { resolve(["#6022EC"]); return }
      // Sort by hue for a smooth, natural-looking gradient
      picked.sort((a, b) => toHsl(a)[0] - toHsl(b)[0])
      resolve(picked.map(toHex))
    }
    img.src = src
  })

// ── PDF generators ────────────────────────────────────────────────────────

const generateMinimalPDF = (quote, company) => {
  const pdf    = new jsPDF()
  const amounts = getQuoteAmounts(quote)
  const colors = company.brandColors?.length > 1 ? company.brandColors : [company.brandColor || "#6022EC"]
  const accent = hexToRgb(colors[0])
  const light  = lighten(accent)
  const gray   = [100, 100, 120]
  const dark   = [20, 20, 35]
  const font   = resolvePdfFont(company.fontStyle)
  const footer = company.footerText || "Generado con Stratega Planner"

  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, 210, 297, "F")
  drawGradientRect(pdf, colors, 0, 0, 210, 4)

  if (company.logoBase64) {
    try { pdf.addImage(company.logoBase64, "PNG", 14, 12, 30, 15) } catch {}
  }

  pdf.setFontSize(18); pdf.setFont(font, "bold"); pdf.setTextColor(...dark)
  pdf.text(company.nombre || "Tu Empresa", company.logoBase64 ? 50 : 14, 22)
  if (company.tagline) {
    pdf.setFontSize(9); pdf.setFont(font, "normal"); pdf.setTextColor(...gray)
    pdf.text(company.tagline, company.logoBase64 ? 50 : 14, 29)
  }

  pdf.setFontSize(8.5); pdf.setTextColor(...gray)
  const rx = 196; let iy = 16
  if (company.email)     { pdf.text(company.email,          rx, iy, { align: "right" }); iy += 6 }
  if (company.telefono)  { pdf.text(company.telefono,       rx, iy, { align: "right" }); iy += 6 }
  if (company.direccion) { pdf.text(company.direccion,      rx, iy, { align: "right" }); iy += 6 }
  if (company.web)       { pdf.text(company.web,            rx, iy, { align: "right" }); iy += 6 }
  if (company.rnc)       { pdf.text(`RNC: ${company.rnc}`, rx, iy, { align: "right" }) }

  pdf.setDrawColor(220, 220, 235); pdf.setLineWidth(0.5); pdf.line(14, 40, 196, 40)

  pdf.setFontSize(28); pdf.setFont(font, "bold"); pdf.setTextColor(...accent)
  pdf.text(quote.tipo === "factura" ? "FACTURA" : "COTIZACIÓN", 14, 55)
  pdf.setFontSize(10); pdf.setFont(font, "normal"); pdf.setTextColor(...gray)
  pdf.text(quote.numero, 14, 63)
  if (quote.ncf) pdf.text(`NCF: ${quote.ncf}`, 14, 68)
  if (quote.metodoPago) pdf.text(`Pago: ${quote.metodoPago}`, 14, quote.ncf ? 73 : 68)

  const col2 = 130
  pdf.setFontSize(9); pdf.setTextColor(...gray); pdf.text("Fecha de emisión", col2, 55)
  pdf.setTextColor(...dark); pdf.setFont(font, "bold")
  pdf.text(new Date().toLocaleDateString("es-ES"), col2, 62)
  if (quote.validez) {
    pdf.setFont(font, "normal"); pdf.setTextColor(...gray); pdf.text("Válida hasta", col2 + 40, 55)
    pdf.setTextColor(...dark); pdf.setFont(font, "bold")
    pdf.text(new Date(quote.validez).toLocaleDateString("es-ES"), col2 + 40, 62)
  }

  pdf.setFillColor(...light); pdf.roundedRect(14, 70, 88, 30, 3, 3, "F")
  pdf.setFontSize(8); pdf.setFont(font, "bold"); pdf.setTextColor(...accent); pdf.text("PARA", 20, 79)
  pdf.setFontSize(11); pdf.setTextColor(...dark); pdf.text(quote.cliente, 20, 87)
  pdf.setFontSize(8.5); pdf.setFont(font, "normal"); pdf.setTextColor(...gray)
  if (quote.email)    pdf.text(quote.email,    20, 94)
  if (quote.telefono) pdf.text(quote.telefono, 20, 99)
  if (quote.clienteId) pdf.text(`ID/Cedula: ${quote.clienteId}`, 20, 104)
  if (quote.clienteRnc) pdf.text(`RNC: ${quote.clienteRnc}`, 20, quote.clienteId ? 109 : 104)

  autoTable(pdf, {
    startY: 110,
    head: [["Descripción", "Cant.", "Precio unit.", "Total"]],
    body: (quote.servicios || []).map(s => [
      s.descripcion, String(s.cantidad),
      `${quote.moneda} ${parseFloat(s.precio).toFixed(2)}`,
      `${quote.moneda} ${(parseFloat(s.precio) * parseInt(s.cantidad)).toFixed(2)}`
    ]),
    headStyles: { fillColor: accent, textColor: [255,255,255], fontStyle: "bold", fontSize: 9, cellPadding: 7, font },
    bodyStyles: { fontSize: 9.5, cellPadding: 6, textColor: dark, font },
    alternateRowStyles: { fillColor: light },
    columnStyles: {
      0: { cellWidth: 80 }, 1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 40, halign: "right" }, 3: { cellWidth: 40, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: [220, 220, 235], tableLineWidth: 0.3,
  })

  const finalY = pdf.lastAutoTable.finalY
  pdf.setFont(font, "normal"); pdf.setFontSize(9); pdf.setTextColor(...gray)
  pdf.text(`Subtotal: ${quote.moneda} ${amounts.subtotal.toFixed(2)}`, 196, finalY + 12, { align: "right" })
  if (amounts.taxEnabled) pdf.text(`ITBIS (${amounts.taxRate}%): ${quote.moneda} ${amounts.taxAmount.toFixed(2)}`, 196, finalY + 18, { align: "right" })
  pdf.setFillColor(...accent); pdf.roundedRect(130, finalY + 22, 66, 18, 3, 3, "F")
  pdf.setTextColor(255,255,255); pdf.setFont(font, "bold"); pdf.setFontSize(11)
  pdf.text(`TOTAL: ${quote.moneda} ${amounts.total.toFixed(2)}`, 163, finalY + 34, { align: "center" })

  if (quote.nota) {
    pdf.setFillColor(248,248,252); pdf.roundedRect(14, finalY + 48, 116, 18, 3, 3, "F")
    pdf.setFontSize(8); pdf.setFont(font, "bold"); pdf.setTextColor(...gray); pdf.text("NOTA:", 20, finalY + 56)
    pdf.setFont(font, "normal"); pdf.setTextColor(...dark)
    pdf.text(pdf.splitTextToSize(quote.nota, 100), 20, finalY + 63)
  }

  pdf.setDrawColor(220, 220, 235); pdf.line(14, 280, 196, 280)
  pdf.setFontSize(8); pdf.setTextColor(...gray); pdf.text(footer, 14, 287)
  if (company.web) pdf.text(company.web, 196, 287, { align: "right" })

  pdf.save(`${quote.numero}-${quote.cliente}.pdf`)
}

const generateDarkPDF = (quote, company) => {
  const pdf     = new jsPDF()
  const amounts = getQuoteAmounts(quote)
  const colors  = company.brandColors?.length > 1 ? company.brandColors : [company.brandColor || "#8B5CF6"]
  const accent  = hexToRgb(colors[0])
  const bg      = [13, 13, 24]
  const bgCard  = [19, 19, 31]
  const bgLight = [30, 30, 46]
  const muted   = [107, 107, 138]
  const white   = [238, 238, 242]
  const font    = resolvePdfFont(company.fontStyle)
  const footer  = company.footerText || "Generado con Stratega Planner"

  pdf.setFillColor(...bg); pdf.rect(0, 0, 210, 297, "F")
  pdf.setFillColor(...bgCard); pdf.rect(0, 0, 210, 50, "F")
  drawGradientRect(pdf, colors, 0, 0, 4, 50, "v")

  if (company.logoBase64) {
    try { pdf.addImage(company.logoBase64, "PNG", 12, 10, 28, 14) } catch {}
  }

  pdf.setFontSize(16); pdf.setFont(font, "bold"); pdf.setTextColor(...white)
  pdf.text(company.nombre || "Tu Empresa", company.logoBase64 ? 46 : 14, 22)
  if (company.tagline) {
    pdf.setFontSize(8.5); pdf.setFont(font, "normal"); pdf.setTextColor(...muted)
    pdf.text(company.tagline, company.logoBase64 ? 46 : 14, 30)
  }

  pdf.setFontSize(8); pdf.setTextColor(...muted)
  let iy = 16; const rx = 196
  if (company.email)     { pdf.text(company.email,          rx, iy, { align: "right" }); iy += 6 }
  if (company.telefono)  { pdf.text(company.telefono,       rx, iy, { align: "right" }); iy += 6 }
  if (company.direccion) { pdf.text(company.direccion,      rx, iy, { align: "right" }); iy += 6 }
  if (company.web)       { pdf.text(company.web,            rx, iy, { align: "right" }); iy += 6 }
  if (company.rnc)       { pdf.text(`RNC: ${company.rnc}`, rx, iy, { align: "right" }) }

  pdf.setFontSize(26); pdf.setFont(font, "bold"); pdf.setTextColor(...accent)
  pdf.text(quote.tipo === "factura" ? "FACTURA" : "COTIZACIÓN", 14, 70)
  pdf.setFontSize(10); pdf.setFont(font, "normal"); pdf.setTextColor(...muted)
  pdf.text(quote.numero, 14, 79)
  if (quote.ncf) pdf.text(`NCF: ${quote.ncf}`, 14, 85)
  if (quote.metodoPago) pdf.text(`Pago: ${quote.metodoPago}`, 14, quote.ncf ? 91 : 85)

  pdf.setFillColor(...bgCard); pdf.roundedRect(14, 86, 85, 32, 3, 3, "F")
  pdf.setDrawColor(...bgLight); pdf.setLineWidth(0.4); pdf.roundedRect(14, 86, 85, 32, 3, 3, "S")
  pdf.setFontSize(7.5); pdf.setFont(font, "bold"); pdf.setTextColor(...accent); pdf.text("CLIENTE", 20, 95)
  pdf.setFontSize(11); pdf.setTextColor(...white); pdf.text(quote.cliente, 20, 104)
  pdf.setFontSize(8.5); pdf.setFont(font, "normal"); pdf.setTextColor(...muted)
  if (quote.email)    pdf.text(quote.email,    20, 111)
  if (quote.telefono) pdf.text(quote.telefono, 20, 117)
  if (quote.clienteId) pdf.text(`ID/Cedula: ${quote.clienteId}`, 20, 123)
  if (quote.clienteRnc) pdf.text(`RNC: ${quote.clienteRnc}`, 20, quote.clienteId ? 129 : 123)

  pdf.setFillColor(...bgCard); pdf.roundedRect(109, 86, 87, 32, 3, 3, "F")
  pdf.setDrawColor(...bgLight); pdf.roundedRect(109, 86, 87, 32, 3, 3, "S")
  pdf.setFontSize(7.5); pdf.setFont(font, "bold"); pdf.setTextColor(...accent); pdf.text("FECHAS", 115, 95)
  pdf.setFontSize(9); pdf.setFont(font, "normal"); pdf.setTextColor(...muted); pdf.text("Emisión:", 115, 104)
  pdf.setTextColor(...white); pdf.text(new Date().toLocaleDateString("es-ES"), 140, 104)
  if (quote.validez) {
    pdf.setTextColor(...muted); pdf.text("Válida:", 115, 112)
    pdf.setTextColor(...white); pdf.text(new Date(quote.validez).toLocaleDateString("es-ES"), 140, 112)
  }

  autoTable(pdf, {
    startY: 136,
    head: [["Descripción", "Cant.", "Precio", "Total"]],
    body: (quote.servicios || []).map(s => [
      s.descripcion, String(s.cantidad),
      `${quote.moneda} ${parseFloat(s.precio).toFixed(2)}`,
      `${quote.moneda} ${(parseFloat(s.precio) * parseInt(s.cantidad)).toFixed(2)}`
    ]),
    headStyles: { fillColor: [30,20,50], textColor: accent, fontStyle: "bold", fontSize: 9, cellPadding: 7, font },
    bodyStyles: { fillColor: bgCard, textColor: white, fontSize: 9.5, cellPadding: 6, font },
    alternateRowStyles: { fillColor: bgLight },
    columnStyles: {
      0: { cellWidth: 80 }, 1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right", fontStyle: "bold", textColor: accent },
    },
    tableLineColor: bgLight, tableLineWidth: 0.3,
  })

  const finalY = pdf.lastAutoTable.finalY
  pdf.setFont(font, "normal"); pdf.setFontSize(9); pdf.setTextColor(...muted)
  pdf.text(`Subtotal: ${quote.moneda} ${amounts.subtotal.toFixed(2)}`, 196, finalY + 12, { align: "right" })
  if (amounts.taxEnabled) pdf.text(`ITBIS (${amounts.taxRate}%): ${quote.moneda} ${amounts.taxAmount.toFixed(2)}`, 196, finalY + 18, { align: "right" })
  pdf.setFillColor(...accent); pdf.roundedRect(130, finalY + 22, 66, 18, 3, 3, "F")
  pdf.setTextColor(255,255,255); pdf.setFont(font, "bold"); pdf.setFontSize(11)
  pdf.text(`${quote.moneda} ${amounts.total.toFixed(2)}`, 163, finalY + 29, { align: "center" })
  pdf.setFontSize(8); pdf.text("TOTAL", 163, finalY + 36, { align: "center" })

  if (quote.nota) {
    pdf.setFillColor(...bgCard); pdf.roundedRect(14, finalY + 48, 116, 18, 3, 3, "F")
    pdf.setFontSize(8); pdf.setFont(font, "bold"); pdf.setTextColor(...accent); pdf.text("NOTA:", 20, finalY + 57)
    pdf.setFont(font, "normal"); pdf.setTextColor(...muted)
    pdf.text(pdf.splitTextToSize(quote.nota, 100), 20, finalY + 64)
  }

  pdf.setDrawColor(...bgLight); pdf.setLineWidth(0.5); pdf.line(14, 280, 196, 280)
  pdf.setFontSize(8); pdf.setTextColor(...muted); pdf.text(footer, 14, 287)
  if (company.web) pdf.text(company.web, 196, 287, { align: "right" })

  pdf.save(`${quote.numero}-${quote.cliente}.pdf`)
}

const generateClassicPDF = (quote, company) => {
  const pdf    = new jsPDF()
  const amounts = getQuoteAmounts(quote)
  const colors = company.brandColors?.length > 1 ? company.brandColors : [company.brandColor || "#1E40AF"]
  const accent = hexToRgb(colors[0])
  const light  = lighten(accent, 0.88)
  const gray   = [80, 90, 110]
  const dark   = [20, 30, 50]
  const font   = resolvePdfFont(company.fontStyle)
  const footer = company.footerText || "Generado con Stratega Planner"

  pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, 210, 297, "F")
  drawGradientRect(pdf, colors, 0, 0, 210, 45)
  // slightly darker strip at bottom of header
  pdf.setFillColor(...accent.map(c => Math.max(0, c - 30))); pdf.rect(0, 38, 210, 7, "F")

  if (company.logoBase64) {
    try { pdf.addImage(company.logoBase64, "PNG", 14, 8, 30, 16) } catch {}
  }

  pdf.setFontSize(18); pdf.setFont(font, "bold"); pdf.setTextColor(255, 255, 255)
  pdf.text(company.nombre || "Tu Empresa", company.logoBase64 ? 50 : 14, 20)
  if (company.tagline) {
    pdf.setFontSize(9); pdf.setFont(font, "normal"); pdf.setTextColor(200, 220, 255)
    pdf.text(company.tagline, company.logoBase64 ? 50 : 14, 28)
  }

  pdf.setFontSize(8.5); pdf.setTextColor(210, 225, 255)
  let iy = 12; const rx = 196
  if (company.email)     { pdf.text(company.email,          rx, iy, { align: "right" }); iy += 6 }
  if (company.telefono)  { pdf.text(company.telefono,       rx, iy, { align: "right" }); iy += 6 }
  if (company.direccion) { pdf.text(company.direccion,      rx, iy, { align: "right" }); iy += 6 }
  if (company.web)       { pdf.text(company.web,            rx, iy, { align: "right" }); iy += 6 }
  if (company.rnc)       { pdf.text(`RNC: ${company.rnc}`, rx, iy, { align: "right" }) }

  pdf.setFontSize(22); pdf.setFont(font, "bold"); pdf.setTextColor(...accent)
  pdf.text(quote.tipo === "factura" ? "FACTURA" : "COTIZACIÓN", 14, 62)
  pdf.setDrawColor(...accent); pdf.setLineWidth(0.4); pdf.line(14, 66, 196, 66)

  pdf.setFontSize(9); pdf.setFont(font, "bold"); pdf.setTextColor(...gray); pdf.text("N°:", 14, 74)
  pdf.setFont(font, "normal"); pdf.setTextColor(...dark); pdf.text(quote.numero, 24, 74)
  if (quote.ncf) {
    pdf.setFont(font, "bold"); pdf.setTextColor(...gray); pdf.text("NCF:", 14, 82)
    pdf.setFont(font, "normal"); pdf.setTextColor(...dark); pdf.text(quote.ncf, 28, 82)
  }
  pdf.setFont(font, "bold"); pdf.setTextColor(...gray); pdf.text("Fecha:", 80, 74)
  pdf.setFont(font, "normal"); pdf.setTextColor(...dark)
  pdf.text(new Date().toLocaleDateString("es-ES"), 96, 74)
  if (quote.validez) {
    pdf.setFont(font, "bold"); pdf.setTextColor(...gray); pdf.text("Válida hasta:", 140, 74)
    pdf.setFont(font, "normal"); pdf.setTextColor(...dark)
    pdf.text(new Date(quote.validez).toLocaleDateString("es-ES"), 172, 74)
  }

  pdf.setFillColor(...light); pdf.setDrawColor(200, 210, 240); pdf.setLineWidth(0.4)
  pdf.rect(14, 82, 90, 28, "FD")
  pdf.setFontSize(8); pdf.setFont(font, "bold"); pdf.setTextColor(...accent)
  pdf.text(quote.tipo === "factura" ? "FACTURA PARA:" : "COTIZACIÓN PARA:", 18, 91)
  pdf.setFontSize(11); pdf.setTextColor(...dark); pdf.text(quote.cliente, 18, 100)
  pdf.setFontSize(8.5); pdf.setFont(font, "normal"); pdf.setTextColor(...gray)
  if (quote.email)    pdf.text(quote.email,    18, 107)
  if (quote.telefono) pdf.text(quote.telefono, 18, 112)
  if (quote.clienteId) pdf.text(`ID/Cedula: ${quote.clienteId}`, 18, 117)
  if (quote.clienteRnc) pdf.text(`RNC: ${quote.clienteRnc}`, 18, quote.clienteId ? 122 : 117)
  if (quote.metodoPago) pdf.text(`Pago: ${quote.metodoPago}`, 120, 100)

  autoTable(pdf, {
    startY: 128,
    head: [["#", "Descripción", "Cant.", "Precio unit.", "Total"]],
    body: (quote.servicios || []).map((s, i) => [
      String(i + 1), s.descripcion, String(s.cantidad),
      `${quote.moneda} ${parseFloat(s.precio).toFixed(2)}`,
      `${quote.moneda} ${(parseFloat(s.precio) * parseInt(s.cantidad)).toFixed(2)}`
    ]),
    headStyles: { fillColor: accent, textColor: [255,255,255], fontStyle: "bold", fontSize: 9, cellPadding: 7, font },
    bodyStyles: { fontSize: 9.5, cellPadding: 6, textColor: dark, font },
    alternateRowStyles: { fillColor: light },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 72 },
      2: { cellWidth: 18, halign: "center" }, 3: { cellWidth: 40, halign: "right" },
      4: { cellWidth: 40, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: [200, 210, 240], tableLineWidth: 0.3,
  })

  const finalY = pdf.lastAutoTable.finalY
  pdf.setDrawColor(...accent); pdf.setLineWidth(0.3); pdf.line(130, finalY + 8, 196, finalY + 8)
  pdf.setFontSize(10); pdf.setFont(font, "bold"); pdf.setTextColor(...accent)
  pdf.setFont(font, "normal"); pdf.setFontSize(9); pdf.setTextColor(...gray)
  pdf.text(`Subtotal: ${quote.moneda} ${amounts.subtotal.toFixed(2)}`, 196, finalY + 16, { align: "right" })
  if (amounts.taxEnabled) pdf.text(`ITBIS (${amounts.taxRate}%): ${quote.moneda} ${amounts.taxAmount.toFixed(2)}`, 196, finalY + 22, { align: "right" })
  pdf.setFontSize(10); pdf.setFont(font, "bold"); pdf.setTextColor(...accent)
  pdf.text("TOTAL:", 132, finalY + 34)
  pdf.setFontSize(13); pdf.text(`${quote.moneda} ${amounts.total.toFixed(2)}`, 196, finalY + 34, { align: "right" })

  if (quote.nota) {
    pdf.setFillColor(...light); pdf.setDrawColor(200, 210, 240)
    pdf.rect(14, finalY + 50, 110, 18, "FD")
    pdf.setFontSize(8); pdf.setFont(font, "bold"); pdf.setTextColor(...accent); pdf.text("NOTA:", 18, finalY + 59)
    pdf.setFont(font, "normal"); pdf.setTextColor(...gray)
    pdf.text(pdf.splitTextToSize(quote.nota, 100), 18, finalY + 66)
  }

  pdf.setFillColor(...accent); pdf.rect(0, 283, 210, 14, "F")
  pdf.setFontSize(8.5); pdf.setFont(font, "normal"); pdf.setTextColor(210, 225, 255)
  pdf.text(footer, 14, 292)
  if (company.web) pdf.text(company.web, 196, 292, { align: "right" })

  pdf.save(`${quote.numero}-${quote.cliente}.pdf`)
}

const addLogoFit = (pdf, logoBase64, x, y, maxW, maxH) => {
  if (!logoBase64) return false
  try {
    const props = pdf.getImageProperties(logoBase64)
    const ratio = props.width / props.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    const format = logoBase64.includes("image/jpeg") || logoBase64.includes("image/jpg") ? "JPEG" : "PNG"
    pdf.addImage(logoBase64, format, x, y, w, h)
    return true
  } catch {
    return false
  }
}

const generatePresentationPDF = (quote, company) => {
  const pdf = new jsPDF()
  const amounts = getQuoteAmounts(quote)
  const ncf = quote.ncf || ""
  const fiscalId = getClientFiscalId(quote)
  const accent = hexToRgb(company.brandColor || "#6022EC")
  const light = lighten(accent, 0.92)
  const dark = [24, 24, 38]
  const muted = [105, 105, 125]
  const border = [224, 224, 235]
  const font = resolvePdfFont(company.fontStyle)
  const isFactura = quote.tipo === "factura"
  const footer = company.footerText || "Generado con Stratega Planner"
  const today = new Date().toLocaleDateString("es-ES")

  pdf.setFillColor(248, 249, 252)
  pdf.rect(0, 0, 210, 297, "F")
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(12, 12, 186, 268, 3, 3, "F")
  pdf.setDrawColor(...border)
  pdf.roundedRect(12, 12, 186, 268, 3, 3, "S")
  pdf.setFillColor(...light)
  pdf.rect(12, 12, 186, 38, "F")

  const hasLogo = addLogoFit(pdf, company.logoBase64, 20, 22, 34, 16)
  const companyX = hasLogo ? 60 : 20
  pdf.setFont(font, "bold")
  pdf.setFontSize(15)
  pdf.setTextColor(...dark)
  pdf.text(company.nombre || "Mi Empresa", companyX, 27, { maxWidth: 78 })
  pdf.setFont(font, "normal")
  pdf.setFontSize(8.5)
  pdf.setTextColor(...muted)
  let companyY = 34
  if (company.tagline) { pdf.text(company.tagline, companyX, companyY, { maxWidth: 78 }); companyY += 5 }
  if (company.email) { pdf.text(company.email, companyX, companyY, { maxWidth: 78 }); companyY += 5 }
  if (company.telefono) { pdf.text(company.telefono, companyX, companyY, { maxWidth: 78 }); companyY += 5 }
  if (company.rnc) pdf.text(`RNC: ${company.rnc}`, companyX, companyY, { maxWidth: 78 })

  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(138, 20, 46, 27, 2, 2, "F")
  pdf.setDrawColor(...border)
  pdf.roundedRect(138, 20, 46, 27, 2, 2, "S")
  pdf.setFont(font, "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(...accent)
  pdf.text(isFactura ? "FACTURA" : "COTIZACION", 161, 27, { align: "center" })
  pdf.setFontSize(11)
  pdf.text(quote.numero || quote.id?.slice(0, 6).toUpperCase() || "", 161, 35, { align: "center" })
  pdf.setFont(font, "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(...muted)
  if (ncf) pdf.text(`NCF: ${ncf}`, 161, 41, { align: "center" })
  if (quote.ncfType) pdf.text(`Tipo: ${quote.ncfType}`, 161, ncf ? 46 : 41, { align: "center" })

  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(20, 60, 82, 38, 2, 2, "F")
  pdf.roundedRect(112, 60, 72, 38, 2, 2, "F")
  pdf.setDrawColor(...border)
  pdf.roundedRect(20, 60, 82, 38, 2, 2, "S")
  pdf.roundedRect(112, 60, 72, 38, 2, 2, "S")

  pdf.setFont(font, "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(...accent)
  pdf.text(isFactura ? "FACTURA PARA" : "COTIZACION PARA", 26, 69)
  pdf.setFontSize(10.5)
  pdf.setTextColor(...dark)
  pdf.text(quote.fiscalName || quote.cliente || "Cliente", 26, 78, { maxWidth: 66 })
  pdf.setFont(font, "normal")
  pdf.setFontSize(8)
  pdf.setTextColor(...muted)
  let clientY = 84
  if (quote.fiscalName && quote.fiscalName !== quote.cliente) { pdf.text(`Cliente: ${quote.cliente}`, 26, clientY, { maxWidth: 66 }); clientY += 5 }
  if (quote.email) { pdf.text(quote.email, 26, clientY, { maxWidth: 66 }); clientY += 5 }
  if (quote.telefono) { pdf.text(quote.telefono, 26, clientY, { maxWidth: 66 }); clientY += 5 }
  if (fiscalId) { pdf.text(`${fiscalId.label}: ${fiscalId.value}`, 26, clientY, { maxWidth: 66 }); clientY += 5 }
  if (quote.direccionCliente) pdf.text(quote.direccionCliente, 26, clientY, { maxWidth: 66 })

  pdf.setFont(font, "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(...accent)
  pdf.text("DETALLES", 118, 69)
  pdf.setFont(font, "normal")
  pdf.setFontSize(8.5)
  pdf.setTextColor(...muted)
  let detailY = 78
  pdf.text(`Fecha: ${today}`, 118, detailY); detailY += 6
  if (ncf) { pdf.text(`NCF asignado: ${ncf}`, 118, detailY); detailY += 6 }
  if (quote.ncfType) { pdf.text(`Tipo NCF: ${quote.ncfType}`, 118, detailY); detailY += 6 }
  if (quote.validez) { pdf.text(`${isFactura ? "Vence" : "Valida hasta"}: ${new Date(quote.validez).toLocaleDateString("es-ES")}`, 118, detailY); detailY += 6 }
  if (quote.metodoPago) pdf.text(`Pago: ${quote.metodoPago}`, 118, detailY)

  autoTable(pdf, {
    startY: 110,
    margin: { left: 20, right: 20 },
    head: [["Descripcion", "Cant.", "Precio", "Total"]],
    body: (quote.servicios || []).map(s => [
      s.descripcion || "",
      String(s.cantidad || 0),
      `${quote.moneda} ${fmt(s.precio)}`,
      `${quote.moneda} ${fmt((parseFloat(s.precio) || 0) * (parseInt(s.cantidad) || 0))}`,
    ]),
    headStyles: { fillColor: accent, textColor: [255, 255, 255], font, fontStyle: "bold", fontSize: 8.5, cellPadding: 5 },
    bodyStyles: { font, fontSize: 9, textColor: dark, cellPadding: 5 },
    alternateRowStyles: { fillColor: [250, 250, 253] },
    columnStyles: {
      0: { cellWidth: 86 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 32, halign: "right" },
      3: { cellWidth: 34, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: border,
    tableLineWidth: 0.2,
  })

  const finalY = Math.max(pdf.lastAutoTable.finalY + 10, 165)
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(114, finalY, 70, amounts.taxEnabled ? 35 : 27, 2, 2, "F")
  pdf.setDrawColor(...border)
  pdf.roundedRect(114, finalY, 70, amounts.taxEnabled ? 35 : 27, 2, 2, "S")
  pdf.setFont(font, "normal")
  pdf.setFontSize(9)
  pdf.setTextColor(...muted)
  pdf.text("Subtotal", 120, finalY + 9)
  pdf.text(`${quote.moneda} ${fmt(amounts.subtotal)}`, 178, finalY + 9, { align: "right" })
  let totalY = finalY + 17
  if (amounts.taxEnabled) {
    pdf.text(`ITBIS (${fmt(amounts.taxRate, 0)}%)`, 120, finalY + 17)
    pdf.text(`${quote.moneda} ${fmt(amounts.taxAmount)}`, 178, finalY + 17, { align: "right" })
    totalY = finalY + 26
  }
  pdf.setFont(font, "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(...accent)
  pdf.text("Total", 120, totalY)
  pdf.text(`${quote.moneda} ${fmt(amounts.total)}`, 178, totalY, { align: "right" })

  if (quote.nota) {
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(20, finalY, 88, 35, 2, 2, "F")
    pdf.setDrawColor(...border)
    pdf.roundedRect(20, finalY, 88, 35, 2, 2, "S")
    pdf.setFont(font, "bold")
    pdf.setFontSize(8)
    pdf.setTextColor(...accent)
    pdf.text("NOTAS", 26, finalY + 9)
    pdf.setFont(font, "normal")
    pdf.setFontSize(8)
    pdf.setTextColor(...muted)
    pdf.text(pdf.splitTextToSize(quote.nota, 74), 26, finalY + 17)
  }

  pdf.setDrawColor(...border)
  pdf.line(20, 262, 184, 262)
  pdf.setFont(font, "normal")
  pdf.setFontSize(8)
  pdf.setTextColor(...muted)
  pdf.text(footer, 20, 270)
  if (company.web) pdf.text(company.web, 184, 270, { align: "right" })

  pdf.save(`${quote.numero || "documento"}-${quote.cliente || "cliente"}.pdf`)
}

const PDF_GENERATORS = {
  minimal: generatePresentationPDF,
  dark:    generatePresentationPDF,
  classic: generatePresentationPDF,
  legacyDark: generateDarkPDF,
  legacyClassic: generateClassicPDF,
}

// ── Input component ───────────────────────────────────────────────────────
const Input = ({ label, value, onChange, placeholder, type = "text", className = "" }) => (
  <div className={className}>
    {label && <label className="block text-xs text-text-muted mb-1.5">{label}</label>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
    />
  </div>
)

const fmt = (n, decimals = 2) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const PAYMENT_METHODS = ["Transferencia", "Efectivo", "Tarjeta", "Cheque", "PayPal", "Otro"]

const NCF_TYPES = [
  { type: "B01", label: "B01 - Crédito fiscal", requiresFiscalId: true },
  { type: "B02", label: "B02 - Consumidor final", requiresFiscalId: false },
  { type: "B03", label: "B03 - Nota de débito", requiresFiscalId: true },
  { type: "B04", label: "B04 - Nota de crédito", requiresFiscalId: true },
  { type: "B11", label: "B11 - Compras", requiresFiscalId: true },
  { type: "B13", label: "B13 - Gubernamental", requiresFiscalId: true },
  { type: "B14", label: "B14 - Regímenes especiales", requiresFiscalId: true },
  { type: "B15", label: "B15 - Gubernamental especial", requiresFiscalId: true },
]

const getNcfTypeInfo = (type) =>
  NCF_TYPES.find(item => item.type === type) || NCF_TYPES[0]

const getActiveNcfSequence = (sequences = [], type = "B01") =>
  sequences.map(normalizeNcfSequence).find(seq => seq.type === type && getSequenceRuntimeStatus(seq) === "activa")

const emptyNcfSequence = () => ({
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  type: "B01",
  prefix: "B01",
  start: 1,
  end: 99999999,
  next: 1,
  expiresAt: "",
  status: "activa",
})

const normalizeNcfSequence = (seq = {}) => ({
  id: seq.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
  type: String(seq.type || seq.prefix || "B01").toUpperCase(),
  prefix: String(seq.prefix || seq.type || "B01").toUpperCase(),
  start: parseInt(seq.start ?? seq.numeroInicial ?? 1) || 1,
  end: parseInt(seq.end ?? seq.numeroFinal ?? 0) || 0,
  next: parseInt(seq.next ?? seq.proximo ?? seq.start ?? seq.numeroInicial ?? 1) || 1,
  expiresAt: seq.expiresAt || seq.fechaVencimiento || "",
  status: seq.status || seq.estado || "activa",
})

const getSequenceRuntimeStatus = (seq) => {
  const normalized = normalizeNcfSequence(seq)
  const today = new Date().toISOString().split("T")[0]
  if (normalized.status !== "activa") return normalized.status
  if (normalized.expiresAt && normalized.expiresAt < today) return "vencida"
  if (normalized.end && normalized.next > normalized.end) return "agotada"
  return "activa"
}

const formatNcf = (seq, number) => {
  const normalized = normalizeNcfSequence(seq)
  const width = Math.max(String(normalized.end || "").length, 8)
  return `${normalized.prefix}${String(number).padStart(width, "0")}`
}

const calcSubtotal = (items = []) =>
  items.reduce((acc, s) => acc + (parseFloat(s.precio) || 0) * (parseInt(s.cantidad) || 0), 0)

const calcTax = (subtotal, taxEnabled, taxRate) =>
  taxEnabled ? subtotal * ((parseFloat(taxRate) || 0) / 100) : 0

const getQuoteAmounts = (quote = {}) => {
  const subtotal = Number.isFinite(Number(quote.subtotal)) ? Number(quote.subtotal) : calcSubtotal(quote.servicios || [])
  const taxEnabled = quote.taxEnabled === true
  const taxRate = parseFloat(quote.taxRate) || 0
  const taxAmount = Number.isFinite(Number(quote.taxAmount)) ? Number(quote.taxAmount) : calcTax(subtotal, taxEnabled, taxRate)
  const total = Number.isFinite(Number(quote.total)) ? Number(quote.total) : subtotal + taxAmount
  return { subtotal, taxAmount, total, taxRate, taxEnabled }
}

const getClientFiscalId = (quote = {}) => {
  const rnc = String(quote.clienteRnc || "").trim()
  const cedula = String(quote.clienteId || "").trim()
  if (rnc) return { label: "RNC fiscal", value: rnc }
  if (cedula) return { label: "Cedula fiscal", value: cedula }
  return null
}

// ── Main component ────────────────────────────────────────────────────────
const Quotes = () => {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const { plan }   = useSubscriptionGuard()
  const isPro      = plan === "pro"

  const [quotes,        setQuotes]        = useState([])
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editingQuote,  setEditingQuote]  = useState(null)
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [selectedTpl,   setSelectedTpl]   = useState("minimal")
  const [activeTab,     setActiveTab]     = useState("cotizaciones")
  const [extracting,    setExtracting]    = useState(false)

  const [form, setForm] = useState({
    cliente: "", fiscalName: "", email: "", telefono: "", clienteId: "", clienteRnc: "", direccionCliente: "",
    moneda: "USD", nota: "", validez: "", ncf: "", ncfType: "B02", fiscalRequested: false, metodoPago: "Transferencia",
    taxEnabled: false, taxRate: 18
  })
  const [servicios, setServicios] = useState([{ descripcion: "", cantidad: 1, precio: 0 }])

  const [company, setCompany] = useState({
    nombre: "", tagline: "", email: "", telefono: "", direccion: "", web: "", rnc: "",
    logoBase64: "", brandColor: "#6022EC", brandColors: [], fontStyle: "helvetica", footerText: "",
    defaultTaxEnabled: false, defaultTaxRate: 18, defaultPaymentMethod: "Transferencia", defaultNcfType: "B02", ncfSequences: []
  })
  const [companyDraft,  setCompanyDraft]  = useState({ ...company })
  const [logoPreview,   setLogoPreview]   = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const logoInputRef = useRef()

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchQuotes = async () => {
    if (!user) return
    const q    = query(collection(db, "quotes"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.creadoEn?.toDate?.() || 0) - new Date(a.creadoEn?.toDate?.() || 0))
    setQuotes(data)
  }

  const fetchCompany = async () => {
    if (!user) return
    const snap = await getDoc(doc(db, "company_profiles", user.uid))
    if (snap.exists()) {
      const data = { nombre: "", tagline: "", email: "", telefono: "", direccion: "", web: "", rnc: "",
        logoBase64: "", brandColor: "#6022EC", brandColors: [], fontStyle: "helvetica", footerText: "",
        defaultTaxEnabled: false, defaultTaxRate: 18, defaultPaymentMethod: "Transferencia", defaultNcfType: "B02", ncfSequences: [], ...snap.data() }
      data.ncfSequences = (data.ncfSequences || []).map(normalizeNcfSequence)
      setCompany(data); setCompanyDraft(data)
      if (data.logoBase64) setLogoPreview(data.logoBase64)
    }
  }

  useEffect(() => { fetchQuotes(); fetchCompany() }, [user])

  // ── Logo handler ───────────────────────────────────────────────────────
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target.result
      setLogoPreview(dataUrl)
      setCompanyDraft(prev => ({ ...prev, logoBase64: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleExtractColor = async () => {
    if (!logoPreview) return
    setExtracting(true)
    const colors = await extractColorsFromImage(logoPreview)
    setCompanyDraft(prev => ({ ...prev, brandColor: colors[0], brandColors: colors }))
    setExtracting(false)
  }

  // ── Save company profile ───────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const normalizedDraft = {
        ...companyDraft,
        ncfSequences: (companyDraft.ncfSequences || []).map(seq => {
          const normalized = normalizeNcfSequence(seq)
          return { ...normalized, status: getSequenceRuntimeStatus(normalized) === "agotada" ? "agotada" : normalized.status }
        }),
      }
      const invalidSequence = normalizedDraft.ncfSequences.find(seq =>
        !seq.type || !seq.prefix || !seq.expiresAt || seq.start <= 0 || seq.end < seq.start || seq.next < seq.start || seq.next > seq.end + 1
      )
      if (invalidSequence) {
        alert("Revisa las secuencias NCF: tipo, prefijo, rango, próximo número y vencimiento son obligatorios y deben ser válidos.")
        setSavingProfile(false)
        return
      }
      await setDoc(doc(db, "company_profiles", user.uid), { ...normalizedDraft, uid: user.uid, updatedAt: new Date() })
      setCompany({ ...normalizedDraft })
      setCompanyDraft({ ...normalizedDraft })
      setProfileOpen(false)
    } catch (e) { console.error(e) }
    setSavingProfile(false)
  }

  // ── Quote logic ────────────────────────────────────────────────────────
  const buildFinancials = (items, source = form) => {
    const subtotal = calcSubtotal(items)
    const taxAmount = calcTax(subtotal, source.taxEnabled, source.taxRate)
    return { subtotal, taxAmount, total: subtotal + taxAmount }
  }

  const handleEdit = (quote) => {
    setEditingQuote(quote)
    setForm({ cliente: quote.cliente, fiscalName: quote.fiscalName || quote.cliente || "", email: quote.email || "", telefono: quote.telefono || "",
      clienteId: quote.clienteId || "", clienteRnc: quote.clienteRnc || "", direccionCliente: quote.direccionCliente || "",
      moneda: quote.moneda || "USD", nota: quote.nota || "", validez: quote.validez || "",
      ncf: quote.ncf || "", ncfType: quote.ncfType || company.defaultNcfType || "B02", fiscalRequested: quote.fiscalRequested === true,
      metodoPago: quote.metodoPago || company.defaultPaymentMethod || "Transferencia",
      taxEnabled: quote.taxEnabled === true, taxRate: quote.taxRate ?? company.defaultTaxRate ?? 18 })
    setServicios(quote.servicios || [{ descripcion: "", cantidad: 1, precio: 0 }])
    setSelectedTpl(quote.template || "minimal")
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.cliente.trim()) return
    if (getNcfTypeInfo(form.ncfType).requiresFiscalId && !form.clienteRnc && !form.clienteId) {
      alert(`Para usar ${form.ncfType}, agrega el RNC o cédula fiscal del cliente.`)
      return
    }
    const financials = buildFinancials(servicios)
    if (editingQuote) {
      await updateDoc(doc(db, "quotes", editingQuote.id), {
        ...form, servicios, ...financials, template: selectedTpl,
      })
      setSelectedQuote(prev => ({ ...prev, ...form, servicios, ...financials, template: selectedTpl }))
    } else {
      await addDoc(collection(db, "quotes"), {
        uid: user.uid, ...form, servicios, ...financials,
        estado: "Borrador", template: selectedTpl, tipo: "cotizacion",
        numero: `COT-${Date.now().toString().slice(-6)}`, creadoEn: new Date()
      })
    }
    setModalOpen(false); setEditingQuote(null); resetForm(); fetchQuotes()
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este documento?")) return
    await deleteDoc(doc(db, "quotes", id))
    setSelectedQuote(null); fetchQuotes()
  }

  const reserveNcfForInvoice = async (transaction, companyRef, quoteRef, payload, ncfType) => {
    const companySnap = await transaction.get(companyRef)
    if (!companySnap.exists()) throw new Error("Configura primero el perfil de empresa.")

    const companyData = companySnap.data()
    const sequences = (companyData.ncfSequences || []).map(normalizeNcfSequence)
    const index = sequences.findIndex(seq => seq.type === ncfType && getSequenceRuntimeStatus(seq) === "activa")
    if (index === -1) throw new Error(`No hay una secuencia activa disponible para ${ncfType}.`)

    const seq = sequences[index]
    const number = seq.next
    const ncf = formatNcf(seq, number)
    const allocationRef = doc(db, "ncf_allocations", `${user.uid}_${ncf}`)
    const allocationSnap = await transaction.get(allocationRef)
    if (allocationSnap.exists()) throw new Error(`El NCF ${ncf} ya fue usado. Revisa la secuencia.`)

    const nextValue = number + 1
    sequences[index] = {
      ...seq,
      next: nextValue,
      status: nextValue > seq.end ? "agotada" : seq.status,
      updatedAt: new Date(),
    }

    transaction.set(quoteRef, { ...payload, ncf, ncfType, ncfSequenceId: seq.id, ncfNumber: number })
    transaction.set(allocationRef, {
      uid: user.uid,
      ncf,
      ncfType,
      quoteId: quoteRef.id,
      sequenceId: seq.id,
      createdAt: new Date(),
    })
    transaction.update(companyRef, { ncfSequences: sequences, updatedAt: new Date() })
    return ncf
  }

  const handleConvertToInvoice = async (quote) => {
    const taxEnabled = quote.taxEnabled ?? company.defaultTaxEnabled ?? false
    const taxRate = quote.taxRate ?? company.defaultTaxRate ?? 18
    const subtotal = calcSubtotal(quote.servicios || [])
    const taxAmount = calcTax(subtotal, taxEnabled, taxRate)
    const ncfType = quote.ncfType || company.defaultNcfType || "B02"
    const ncfInfo = getNcfTypeInfo(ncfType)
    if (ncfInfo.requiresFiscalId && !quote.clienteRnc && !quote.clienteId) {
      alert(`Para emitir ${ncfType}, agrega el RNC o cédula fiscal del cliente.`)
      return
    }
    const quoteRef = doc(collection(db, "quotes"))
    const companyRef = doc(db, "company_profiles", user.uid)
    const payload = {
      uid: user.uid, cliente: quote.cliente, fiscalName: quote.fiscalName || quote.cliente || "", email: quote.email || "",
      telefono: quote.telefono || "", clienteId: quote.clienteId || "", clienteRnc: quote.clienteRnc || "",
      direccionCliente: quote.direccionCliente || "", moneda: quote.moneda || "USD",
      nota: quote.nota || "", validez: quote.validez || "",
      fiscalRequested: quote.fiscalRequested === true,
      metodoPago: quote.metodoPago || company.defaultPaymentMethod || "Transferencia",
      taxEnabled,
      taxRate,
      servicios: quote.servicios, subtotal, taxAmount, total: subtotal + taxAmount, estado: "Emitida",
      template: quote.template || "minimal", tipo: "factura",
      numero: `FAC-${Date.now().toString().slice(-6)}`,
      cotizacionRef: quote.id, creadoEn: new Date(),
    }
    try {
      await runTransaction(db, transaction => reserveNcfForInvoice(transaction, companyRef, quoteRef, payload, ncfType))
    } catch (err) {
      alert(err.message || "No se pudo asignar el NCF.")
      return
    }
    fetchQuotes(); setActiveTab("facturas"); setSelectedQuote(null)
  }

  const handleUpdateEstado = async (id, estado) => {
    await updateDoc(doc(db, "quotes", id), { estado })
    setSelectedQuote(prev => prev?.id === id ? { ...prev, estado } : prev)
    fetchQuotes()
  }

  const resetForm = () => {
    const defaultType = company.defaultNcfType || "B02"
    setForm({
      cliente: "", fiscalName: "", email: "", telefono: "", clienteId: "", clienteRnc: "", direccionCliente: "",
      moneda: "USD", nota: "", validez: "", ncf: "", ncfType: defaultType, fiscalRequested: getNcfTypeInfo(defaultType).requiresFiscalId,
      metodoPago: company.defaultPaymentMethod || "Transferencia",
      taxEnabled: company.defaultTaxEnabled || false, taxRate: company.defaultTaxRate || 18
    })
    setServicios([{ descripcion: "", cantidad: 1, precio: 0 }])
    setSelectedTpl("minimal")
  }

  const handleDownloadPDF = (quote) => {
    const gen = PDF_GENERATORS[quote.template || "minimal"] || generateMinimalPDF
    gen(quote, company)
  }

  const updateNcfSequence = (id, patch) => {
    setCompanyDraft(prev => ({
      ...prev,
      ncfSequences: (prev.ncfSequences || []).map(seq => {
        if (seq.id !== id) return seq
        const next = normalizeNcfSequence({ ...seq, ...patch })
        if (patch.type && !patch.prefix) next.prefix = String(patch.type).toUpperCase()
        return next
      }),
    }))
  }

  const addNcfSequence = () => {
    setCompanyDraft(prev => ({ ...prev, ncfSequences: [...(prev.ncfSequences || []), emptyNcfSequence()] }))
  }

  const removeNcfSequence = (id) => {
    setCompanyDraft(prev => ({ ...prev, ncfSequences: (prev.ncfSequences || []).filter(seq => seq.id !== id) }))
  }

  const { subtotal, taxAmount, total } = buildFinancials(servicios)
  const filteredQuotes = quotes.filter(q => {
    if (activeTab === "cotizaciones") return !q.tipo || q.tipo === "cotizacion"
    if (activeTab === "facturas") return q.tipo === "factura"
    return true
  })

  const brandCss = company.brandColor || "#6022EC"

  return (
    <DashboardLayout>

      {/* ── Header ── */}
      <div className="mb-5 flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2">
            <FileText size={20} className="text-primary-light" />Cotizaciones & Facturas
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            {quotes.filter(q => !q.tipo || q.tipo === "cotizacion").length} cotizaciones · {quotes.filter(q => q.tipo === "factura").length} facturas
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => { setCompanyDraft({ ...company }); setLogoPreview(company.logoBase64 || ""); setProfileOpen(true) }}
            className="flex items-center gap-1.5 bg-bg-card border border-border text-text-muted text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:border-primary/40 hover:text-primary-light transition focus:outline-none"
          >
            <Building2 size={13} /><span className="hidden sm:inline">Perfil empresa</span><span className="sm:hidden">Empresa</span>
          </button>
          <button
            onClick={() => { resetForm(); setModalOpen(true) }}
            className="bg-primary text-white font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-xs sm:text-sm focus:outline-none"
          >
            + Nueva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

        {/* ── Lista ── */}
        <div className={`sm:col-span-1 space-y-3 ${selectedQuote ? "hidden sm:block" : "block"}`}>
          <div className="flex bg-bg-hover border border-border rounded-xl p-1 gap-1">
            {[{ key: "cotizaciones", label: "Cotizaciones" }, { key: "facturas", label: "Facturas" }].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedQuote(null) }}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition focus:outline-none ${
                  activeTab === tab.key ? "bg-primary text-white shadow" : "text-text-muted hover:text-text-main"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredQuotes.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-bg-hover border border-border flex items-center justify-center mx-auto mb-2">
                <FileText size={18} className="text-text-muted" />
              </div>
              <p className="text-text-muted text-xs">Sin {activeTab}</p>
            </div>
          ) : filteredQuotes.map(quote => {
            const estadosList = quote.tipo === "factura" ? ESTADOS_FACTURA : ESTADOS
            const estado = estadosList.find(e => e.label === quote.estado)
            return (
              <div
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className={`flex flex-col gap-2 px-4 py-3 rounded-xl border cursor-pointer transition ${
                  selectedQuote?.id === quote.id ? "bg-primary/10 border-primary/30" : "bg-bg-card border-border hover:bg-bg-hover"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-mono">{quote.numero}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${estado?.color}`}>{quote.estado}</span>
                </div>
                <p className="text-sm font-medium text-text-main truncate">{quote.cliente}</p>
                <p className="text-sm font-bold text-primary-light">{quote.moneda} {fmt(getQuoteAmounts(quote).total)}</p>
              </div>
            )
          })}
        </div>

        {/* ── Detalle ── */}
        <div className="col-span-1 sm:col-span-2">
          {/* Mobile back button */}
          {selectedQuote && (
            <button
              onClick={() => setSelectedQuote(null)}
              className="sm:hidden flex items-center gap-2 text-text-muted text-sm mb-3 hover:text-text-main transition"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Cotizaciones
            </button>
          )}
          {!selectedQuote ? (
            <div className="hidden sm:flex bg-bg-card border border-border rounded-2xl p-16 text-center flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-bg-hover border border-border flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-text-muted" />
              </div>
              <p className="text-text-muted">Selecciona una cotización para verla</p>
            </div>
          ) : (
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-text-muted text-xs font-mono">{selectedQuote.numero}</p>
                    {selectedQuote.tipo === "factura" && (
                      <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">FACTURA</span>
                    )}
                  </div>
                  <h2 className="text-text-main font-bold text-lg">{selectedQuote.cliente}</h2>
                  {selectedQuote.email    && <p className="text-text-muted text-xs">{selectedQuote.email}</p>}
                  {selectedQuote.telefono && <p className="text-text-muted text-xs">{selectedQuote.telefono}</p>}
                  {selectedQuote.fiscalName && selectedQuote.fiscalName !== selectedQuote.cliente && <p className="text-text-muted text-xs">Razón social: {selectedQuote.fiscalName}</p>}
                  {(() => {
                    const fiscalId = getClientFiscalId(selectedQuote)
                    return fiscalId ? <p className="text-text-muted text-xs">{fiscalId.label}: {fiscalId.value}</p> : null
                  })()}
                  {selectedQuote.ncf && <p className="text-green-400 text-xs font-mono mt-1">NCF asignado: {selectedQuote.ncf}</p>}
                  {selectedQuote.ncfType && <p className="text-text-muted text-xs">Tipo NCF: {selectedQuote.ncfType}</p>}
                  {selectedQuote.metodoPago && <p className="text-text-muted text-xs">Pago: {selectedQuote.metodoPago}</p>}
                </div>
                <div className="flex flex-col gap-2 items-start sm:items-end flex-shrink-0">
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {(selectedQuote.tipo === "factura" ? ESTADOS_FACTURA : ESTADOS).map(e => (
                      <button
                        key={e.label}
                        onClick={() => handleUpdateEstado(selectedQuote.id, e.label)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition focus:outline-none ${
                          selectedQuote.estado === e.label ? e.color + " font-semibold" : "bg-bg-card border-border text-text-muted hover:bg-bg-hover"
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button onClick={() => handleEdit(selectedQuote)} className="flex items-center gap-1.5 bg-bg-input border border-border text-text-muted text-sm px-3 py-2 rounded-xl hover:border-primary/40 hover:text-primary-light transition focus:outline-none">
                      <Pencil size={13} />Editar
                    </button>
                    {(!selectedQuote.tipo || selectedQuote.tipo === "cotizacion") && (
                      <button onClick={() => handleConvertToInvoice(selectedQuote)} className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-3 py-2 rounded-xl hover:bg-green-500/20 transition focus:outline-none">
                        <Receipt size={13} />Factura
                      </button>
                    )}
                    {isPro ? (
                      <button onClick={() => navigate(`/quotes/ver/${selectedQuote.id}`)} className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-primary-light text-sm px-3 py-2 rounded-xl hover:bg-primary/30 transition focus:outline-none">
                        <Monitor size={13} />Presentar
                      </button>
                    ) : (
                      <button onClick={() => navigate("/subscription")} title="Disponible en plan Pro" className="flex items-center gap-1.5 bg-bg-input border border-border text-text-muted/40 text-sm px-3 py-2 rounded-xl cursor-pointer hover:border-amber-500/40 hover:text-amber-400 transition focus:outline-none">
                        <Lock size={13} />Presentar
                      </button>
                    )}
                    {isPro ? (
                      <button onClick={() => handleDownloadPDF(selectedQuote)} className="flex items-center gap-1.5 bg-bg-input border border-border text-text-muted text-sm px-3 py-2 rounded-xl hover:border-primary/40 hover:text-primary-light transition focus:outline-none">
                        <Download size={13} />PDF
                      </button>
                    ) : (
                      <button onClick={() => navigate("/subscription")} title="Disponible en plan Pro" className="flex items-center gap-1.5 bg-bg-input border border-border text-text-muted/40 text-sm px-3 py-2 rounded-xl cursor-pointer hover:border-amber-500/40 hover:text-amber-400 transition focus:outline-none">
                        <Lock size={13} />PDF
                      </button>
                    )}
                    <button onClick={() => handleDelete(selectedQuote.id)} className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-xl hover:bg-red-500/20 transition focus:outline-none">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-bg-input border border-border rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase">Descripción</th>
                      <th className="text-center px-4 py-3 text-text-muted font-medium text-xs uppercase">Cant.</th>
                      <th className="text-right px-4 py-3 text-text-muted font-medium text-xs uppercase">Precio</th>
                      <th className="text-right px-4 py-3 text-text-muted font-medium text-xs uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.servicios?.map((s, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-4 py-3 text-text-main">{s.descripcion}</td>
                        <td className="px-4 py-3 text-text-muted text-center">{s.cantidad}</td>
                        <td className="px-4 py-3 text-text-muted text-right">{selectedQuote.moneda} {fmt(parseFloat(s.precio))}</td>
                        <td className="px-4 py-3 text-text-main text-right font-medium">
                          {selectedQuote.moneda} {fmt(parseFloat(s.precio) * parseInt(s.cantidad))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-4">
                <div className="bg-primary/20 border border-primary/30 rounded-xl px-6 py-3 min-w-56">
                  {(() => {
                    const amounts = getQuoteAmounts(selectedQuote)
                    return (
                      <>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-8 text-text-muted"><span>Subtotal</span><span>{selectedQuote.moneda} {fmt(amounts.subtotal)}</span></div>
                          {amounts.taxEnabled && (
                            <div className="flex justify-between gap-8 text-text-muted"><span>ITBIS ({fmt(amounts.taxRate, 0)}%)</span><span>{selectedQuote.moneda} {fmt(amounts.taxAmount)}</span></div>
                          )}
                        </div>
                        <p className="text-text-muted text-xs mt-2 mb-1">Total</p>
                        <p className="text-primary-light font-bold text-xl">{selectedQuote.moneda} {fmt(amounts.total)}</p>
                      </>
                    )
                  })()}
                </div>
              </div>

              {selectedQuote.nota && (
                <div className="bg-bg-input border border-border rounded-xl px-4 py-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Nota</p>
                  <p className="text-text-main text-sm">{selectedQuote.nota}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL PERFIL EMPRESA ── */}
      {profileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-y-auto animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl my-auto animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-text-main font-semibold">Perfil de empresa</h2>
                <p className="text-text-muted text-xs mt-0.5">Aparecerá en tus cotizaciones y facturas PDF</p>
              </div>
              <button onClick={() => setProfileOpen(false)} className="text-text-muted hover:text-text-main focus:outline-none"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="block text-xs text-text-muted mb-2">Logo de la empresa</label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-bg-input flex items-center justify-center cursor-pointer transition"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-h-16 max-w-[160px] object-contain" />
                  ) : (
                    <div className="text-center">
                      <ImagePlus size={22} className="text-text-muted mx-auto mb-1" />
                      <p className="text-text-muted text-xs">Click para subir logo</p>
                      <p className="text-text-muted/50 text-[10px]">PNG o JPG recomendado</p>
                    </div>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                {logoPreview && (
                  <button onClick={() => { setLogoPreview(""); setCompanyDraft(prev => ({ ...prev, logoBase64: "" })) }} className="text-xs text-red-400 mt-1 hover:text-red-300 focus:outline-none">
                    Quitar logo
                  </button>
                )}
              </div>

              {/* Datos empresa */}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre de la empresa *" value={companyDraft.nombre} onChange={v => setCompanyDraft(p => ({ ...p, nombre: v }))} placeholder="Tu Empresa SRL" />
                <Input label="Eslogan / Tagline" value={companyDraft.tagline} onChange={v => setCompanyDraft(p => ({ ...p, tagline: v }))} placeholder="Tu slogan aquí" />
                <Input label="Correo electrónico" value={companyDraft.email} onChange={v => setCompanyDraft(p => ({ ...p, email: v }))} placeholder="hola@tuempresa.com" type="email" />
                <Input label="Teléfono" value={companyDraft.telefono} onChange={v => setCompanyDraft(p => ({ ...p, telefono: v }))} placeholder="+1 809 000 0000" />
                <Input label="Dirección" value={companyDraft.direccion} onChange={v => setCompanyDraft(p => ({ ...p, direccion: v }))} placeholder="Ciudad, País" className="col-span-2" />
                <Input label="Sitio web" value={companyDraft.web} onChange={v => setCompanyDraft(p => ({ ...p, web: v }))} placeholder="www.tuempresa.com" />
                <Input label="RNC" value={companyDraft.rnc} onChange={v => setCompanyDraft(p => ({ ...p, rnc: v }))} placeholder="1-01-12345-6" />
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt size={14} className="text-green-400" />
                  <p className="text-xs text-text-muted uppercase tracking-wider">Preferencias fiscales</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-text-muted mb-1.5">Tipo de comprobante por defecto</label>
                    <select
                      value={companyDraft.defaultNcfType || "B01"}
                      onChange={e => setCompanyDraft(p => ({ ...p, defaultNcfType: e.target.value }))}
                      className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {NCF_TYPES.map(item => <option key={item.type} value={item.type}>{item.label}</option>)}
                    </select>
                  </div>
                  <label className="col-span-2 flex items-center justify-between gap-3 bg-bg-input border border-border rounded-xl px-4 py-3">
                    <span>
                      <span className="block text-sm text-text-main font-medium">Aplicar ITBIS por defecto</span>
                      <span className="block text-[11px] text-text-muted">Puedes cambiarlo en cada cotización o factura.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={companyDraft.defaultTaxEnabled || false}
                      onChange={e => setCompanyDraft(p => ({ ...p, defaultTaxEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                  </label>
                  <Input label="ITBIS por defecto (%)" type="number" value={companyDraft.defaultTaxRate ?? 18} onChange={v => setCompanyDraft(p => ({ ...p, defaultTaxRate: v }))} placeholder="18" />
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5">Método de pago por defecto</label>
                    <select
                      value={companyDraft.defaultPaymentMethod || "Transferencia"}
                      onChange={e => setCompanyDraft(p => ({ ...p, defaultPaymentMethod: e.target.value }))}
                      className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-text-main font-medium">Secuencias NCF autorizadas</p>
                      <p className="text-[11px] text-text-muted">Registra los rangos aprobados por DGII. El próximo NCF se asigna automáticamente al emitir factura.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addNcfSequence}
                      className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-xl hover:bg-green-500/20 transition"
                    >
                      + Secuencia
                    </button>
                  </div>

                  {(companyDraft.ncfSequences || []).length === 0 ? (
                    <div className="bg-bg-input border border-border rounded-xl px-4 py-4 text-center">
                      <p className="text-text-muted text-xs">No hay secuencias configuradas.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(companyDraft.ncfSequences || []).map(seq => {
                        const normalized = normalizeNcfSequence(seq)
                        const runtimeStatus = getSequenceRuntimeStatus(normalized)
                        return (
                          <div key={normalized.id} className="bg-bg-input border border-border rounded-xl p-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <select
                                value={normalized.type}
                                onChange={e => updateNcfSequence(normalized.id, { type: e.target.value, prefix: e.target.value })}
                                className="bg-bg-card border border-border text-text-main rounded-lg px-2 py-2 text-xs focus:outline-none"
                              >
                                {NCF_TYPES.map(item => <option key={item.type} value={item.type}>{item.label}</option>)}
                              </select>
                              <span className={`text-[10px] px-2 py-1 rounded-full border ${
                                runtimeStatus === "activa"
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : runtimeStatus === "agotada"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : "bg-red-500/10 text-red-400 border-red-500/30"
                              }`}>
                                {runtimeStatus}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeNcfSequence(normalized.id)}
                                className="text-red-400 hover:text-red-300 p-1"
                                aria-label="Eliminar secuencia"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <Input label="Prefijo" value={normalized.prefix} onChange={v => updateNcfSequence(normalized.id, { prefix: v.toUpperCase() })} placeholder="B01" />
                              <Input label="Inicial" type="number" value={normalized.start} onChange={v => updateNcfSequence(normalized.id, { start: v })} placeholder="1" />
                              <Input label="Final" type="number" value={normalized.end} onChange={v => updateNcfSequence(normalized.id, { end: v })} placeholder="99999999" />
                              <Input label="Próximo" type="number" value={normalized.next} onChange={v => updateNcfSequence(normalized.id, { next: v })} placeholder="1" />
                              <Input label="Vence" type="date" value={normalized.expiresAt} onChange={v => updateNcfSequence(normalized.id, { expiresAt: v })} />
                              <div>
                                <label className="block text-xs text-text-muted mb-1.5">Estado</label>
                                <select
                                  value={normalized.status}
                                  onChange={e => updateNcfSequence(normalized.id, { status: e.target.value })}
                                  className="w-full bg-bg-card border border-border text-text-main rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="activa">Activa</option>
                                  <option value="pausada">Pausada</option>
                                  <option value="agotada">Agotada</option>
                                </select>
                              </div>
                            </div>
                            <p className="text-[11px] text-text-muted">
                              Próximo NCF: <span className="font-mono text-text-main">{formatNcf(normalized, normalized.next)}</span>
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Personalización de documentos ── */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={14} className="text-primary-light" />
                  <p className="text-xs text-text-muted uppercase tracking-wider">Personalización de documentos</p>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  {/* Color de marca */}
                  <div className="col-span-2">
                    <label className="block text-xs text-text-muted mb-2">Color de marca</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={companyDraft.brandColor || "#6022EC"}
                          onChange={e => setCompanyDraft(p => ({ ...p, brandColor: e.target.value, brandColors: [] }))}
                          className="w-12 h-12 rounded-xl cursor-pointer border border-border bg-bg-input p-1"
                          title="Elige un color"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {companyDraft.brandColors?.length > 1 ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-5 flex-1 rounded-full border border-black/10"
                              style={{ background: `linear-gradient(to right, ${companyDraft.brandColors.join(", ")})` }}
                            />
                            <span className="text-text-muted text-[11px] shrink-0">{companyDraft.brandColors.length} colores</span>
                          </div>
                        ) : (
                          <p className="text-text-main text-sm font-mono font-medium">{companyDraft.brandColor || "#6022EC"}</p>
                        )}
                        <p className="text-text-muted text-[11px] mt-0.5">Se aplica a encabezados y plantillas del PDF</p>
                      </div>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleExtractColor}
                          disabled={extracting}
                          className="flex items-center gap-1.5 text-xs border border-primary/30 text-primary-light hover:bg-primary/10 rounded-xl px-3 py-2 transition disabled:opacity-50 focus:outline-none whitespace-nowrap"
                        >
                          <Pipette size={12} />
                          {extracting ? "Extrayendo..." : "Tomar del logo"}
                        </button>
                      )}
                    </div>

                    {/* Preview swatches */}
                    <div className="flex gap-2 mt-3">
                      {["#6022EC","#1E40AF","#0F766E","#B45309","#BE123C","#1D4ED8","#7C3AED","#059669"].map(c => (
                        <button
                          key={c}
                          onClick={() => setCompanyDraft(p => ({ ...p, brandColor: c, brandColors: [] }))}
                          title={c}
                          className={`w-7 h-7 rounded-lg border-2 transition focus:outline-none ${companyDraft.brandColor === c && !companyDraft.brandColors?.length ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tipografía */}
                  <div className="col-span-2">
                    <label className="block text-xs text-text-muted mb-2">Tipografía del documento</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONTS.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setCompanyDraft(p => ({ ...p, fontStyle: f.id }))}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition focus:outline-none ${
                            (companyDraft.fontStyle || "helvetica") === f.id
                              ? "bg-primary/10 border-primary/40 text-primary-light"
                              : "bg-bg-input border-border text-text-muted hover:border-primary/30 hover:text-text-main"
                          }`}
                        >
                          <span className="text-base leading-none w-5 text-center font-bold" style={{ fontFamily: f.label }}>A</span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{f.label}</p>
                            <p className="text-[10px] opacity-60 truncate">{f.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pie de página */}
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5">Texto de pie de página</label>
                    <input
                      type="text"
                      value={companyDraft.footerText || ""}
                      onChange={e => setCompanyDraft(p => ({ ...p, footerText: e.target.value }))}
                      placeholder="Generado con Stratega Planner"
                      className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                    />
                  </div>

                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setProfileOpen(false)} className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm focus:outline-none">Cancelar</button>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-60 focus:outline-none">
                {savingProfile ? "Guardando..." : "Guardar perfil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA COTIZACIÓN ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-y-auto animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-auto animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">{editingQuote ? "Editar cotización" : "Nueva cotización"}</h2>
              <button onClick={() => { setModalOpen(false); setEditingQuote(null); resetForm() }} className="text-text-muted hover:text-text-main focus:outline-none"><X size={18} /></button>
            </div>

            <div className="space-y-5">

              {/* Plantilla */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Plantilla del PDF</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: brandCss }} />
                    Color de marca aplicado
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTpl(tpl.id)}
                      className={`relative rounded-xl border-2 p-3 text-left transition focus:outline-none ${
                        selectedTpl === tpl.id ? "border-primary bg-primary/10" : "border-border bg-bg-input hover:border-border/80"
                      }`}
                    >
                      {/* Mini preview */}
                      <div className="w-full h-14 rounded-lg mb-2 overflow-hidden" style={{ backgroundColor: tpl.bg }}>
                        {/* Color stripe from brand */}
                        <div className="w-full h-2.5" style={{ backgroundColor: brandCss }} />
                        <div className="p-1.5 space-y-1">
                          <div className="h-1.5 rounded w-1/2" style={{ backgroundColor: tpl.id === "dark" ? "#2A2A3E" : "#E5E7EB" }} />
                          <div className="h-1 rounded w-3/4"   style={{ backgroundColor: tpl.id === "dark" ? "#1E1E2E" : "#F3F4F6" }} />
                          {/* Simulated table row with brand color header */}
                          <div className="mt-1 rounded h-2" style={{ backgroundColor: `${brandCss}55` }} />
                          <div className="rounded h-1.5" style={{ backgroundColor: tpl.id === "dark" ? "#1E1E2E" : "#F3F4F6" }} />
                        </div>
                      </div>
                      <p className="text-text-main text-xs font-semibold">{tpl.name}</p>
                      <p className="text-text-muted text-[10px]">{tpl.desc}</p>
                      {selectedTpl === tpl.id && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos cliente */}
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Datos del cliente</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nombre del cliente *" value={form.cliente} onChange={v => setForm(p => ({ ...p, cliente: v }))} placeholder="Empresa ABC" />
                  <Input label="Correo" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="cliente@correo.com" type="email" />
                  <Input label="Teléfono" value={form.telefono} onChange={v => setForm(p => ({ ...p, telefono: v }))} placeholder="+1 809 000 0000" />
                  <Input label="Válida hasta" value={form.validez} onChange={v => setForm(p => ({ ...p, validez: v }))} type="date" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5">Moneda</label>
                    <select value={form.moneda} onChange={e => setForm(p => ({ ...p, moneda: e.target.value }))} className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5">Método de pago</label>
                    <select value={form.metodoPago} onChange={e => setForm(p => ({ ...p, metodoPago: e.target.value }))} className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-between gap-3 bg-bg-input border border-border rounded-xl px-4 py-2.5">
                      <span className="text-xs text-text-muted">ITBIS</span>
                      <input
                        type="checkbox"
                        checked={form.taxEnabled || false}
                        onChange={e => setForm(p => ({ ...p, taxEnabled: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                    </label>
                    <Input label="%" type="number" value={form.taxRate} onChange={v => setForm(p => ({ ...p, taxRate: v }))} placeholder="18" />
                  </div>
                </div>
              </div>

              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-green-400 uppercase tracking-wider font-semibold">Comprobante fiscal del cliente</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Selecciona el tipo autorizado y completa los datos fiscales que el cliente te entregue.</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-text-muted">
                    <input
                      type="checkbox"
                      checked={form.fiscalRequested}
                      onChange={e => setForm(p => ({
                        ...p,
                        fiscalRequested: e.target.checked,
                        ncfType: e.target.checked ? "B01" : "B02",
                      }))}
                      disabled={editingQuote?.tipo === "factura" && !!editingQuote?.ncf}
                      className="w-4 h-4 accent-primary"
                    />
                    Solicita comprobante
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-text-muted mb-1.5">Tipo de comprobante fiscal</label>
                    <select
                      value={form.ncfType || "B02"}
                      onChange={e => setForm(p => ({
                        ...p,
                        ncfType: e.target.value,
                        fiscalRequested: p.fiscalRequested || getNcfTypeInfo(e.target.value).requiresFiscalId,
                      }))}
                      disabled={editingQuote?.tipo === "factura" && !!editingQuote?.ncf}
                      className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                    >
                      {NCF_TYPES.map(item => <option key={item.type} value={item.type}>{item.label}</option>)}
                    </select>
                    {(() => {
                      const seq = getActiveNcfSequence(company.ncfSequences || [], form.ncfType || "B02")
                      return (
                        <p className={`text-[11px] mt-1 ${seq ? "text-green-400" : "text-amber-400"}`}>
                          {editingQuote?.ncf
                            ? <>NCF asignado: <span className="font-mono">{editingQuote.ncf}</span></>
                            : seq
                              ? <>Próximo NCF disponible: <span className="font-mono">{formatNcf(seq, seq.next)}</span></>
                              : "No hay secuencia activa para este tipo. Configúrala en Perfil de empresa."}
                        </p>
                      )
                    })()}
                  </div>

                  <Input label="Razón social fiscal" value={form.fiscalName} onChange={v => setForm(p => ({ ...p, fiscalName: v }))} placeholder="Nombre legal del cliente" className="col-span-2" />
                  <Input label="RNC fiscal del cliente" value={form.clienteRnc} onChange={v => setForm(p => ({ ...p, clienteRnc: v, clienteId: v.trim() ? "" : p.clienteId }))} placeholder="1-01-12345-6" />
                  <Input label="Cédula fiscal del cliente" value={form.clienteId} onChange={v => setForm(p => ({ ...p, clienteId: v, clienteRnc: v.trim() ? "" : p.clienteRnc }))} placeholder="001-0000000-0" />
                  <Input label="Dirección fiscal" value={form.direccionCliente} onChange={v => setForm(p => ({ ...p, direccionCliente: v }))} placeholder="Ciudad, País" className="col-span-2" />
                </div>
              </div>

              {/* Servicios */}
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Servicios</p>
                <div className="space-y-3">
                  {servicios.map((s, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <input
                        type="text"
                        value={s.descripcion}
                        onChange={e => { const u = [...servicios]; u[i].descripcion = e.target.value; setServicios(u) }}
                        placeholder="Descripción del servicio"
                        className="col-span-12 sm:col-span-6 bg-bg-input border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                      />
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 px-1">Cantidad</label>
                        <input
                          type="number"
                          value={s.cantidad}
                          onChange={e => { const u = [...servicios]; u[i].cantidad = e.target.value; setServicios(u) }}
                          min="1"
                          className="w-full bg-bg-input border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 px-1">Precio unit.</label>
                        <input
                          type="number"
                          value={s.precio}
                          onChange={e => { const u = [...servicios]; u[i].precio = e.target.value; setServicios(u) }}
                          min="0"
                          className="w-full bg-bg-input border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <button
                        onClick={() => setServicios(servicios.filter((_, idx) => idx !== i))}
                        disabled={servicios.length === 1}
                        className="col-span-2 sm:col-span-1 flex items-center justify-center text-red-400 hover:text-red-300 disabled:opacity-20 focus:outline-none p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setServicios([...servicios, { descripcion: "", cantidad: 1, precio: 0 }])} className="text-primary-light text-sm hover:text-accent transition mt-3 focus:outline-none">
                  + Agregar servicio
                </button>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 min-w-56">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-8 text-text-muted"><span>Subtotal</span><span>{form.moneda} {fmt(subtotal)}</span></div>
                    {form.taxEnabled && (
                      <div className="flex justify-between gap-8 text-text-muted"><span>ITBIS ({fmt(form.taxRate, 0)}%)</span><span>{form.moneda} {fmt(taxAmount)}</span></div>
                    )}
                  </div>
                  <p className="text-text-muted text-xs mt-2">Total estimado</p>
                  <p className="text-primary-light font-bold text-lg">{form.moneda} {fmt(total)}</p>
                </div>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Nota (opcional)</label>
                <textarea value={form.nota} onChange={e => setForm(p => ({ ...p, nota: e.target.value }))} placeholder="Términos, condiciones o notas adicionales..." rows={2} className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalOpen(false); setEditingQuote(null); resetForm() }} className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm focus:outline-none">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 focus:outline-none">
                {editingQuote ? "Guardar cambios" : "Guardar cotización"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Quotes
