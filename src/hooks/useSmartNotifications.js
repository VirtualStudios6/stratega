import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { db } from "../firebase/config"
import { collection, getDocs, query, where } from "firebase/firestore"
import { useTranslation } from "react-i18next"

const SESSION_KEY       = "stratega_dismissed_notifications"
const PLANNERS_CACHE_KEY = "stratega_planners_cache"
const CACHE_TTL          = 20 * 60 * 1000 // 20 minutos

const getDismissed = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]")
  } catch {
    return []
  }
}

const getCachedPlanners = (uid) => {
  try {
    const raw = sessionStorage.getItem(`${PLANNERS_CACHE_KEY}_${uid}`)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

const setCachedPlanners = (uid, data) => {
  try {
    sessionStorage.setItem(
      `${PLANNERS_CACHE_KEY}_${uid}`,
      JSON.stringify({ data, timestamp: Date.now() })
    )
  } catch {}
}

export const dismissNotification = (id) => {
  const dismissed = getDismissed()
  if (!dismissed.includes(id)) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...dismissed, id]))
  }
}

const useSmartNotifications = () => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return
    buildNotifications()
  }, [user, i18n.language])

  const getWeekdayName = (date) => {
    const locale = i18n.language === "es" ? "es-ES" : "en-US"
    return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date)
  }

  const buildNotifications = async () => {
    const uid = user.uid

    let events = getCachedPlanners(uid)
    if (!events) {
      const snap = await getDocs(query(collection(db, "planners"), where("uid", "==", uid)))
      events = snap.docs.map(d => d.data())
      setCachedPlanners(uid, events)
    }

    const dismissed = getDismissed()
    const generated = []

    // --- Días de la semana actual sin contenido ---
    const today = new Date()
    const startOfWeek = new Date(today)
    // Lunes como inicio de semana
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
    startOfWeek.setDate(today.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    const missingDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)

      // Solo días futuros o de hoy
      if (day < today && day.toDateString() !== today.toDateString()) continue

      const dayStr = day.toISOString().split("T")[0]
      const hasEvent = events.some(e => e.fecha === dayStr)
      if (!hasEvent) {
        missingDays.push({ dayStr, name: getWeekdayName(day) })
      }
    }

    if (missingDays.length > 0) {
      const weekId = `week-missing-${startOfWeek.toISOString().split("T")[0]}`
      if (!dismissed.includes(weekId)) {
        let mensaje
        if (missingDays.length === 1) {
          mensaje = t("notifications.week_missing_1", { day: missingDays[0].name })
        } else if (missingDays.length === 2) {
          mensaje = t("notifications.week_missing_2", { day1: missingDays[0].name, day2: missingDays[1].name })
        } else {
          mensaje = t("notifications.week_missing_many", { count: missingDays.length })
        }
        generated.push({ id: weekId, mensaje, tipo: "warning" })
      }
    }

    setNotifications(generated)
  }

  const dismiss = (id) => {
    dismissNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return { notifications, dismiss }
}

export default useSmartNotifications
