import { useState, useRef, useEffect } from "react"
import { askGroq } from "../../services/groq"
import { useAuth } from "../../context/AuthContext"

const SYSTEM_PROMPT = `Stratega Planner IA, el asistente de IA de Stratega Planner, una app para community managers e influencers.
Ayudas con:
- Estrategias de redes sociales (Instagram, TikTok, Facebook, Twitter/X)
- Organización de contenido y planificación
- Sugerencias para mejorar el engagement
- Redacción de captions y copys
- Gestión del tiempo y productividad
- Cotizaciones y precios para servicios digitales
- Análisis de métricas y resultados

Responde siempre en español, de forma concisa, amigable y profesional.
Usa emojis ocasionalmente para hacer las respuestas más dinámicas.
Si te preguntan algo fuera de tu área, redirige amablemente al tema de marketing y redes sociales.`

const AIAssistant = () => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "¡Hola! Soy **Stratega Planner**, tu asistente de IA 🤖\n\n¿En qué puedo ayudarte hoy? Puedo ayudarte con estrategias de redes sociales, organización de contenido, cotizaciones y mucho más."
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: "user", content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)
    try {
      const response = await askGroq(input, SYSTEM_PROMPT)
      setMessages(prev => [...prev, { role: "assistant", content: response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Hubo un error al conectar con la IA. Intentelo mas tarde."
      }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>")
  }

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario"

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center z-50 transition-all
          ${open ? "bg-[#1E1E2E] border border-[#2A2A3E]" : "bg-primary shadow-primary/40 hover:bg-primary-light"}`}
      >
        {open ? (
          <span className="text-text-muted text-xl">✕</span>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[560px] bg-[#13131F] border border-[#2A2A3E] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#2A2A3E] bg-[#0D0D18]">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div className="flex-1">
              <p className="text-text-main font-semibold text-sm">Stratega AI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-text-muted text-xs">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setMessages([{
                role: "assistant",
                content: "Chat reiniciado. ¿En qué puedo ayudarte? 🤖"
              }])}
              className="text-text-muted hover:text-text-main text-xs transition"
            >
              🔄
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-sm">🤖</span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-[#1E1E2E] text-text-main rounded-tl-sm border border-[#2A2A3E]"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                {msg.role === "user" && (
                  <div className="w-7 h-7 bg-[#2A2A3E] rounded-lg flex items-center justify-center ml-2 flex-shrink-0 mt-0.5">
                    <span className="text-sm">{firstName[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="bg-[#1E1E2E] border border-[#2A2A3E] px-4 py-3 rounded-2xl rounded-tl-sm">
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
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {[
                "💡 Ideas para posts",
                "📅 Planificar contenido",
                "💰 Sugerir precios",
                "📊 Mejorar engagement",
              ].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s.slice(3))}
                  className="text-xs bg-primary/10 border border-primary/20 text-primary-light px-3 py-1.5 rounded-xl hover:bg-primary/20 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-[#2A2A3E]">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                className="flex-1 bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary-light transition disabled:opacity-40 flex-shrink-0"
              >
                <span className="text-white text-sm">➤</span>
              </button>
            </div>
            <p className="text-text-muted/40 text-xs mt-1.5 text-center">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        </div>
      )}
    </>
  )
}

export default AIAssistant
