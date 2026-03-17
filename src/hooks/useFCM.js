import { useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { initFCM, onForegroundMessage } from "../firebase/notifications"

/**
 * Registers the FCM service worker, requests notification permission,
 * saves the FCM token to Firestore, and handles foreground messages.
 *
 * Background messages are handled automatically by firebase-messaging-sw.js
 * (fires when the tab is closed or the browser is in the background).
 */
export const useFCM = () => {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then(() => initFCM(user.uid))
      .catch((err) => console.warn("Service Worker registration failed:", err))

    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title || "Recordatorio"
      const body  = payload.notification?.body  || ""

      // Use the service worker's showNotification for better compatibility
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon:    "/logos/logo.png",
          badge:   "/logos/logo.png",
          tag:     payload.data?.reminderId || "stratega-reminder",
          vibrate: [200, 100, 200],
          data:    payload.data || {},
        })
      })
    })

    return unsub
  }, [user?.uid])
}
