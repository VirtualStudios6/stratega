import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "../firebase/config"
import { onAuthStateChanged } from "firebase/auth"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

// Oculta el splash nativo tan pronto como el estado de auth es conocido.
// Reintenta hasta 3 veces con delay porque en algunos dispositivos Android
// el plugin no está listo en el primer intento.
const hideSplash = (attempt = 0) => {
  import("@capacitor/splash-screen")
    .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 300 }))
    .catch(() => {
      if (attempt < 3) setTimeout(() => hideSplash(attempt + 1), 500)
    })
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

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
