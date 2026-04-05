/**
 * Firebase Cloud Functions — Stratega Planner
 *
 * 1. sendReminderNotifications  — scheduled every 5 min
 * 2. paypalWebhook              — HTTP endpoint for PayPal events (legacy)
 * 3. cancelPaypalSubscription   — callable to cancel PayPal subscription
 * 4. paddleWebhook              — HTTP endpoint for Paddle Billing v2 events
 * 5. cancelPaddleSubscription   — callable to cancel Paddle subscription
 *
 * SECRETS (set before deploying):
 *   firebase functions:secrets:set PAYPAL_CLIENT_ID
 *   firebase functions:secrets:set PAYPAL_SECRET
 *   firebase functions:secrets:set PADDLE_API_KEY
 *   firebase functions:secrets:set PADDLE_WEBHOOK_SECRET
 *
 * DEPLOY:
 *   firebase deploy --only functions
 *
 * WEBHOOK URLs after deploy:
 *   PayPal: https://us-central1-stratega-planner.cloudfunctions.net/paypalWebhook
 *   Paddle: https://us-central1-stratega-planner.cloudfunctions.net/paddleWebhook
 */

const { onSchedule }                    = require("firebase-functions/v2/scheduler")
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https")
const { defineSecret }                  = require("firebase-functions/params")
const admin                             = require("firebase-admin")
const crypto                            = require("crypto")

admin.initializeApp()

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

const PAYPAL_CLIENT_ID       = defineSecret("PAYPAL_CLIENT_ID")
const PAYPAL_SECRET          = defineSecret("PAYPAL_SECRET")
const PADDLE_API_KEY         = defineSecret("PADDLE_API_KEY")
const PADDLE_WEBHOOK_SECRET  = defineSecret("PADDLE_WEBHOOK_SECRET")

// ---------------------------------------------------------------------------
// 1. Scheduled reminder notifications
// ---------------------------------------------------------------------------

exports.sendReminderNotifications = onSchedule("every 5 minutes", async () => {
  const now      = Date.now()
  const windowMs = 5 * 60 * 1000

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

      const reminderTime    = new Date(reminder.fecha).getTime()
      const diff            = reminderTime - now
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
          data: { reminderId: reminderDoc.id, url: "/reminders" },
          webpush: {
            notification: {
              icon:    "https://stratega-planner.web.app/logos/logo.png",
              badge:   "https://stratega-planner.web.app/logos/logo.png",
              vibrate: "200,100,200",
              requireInteraction: false,
            },
            fcm_options: { link: "https://stratega-planner.web.app/reminders" },
          },
        })
      } catch (err) {
        if (err.code === "messaging/registration-token-not-registered") {
          await admin.firestore().collection("users").doc(userDoc.id)
            .update({ fcmToken: admin.firestore.FieldValue.delete() })
        }
      }
    }
  }
})

// ---------------------------------------------------------------------------
// 2. PayPal Webhook (legacy — mantener para suscriptores existentes)
// ---------------------------------------------------------------------------

const PAYPAL_STATUS_MAP = {
  "BILLING.SUBSCRIPTION.ACTIVATED": "active",
  "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
  "BILLING.SUBSCRIPTION.SUSPENDED": "suspended",
  "BILLING.SUBSCRIPTION.EXPIRED":   "expired",
  "PAYMENT.SALE.DENIED":            "payment_failed",
}

exports.paypalWebhook = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed")

  try {
    const { event_type, resource } = req.body || {}
    if (!event_type || !resource) return res.status(200).send("Missing fields")

    const db = admin.firestore()
    let subscriptionId, updateData

    if (event_type === "PAYMENT.SALE.COMPLETED") {
      subscriptionId = resource.billing_agreement_id
      updateData     = { lastPaymentDate: admin.firestore.FieldValue.serverTimestamp() }
    } else if (PAYPAL_STATUS_MAP[event_type]) {
      subscriptionId = resource.id
      updateData     = { subscriptionStatus: PAYPAL_STATUS_MAP[event_type] }
    } else {
      return res.status(200).send("Event ignored")
    }

    if (!subscriptionId) return res.status(200).send("No subscription ID")

    const snap = await db.collection("users")
      .where("subscriptionID", "==", subscriptionId).limit(1).get()

    if (!snap.empty) {
      await snap.docs[0].ref.update(updateData)
      console.log(`paypalWebhook: uid=${snap.docs[0].id} event=${event_type}`)
    }
  } catch (err) {
    console.error("paypalWebhook error:", err)
  }

  return res.status(200).send("OK")
})

// ---------------------------------------------------------------------------
// 3. Cancel PayPal subscription (callable)
// ---------------------------------------------------------------------------

async function getPaypalToken(clientId, secret) {
  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64")
  const resp = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method:  "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body:    "grant_type=client_credentials",
  })
  if (!resp.ok) throw new Error(`PayPal token failed: ${resp.status}`)
  return (await resp.json()).access_token
}

exports.cancelPaypalSubscription = onCall(
  { secrets: [PAYPAL_CLIENT_ID, PAYPAL_SECRET] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes estar autenticado.")

    const { subscriptionID } = request.data || {}
    if (!subscriptionID)     throw new HttpsError("invalid-argument", "subscriptionID requerido.")

    const uid      = request.auth.uid
    const db       = admin.firestore()
    const userSnap = await db.collection("users").doc(uid).get()

    if (!userSnap.exists || userSnap.data().subscriptionID !== subscriptionID) {
      throw new HttpsError("permission-denied", "Suscripción no pertenece a este usuario.")
    }

    const token     = await getPaypalToken(PAYPAL_CLIENT_ID.value(), PAYPAL_SECRET.value())
    const paypalRes = await fetch(
      `https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionID}/cancel`,
      {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ reason: "Cancelación solicitada por el usuario" }),
      }
    )

    if (!paypalRes.ok && paypalRes.status !== 422) {
      throw new HttpsError("internal", "No se pudo cancelar en PayPal.")
    }

    await db.collection("users").doc(uid).update({ subscriptionStatus: "cancelled" })
    return { success: true }
  }
)

// ---------------------------------------------------------------------------
// 4. Paddle Webhook (Billing v2)
//
// Registra esta URL en Paddle Dashboard:
//   Paddle Dashboard → Developer Tools → Notifications → Add destination
//   URL: https://us-central1-stratega-planner.cloudfunctions.net/paddleWebhook
//
// Eventos a suscribir:
//   subscription.activated   → plan activo
//   subscription.updated     → plan cambiado
//   subscription.cancelled   → cancelado
//   subscription.paused      → pausado
//   subscription.resumed     → reactivado
//   subscription.past_due    → pago fallido
//   transaction.completed    → pago completado
// ---------------------------------------------------------------------------

/**
 * Verifica la firma HMAC-SHA256 del webhook de Paddle.
 * Paddle envía el header: Paddle-Signature: ts=xxx;h1=yyy
 */
function verifyPaddleSignature(rawBody, signatureHeader, secret) {
  try {
    const parts    = Object.fromEntries(signatureHeader.split(";").map(p => p.split("=")))
    const ts       = parts.ts
    const h1       = parts.h1
    if (!ts || !h1) return false

    const payload  = `${ts}:${rawBody}`
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")

    return crypto.timingSafeEqual(
      Buffer.from(h1,       "hex"),
      Buffer.from(expected, "hex"),
    )
  } catch {
    return false
  }
}

/** Determina el subscriptionStatus de Firestore según el evento de Paddle */
function paddleEventToStatus(eventType) {
  const map = {
    "subscription.activated": "active",
    "subscription.resumed":   "active",
    "subscription.updated":   "active",
    "subscription.cancelled": "cancelled",
    "subscription.paused":    "suspended",
    "subscription.past_due":  "payment_failed",
  }
  return map[eventType] || null
}

/** Extrae el plan (basico/pro) desde el priceId de Paddle */
function priceIdToPlan(priceId) {
  const PRICE_MAP = {
    "pri_01kmna6c9abcr6n96f27ytey15": { plan: "basico", ciclo: "mensual" },
    "pri_01kmna88v8dqgb2vdqw323wp86": { plan: "basico", ciclo: "anual"   },
    "pri_01kmnaam2a1t269x2dnnf63z78": { plan: "pro",    ciclo: "mensual" },
    "pri_01kmnabym9jdxvq8my0yr5a6n3": { plan: "pro",    ciclo: "anual"   },
  }
  return PRICE_MAP[priceId] || { plan: "basico", ciclo: "mensual" }
}

exports.paddleWebhook = onRequest(
  { secrets: [PADDLE_WEBHOOK_SECRET], rawBody: true, cors: false },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed")

    // ── Verificar firma ────────────────────────────────────────────────────────
    const signatureHeader = req.headers["paddle-signature"]
    if (!signatureHeader) {
      console.warn("paddleWebhook: missing Paddle-Signature header")
      return res.status(401).send("Missing signature")
    }

    const rawBody = req.rawBody?.toString("utf8") || JSON.stringify(req.body)
    const isValid = verifyPaddleSignature(rawBody, signatureHeader, PADDLE_WEBHOOK_SECRET.value())

    if (!isValid) {
      console.error("paddleWebhook: invalid signature")
      return res.status(401).send("Invalid signature")
    }

    // ── Procesar evento ────────────────────────────────────────────────────────
    try {
      const { event_type, data } = req.body || {}
      if (!event_type || !data) return res.status(200).send("Missing fields")

      console.log(`paddleWebhook: received event=${event_type}`)

      const db = admin.firestore()

      // ── transaction.completed: primer pago / renovación ──────────────────
      if (event_type === "transaction.completed") {
        const userId = data.custom_data?.user_id
        if (!userId) {
          console.warn("paddleWebhook: transaction.completed sin user_id en custom_data")
          return res.status(200).send("No user_id")
        }

        const priceId      = data.items?.[0]?.price?.id
        const { plan, ciclo } = priceIdToPlan(priceId)

        await db.collection("users").doc(userId).set({
          plan,
          ciclo,
          subscriptionID:        data.subscription_id || data.id,
          subscriptionStatus:    "active",
          cancellationScheduled: false,
          subscriptionDate:      admin.firestore.FieldValue.serverTimestamp(),
          paymentProvider:       "paddle",
          lastPaymentDate:       admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true })

        console.log(`paddleWebhook: activated uid=${userId} plan=${plan}/${ciclo}`)
        return res.status(200).send("OK")
      }

      // ── Eventos de estado de suscripción ─────────────────────────────────
      const newStatus = paddleEventToStatus(event_type)
      if (!newStatus) return res.status(200).send("Event ignored")

      const subscriptionId = data.id
      if (!subscriptionId) return res.status(200).send("No subscription ID")

      // Buscar el usuario por subscriptionID
      const snap = await db.collection("users")
        .where("subscriptionID", "==", subscriptionId)
        .limit(1)
        .get()

      // Si la suscripción se reactiva, limpiar cancellationScheduled
      const updatePayload = { subscriptionStatus: newStatus }
      if (newStatus === "active") updatePayload.cancellationScheduled = false

      if (snap.empty) {
        // Fallback: buscar por user_id en custom_data si está disponible
        const userId = data.custom_data?.user_id
        if (userId) {
          await db.collection("users").doc(userId).set(updatePayload, { merge: true })
          console.log(`paddleWebhook: updated by uid=${userId} event=${event_type} status=${newStatus}`)
        } else {
          console.warn(`paddleWebhook: no user found for subscriptionID=${subscriptionId}`)
        }
      } else {
        await snap.docs[0].ref.update(updatePayload)
        console.log(`paddleWebhook: updated uid=${snap.docs[0].id} event=${event_type} status=${newStatus}`)
      }

    } catch (err) {
      console.error("paddleWebhook unexpected error:", err)
    }

    return res.status(200).send("OK")
  }
)

// ---------------------------------------------------------------------------
// 5. Cancel Paddle subscription (callable)
//
// Client:
//   const fn = httpsCallable(getFunctions(), "cancelPaddleSubscription")
//   await fn({ subscriptionID: "sub_xxx" })
// ---------------------------------------------------------------------------

exports.cancelPaddleSubscription = onCall(
  { secrets: [PADDLE_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes estar autenticado.")

    const { subscriptionID } = request.data || {}
    if (!subscriptionID)     throw new HttpsError("invalid-argument", "subscriptionID requerido.")

    const uid      = request.auth.uid
    const db       = admin.firestore()
    const userSnap = await db.collection("users").doc(uid).get()

    if (!userSnap.exists || userSnap.data().subscriptionID !== subscriptionID) {
      throw new HttpsError("permission-denied", "Suscripción no pertenece a este usuario.")
    }

    // Cancelar en Paddle al final del período de facturación actual
    const paddleRes = await fetch(
      `https://api.paddle.com/subscriptions/${subscriptionID}/cancel`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${PADDLE_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ effective_from: "next_billing_period" }),
      }
    )

    if (!paddleRes.ok) {
      const err = await paddleRes.text().catch(() => "")
      console.error("Paddle cancel error:", paddleRes.status, err)
      throw new HttpsError("internal", "No se pudo cancelar la suscripción en Paddle.")
    }

    // Marcar como cancelación programada — el status real pasa a "cancelled"
    // cuando Paddle dispara subscription.cancelled al final del período.
    // NO se cambia subscriptionStatus aquí para que el usuario mantenga acceso.
    await db.collection("users").doc(uid).update({ cancellationScheduled: true })

    return { success: true }
  }
)
