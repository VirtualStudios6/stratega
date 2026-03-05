export const askGroq = async (prompt, systemPrompt = "") => {
  const messages = []

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt })
  }
  messages.push({ role: "user", content: prompt })

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    })
  })

  const data = await response.json()

  if (!response.ok) {
    console.error("Groq error detalle:", JSON.stringify(data))
    throw new Error(data.error?.message || "Error con Groq API")
  }

  return data.choices[0]?.message?.content || ""
}
