/**
 * usePaddle — carga Paddle.js una sola vez y expone openCheckout()
 * Singleton a nivel de módulo: seguro ante múltiples renders y StrictMode.
 *
 * En plataformas nativas (Android / iOS con Capacitor) el checkout se abre
 * en el navegador externo del dispositivo para evitar restricciones del
 * WebView con 3D Secure y popups de autenticación bancaria.
 */
import { useState, useEffect } from "react"
import { Capacitor } from "@capacitor/core"

const PADDLE_TOKEN   = "live_fba5dd15829a77f957863e3d469"
const CHECKOUT_URL   = "https://stratega-git-main-virtualstudios-projects.vercel.app/subscription"

let _scriptInjected  = false
let _paddleReady     = false
let _pendingReady    = []
let _successCb       = null
let _errorCb         = null
let _closeCb         = null

function _handleEvent(event) {
  console.log(`[Paddle] event → ${event.name}`, event)

  switch (event.name) {
    case "checkout.loaded":
      console.info("[Paddle] ✅ Checkout cargado correctamente")
      break

    case "checkout.completed":
      console.info("[Paddle] ✅ Pago completado:", event.data)
      if (_successCb) { _successCb(event.data); _successCb = null }
      _errorCb = null
      _closeCb = null
      break

    case "checkout.error":
      console.error("[Paddle] ❌ Error en checkout:", event.data)
      if (_errorCb) { _errorCb(event.data); _errorCb = null }
      _successCb = null
      _closeCb   = null
      break

    case "checkout.warning":
      console.warn("[Paddle] ⚠️ Advertencia:", event.data)
      break

    case "checkout.closed":
      console.info("[Paddle] Checkout cerrado por el usuario")
      if (_closeCb) { _closeCb(); _closeCb = null }
      _successCb = null
      _errorCb   = null
      break

    default:
      break
  }
}

function _initPaddle(onReady) {
  window.Paddle.Initialize({
    token: PADDLE_TOKEN,
    eventCallback: _handleEvent,
  })
  _paddleReady = true
  onReady()
  _pendingReady.forEach(cb => cb())
  _pendingReady = []
  console.info("[Paddle] ✅ Inicializado correctamente (production)")
}

export function usePaddle() {
  const [ready, setReady] = useState(_paddleReady)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    // En nativo no cargamos Paddle.js — el pago se hace en navegador externo
    if (isNative) { setReady(true); return }

    if (_paddleReady) { setReady(true); return }

    if (_scriptInjected) {
      _pendingReady.push(() => setReady(true))
      return
    }

    if (window.Paddle) {
      _scriptInjected = true
      _initPaddle(() => setReady(true))
      return
    }

    _scriptInjected = true
    const script    = document.createElement("script")
    script.src      = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async    = true
    script.onload   = () => _initPaddle(() => setReady(true))
    script.onerror  = () => console.error("[Paddle] ❌ No se pudo cargar paddle.js desde CDN")
    document.head.appendChild(script)
  }, [])

  /**
   * Abre el checkout de Paddle.
   *
   * Web     → overlay de Paddle.js dentro de la app
   * Nativo  → navegador externo del dispositivo (Safari / Chrome)
   *           evita restricciones de WebView con 3DS y popups bancarios
   *
   * @param {object}   options
   * @param {string}   options.priceId     — Price ID (pri_XXXX)
   * @param {string}   [options.email]     — Email del usuario
   * @param {string}   [options.userId]    — UID de Firebase (para webhooks)
   * @param {function} [options.onSuccess] — Callback al completar el pago (solo web)
   * @param {function} [options.onError]   — Callback en error (solo web)
   * @param {function} [options.onClose]   — Callback al cerrar sin pagar (solo web)
   */
  const openCheckout = async ({ priceId, email, userId, onSuccess, onError, onClose } = {}) => {
    if (!priceId) {
      console.error("[Paddle] Se requiere priceId")
      return
    }

    // ── NATIVO: abrir en navegador externo ─────────────────────────────────────
    if (isNative) {
      console.info("[Paddle] Modo nativo → abriendo en navegador externo")
      try {
        const params = new URLSearchParams({
          priceId,
          ...(email  && { email }),
          ...(userId && { uid: userId }),
        })
        const { Browser } = await import("@capacitor/browser")
        await Browser.open({
          url:            `${CHECKOUT_URL}?${params.toString()}`,
          presentationStyle: "popover",
        })
        // En nativo no hay callback de pago inmediato.
        // La suscripción se activa vía webhook de Paddle → Firestore.
        // El usuario verá su plan actualizado al volver a la app.
      } catch (err) {
        console.error("[Paddle] Error abriendo navegador externo:", err)
        if (onError) onError(err)
      }
      return
    }

    // ── WEB: overlay de Paddle.js ──────────────────────────────────────────────
    if (!window.Paddle || !_paddleReady) {
      console.warn("[Paddle] openCheckout() llamado antes de que Paddle esté listo")
      return
    }

    console.info(`[Paddle] Abriendo checkout para priceId: ${priceId}`)

    _successCb = onSuccess || null
    _errorCb   = onError   || null
    _closeCb   = onClose   || null

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(email  && { customer: { email } }),
      ...(userId && { customData: { user_id: userId } }),
      settings: {
        displayMode: "overlay",
        theme:       "dark",
      },
    })
  }

  return { ready, openCheckout }
}
