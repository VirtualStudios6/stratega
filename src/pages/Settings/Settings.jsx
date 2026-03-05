import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db, storage } from "../../firebase/config"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useAuth } from "../../context/AuthContext"
import { useTheme, THEMES } from "../../context/ThemeContext"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"

const Settings = () => {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("perfil")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
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
    setLoading(true)
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updateDoc(doc(db, "users", user.uid), { avatar: url })
      setAvatarPreview(url)
      showSuccess("Foto actualizada correctamente")
    } catch { showError("Error al subir la foto") }
    setLoading(false)
  }

  const handleSavePerfil = async () => {
    setLoading(true)
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: perfil.nombre, cargo: perfil.cargo, empresa: perfil.empresa,
        telefono: perfil.telefono, bio: perfil.bio, website: perfil.website,
      }, { merge: true })
      showSuccess("Perfil actualizado correctamente")
    } catch { showError("Error al guardar el perfil") }
    setLoading(false)
  }

  const handleCambiarPassword = async () => {
    if (seguridad.passwordNuevo !== seguridad.passwordConfirm) { showError("Las contraseñas no coinciden"); return }
    if (seguridad.passwordNuevo.length < 6) { showError("La contraseña debe tener al menos 6 caracteres"); return }
    setLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, seguridad.passwordActual)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, seguridad.passwordNuevo)
      setSeguridad({ passwordActual: "", passwordNuevo: "", passwordConfirm: "" })
      showSuccess("Contraseña actualizada correctamente")
    } catch { showError("Contraseña actual incorrecta") }
    setLoading(false)
  }

  const handleSaveNotificaciones = async () => {
    setLoading(true)
    try {
      await updateDoc(doc(db, "users", user.uid), { notificaciones })
      showSuccess("Preferencias guardadas")
    } catch { showError("Error al guardar preferencias") }
    setLoading(false)
  }

  const getInitials = () =>
    perfil.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"

  const TABS = [
    { id: "perfil", label: "Perfil", icon: "👤" },
    { id: "apariencia", label: "Apariencia", icon: "🎨" },
    { id: "notificaciones", label: "Notificaciones", icon: "🔔" },
    { id: "seguridad", label: "Seguridad", icon: "🔐" },
    { id: "cuenta", label: "Cuenta", icon: "⚙️" },
  ]

  const inputClass = "w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
  const cardClass = "bg-bg-card border border-border rounded-2xl p-6"

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main">Configuración ⚙️</h1>
        <p className="text-text-muted text-sm mt-1">Administra tu perfil y preferencias</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-5">✅ {success}</div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">❌ {error}</div>
      )}

      <div className="grid grid-cols-4 gap-6">

        {/* Sidebar tabs */}
        <div className="col-span-1 space-y-1">
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

        <div className="col-span-3">

          {/* Tab Perfil */}
          {activeTab === "perfil" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-6">Información del perfil</h2>
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl">
                      {getInitials()}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-light transition">
                    <span className="text-white text-xs">✏️</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div>
                  <p className="text-text-main font-semibold">{perfil.nombre || "Sin nombre"}</p>
                  <p className="text-text-muted text-sm">{user?.email}</p>
                  <p className="text-text-muted/60 text-xs mt-0.5">{perfil.cargo || "Sin cargo"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Nombre completo</label>
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
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Website</label>
                  <input type="text" value={perfil.website} onChange={e => setPerfil({ ...perfil, website: e.target.value })} placeholder="https://tuweb.com" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Bio</label>
                  <textarea value={perfil.bio} onChange={e => setPerfil({ ...perfil, bio: e.target.value })} placeholder="Cuéntanos sobre ti..." rows={3} className={`${inputClass} resize-none`} />
                </div>
              </div>
              <button onClick={handleSavePerfil} disabled={loading} className="mt-6 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50">
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}

          {/* Tab Apariencia */}
          {activeTab === "apariencia" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-2">Apariencia</h2>
              <p className="text-text-muted text-sm mb-6">Elige el tema que más te guste</p>

              <div className="grid grid-cols-2 gap-4">
                {Object.values(THEMES).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`relative rounded-2xl border-2 overflow-hidden transition ${
                      theme === t.id
                        ? "border-primary shadow-lg shadow-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="p-4 text-left" style={{ backgroundColor: t.vars["--bg-main"] }}>
                      <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: t.vars["--bg-card"], border: `1px solid ${t.vars["--border"]}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: t.vars["--primary"] }} />
                          <div className="h-2 rounded-full w-20" style={{ backgroundColor: t.vars["--text-main"], opacity: 0.7 }} />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: t.vars["--border"] }} />
                          <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: t.vars["--border"] }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: t.vars["--text-main"] }}>
                          {t.emoji} {t.nombre}
                        </p>
                        {theme === t.id && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.vars["--primary"] }}>
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
                  ✨ Tema activo: <span className="text-text-main font-medium">{THEMES[theme]?.nombre}</span> — Se guarda automáticamente
                </p>
              </div>
            </div>
          )}

          {/* Tab Notificaciones */}
          {activeTab === "notificaciones" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-6">Preferencias de notificaciones</h2>
              <div className="space-y-4">
                {[
                  { key: "recordatorios", label: "Recordatorios", desc: "Notificaciones de tus recordatorios programados" },
                  { key: "resumenSemanal", label: "Resumen semanal", desc: "Recibe un resumen de tu actividad cada semana" },
                  { key: "nuevosClientes", label: "Nuevos clientes", desc: "Cuando agregues un nuevo miembro al equipo" },
                  { key: "actualizaciones", label: "Actualizaciones", desc: "Novedades y mejoras de Stratega Planner" },
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
              <button onClick={handleSaveNotificaciones} disabled={loading} className="mt-6 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50">
                {loading ? "Guardando..." : "Guardar preferencias"}
              </button>
            </div>
          )}

          {/* Tab Seguridad */}
          {activeTab === "seguridad" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-6">Cambiar contraseña</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Contraseña actual</label>
                  <input type="password" value={seguridad.passwordActual} onChange={e => setSeguridad({ ...seguridad, passwordActual: e.target.value })} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Nueva contraseña</label>
                  <input type="password" value={seguridad.passwordNuevo} onChange={e => setSeguridad({ ...seguridad, passwordNuevo: e.target.value })} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Confirmar contraseña</label>
                  <input type="password" value={seguridad.passwordConfirm} onChange={e => setSeguridad({ ...seguridad, passwordConfirm: e.target.value })} placeholder="••••••••" className={inputClass} />
                </div>
              </div>
              <button onClick={handleCambiarPassword} disabled={loading} className="mt-6 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50">
                {loading ? "Actualizando..." : "Cambiar contraseña"}
              </button>
              <div className="mt-8 bg-bg-input border border-border rounded-xl p-4">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Info de la cuenta</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-muted text-sm">Correo</span>
                    <span className="text-text-main text-sm">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted text-sm">UID</span>
                    <span className="text-text-muted/60 text-xs font-mono">{user?.uid?.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted text-sm">Proveedor</span>
                    <span className="text-text-main text-sm">{user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Cuenta */}
          {activeTab === "cuenta" && (
            <div className={cardClass}>
              <h2 className="text-text-main font-semibold mb-6">Información de la cuenta</h2>
              <div className="bg-bg-input border border-border rounded-xl p-5 mb-6">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-4">Plan actual</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main font-bold text-lg">Plan Gratuito</p>
                    <p className="text-text-muted text-sm mt-0.5">Acceso limitado a funciones básicas</p>
                  </div>
                  <button className="bg-primary text-white font-medium px-5 py-2 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30">
                    Mejorar plan
                  </button>
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                <p className="text-red-400 font-semibold text-sm mb-1">Zona de peligro</p>
                <p className="text-text-muted text-xs mb-4">Estas acciones son irreversibles. Procede con cuidado.</p>
                <button className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-xl hover:bg-red-500/20 transition">
                  Eliminar cuenta
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  )
}

export default Settings
