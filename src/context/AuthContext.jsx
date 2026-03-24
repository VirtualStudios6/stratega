import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "../firebase/config"
import { onAuthStateChanged } from "firebase/auth"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

// Oculta el splash nativo tan pronto como el estado de auth es conocido.
// Se llama aquí (en lugar de en App.jsx) para garantizar que se ejecute
// incluso si hay errores posteriores en el árbol de componentes.
const hideSplash = () => {
  import("@capacitor/splash-screen")
    .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 300 }))
    .catch(() => {})
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
