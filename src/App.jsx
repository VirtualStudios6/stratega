import { Routes, Route, Navigate } from "react-router-dom"
import { Capacitor } from "@capacitor/core"
import { useAuth } from "./context/AuthContext"
import Landing from "./pages/Landing/Landing"
import Terms from "./pages/Legal/Terms"
import Privacy from "./pages/Legal/Privacy"
import Login from "./pages/Auth/Login"
import Register from "./pages/Auth/Register"
import ForgotPassword from "./pages/Auth/ForgotPassword"
import Dashboard from "./pages/Dashboard/Dashboard"
import Planner from "./pages/Planner/Planner"
import Feed from "./pages/Feed/Feed"
import Reminders from "./pages/Reminders/Reminders"
import Folders from "./pages/Folders/Folders"
import Quotes from "./pages/Quotes/Quotes"
import Accounting from "./pages/Accounting/Accounting"
import Team from "./pages/Team/Team"
import Settings from "./pages/Settings/Settings"
import Subscription from "./pages/Subscription/Subscription"
import QuotePresentation from "./pages/Quotes/QuotePresentation"
import PrivateRoute from "./components/shared/PrivateRoute"
import { useFCM } from "./hooks/useFCM"
import { useReminderNotifications } from "./hooks/useReminderNotifications"

// Guard para la ruta raíz "/":
// - Loggeado (web o nativo) → /dashboard
// - No loggeado + nativo (APK/iOS) → /login  (la Landing nunca se muestra en app nativa)
// - No loggeado + web → Landing
// AuthContext ya espera a que onAuthStateChanged resuelva antes de renderizar,
// por lo que no hay flash ni redirección prematura.
function RootRedirect() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  if (Capacitor.isNativePlatform()) return <Navigate to="/login" replace />
  return <Landing />
}

// Redirige al dashboard si el usuario ya está autenticado.
// Evita que un usuario loggeado pueda volver a /login, /register, etc.
function GuestRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  useFCM()
  useReminderNotifications()

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/planner" element={<PrivateRoute><Planner /></PrivateRoute>} />
      <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
      <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
      <Route path="/folders" element={<PrivateRoute><Folders /></PrivateRoute>} />
      <Route path="/quotes" element={<PrivateRoute><Quotes /></PrivateRoute>} />
      <Route path="/accounting" element={<PrivateRoute><Accounting /></PrivateRoute>} />
      <Route path="/team" element={<PrivateRoute><Team /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
      <Route path="/quotes/ver/:id" element={<PrivateRoute><QuotePresentation /></PrivateRoute>} />
    </Routes>
  )
}

export default App
