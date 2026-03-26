/**
 * usePaddle — carga Paddle.js una sola vez y expone openCheckout()
 *
 * El script se inyecta dinámicamente en el <head> la primera vez que
 * cualquier componente usa este hook. Posteriores renders reutilizan
 * la instancia ya inicializada (módulo-level singleton).
 */
import { useState, useEffect } from "react"

const PADDLE_TOKEN = "live_fba5dd15829a77f957863e3d469"

// Estado singleton a nivel de módulo para evitar doble carga
let _scriptInjected = false
let _paddleReady    = false
let _successCb      = null   // callback activo para checkout.completed

function _initPaddle(onReady) {
  window.Paddle.Environment.set("production")
  window.Paddle.Initialize({
    token: PADDLE_TOKEN,
    eventCallback(event) {
      if (event.name === "checkout.completed" && _successCb) {
        _successCb(event.data)
        _successCb = null
      }
    },
  })
  _paddleReady = true
  onReady()
}

export function usePaddle() {
  const [ready, setReady] = useState(_paddleReady)

  useEffect(() => {
    // Ya inicializado en un render/componente anterior
    if (_paddleReady) {
      setReady(true)
      return
    }

    // Script ya inyectado pero aún cargando — no duplicar
    if (_scriptInjected) return

    // Si por algún motivo Paddle ya existe en window (CDN externo)
    if (window.Paddle) {
      _scriptInjected = true
      _initPaddle(() => setReady(true))
      return
    }

    _scriptInjected = true
    const script = document.createElement("script")
    script.src   = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.onload = () => _initPaddle(() => setReady(true))
    script.onerror = () => console.error("[Paddle] Error al cargar paddle.js")
    document.head.appendChild(script)
  }, [])

  /**
   * Abre el checkout de Paddle.
   *
   * @param {object} options
   * @param {string}   options.priceId   — Price ID de Paddle (pri_XXXX)
   * @param {string}   [options.email]   — Email pre-relleno del usuario
   * @param {string}   [options.userId]  — UID para customData (webhooks)
   * @param {function} [options.onSuccess] — Callback cuando el pago se completa
   */
  const openCheckout = ({ priceId, email, userId, onSuccess } = {}) => {
    if (!window.Paddle || !_paddleReady) {
      console.warn("[Paddle] El checkout no está listo todavía")
      return
    }

    if (onSuccess) _successCb = onSuccess

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(email   && { customer: { email } }),
      ...(userId  && { customData: { user_id: userId } }),
      settings: {
        successUrl: `${window.location.origin}/dashboard`,
        displayMode: "overlay",
        theme: "dark",
        locale: "es",
      },
    })
  }

  return { ready, openCheckout }
}
