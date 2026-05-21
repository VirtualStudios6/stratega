import { getFunctions, httpsCallable } from "firebase/functions"

// Routes all Groq requests through a Cloud Function so the API key
// is never embedded in the client bundle.
export const askGroq = async (prompt, systemPrompt = "") => {
  const fn = httpsCallable(getFunctions(), "groqProxy")
  const result = await fn({ prompt, systemPrompt })
  return result.data?.content || ""
}
