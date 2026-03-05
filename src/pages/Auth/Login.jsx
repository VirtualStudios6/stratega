import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginWithEmail, loginWithGoogle } from "../../firebase/auth"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate("/dashboard")
    } catch (err) {
      setError("Correo o contraseña incorrectos")
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
      navigate("/dashboard")
    } catch (err) {
      setError("Error al iniciar con Google")
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-4 relative overflow-hidden">

      <div className="absolute w-72 h-72 bg-primary opacity-20 rounded-full blur-3xl -top-10 -left-10 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-primary-light opacity-10 rounded-full blur-3xl bottom-0 right-0 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-[#13131F] border border-[#2A2A3E] rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8">
            <img
              src="/logos/logo.png"
              alt="Stratega Planner"
              className="w-20 h-20 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Stratega Planner</h1>
            <p className="text-text-muted text-sm mt-1">Convierte ideas en resultados.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted/40 transition"
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-text-muted hover:text-primary-light transition">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 border-t border-[#2A2A3E]" />
            <span className="text-xs text-text-muted">o</span>
            <div className="flex-1 border-t border-[#2A2A3E]" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full bg-[#0D0D18] border border-[#2A2A3E] rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-[#1E1E2E] transition"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
            <span className="text-sm font-medium text-text-main">Continuar con Google</span>
          </button>

          <p className="text-center text-xs text-text-muted mt-6">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-primary-light font-medium hover:text-accent transition">
              Regístrate gratis
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © 2026 Stratega Planner. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default Login
