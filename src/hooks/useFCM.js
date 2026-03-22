import { useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { initFCM, onForegroundMessage } from "../firebase/notifications"
import { Capacitor } from "@capacitor/core"

/**
 * Gestiona las notificaciones push según la plataforma:
 *
 * • WEB        → registra firebase-messaging-sw.js + escucha mensajes en primer plano
 * • ANDROID/iOS → solicita permiso nativo con @capacitor/push-notifications
 *                 (los service workers no funcionan en WebView nativo de Capacitor)
 */
export const useFCM = () => {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // ── NATIVO (Android / iOS) ──────────────────────────────────────────────
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/push-notifications")
        .then(({ PushNotifications }) => {
          PushNotifications.checkPermissions().then((status) => {
            const doRegister = () =>
              PushNotifications.register().catch((err) =>
                console.warn("[FCM native] Register error:", err)
              )

            if (status.receive === "prompt") {
              PushNotifications.requestPermissions().then((result) => {
                if (result.receive === "granted") doRegister()
              })
            } else if (status.receive === "granted") {
              doRegister()
            }
          })
        })
        .catch(() => {
          // Plugin no disponible — se ignora silenciosamente
        })
      return
    }

    // ── WEB ─────────────────────────────────────────────────────────────────
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then(() => initFCM(user.uid))
      .catch((err) => console.warn("[FCM web] Service Worker registration failed:", err))

    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title || "Recordatorio"
      const body  = payload.notification?.body  || ""

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
