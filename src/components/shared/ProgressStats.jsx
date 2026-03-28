import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../firebase/config"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { Flame, CalendarDays, Image, CheckCircle2, Zap } from "lucide-react"

const MetricCard = ({ icon, label, value, color, unit }) => (
  <div className={`bg-bg-main border border-border rounded-2xl p-4 flex flex-col gap-1`}>
    <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-1 ${color}`}>
      {icon}
    </div>
    <p className="text-text-muted text-xs uppercase tracking-wider leading-tight">{label}</p>
    <div className="flex items-end gap-1">
      <span className="text-2xl font-bold text-text-main">{value}</span>
      {unit && <span className="text-text-muted text-xs mb-0.5">{unit}</span>}
    </div>
  </div>
)

const ProgressStats = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [data, setData] = useState({
    streakDays: 0,
    campanias: 0,
    posts: 0,
    tareasCompletadas: 0,
  })

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const fetchStats = async () => {
    const uid = user.uid

    const [userSnap, plannersSnap, feedSnap, remSnap] = await Promise.all([
      getDoc(doc(db, "users", uid)),
      getDocs(query(collection(db, "planners"), where("uid", "==", uid))),
      getDocs(query(collection(db, "feed_posts"), where("uid", "==", uid))),
      getDocs(query(collection(db, "reminders"), where("uid", "==", uid), where("completado", "==", true))),
    ])

    const streakDays = userSnap.exists() ? (userSnap.data().streakDays || 0) : 0

    setData({
      streakDays,
      campanias: plannersSnap.size,
      posts: feedSnap.size,
      tareasCompletadas: remSnap.size,
    })
  }

  const getMotivation = () => {
    const { streakDays, posts, tareasCompletadas } = data
    if (streakDays >= 4)
      return t("progress.motivation_streak", { days: streakDays })
    if (posts >= 10)
      return t("progress.motivation_posts")
    if (tareasCompletadas >= 5)
      return t("progress.motivation_tasks")
    return t("progress.motivation_default")
  }

  const metrics = [
    { icon: <Flame size={18} className="text-orange-400" />, label: t("progress.streak"),    value: data.streakDays,        unit: t("progress.streak_unit"), color: "bg-orange-500/20" },
    { icon: <CalendarDays size={18} className="text-primary-light" />, label: t("progress.campaigns"),  value: data.campanias,         unit: null,                      color: "bg-primary/20"    },
    { icon: <Image size={18} className="text-blue-400" />, label: t("progress.content"),    value: data.posts,             unit: null,                      color: "bg-blue-500/20"   },
    { icon: <CheckCircle2 size={18} className="text-green-400" />, label: t("progress.tasks"),       value: data.tareasCompletadas, unit: null,                      color: "bg-green-500/20"  },
  ]

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-text-main font-semibold text-sm">{t("progress.title")}</h2>
          <p className="text-text-muted text-xs">{t("progress.subtitle")}</p>
        </div>
        <span className="text-xs bg-primary/10 border border-primary/20 text-primary-light px-3 py-1 rounded-full flex items-center gap-1.5">
          <Flame size={12} className="text-orange-400" />
          {data.streakDays} {t("progress.streak_unit")}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
        <Zap size={18} className="text-primary-light flex-shrink-0" />
        <p className="text-text-main text-sm">{getMotivation()}</p>
      </div>
    </div>
  )
}

export default ProgressStats
