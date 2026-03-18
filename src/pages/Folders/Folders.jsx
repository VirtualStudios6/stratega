import { useState, useEffect } from "react"
import { FolderOpen, Folder, X, Download, FileText, Film, File, Eye, Play } from "lucide-react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db, storage } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc, updateDoc
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useAuth } from "../../context/AuthContext"
import compressImage from "../../utils/compressImage"

const COLORES = [
  { name: "Morado",    value: "#6022EC" },
  { name: "Índigo",   value: "#6366F1" },
  { name: "Azul",     value: "#3B82F6" },
  { name: "Celeste",  value: "#0EA5E9" },
  { name: "Cian",     value: "#06B6D4" },
  { name: "Teal",     value: "#14B8A6" },
  { name: "Verde",    value: "#10B981" },
  { name: "Lima",     value: "#84CC16" },
  { name: "Amarillo", value: "#F59E0B" },
  { name: "Naranja",  value: "#F97316" },
  { name: "Rojo",     value: "#EF4444" },
  { name: "Rosa",     value: "#EC4899" },
  { name: "Fucsia",   value: "#D946EF" },
  { name: "Gris",     value: "#64748B" },
]

const Folders = () => {
  const { user } = useAuth()
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [files, setFiles] = useState([])
  const [linkedFeeds, setLinkedFeeds] = useState([])
  const [linkedPlanners, setLinkedPlanners] = useState([])
  const [linkedReminders, setLinkedReminders] = useState([])
  const [modalFolder, setModalFolder] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [folderForm, setFolderForm] = useState({ nombre: "", color: "#6022EC" })
  const [editingFolder, setEditingFolder] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  const fetchFolders = async () => {
    if (!user) return
    const q = query(collection(db, "folders"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const fetchFiles = async (folderId) => {
    const q = query(collection(db, "folder_files"), where("folderId", "==", folderId))
    const snap = await getDocs(q)
    setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const fetchLinkedFeeds = async (folderId) => {
    const q = query(collection(db, "feeds"), where("uid", "==", user.uid), where("folderId", "==", folderId))
    const snap = await getDocs(q)
    setLinkedFeeds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const fetchLinkedPlanners = async (folderId) => {
    const q = query(collection(db, "planners"), where("uid", "==", user.uid), where("folderId", "==", folderId))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    setLinkedPlanners(data)
  }

  const fetchLinkedReminders = async (folderId) => {
    const q = query(collection(db, "reminders"), where("uid", "==", user.uid), where("folderId", "==", folderId))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    setLinkedReminders(data)
  }

  useEffect(() => { fetchFolders() }, [user])
  useEffect(() => {
    if (selectedFolder) {
      fetchFiles(selectedFolder.id)
      fetchLinkedFeeds(selectedFolder.id)
      fetchLinkedPlanners(selectedFolder.id)
      fetchLinkedReminders(selectedFolder.id)
    } else {
      setLinkedFeeds([])
      setLinkedPlanners([])
      setLinkedReminders([])
    }
  }, [selectedFolder])

  const handleCreateFolder = async () => {
    if (!folderForm.nombre.trim()) return
    await addDoc(collection(db, "folders"), {
      uid: user.uid,
      nombre: folderForm.nombre,
      color: folderForm.color,
      creadoEn: new Date()
    })
    setModalFolder(false)
    setFolderForm({ nombre: "", color: "#6022EC" })
    fetchFolders()
  }

  const handleEditFolder = async () => {
    if (!folderForm.nombre.trim() || !editingFolder) return
    await updateDoc(doc(db, "folders", editingFolder.id), {
      nombre: folderForm.nombre,
      color: folderForm.color,
    })
    setModalFolder(false)
    setEditingFolder(null)
    setFolderForm({ nombre: "", color: "#6022EC" })
    fetchFolders()
  }

  const handleDeleteFolder = async (folder) => {
    await deleteDoc(doc(db, "folders", folder.id))
    if (selectedFolder?.id === folder.id) setSelectedFolder(null)
    fetchFolders()
  }

  const handleUploadFile = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedFolder) return
    setUploading(true)
    try {
      const toUpload = file.type.startsWith("image/") ? await compressImage(file) : file
      const storageRef = ref(storage, `folders/${user.uid}/${selectedFolder.id}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, toUpload)
      const url = await getDownloadURL(storageRef)
      await addDoc(collection(db, "folder_files"), {
        uid: user.uid,
        folderId: selectedFolder.id,
        nombre: file.name,
        url,
        tipo: file.type,
        storagePath: storageRef.fullPath,
        creadoEn: new Date()
      })
      fetchFiles(selectedFolder.id)
    } catch (err) {
      console.error(err)
    }
    setUploading(false)
  }

  const handleDeleteFile = async (file) => {
    await deleteDoc(doc(db, "folder_files", file.id))
    if (file.storagePath) {
      await deleteObject(ref(storage, file.storagePath))
    }
    fetchFiles(selectedFolder.id)
  }

  const isImage = (tipo) => tipo?.startsWith("image/")
  const isVideo = (tipo) => tipo?.startsWith("video/")
  const isPDF   = (tipo) => tipo === "application/pdf"

  return (
    <DashboardLayout>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">Carpetas 📁</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">{folders.length} carpetas creadas</p>
        </div>
        <button
          onClick={() => setModalFolder(true)}
          className="bg-primary text-white font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm flex-shrink-0"
        >
          + Nueva
        </button>
      </div>

      {/* ── Carpetas: scroll horizontal en mobile ── */}
      <div className="md:hidden mb-4">
        {folders.length === 0 ? (
          <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
            <span className="text-3xl mb-2 block">📁</span>
            <p className="text-text-muted text-xs mb-3">Sin carpetas</p>
            <button onClick={() => setModalFolder(true)} className="text-xs bg-primary/10 border border-primary/20 text-primary-light px-3 py-1.5 rounded-lg hover:bg-primary/20 transition">+ Nueva carpeta</button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-shrink-0 transition ${
                  selectedFolder?.id === folder.id
                    ? "bg-primary/10 border-primary/30"
                    : "bg-bg-card border-border"
                }`}
              >
                <Folder size={16} style={{ color: folder.color }} className="flex-shrink-0" />
                <span className="text-sm text-text-main whitespace-nowrap">{folder.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: back button when folder is selected */}
      {selectedFolder && (
        <button
          onClick={() => setSelectedFolder(null)}
          className="md:hidden flex items-center gap-2 text-text-muted text-sm mb-3 hover:text-text-main transition"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Carpetas
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

        <div className="hidden md:block md:col-span-1 space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Mis carpetas</p>
          {folders.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
              <span className="text-3xl mb-2 block">📁</span>
              <p className="text-text-muted text-xs">Sin carpetas</p>
            </div>
          ) : (
            folders.map(folder => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                  selectedFolder?.id === folder.id
                    ? "bg-primary/10 border-primary/30"
                    : "bg-bg-card border-border hover:bg-bg-hover"
                }`}
              >
                <Folder size={20} style={{ color: folder.color }} className="flex-shrink-0" />
                <span className="text-sm text-text-main flex-1 truncate">{folder.nombre}</span>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setEditingFolder(folder)
                    setFolderForm({ nombre: folder.nombre, color: folder.color })
                    setModalFolder(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary-light transition text-sm mr-1"
                >
                  ✏️
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteFolder(folder) }}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition text-sm"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        <div className="col-span-1 md:col-span-3">
          {!selectedFolder ? (
            <div className="hidden md:flex bg-bg-card border border-border rounded-2xl p-16 text-center flex-col items-center justify-center">
              <span className="text-5xl mb-4 block">👈</span>
              <p className="text-text-muted">Selecciona una carpeta para ver su contenido</p>
            </div>
          ) : (
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FolderOpen size={24} style={{ color: selectedFolder.color }} />
                  <div>
                    <h2 className="text-text-main font-semibold">{selectedFolder.nombre}</h2>
                    <p className="text-text-muted text-xs">{files.length} archivos</p>
                  </div>
                </div>
                <label className={`bg-primary/20 border border-primary/30 text-primary-light text-sm px-4 py-2 rounded-xl hover:bg-primary/30 transition cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? "Subiendo..." : "+ Subir archivo"}
                  <input type="file" className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={handleUploadFile} />
                </label>
              </div>

              {/* Feeds vinculados */}
              {linkedFeeds.length > 0 && (
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 6.857A1.857 1.857 0 0 1 3.857 5h16.286A1.857 1.857 0 0 1 22 6.857v10.286A1.857 1.857 0 0 1 20.143 19H3.857A1.857 1.857 0 0 1 2 17.143V6.857z"/>
                    </svg>
                    Feeds vinculados ({linkedFeeds.length})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {linkedFeeds.map(feed => (
                      <div
                        key={feed.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-bg-input hover:bg-bg-hover transition"
                      >
                        {/* Mini avatar */}
                        <div
                          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2"
                          style={{ borderColor: selectedFolder.color + "66" }}
                        >
                          {feed.photoURL
                            ? <img src={feed.photoURL} alt={feed.username} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-bg-hover flex items-center justify-center text-sm">👤</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-main leading-tight">@{feed.username}</p>
                          {feed.nombre && (
                            <p className="text-[11px] text-text-muted truncate">{feed.nombre}</p>
                          )}
                          <p className="text-[10px] text-text-muted/60 mt-0.5">
                            {(feed.followers || 0).toLocaleString()} seguidores
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eventos del Planner */}
              {linkedPlanners.length > 0 && (
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                    📅 Eventos del Planner ({linkedPlanners.length})
                  </p>
                  <div className="space-y-2">
                    {linkedPlanners.slice(0, 5).map(ev => {
                      const pColor = { Urgente: "#EF4444", Importante: "#F59E0B", Normal: "var(--primary)" }[ev.prioridad] || "var(--primary)"
                      return (
                        <div key={ev.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-bg-input">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pColor }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-main truncate">{ev.titulo}</p>
                            {ev.plataforma && <p className="text-[11px] text-text-muted">{ev.plataforma}</p>}
                          </div>
                          <span className="text-xs text-text-muted flex-shrink-0 whitespace-nowrap">
                            {ev.fecha ? new Date(ev.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : ""}
                          </span>
                        </div>
                      )
                    })}
                    {linkedPlanners.length > 5 && (
                      <p className="text-xs text-text-muted text-center">+{linkedPlanners.length - 5} más</p>
                    )}
                  </div>
                </div>
              )}

              {/* Recordatorios */}
              {linkedReminders.length > 0 && (
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">
                    🔔 Recordatorios ({linkedReminders.length})
                  </p>
                  <div className="space-y-2">
                    {linkedReminders.slice(0, 5).map(rem => (
                      <div key={rem.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-bg-input">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rem.completado ? "bg-green-500" : "bg-yellow-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm text-text-main truncate ${rem.completado ? "line-through opacity-50" : ""}`}>{rem.titulo}</p>
                        </div>
                        <span className="text-[11px] text-text-muted flex-shrink-0">{rem.categoria}</span>
                      </div>
                    ))}
                    {linkedReminders.length > 5 && (
                      <p className="text-xs text-text-muted text-center">+{linkedReminders.length - 5} más</p>
                    )}
                  </div>
                </div>
              )}

              {files.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-3 block">📄</span>
                  <p className="text-text-muted text-sm">Esta carpeta está vacía</p>
                  <p className="text-text-muted/50 text-xs mt-1">Sube archivos, imágenes, videos o PDFs</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="group relative bg-bg-input border border-border rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => setPreviewFile(file)}
                    >
                      {isImage(file.tipo) ? (
                        <div className="aspect-square">
                          <img src={file.url} alt={file.nombre} className="w-full h-full object-cover" />
                        </div>
                      ) : isVideo(file.tipo) ? (
                        <div className="aspect-square relative bg-black flex items-center justify-center">
                          <video src={file.url} className="w-full h-full object-cover opacity-70" preload="metadata" muted />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Play size={18} className="text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : isPDF(file.tipo) ? (
                        <div className="aspect-square flex flex-col items-center justify-center p-4 bg-red-500/5">
                          <FileText size={40} className="text-red-400 mb-2" />
                          <p className="text-text-muted text-[10px] text-center line-clamp-2">{file.nombre}</p>
                        </div>
                      ) : (
                        <div className="aspect-square flex flex-col items-center justify-center p-4">
                          <File size={40} className="text-text-muted/50 mb-2" />
                          <p className="text-text-muted text-[10px] text-center line-clamp-2">{file.nombre}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setPreviewFile(file) }}
                          className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/30 transition flex items-center gap-1.5"
                        >
                          <Eye size={12} /> Previsualizar
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteFile(file) }}
                          className="bg-red-500/80 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-500 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="p-2 border-t border-border">
                        <p className="text-text-muted text-xs truncate">{file.nombre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de previsualización ── */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative bg-bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {isImage(previewFile.tipo) && <Eye size={15} className="text-primary-light flex-shrink-0" />}
                {isVideo(previewFile.tipo) && <Film size={15} className="text-primary-light flex-shrink-0" />}
                {isPDF(previewFile.tipo)   && <FileText size={15} className="text-red-400 flex-shrink-0" />}
                {!isImage(previewFile.tipo) && !isVideo(previewFile.tipo) && !isPDF(previewFile.tipo) && <File size={15} className="text-text-muted flex-shrink-0" />}
                <p className="text-text-main text-sm font-medium truncate">{previewFile.nombre}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <a
                  href={previewFile.url}
                  download={previewFile.nombre}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main border border-border px-3 py-1.5 rounded-lg hover:bg-bg-hover transition"
                  onClick={e => e.stopPropagation()}
                >
                  <Download size={12} /> Descargar
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-text-muted hover:text-text-main transition p-1.5 rounded-lg hover:bg-bg-hover"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
              {isImage(previewFile.tipo) && (
                <img
                  src={previewFile.url}
                  alt={previewFile.nombre}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
              {isVideo(previewFile.tipo) && (
                <video
                  src={previewFile.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg"
                  style={{ maxHeight: "calc(90vh - 100px)" }}
                />
              )}
              {isPDF(previewFile.tipo) && (
                <iframe
                  src={previewFile.url}
                  title={previewFile.nombre}
                  className="w-full rounded-lg border border-border"
                  style={{ height: "calc(90vh - 110px)", minHeight: "400px" }}
                />
              )}
              {!isImage(previewFile.tipo) && !isVideo(previewFile.tipo) && !isPDF(previewFile.tipo) && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <File size={64} className="text-text-muted/30" />
                  <div className="text-center">
                    <p className="text-text-main font-medium">{previewFile.nombre}</p>
                    <p className="text-text-muted text-sm mt-1">Vista previa no disponible para este tipo de archivo</p>
                  </div>
                  <a
                    href={previewFile.url}
                    download={previewFile.nombre}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-primary text-white text-sm px-5 py-2.5 rounded-xl hover:bg-primary-light transition"
                  >
                    <Download size={14} /> Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalFolder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">{editingFolder ? "Editar carpeta" : "Nueva carpeta"}</h2>
              <button onClick={() => { setModalFolder(false); setEditingFolder(null); setFolderForm({ nombre: "", color: "#6022EC" }) }} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={folderForm.nombre}
                  onChange={e => setFolderForm({ ...folderForm, nombre: e.target.value })}
                  placeholder="Ej: Empresa de comida"
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setFolderForm({ ...folderForm, color: c.value })}
                      title={c.name}
                      className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                      style={{
                        backgroundColor: c.value,
                        boxShadow: folderForm.color === c.value
                          ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${c.value}`
                          : "none",
                        transform: folderForm.color === c.value ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      {folderForm.color === c.value && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-bg-input border border-border rounded-xl px-4 py-3">
                <Folder size={20} style={{ color: folderForm.color }} />
                <span className="text-text-main text-sm">{folderForm.nombre || "Vista previa"}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setModalFolder(false); setEditingFolder(null); setFolderForm({ nombre: "", color: "#6022EC" }) }}
                className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={editingFolder ? handleEditFolder : handleCreateFolder}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                {editingFolder ? "Guardar cambios" : "Crear carpeta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Folders
