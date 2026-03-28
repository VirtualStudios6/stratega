import { useState, useRef, useEffect, useMemo } from "react"
import { askGroq } from "../../services/groq"
import { useAuth } from "../../context/AuthContext"
import { useTranslation } from "react-i18next"
import { X, RotateCcw, Send, Sparkles } from "lucide-react"
import useSubscriptionGuard from "../../hooks/useSubscriptionGuard"

const AIAssistant = () => {
  const { user } = useAuth()
  const { plan, isActive } = useSubscriptionGuard()
  const { t, i18n } = useTranslation()
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef        = useRef(null)

  const greeting = useMemo(() => ({
    role: "assistant",
    content: t("ai.greeting"),
  }), [t])

  const [chatMessages, setChatMessages] = useState([])
  const messages = useMemo(() => [greeting, ...chatMessages], [greeting, chatMessages])

  const systemPrompt = useMemo(() => {
    const lang     = i18n.language
    const langName = lang === "es" ? "Spanish" : "English"
    return `Stratega Planner IA, el asistente de IA de Stratega Planner, una app para community managers e influencers.
Ayudas con:
- Estrategias de redes sociales (Instagram, TikTok, Facebook, Twitter/X)
- Organización de contenido y planificación
- Sugerencias para mejorar el engagement
- Redacción de captions y copys
- Gestión del tiempo y productividad
- Cotizaciones y precios para servicios digitales
- Análisis de métricas y resultados

Always respond in ${langName}, in a concise, friendly and professional manner.
Use emojis occasionally to make responses more dynamic.
If asked something outside your area, redirect politely to marketing and social media topics.`
  }, [i18n.language])

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: "user", content: input }
    setChatMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)
    try {
      const response = await askGroq(input, systemPrompt)
      setChatMessages(prev => [...prev, { role: "assistant", content: response }])
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: t("ai.error_connect") }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatMessage = (text) =>
    text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>")

  // Only available on Pro plan (admins already get plan "pro")
  if (!isActive || plan !== "pro") return null

  const firstName     = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "U"
  const quickSuggestions = [
    t("ai.suggestion_ideas"),
    t("ai.suggestion_plan"),
    t("ai.suggestion_prices"),
    t("ai.suggestion_engagement"),
  ]

  return (
    <>
      <style>{`
        @keyframes ai-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb, 96,34,236), 0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(var(--primary-rgb, 96,34,236), 0); }
        }
        .ai-glow { animation: ai-glow-pulse 2.5s ease-in-out infinite; }
        @keyframes ai-scan {
          0%   { top: 0%;   opacity: 0.5; }
          50%  { opacity: 1; }
          100% { top: 100%; opacity: 0;  }
        }
        .ai-scan { animation: ai-scan 3s linear infinite; }
      `}</style>

      {/* ── Chat panel ── */}
      <div className={`
        fixed bottom-[5.5rem] sm:bottom-24 right-3 sm:right-5 z-50
        w-[calc(100vw-1.5rem)] sm:w-96
        bg-bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden
        transition-all duration-300 origin-bottom-right
        ${open
          ? "h-[70vh] sm:h-[540px] opacity-100 scale-100 pointer-events-auto"
          : "h-0 opacity-0 scale-95 pointer-events-none"
        }
      `}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-input flex-shrink-0">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 border border-border">
            <img src="/logos/stratega-ia.png" alt="AI" className="w-full h-full object-cover" />
            <div className="ai-scan absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-light/60 to-transparent pointer-events-none" />
          </div>
          <div className="flex-1">
            <p className="text-text-main font-semibold text-sm leading-none">Stratega AI</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <p className="text-text-muted text-[10px]">{t("ai.online")}</p>
            </div>
          </div>
          <button
            onClick={() => setChatMessages([])}
            className="text-text-muted hover:text-text-main transition p-1"
            title="Reiniciar chat"
          >
            <RotateCcw size={14} />
          </button>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-main transition p-1">
            <X size={16} />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg overflow-hidden mr-2 flex-shrink-0 mt-0.5 border border-border">
                  <img src="/logos/stratega-ia.png" alt="AI" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-bg-hover text-text-main rounded-tl-sm border border-border"
                }`}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
              {msg.role === "user" && (
                <div className="w-7 h-7 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center ml-2 flex-shrink-0 mt-0.5">
                  <span className="text-primary-light text-xs font-bold">{firstName[0].toUpperCase()}</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg overflow-hidden mr-2 flex-shrink-0 border border-border">
                <img src="/logos/stratega-ia.png" alt="AI" className="w-full h-full object-cover" />
              </div>
              <div className="bg-bg-hover border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias rápidas */}
        {chatMessages.length === 0 && (
          <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
            {quickSuggestions.map(s => (
              <button
                key={s}
                onClick={() => setInput(s.replace(/^[^\s]+\s/, ""))}
                className="text-xs bg-primary/10 border border-primary/20 text-primary-light px-3 py-1.5 rounded-xl hover:bg-primary/20 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("ai.placeholder")}
              rows={1}
              className="flex-1 bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary-light transition disabled:opacity-40 flex-shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
          <p className="text-text-muted/40 text-xs mt-1.5 text-center">{t("ai.enter_hint")}</p>
        </div>
      </div>

      {/* ── Botón principal — pill compacto ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          fixed bottom-20 sm:bottom-6 right-3 sm:right-5 z-50
          flex items-center gap-2.5 px-4 py-2.5 rounded-2xl
          border transition-all duration-300 shadow-lg
          hover:scale-105 active:scale-95 select-none
          ${open
            ? "bg-bg-card border-border text-text-muted hover:text-text-main"
            : "bg-primary border-primary/0 text-white ai-glow hover:bg-primary-light"
          }
        `}
      >
        {open ? (
          <>
            <X size={15} />
            <span className="text-sm font-semibold">Cerrar</span>
          </>
        ) : (
          <>
            <div className="relative w-5 h-5 rounded-lg overflow-hidden flex-shrink-0">
              <img src="/logos/stratega-ia.png" alt="AI" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold">Stratega AI</span>
            <Sparkles size={13} className="opacity-80" />
          </>
        )}
      </button>
    </>
  )
}

export default AIAssistant
