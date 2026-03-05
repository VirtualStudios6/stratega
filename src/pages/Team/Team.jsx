import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc, updateDoc
} from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"

const ROLES = ["Admin", "Editor", "Viewer"]
const ESTADOS = ["Activo", "Inactivo"]

const ROLE_COLORS = {
  Admin: "bg-primary/20 text-primary-light border-primary/30",
  Editor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Viewer: "bg-[#1E1E2E] text-text-muted border-[#2A2A3E]",
}

const ESTADO_COLORS = {
  Activo: "bg-green-500/20 text-green-400 border-green-500/30",
  Inactivo: "bg-red-500/20 text-red-400 border-red-500/30",
}

const getInitials = (name) =>
  name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"

const AVATAR_COLORS = [
  "#6022EC", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#EF4444"
]

const Team = () => {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [filtroRol, setFiltroRol] = useState("Todos")
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    rol: "Editor",
    estado: "Activo",
    cargo: "",
    telefono: "",
  })

  const fetchMembers = async () => {
    if (!user) return
    const q = query(collection(db, "team_members"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { fetchMembers() }, [user])

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.email.trim()) return
    await addDoc(collection(db, "team_members"), {
      uid: user.uid,
      ...form,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      creadoEn: new Date()
    })
    setModalOpen(false)
    resetForm()
    fetchMembers()
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "team_members", id))
    setSelectedMember(null)
    fetchMembers()
  }

  const handleToggleEstado = async (member) => {
    const nuevoEstado = member.estado === "Activo" ? "Inactivo" : "Activo"
    await updateDoc(doc(db, "team_members", member.id), { estado: nuevoEstado })
    fetchMembers()
  }

  const resetForm = () => {
    setForm({ nombre: "", email: "", rol: "Editor", estado: "Activo", cargo: "", telefono: "" })
  }

  const filtrados = filtroRol === "Todos" ? members : members.filter(m => m.rol === filtroRol)

  const activos = members.filter(m => m.estado === "Activo").length

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Equipo 👥</h1>
          <p className="text-text-muted text-sm mt-1">{members.length} miembros · {activos} activos</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true) }}
          className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
        >
          + Agregar miembro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: members.length, color: "bg-primary/10 border-primary/20 text-primary-light" },
          { label: "Admins", value: members.filter(m => m.rol === "Admin").length, color: "bg-primary/10 border-primary/20 text-primary-light" },
          { label: "Editores", value: members.filter(m => m.rol === "Editor").length, color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
          { label: "Activos", value: activos, color: "bg-green-500/10 border-green-500/20 text-green-400" },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-text-muted text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {["Todos", ...ROLES].map(f => (
          <button
            key={f}
            onClick={() => setFiltroRol(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition
              ${filtroRol === f
                ? "bg-primary/20 text-primary-light border-primary/30"
                : "bg-[#13131F] text-text-muted border-[#2A2A3E] hover:bg-[#1E1E2E]"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid de miembros */}
      {filtrados.length === 0 ? (
        <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-16 text-center">
          <span className="text-5xl mb-4 block">👥</span>
          <p className="text-text-muted">No hay miembros en el equipo</p>
          <p className="text-text-muted/50 text-sm mt-1">Agrega tu primer miembro</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtrados.map(member => (
            <div
              key={member.id}
              className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-5 hover:border-primary/30 transition cursor-pointer"
              onClick={() => setSelectedMember(member)}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: member.avatarColor || "#6022EC" }}
                >
                  {getInitials(member.nombre)}
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[member.rol]}`}>
                    {member.rol}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${ESTADO_COLORS[member.estado]}`}>
                    {member.estado}
                  </span>
                </div>
              </div>

              <h3 className="text-text-main font-semibold text-sm">{member.nombre}</h3>
              {member.cargo && <p className="text-text-muted text-xs mt-0.5">{member.cargo}</p>}
              <p className="text-text-muted/60 text-xs mt-1 truncate">{member.email}</p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={e => { e.stopPropagation(); handleToggleEstado(member) }}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-[#2A2A3E] text-text-muted hover:bg-[#1E1E2E] transition"
                >
                  {member.estado === "Activo" ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(member.id) }}
                  className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition text-xs"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalle miembro */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">Detalle del miembro</h2>
              <button onClick={() => setSelectedMember(null)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="text-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3"
                style={{ backgroundColor: selectedMember.avatarColor || "#6022EC" }}
              >
                {getInitials(selectedMember.nombre)}
              </div>
              <h3 className="text-text-main font-bold text-lg">{selectedMember.nombre}</h3>
              {selectedMember.cargo && <p className="text-text-muted text-sm">{selectedMember.cargo}</p>}
              <div className="flex gap-2 justify-center mt-2">
                <span className={`text-xs px-3 py-1 rounded-full border ${ROLE_COLORS[selectedMember.rol]}`}>
                  {selectedMember.rol}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full border ${ESTADO_COLORS[selectedMember.estado]}`}>
                  {selectedMember.estado}
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-[#0D0D18] border border-[#2A2A3E] rounded-xl p-4">
              <div className="flex justify-between">
                <span className="text-text-muted text-xs">Correo</span>
                <span className="text-text-main text-xs">{selectedMember.email}</span>
              </div>
              {selectedMember.telefono && (
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs">Teléfono</span>
                  <span className="text-text-main text-xs">{selectedMember.telefono}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted text-xs">Rol</span>
                <span className="text-text-main text-xs">{selectedMember.rol}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full mt-4 bg-[#0D0D18] border border-[#2A2A3E] text-text-muted py-2.5 rounded-xl hover:bg-[#1E1E2E] transition text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal agregar miembro */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">Agregar miembro</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre completo"
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Cargo</label>
                  <input
                    type="text"
                    value={form.cargo}
                    onChange={e => setForm({ ...form, cargo: e.target.value })}
                    placeholder="Ej: Diseñador"
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Correo</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+1 809 000 0000"
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Rol</label>
                  <select
                    value={form.rol}
                    onChange={e => setForm({ ...form, rol: e.target.value })}
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm({ ...form, estado: e.target.value })}
                    className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-[#0D0D18] border border-[#2A2A3E] text-text-muted py-2.5 rounded-xl hover:bg-[#1E1E2E] transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Team
