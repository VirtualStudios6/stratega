import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "../firebase/config"
import { onAuthStateChanged } from "firebase/auth"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsub
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
