import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { app, db } from "./config"
import { doc, setDoc } from "firebase/firestore"

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

let _messaging = null

const getMsg = () => {
  if (!_messaging) _messaging = getMessaging(app)
  return _messaging
}

/**
 * Requests notification permission, gets FCM token, and saves it to Firestore.
 * Must be called after the service worker is registered.
 */
export const initFCM = async (userId) => {
  try {
    if (!("Notification" in window)) return null
    if (Notification.permission === "denied") return null
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission()
      if (perm !== "granted") return null
    }
    const token = await getToken(getMsg(), { vapidKey: VAPID_KEY })
    if (token && userId) {
      await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true })
    }
    return token
  } catch (err) {
    console.warn("FCM init error:", err)
    return null
  }
}

/**
 * Listens for FCM messages when the app tab is in the foreground.
 * Returns an unsubscribe function.
 */
export const onForegroundMessage = (callback) => {
  try {
    return onMessage(getMsg(), callback)
  } catch {
    return () => {}
  }
}
