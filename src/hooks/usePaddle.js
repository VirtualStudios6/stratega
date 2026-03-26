/**
 * usePaddle — carga Paddle.js una sola vez y expone openCheckout()
 * Singleton a nivel de módulo: seguro ante múltiples renders y StrictMode.
 */
import { useState, useEffect } from "react"

const PADDLE_TOKEN = "live_fba5dd15829a77f957863e3d469"

let _scriptInjected = false
let _paddleReady    = false
let _successCb      = null
let _errorCb        = null
let _closeCb        = null

function _handleEvent(event) {
  // Log completo de TODOS los eventos para facilitar debugging en DevTools
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
      console.warn("[Paddle] ⚠️ Advertencia en checkout:", event.data)
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
  // En Paddle Billing v2 "production" es el entorno por defecto.
  // NO llamar Environment.set() en producción evita conflictos.
  // Solo se llama para sandbox: Paddle.Environment.set("sandbox")

  window.Paddle.Initialize({
    token: PADDLE_TOKEN,
    eventCallback: _handleEvent,
  })

  _paddleReady = true
  onReady()
  console.info("[Paddle] ✅ Inicializado correctamente (production)")
}

export function usePaddle() {
  const [ready, setReady] = useState(_paddleReady)

  useEffect(() => {
    if (_paddleReady) { setReady(true); return }
    if (_scriptInjected) return

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
   * @param {object}   options
   * @param {string}   options.priceId     — Price ID (pri_XXXX)
   * @param {string}   [options.email]     — Email del usuario (pre-rellena el campo)
   * @param {string}   [options.userId]    — UID de Firebase (para webhooks)
   * @param {function} [options.onSuccess] — Se llama con event.data al completar el pago
   * @param {function} [options.onError]   — Se llama con event.data si hay error
   * @param {function} [options.onClose]   — Se llama si el usuario cierra sin pagar
   */
  const openCheckout = ({ priceId, email, userId, onSuccess, onError, onClose } = {}) => {
    if (!window.Paddle || !_paddleReady) {
      console.warn("[Paddle] openCheckout() llamado antes de que Paddle esté listo")
      return
    }

    if (!priceId) {
      console.error("[Paddle] Se requiere priceId para abrir el checkout")
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
        // successUrl y locale eliminados: pueden causar "Something went wrong"
        // en ciertos setups de Paddle. Se maneja con eventCallback en su lugar.
      },
    })
  }

  return { ready, openCheckout }
}
