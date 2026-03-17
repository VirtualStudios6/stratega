/**
 * Firebase Cloud Function — Scheduled Reminder Notifications
 *
 * Runs every 5 minutes and sends FCM push notifications for reminders that are due.
 * Works even when the user's browser is completely closed.
 *
 * REQUIREMENTS:
 *   1. Firebase Blaze plan (free tier covers this easily — ~8,640 calls/month vs 2M free)
 *   2. Deploy: firebase deploy --only functions
 *   3. Enable Cloud Scheduler API in Google Cloud Console
 *
 * INSTALL:
 *   cd functions && npm install
 */

const { onSchedule } = require("firebase-functions/v2/scheduler")
const admin = require("firebase-admin")

admin.initializeApp()

exports.sendReminderNotifications = onSchedule("every 5 minutes", async () => {
  const now      = Date.now()
  const windowMs = 5 * 60 * 1000  // 5-minute window

  // Fetch all users that have an FCM token registered
  const usersSnap = await admin.firestore()
    .collection("users")
    .where("fcmToken", "!=", null)
    .get()

  for (const userDoc of usersSnap.docs) {
    const { fcmToken } = userDoc.data()
    if (!fcmToken) continue

    // Fetch pending reminders for this user
    const remindersSnap = await admin.firestore()
      .collection("reminders")
      .where("uid",        "==", userDoc.id)
      .where("completado", "==", false)
      .get()

    for (const reminderDoc of remindersSnap.docs) {
      const reminder = reminderDoc.data()
      if (!reminder.fecha) continue

      const reminderTime = new Date(reminder.fecha).getTime()
      const diff         = reminderTime - now

      // Notify 5 minutes before OR at the exact time (±1 min tolerance)
      const isFiveMinBefore = diff >= windowMs - 60000 && diff <= windowMs + 60000
      const isNow           = diff >= -60000 && diff <= 60000

      if (!isFiveMinBefore && !isNow) continue

      const label = isFiveMinBefore ? "en 5 minutos" : "¡ahora!"

      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: `⏰ ${reminder.titulo}`,
            body:  `${reminder.descripcion || "Recordatorio"} — ${label}`,
          },
          data: {
            reminderId: reminderDoc.id,
            url:        "/reminders",
          },
          webpush: {
            notification: {
              icon:    "https://stratega-planner.web.app/logos/logo.png",
              badge:   "https://stratega-planner.web.app/logos/logo.png",
              vibrate: "200,100,200",
              requireInteraction: false,
            },
            fcm_options: {
              link: "https://stratega-planner.web.app/reminders",
            },
          },
        })
      } catch (err) {
        // Token may be stale — remove it
        if (err.code === "messaging/registration-token-not-registered") {
          await admin.firestore()
            .collection("users")
            .doc(userDoc.id)
            .update({ fcmToken: admin.firestore.FieldValue.delete() })
        }
      }
    }
  }
})
