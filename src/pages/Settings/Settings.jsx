import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db, storage, auth } from "../../firebase/config"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useAuth } from "../../context/AuthContext"
import { useTheme, THEMES } from "../../context/ThemeContext"
import { updatePassword, reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider, GoogleAuthProvider, deleteUser, updateProfile } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import LanguageSwitcher from "../../components/shared/LanguageSwitcher"
import { deleteUserData } from "../../firebase/deleteUserData"

const Settings = () => {
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("perfil")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [perfil, setPerfil] = useState({
    nombre: "", cargo: "", empresa: "", telefono: "", bio: "", website: "",
  })

  const [seguridad, setSeguridad] = useState({
    passwordActual: "", passwordNuevo: "", passwordConfirm: "",
  })

  const [notificaciones, setNotificaciones] = useState({
    recordatorios: true, resumenSemanal: false, nuevosClientes: true, actualizaciones: false,
  })

  const fetchPerfil = async () => {
    if (!user) return
    const snap = await getDoc(doc(db, "users", user.uid))
    if (snap.exists()) {
      const data = snap.data()
      setPerfil({
        nombre: data.name || user.displayName || "",
        cargo: data.cargo || "",
        empresa: data.empresa || "",
        telefono: data.telefono || "",
        bio: data.bio || "",
        website: data.website || "",
      })
      if (data.avatar) setAvatarPreview(data.avatar)
      if (data.notificaciones) setNotificaciones(data.notificaciones)
    }
  }

  useEffect(() => { fetchPerfil() }, [user])

  const showSuccess = (msg) => { setSuccess(msg); setError(""); setTimeout(() => setSuccess(""), 3000) }
  const showError = (msg) => { setError(msg); setSuccess(""); setTimeout(() => setError(""), 4000) }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!ALLOWED.includes(file.type)) { showError("Solo se permiten imágenes (JPG, PNG, WEBP, GIF)"); return }
    if (file.size > 5 * 1024 * 1024) { showError("La imagen no puede superar 5 MB"); return }
    setLoading(true)
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updateDoc(doc(db, "users", user.uid), { avatar: url })
      setAvatarPreview(url)
      showSuccess(t("settings.saved"))
    } catch { showError(t("common.error")) }
    setLoading(false)
  }

  const handleSavePerfil = async () => {
    setLoading(true)
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: perfil.nombre, cargo: perfil.cargo, empresa: perfil.empresa,
        telefono: perfil.telefono, bio: perfil.bio, website: perfil.website,
      }, { merge: true })
      if (perfil.nombre && perfil.nombre !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: perfil.nombre })
        await refreshUser()
      }
      showSuccess(t("settings.saved"))
    } catch { showError(t("common.error")) }
    setLoading(false)
  }

  const handleCambiarPassword = async () => {
    if (seguridad.passwordNuevo !== seguridad.passwordConfirm) { showError("Las contraseñas no coinciden"); return }
    if (seguridad.passwordNuevo.length < 8) { showError("La contraseña debe tener al menos 8 caracteres"); return }
    if (!/[A-Z]/.test(seguridad.passwordNuevo) || !/[0-9]/.test(seguridad.passwordNuevo)) { showError("La contraseña debe incluir al menos una mayúscula y un número"); return }
    setLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, seguridad.passwordActual)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, seguridad.passwordNuevo)
      setSeguridad({ passwordActual: "", passwordNuevo: "", passwordConfirm: "" })
      showSuccess(t("settings.saved"))
    } catch { showError("Contraseña actual incorrecta") }
    setLoading(false)
  }

  const handleSaveNotificaciones = async () => {
    setLoading(true)
    try {
      await updateDoc(doc(db, "users", user.uid), { notificaciones })
      showSuccess(t("settings.saved"))
    } catch { showError(t("common.error")) }
    setLoading(false)
  }

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false)
    setLoading(true)
    const uid = auth.currentUser?.uid
    const doDelete = async () => {
      await deleteUserData(uid)
      await deleteUser(auth.currentUser)
      navigate("/login")
    }
    try {
      await doDelete()
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        const providerId = user?.providerData?.[0]?.providerId
        try {
          if (providerId === "google.com") {
            await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider())
          } else if (providerId === "facebook.com") {
            const { FacebookAuthProvider } = await import("firebase/auth")
            await reauthenticateWithPopup(auth.currentUser, new FacebookAuthProvider())
          } else {
            const password = window.prompt("Por seguridad, confirma tu contraseña para eliminar la cuenta:")
            if (!password) { setLoading(false); return }
            const credential = EmailAuthProvider.credential(user.email, password)
            await reauthenticateWithCredential(auth.currentUser, credential)
          }
          await doDelete()
        } catch {
          showError("No se pudo verificar tu identidad. Intenta de nuevo.")
        }
      } else {
        showError(t("common.error"))
      }
    }
    setLoading(false)
  }

  const getInitials = () =>
    perfil.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"

  const TABS = [
    { id: "perfil",         label: t("settings.profile"),       icon: "👤" },
    { id: "apariencia",     label: t("settings.appearance"),    icon: "🎨" },
    { id: "idioma",         label: t("settings.language"),      icon: "🌍" },
    { id: "notificaciones", label: t("settings.notifications"), icon: "🔔" },
    { id: "seguridad",      label: t("settings.security"),      icon: "🔐" },
    { id: "cuenta",         label: t("settings.current_plan"),  icon: "⚙️" },
  ]

  const inputClass = "w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
  const cardClass = "bg-bg-card border border-border rounded-2xl p-6"

  return (
    <DashboardLayout>
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main">{t("settings.title")} ⚙️</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-0.5">Administra tu perfil y preferencias</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-4">✅ {success}</div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">❌ {error}</div>
      )}

      {/* ── Tabs: scroll horizontal en mobile, sidebar vertical en desktop ── */}
      <div className="md:hidden mb-4 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border flex-shrink-0 transition
                ${activeTab === tab.id
                  ? "bg-primary/20 text-primary-light border-primary/30"
                  : "bg-bg-card text-text-muted border-border"
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

        {/* Sidebar tabs — solo desktop */}
        <div className="hidden md:block md:col-span-1 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left
                ${activeTab === tab.id
                  ? "bg-primary/20 text-primary-light border border-primary/30"
                  : "text-text-muted hover:bg-bg-hover hover:text-text-main"
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="col-span-1 md:col-span-3">

          {/* PERFIL */}
          {activeTab === "perfil" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-5">{t("settings.profile")}</h2>

              {/* Avatar + nombre */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl sm:text-2xl">
                      {getInitials()}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-light transition shadow-lg">
                    <span className="text-white text-xs">✏️</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div className="min-w-0">
                  <p className="text-text-main font-semibold truncate">{perfil.nombre || "Sin nombre"}</p>
                  <p className="text-text-muted text-sm truncate">{user?.email}</p>
                  <p className="text-text-muted/60 text-xs mt-0.5">{perfil.cargo || "Sin cargo"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("settings.name")}</label>
                  <input type="text" value={perfil.nombre} onChange={e => setPerfil({ ...perfil, nombre: e.target.value })} placeholder="Tu nombre" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Cargo</label>
                  <input type="text" value={perfil.cargo} onChange={e => setPerfil({ ...perfil, cargo: e.target.value })} placeholder="Ej: Community Manager" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Empresa</label>
                  <input type="text" value={perfil.empresa} onChange={e => setPerfil({ ...perfil, empresa: e.target.value })} placeholder="Nombre de tu empresa" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input type="text" value={perfil.telefono} onChange={e => setPerfil({ ...perfil, telefono: e.target.value })} placeholder="+1 809 000 0000" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Website</label>
                  <input type="text" value={perfil.website} onChange={e => setPerfil({ ...perfil, website: e.target.value })} placeholder="https://tuweb.com" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Bio</label>
                  <textarea value={perfil.bio} onChange={e => setPerfil({ ...perfil, bio: e.target.value })} placeholder="Cuéntanos sobre ti..." rows={3} className={`${inputClass} resize-none`} />
                </div>
              </div>
              <button onClick={handleSavePerfil} disabled={loading} className="mt-5 w-full sm:w-auto bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50">
                {loading ? t("common.loading") : t("settings.save")}
              </button>
            </div>
          )}

          {/* APARIENCIA */}
          {activeTab === "apariencia" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-2">{t("settings.appearance")}</h2>
              <p className="text-text-muted text-sm mb-6">Elige el tema que más te guste</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(THEMES).map(th => (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    className={`relative rounded-2xl border-2 overflow-hidden transition ${
                      theme === th.id
                        ? "border-primary shadow-lg shadow-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="p-4 text-left" style={{ backgroundColor: th.vars["--bg-main"] }}>
                      <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: th.vars["--bg-card"], border: `1px solid ${th.vars["--border"]}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: th.vars["--primary"] }} />
                          <div className="h-2 rounded-full w-20" style={{ backgroundColor: th.vars["--text-main"], opacity: 0.7 }} />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: th.vars["--border"] }} />
                          <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: th.vars["--border"] }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: th.vars["--text-main"] }}>
                          {th.emoji} {th.nombre}
                        </p>
                        {theme === th.id && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: th.vars["--primary"] }}>
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 bg-bg-input border border-border rounded-xl px-4 py-3">
                <p className="text-text-muted text-xs">
                  ✨ {t("settings.theme")}: <span className="text-text-main font-medium">{THEMES[theme]?.nombre}</span> — Se guarda automáticamente
                </p>
              </div>
            </div>
          )}

          {/* IDIOMA */}
          {activeTab === "idioma" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-2">{t("settings.language")} 🌍</h2>
              <p className="text-text-muted text-sm mb-8">{t("settings.select_language")}</p>
              <LanguageSwitcher variant="default" />
              <div className="mt-8 bg-bg-input border border-border rounded-xl px-4 py-3">
                <p className="text-text-muted text-xs">
                  🌐 El idioma se guarda automáticamente y aplica a toda la aplicación.
                </p>
              </div>
            </div>
          )}

          {/* NOTIFICACIONES */}
          {activeTab === "notificaciones" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-6">{t("settings.notifications")}</h2>
              <div className="space-y-4">
                {[
                  { key: "recordatorios",  label: t("reminders.title"), desc: "Notificaciones de tus recordatorios programados" },
                  { key: "resumenSemanal", label: "Resumen semanal",    desc: "Recibe un resumen de tu actividad cada semana" },
                  { key: "nuevosClientes", label: "Nuevos clientes",    desc: "Cuando agregues un nuevo miembro al equipo" },
                  { key: "actualizaciones",label: "Actualizaciones",    desc: "Novedades y mejoras de Stratega Planner" },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between bg-bg-input border border-border rounded-xl px-4 py-4">
                    <div>
                      <p className="text-text-main text-sm font-medium">{n.label}</p>
                      <p className="text-text-muted text-xs mt-0.5">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotificaciones({ ...notificaciones, [n.key]: !notificaciones[n.key] })}
                      className={`w-12 h-6 rounded-full transition-all relative ${notificaciones[n.key] ? "bg-primary" : "bg-border"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notificaciones[n.key] ? "left-7" : "left-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleSaveNotificaciones} disabled={loading} className="mt-6 w-full sm:w-auto bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50">
                {loading ? t("common.loading") : t("settings.save")}
              </button>
            </div>
          )}

          {/* SEGURIDAD */}
          {activeTab === "seguridad" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-6">{t("settings.change_password")}</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("settings.current_password")}</label>
                  <input type="password" value={seguridad.passwordActual} onChange={e => setSeguridad({ ...seguridad, passwordActual: e.target.value })} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("settings.new_password")}</label>
                  <input type="password" value={seguridad.passwordNuevo} onChange={e => setSeguridad({ ...seguridad, passwordNuevo: e.target.value })} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">{t("settings.confirm_password")}</label>
                  <input type="password" value={seguridad.passwordConfirm} onChange={e => setSeguridad({ ...seguridad, passwordConfirm: e.target.value })} placeholder="••••••••" className={inputClass} />
                </div>
              </div>
              <button onClick={handleCambiarPassword} disabled={loading} className="mt-6 w-full sm:w-auto bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50">
                {loading ? t("common.loading") : t("settings.change_password")}
              </button>
              <div className="mt-6 bg-bg-input border border-border rounded-xl p-4">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-3">{t("settings.account_info")}</p>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span className="text-text-muted text-xs sm:text-sm">{t("settings.email")}</span>
                    <span className="text-text-main text-sm font-medium truncate">{user?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span className="text-text-muted text-xs sm:text-sm">UID</span>
                    <span className="text-text-muted/60 text-xs font-mono">{user?.uid?.slice(0, 16)}...</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span className="text-text-muted text-xs sm:text-sm">{t("settings.provider")}</span>
                    <span className="text-text-main text-sm">{user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUENTA */}
          {activeTab === "cuenta" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-6">{t("settings.current_plan")}</h2>
              <div className="bg-bg-input border border-border rounded-xl p-5 mb-6">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-4">{t("settings.current_plan")}</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-text-main font-bold text-lg">{t("dashboard.free_plan")}</p>
                    <p className="text-text-muted text-sm mt-0.5">{t("settings.free_access")}</p>
                  </div>
                  <button
                    onClick={() => navigate("/subscription")}
                    className="w-full sm:w-auto bg-primary text-white font-medium px-5 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
                  >
                    {t("settings.upgrade")}
                  </button>
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                <p className="text-red-400 font-semibold text-sm mb-1">{t("settings.danger_zone")}</p>
                <p className="text-text-muted text-xs mb-4">{t("settings.danger_desc")}</p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={loading}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-xl hover:bg-red-500/20 transition disabled:opacity-50"
                >
                  {loading ? t("common.loading") : t("settings.delete_account")}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* ── Delete Account Confirmation Modal ──────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-text-main font-bold text-center text-lg mb-2">
              Eliminar cuenta
            </h3>
            <p className="text-text-muted text-sm text-center mb-1">
              Esta acción es <span className="text-red-400 font-semibold">irreversible</span>.
            </p>
            <p className="text-text-muted text-sm text-center mb-6">
              Se eliminarán todos tus datos: recordatorios, cotizaciones, archivos, publicaciones y más.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-bg-input border border-border text-text-main text-sm font-medium py-2.5 rounded-xl hover:bg-bg-hover transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-600 transition"
              >
                Sí, eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}

export default Settings
