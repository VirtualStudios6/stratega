import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"

/**
 * Reads the user's subscription/trial state from Firestore.
 *
 * Module-level cache avoids re-fetching on every page navigation,
 * eliminating the "locked" flash when switching sections.
 *
 * Returns:
 *   status   — "trial" | "active" | "expired" | "cancelled" | "suspended" | "payment_failed"
 *   plan     — "trial" | "basico" | "pro"
 *   isActive — true when the user can access the app
 *   daysLeft — days remaining in trial (0 when not in trial)
 *   loading  — true while fetching
 */

// Module-level cache — persists across component mount/unmount (navigation)
let _cachedState = null
let _cachedUid   = null

const SESSION_KEY = "stratega_sub_state"

// Call this after manually updating Firestore (e.g. admin plan switcher)
// so the next render re-fetches fresh data.
export const invalidateSubscriptionCache = () => {
  _cachedState = null
  _cachedUid   = null
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}

const INITIAL_STATE = { status: "trial", plan: "trial", isActive: true, daysLeft: 7, loading: true }

// Read persisted state from sessionStorage (survives page refresh within same tab)
const readSession = (uid) => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { uid: storedUid, state } = JSON.parse(raw)
    return storedUid === uid ? state : null
  } catch { return null }
}

const writeSession = (uid, state) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ uid, state }))
  } catch {}
}

const useSubscriptionGuard = () => {
  const { user } = useAuth()

  // Priority: 1) module cache (navigation), 2) sessionStorage (refresh), 3) loading state
  const [state, setState] = useState(() => {
    if (_cachedState && _cachedUid === user?.uid) return _cachedState
    const persisted = user?.uid ? readSession(user.uid) : null
    if (persisted) {
      _cachedState = persisted
      _cachedUid   = user?.uid
      return persisted
    }
    return INITIAL_STATE
  })

  useEffect(() => {
    if (!user?.uid) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    // Already have a valid cache for this user — no need to re-fetch
    if (_cachedState && _cachedUid === user.uid) return

    const save = (newState) => {
      _cachedState = newState
      _cachedUid   = user.uid
      writeSession(user.uid, newState)
      setState(newState)
    }

    getDoc(doc(db, "users", user.uid))
      .then(snap => {
        if (!snap.exists()) {
          // New user without doc yet — treat as fresh trial
          save({ status: "trial", plan: "trial", isActive: true, daysLeft: 7, loading: false })
          return
        }

        const data = snap.data()
        const rawStatus = data.subscriptionStatus || "trial"
        const plan      = data.plan || "trial"

        // Admin — uses the actual plan/status from Firestore so dev tools work.
        // isActive mirrors real logic so expired/cancelled simulations show the
        // paywall (admin can always escape via Settings in the sidebar).
        if (data.isAdmin === true) {
          const adminPlan   = data.plan   || "pro"
          const adminStatus = data.subscriptionStatus || "active"
          const adminActive = adminStatus === "active" || adminStatus === "trial"
          let daysLeft = 0
          if (adminStatus === "trial") {
            const endSource = data.trialEndDate || data.createdAt
            if (endSource) {
              const baseDate = endSource?.toDate ? endSource.toDate() : new Date(endSource)
              const trialEnd = data.trialEndDate ? baseDate : new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000)
              daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000))
            } else {
              daysLeft = 7
            }
          }
          save({ status: adminStatus, plan: adminPlan, isActive: adminActive, daysLeft, loading: false })
          return
        }

        // Paid subscription — active (cancellation may be scheduled but access continues)
        if (rawStatus === "active") {
          const status = data.cancellationScheduled ? "cancellation_scheduled" : "active"
          save({ status, plan, isActive: true, daysLeft: 0, loading: false })
          return
        }

        // Trial — check expiry
        if (rawStatus === "trial") {
          let daysLeft = 7
          let expired  = false

          // Use trialEndDate if available, otherwise fall back to createdAt + 7 days
          const endSource = data.trialEndDate || data.createdAt
          if (endSource) {
            const baseDate = endSource?.toDate ? endSource.toDate() : new Date(endSource)
            const trialEnd = data.trialEndDate
              ? baseDate
              : new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            const msLeft = trialEnd.getTime() - Date.now()
            daysLeft     = Math.max(0, Math.ceil(msLeft / 86_400_000))
            expired      = msLeft <= 0
          }

          save({
            status:   expired ? "expired" : "trial",
            plan:     "trial",
            isActive: !expired,
            daysLeft: expired ? 0 : daysLeft,
            loading:  false,
          })
          return
        }

        // Cancelled / suspended / expired / payment_failed → blocked
        save({ status: rawStatus, plan, isActive: false, daysLeft: 0, loading: false })
      })
      .catch(() => {
        // On error, give benefit of the doubt
        save({ status: "trial", plan: "trial", isActive: true, daysLeft: 7, loading: false })
      })
  }, [user])

  return state
}

export default useSubscriptionGuard
