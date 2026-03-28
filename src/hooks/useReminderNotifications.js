import { useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { db } from "../firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import toast from "react-hot-toast"

// Module-level dedup — survives re-renders
const notified = new Set()

// ── Badge counter ─────────────────────────────────────────────────────────
let _badgeCount = 0

export const getReminderBadgeCount = () => _badgeCount

export const clearReminderBadge = () => {
  _badgeCount = 0
  window.dispatchEvent(new CustomEvent("reminder-badge", { detail: 0 }))
}

// ── AudioContext singleton — unlocked on first user gesture ───────────────
let _audioCtx = null

const getAudioCtx = () => {
  if (!_audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return _audioCtx
}

// Pre-unlock AudioContext on first interaction so it's ready when reminder fires
if (typeof window !== "undefined") {
  const unlock = () => {
    getAudioCtx()?.resume().catch(() => {})
    window.removeEventListener("click",      unlock)
    window.removeEventListener("keydown",    unlock)
    window.removeEventListener("touchstart", unlock)
  }
  window.addEventListener("click",      unlock, { once: true })
  window.addEventListener("keydown",    unlock, { once: true })
  window.addEventListener("touchstart", unlock, { once: true })
}

const playBeep = () => {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const play = () => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    }
    if (ctx.state === "suspended") {
      ctx.resume().then(play).catch(() => {})
    } else {
      play()
    }
  } catch {}
}

const fireNotification = (task, label) => {
  playBeep()

  // Increment badge and notify UI
  _badgeCount++
  window.dispatchEvent(new CustomEvent("reminder-badge", { detail: _badgeCount }))

  // In-app toast — always shown regardless of OS notification permission
  toast(`⏰ ${task.titulo} — ${label}`, {
    duration: 8000,
    style: { background: "var(--bg-card)", color: "var(--text-main)", border: "1px solid var(--border)" },
  })

  window.dispatchEvent(new CustomEvent("reminder-fired", { detail: task }))

  // OS notification — only if permission granted
  if (Notification.permission !== "granted") return

  const title = `⏰ ${task.titulo}`
  const body  = `${task.descripcion || "Recordatorio"} — ${label}`
  const opts  = {
    body,
    icon:    "/logos/logo.png",
    badge:   "/logos/logo.png",
    tag:     task.id,
    vibrate: [300, 100, 300],
    requireInteraction: true,
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(reg => reg.showNotification(title, opts))
      .catch(() => new Notification(title, opts))
  } else {
    new Notification(title, opts)
  }
}

export const useReminderNotifications = () => {
  const { user }    = useAuth()
  const reminders   = useRef([])
  const fetched     = useRef(false)
  const intervalId  = useRef(null)

  // Fetch pending reminders, refresh every 5 minutes
  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        const q    = query(collection(db, "reminders"), where("uid", "==", user.uid), where("completado", "==", false))
        const snap = await getDocs(q)
        reminders.current = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        fetched.current   = true
      } catch (err) {
        console.error("[ReminderNotifications] Error cargando recordatorios:", err)
      }
    }

    load()
    const id = setInterval(load, 5 * 60 * 1000)

    // Re-fetch immediately when a reminder is created/edited
    window.addEventListener("reminder-saved", load)

    return () => {
      clearInterval(id)
      window.removeEventListener("reminder-saved", load)
    }
  }, [user?.uid])

  // Check every 30 seconds — starts after 5s to let fetch complete
  useEffect(() => {
    if (!user) return

    const check = () => {
      if (!fetched.current) return

      const now = Date.now()

      reminders.current.forEach(task => {
        if (!task.fecha) return

        const diff = new Date(task.fecha).getTime() - now

        // 5 minutes before: window 4:30 → 5:30 min
        const k5 = `${task.id}-5`
        if (diff >= 4.5 * 60000 && diff <= 5.5 * 60000 && !notified.has(k5)) {
          notified.add(k5)
          fireNotification(task, "en 5 minutos")
        }

        // At time: window -2min → +1min (catches slight delays)
        const k0 = `${task.id}-0`
        if (diff >= -2 * 60000 && diff <= 60000 && !notified.has(k0)) {
          notified.add(k0)
          fireNotification(task, "¡ahora!")
        }
      })
    }

    const delay = setTimeout(() => {
      check()
      intervalId.current = setInterval(check, 30000)
    }, 5000)

    return () => {
      clearTimeout(delay)
      clearInterval(intervalId.current)
    }
  }, [user?.uid])
}
