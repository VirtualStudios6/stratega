import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "../firebase/config"
import { onAuthStateChanged } from "firebase/auth"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

// Duración mínima del splash: la animación dura 700 ms + 300 ms de fade = 1000 ms.
// Añadimos 400 ms de buffer para que el usuario perciba la transición completa.
const SPLASH_MIN_MS = 1400
const splashStart = Date.now()

// Oculta el splash respetando el tiempo mínimo para que la animación termine.
// Reintenta hasta 3 veces con delay porque en algunos dispositivos Android
// el plugin no está listo en el primer intento.
const hideSplash = (attempt = 0) => {
  const remaining = SPLASH_MIN_MS - (Date.now() - splashStart)
  const delay = Math.max(0, remaining)
  setTimeout(() => {
    import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 400 }))
      .catch(() => {
        if (attempt < 3) setTimeout(() => hideSplash(attempt + 1), 500)
      })
  }, delay)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout de seguridad: si onAuthStateChanged no dispara en 5 s
    // (p.ej. fallo de init del plugin nativo), desbloqueamos el render.
    const timeout = setTimeout(() => {
      setLoading(false)
      hideSplash()
    }, 5000)

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeout)
      setUser(currentUser)
      setLoading(false)
      hideSplash()
    })

    return () => {
      clearTimeout(timeout)
      unsub()
    }
  }, [])

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload()
      setUser({ ...auth.currentUser }) // new object triggers re-render for displayName etc.
    }
  }

  // Mientras onAuthStateChanged resuelve, mostramos un fondo con el color
  // del tema activo (sin spinner llamativo) para evitar el flash blanco/negro
  // que aparece cuando el splash se oculta antes de que React haya renderizado.
  if (loading) {
    return (
      <div
        style={{ minHeight: "100dvh", backgroundColor: "var(--bg-main)" }}
        className="flex items-center justify-center"
      >
        <div className="w-7 h-7 rounded-full border-2 border-border border-t-primary animate-spin opacity-60" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
