import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
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

function App() {
  useFCM()
  useReminderNotifications()

  // Oculta el splash screen nativo solo cuando React ya terminó de renderizar.
  // launchAutoHide está en false en capacitor.config.ts para evitar pantalla negra en iOS.
  useEffect(() => {
    import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 300 }))
      .catch(() => { /* entorno web — se ignora */ })
  }, [])
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />
      <Route path="/planner" element={
        <PrivateRoute><Planner /></PrivateRoute>
      } />
      <Route path="/feed" element={
        <PrivateRoute><Feed /></PrivateRoute>
      } />
      <Route path="/reminders" element={
        <PrivateRoute><Reminders /></PrivateRoute>
      } />
      <Route path="/folders" element={
        <PrivateRoute><Folders /></PrivateRoute>
      } />
      <Route path="/quotes" element={
        <PrivateRoute><Quotes /></PrivateRoute>
      } />
      <Route path="/accounting" element={
        <PrivateRoute><Accounting /></PrivateRoute>
      } />
      <Route path="/team" element={
        <PrivateRoute><Team /></PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute><Settings /></PrivateRoute>
      } />
      <Route path="/subscription" element={
        <PrivateRoute><Subscription /></PrivateRoute>
      } />
      <Route path="/quotes/ver/:id" element={
        <PrivateRoute><QuotePresentation /></PrivateRoute>
      } />
    </Routes>
  )
}

export default App
