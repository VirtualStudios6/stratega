import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"

/**
 * Reads the user's subscription/trial state from Firestore.
 *
 * Returns:
 *   status   — "trial" | "active" | "expired" | "cancelled" | "suspended" | "payment_failed"
 *   plan     — "trial" | "basico" | "pro"
 *   isActive — true when the user can access the app
 *   daysLeft — days remaining in trial (0 when not in trial)
 *   loading  — true while fetching
 */
const useSubscriptionGuard = () => {
  const { user } = useAuth()
  const [state, setState] = useState({
    status:   "trial",
    plan:     "trial",
    isActive: true,
    daysLeft: 7,
    loading:  true,
  })

  useEffect(() => {
    if (!user?.uid) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    getDoc(doc(db, "users", user.uid))
      .then(snap => {
        if (!snap.exists()) {
          // New user without doc yet — treat as fresh trial
          setState({ status: "trial", plan: "trial", isActive: true, daysLeft: 7, loading: false })
          return
        }

        const data = snap.data()
        const rawStatus = data.subscriptionStatus || "trial"
        const plan      = data.plan || "trial"

        // Admin — full pro access, no restrictions
        if (data.isAdmin === true) {
          setState({ status: "active", plan: "pro", isActive: true, daysLeft: 0, loading: false })
          return
        }

        // Paid subscription — always active
        if (rawStatus === "active") {
          setState({ status: "active", plan, isActive: true, daysLeft: 0, loading: false })
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

          setState({
            status:   expired ? "expired" : "trial",
            plan:     "trial",
            isActive: !expired,
            daysLeft: expired ? 0 : daysLeft,
            loading:  false,
          })
          return
        }

        // Cancelled / suspended / expired / payment_failed → blocked
        setState({ status: rawStatus, plan, isActive: false, daysLeft: 0, loading: false })
      })
      .catch(() => {
        // On error, give benefit of the doubt
        setState({ status: "trial", plan: "trial", isActive: true, daysLeft: 7, loading: false })
      })
  }, [user])

  return state
}

export default useSubscriptionGuard
