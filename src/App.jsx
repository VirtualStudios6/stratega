import { Routes, Route } from "react-router-dom"
import Landing from "./pages/Landing/Landing"
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
import PrivateRoute from "./components/shared/PrivateRoute"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
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
    </Routes>
  )
}

export default App
