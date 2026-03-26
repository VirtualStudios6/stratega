/**
 * Firebase Cloud Functions — Stratega Planner
 *
 * 1. sendReminderNotifications  — scheduled every 5 min (existing)
 * 2. paypalWebhook              — public HTTP endpoint for PayPal events
 * 3. cancelPaypalSubscription   — authenticated callable to cancel a subscription
 *
 * SECRETS (set before deploying):
 *   firebase functions:secrets:set PAYPAL_CLIENT_ID
 *   firebase functions:secrets:set PAYPAL_SECRET
 *
 * DEPLOY:
 *   firebase deploy --only functions
 *
 * WEBHOOK URL after deploy:
 *   https://us-central1-<your-project>.cloudfunctions.net/paypalWebhook
 */

const { onSchedule }          = require("firebase-functions/v2/scheduler")
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https")
const { defineSecret }        = require("firebase-functions/params")
const admin                   = require("firebase-admin")

admin.initializeApp()

// ---------------------------------------------------------------------------
// PayPal secrets (Google Cloud Secret Manager via Firebase)
// ---------------------------------------------------------------------------

const PAYPAL_CLIENT_ID = defineSecret("PAYPAL_CLIENT_ID")
const PAYPAL_SECRET    = defineSecret("PAYPAL_SECRET")

// ---------------------------------------------------------------------------
// Helper: exchange client credentials for a PayPal access token
// ---------------------------------------------------------------------------

async function getPaypalToken(clientId, secret) {
  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64")
  const resp = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  if (!resp.ok) {
    throw new Error(`PayPal token request failed: ${resp.status}`)
  }
  const data = await resp.json()
  return data.access_token
}

// ---------------------------------------------------------------------------
// 1. EXISTING — Scheduled reminder notifications
// ---------------------------------------------------------------------------

exports.sendReminderNotifications = onSchedule("every 5 minutes", async () => {
  const now      = Date.now()
  const windowMs = 5 * 60 * 1000  // 5-minute window

  const usersSnap = await admin.firestore()
    .collection("users")
    .where("fcmToken", "!=", null)
    .get()

  for (const userDoc of usersSnap.docs) {
    const { fcmToken } = userDoc.data()
    if (!fcmToken) continue

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

// ---------------------------------------------------------------------------
// 2. NEW — PayPal Webhook (public HTTP endpoint)
//
// Register this URL in PayPal Developer → Apps & Credentials →
// your app → Live Webhooks → Add Webhook:
//   https://us-central1-<your-project>.cloudfunctions.net/paypalWebhook
//
// Events to subscribe:
//   BILLING.SUBSCRIPTION.ACTIVATED
//   BILLING.SUBSCRIPTION.CANCELLED
//   BILLING.SUBSCRIPTION.SUSPENDED
//   BILLING.SUBSCRIPTION.EXPIRED
//   PAYMENT.SALE.COMPLETED
//   PAYMENT.SALE.DENIED
// ---------------------------------------------------------------------------

const SUBSCRIPTION_STATUS_MAP = {
  "BILLING.SUBSCRIPTION.ACTIVATED": "active",
  "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
  "BILLING.SUBSCRIPTION.SUSPENDED": "suspended",
  "BILLING.SUBSCRIPTION.EXPIRED":   "expired",
  "PAYMENT.SALE.DENIED":            "payment_failed",
}

exports.paypalWebhook = onRequest({ cors: false }, async (req, res) => {
  // PayPal only sends POST; reject everything else
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed")
  }

  try {
    const { event_type, resource } = req.body || {}

    if (!event_type || !resource) {
      return res.status(200).send("Missing event_type or resource")
    }

    const db = admin.firestore()
    let subscriptionId
    let updateData

    if (event_type === "PAYMENT.SALE.COMPLETED") {
      // Sale resource uses billing_agreement_id for the subscription ID
      subscriptionId = resource.billing_agreement_id
      updateData = { lastPaymentDate: admin.firestore.FieldValue.serverTimestamp() }

    } else if (SUBSCRIPTION_STATUS_MAP[event_type]) {
      subscriptionId = resource.id
      updateData = { subscriptionStatus: SUBSCRIPTION_STATUS_MAP[event_type] }

    } else {
      // Unknown / unsubscribed event — acknowledge and ignore
      return res.status(200).send("Event ignored")
    }

    if (!subscriptionId) {
      console.warn(`No subscriptionId found in resource for event: ${event_type}`)
      return res.status(200).send("No subscription ID")
    }

    // Find the user that owns this subscription
    const usersSnap = await db.collection("users")
      .where("subscriptionID", "==", subscriptionId)
      .limit(1)
      .get()

    if (usersSnap.empty) {
      console.warn(`paypalWebhook: no user found for subscriptionID=${subscriptionId}`)
      return res.status(200).send("User not found")
    }

    await usersSnap.docs[0].ref.update(updateData)
    console.log(`paypalWebhook: updated uid=${usersSnap.docs[0].id} event=${event_type}`)

  } catch (err) {
    // Log but never return 5xx — PayPal would keep retrying
    console.error("paypalWebhook unexpected error:", err)
  }

  // Always respond 200 so PayPal marks the delivery as successful
  return res.status(200).send("OK")
})

// ---------------------------------------------------------------------------
// 3. NEW — Cancel PayPal subscription (authenticated callable)
//
// Client call:
//   const fn = httpsCallable(getFunctions(), "cancelPaypalSubscription")
//   await fn({ subscriptionID: "I-..." })
// ---------------------------------------------------------------------------

exports.cancelPaypalSubscription = onCall(
  { secrets: [PAYPAL_CLIENT_ID, PAYPAL_SECRET] },
  async (request) => {
    // Must be signed in
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes estar autenticado.")
    }

    const { subscriptionID } = request.data || {}
    if (!subscriptionID) {
      throw new HttpsError("invalid-argument", "subscriptionID es requerido.")
    }

    const uid = request.auth.uid
    const db  = admin.firestore()

    // Verify the subscription belongs to the requesting user
    const userSnap = await db.collection("users").doc(uid).get()
    if (!userSnap.exists || userSnap.data().subscriptionID !== subscriptionID) {
      throw new HttpsError("permission-denied", "La suscripción no pertenece a este usuario.")
    }

    // Get a PayPal access token using server-side credentials
    const token = await getPaypalToken(
      PAYPAL_CLIENT_ID.value(),
      PAYPAL_SECRET.value(),
    )

    // Request cancellation from PayPal
    const paypalResp = await fetch(
      `https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionID}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Cancelación solicitada por el usuario" }),
      }
    )

    // 204 = success, 422 = already cancelled — both are acceptable
    if (!paypalResp.ok && paypalResp.status !== 422) {
      const errBody = await paypalResp.text().catch(() => "")
      console.error("PayPal cancel error:", paypalResp.status, errBody)
      throw new HttpsError("internal", "No se pudo cancelar la suscripción en PayPal.")
    }

    // Update Firestore — webhook will also fire but this ensures immediate UI update
    await db.collection("users").doc(uid).update({
      subscriptionStatus: "cancelled",
    })

    return { success: true }
  }
)
