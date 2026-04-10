import { useState, useEffect, useRef } from "react"
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext,
  sortableKeyboardCoordinates, rectSortingStrategy
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db, storage } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc, updateDoc
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useAuth } from "../../context/AuthContext"
import compressImage from "../../utils/compressImage"

/* ─── Sortable image/video ───────────────────────────────────── */
const SortableImage = ({ item, onDelete, onPreview, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 999 : 1 }
  const isVideo = item.type === "video"
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="relative group aspect-square overflow-hidden cursor-grab active:cursor-grabbing bg-black">
      {isVideo ? (
        <video src={item.url} muted playsInline preload="metadata"
          className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <img src={item.url} alt={item.caption || "feed"}
          className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105" />
      )}
      {isVideo && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 pointer-events-none">
          <svg width="8" height="9" viewBox="0 0 8 9" fill="white"><path d="M0 0l8 4.5L0 9V0z"/></svg>
          <span className="text-white text-[8px] font-bold tracking-wide">VIDEO</span>
        </div>
      )}
      {/* Overlay de acciones — hover en desktop, siempre visible en táctil (no hay hover) */}
      <div className="feed-item-actions absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3">
        {item.caption && (
          <p className="text-white text-xs text-center leading-relaxed line-clamp-2 pointer-events-none">{item.caption}</p>
        )}
        <div className="flex gap-2">
          <button onPointerDown={e => e.stopPropagation()} onClick={() => onPreview(item)}
            className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/30 active:bg-white/40 transition font-medium border border-white/30">
            Ver
          </button>
          <button onPointerDown={e => e.stopPropagation()} onClick={() => onDelete(item)}
            className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-400 active:bg-red-600 transition font-medium">
            Eliminar
          </button>
        </div>
      </div>
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
        {index + 1}
      </div>
      {isDragging && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
    </div>
  )
}

/* ─── Avatar ─────────────────────────────────────────────────── */
const Avatar = ({ photoURL, size = "md" }) => {
  const sizes = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-20 h-20" }
  const textSizes = { sm: "text-xs", md: "text-2xl", lg: "text-3xl" }
  return (
    <div className={`${sizes[size]} rounded-full p-0.5 flex-shrink-0`}
      style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
      <div className="w-full h-full rounded-full bg-bg-card overflow-hidden flex items-center justify-center">
        {photoURL
          ? <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
          : <span className={textSizes[size]}>👤</span>
        }
      </div>
    </div>
  )
}

/* ─── Feed page ───────────────────────────────────────────────── */
const Feed = () => {
  const { user } = useAuth()

  // Multi-feed
  const [feeds, setFeeds] = useState([])
  const [selectedFeed, setSelectedFeed] = useState(null)
  const [feedModalOpen, setFeedModalOpen] = useState(false)
  const [editingFeed, setEditingFeed] = useState(null)
  const [feedForm, setFeedForm] = useState({ username: "", nombre: "", bio: "", website: "", followers: 0, following: 0, photoURL: null, folderId: "" })

  // Posts
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [caption, setCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mediaType, setMediaType] = useState("photo") // "photo" | "video"
  const [activeTab, setActiveTab] = useState("grid")
  const [previewItem, setPreviewItem] = useState(null)
  const [copiedCaption, setCopiedCaption] = useState(false)

  // Folders
  const [folders, setFolders] = useState([])

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarHeaderRef = useRef(null)
  const avatarModalRef = useRef(null)
  const gridUploadRef = useRef(null)

  // Threshold de 10px antes de activar el drag.
  // Sin esto en táctil, cualquier tap se convierte en arrastre accidental.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  /* ── Fetchers ── */
  const fetchFeeds = async () => {
    if (!user) return
    const q = query(collection(db, "feeds"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    setFeeds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const fetchFolders = async () => {
    if (!user) return
    const q = query(collection(db, "folders"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const fetchItems = async (feedId) => {
    if (!feedId) return
    const q = query(collection(db, "feed_posts"), where("feedId", "==", feedId))
    const snap = await getDocs(q)
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.orden - b.orden))
  }

  useEffect(() => { fetchFeeds(); fetchFolders() }, [user])

  // Auto-select first feed on load
  useEffect(() => {
    if (feeds.length > 0 && !selectedFeed) setSelectedFeed(feeds[0])
  }, [feeds])

  useEffect(() => { if (selectedFeed) fetchItems(selectedFeed.id) }, [selectedFeed])

  /* ── Feed CRUD ── */
  const resetFeedForm = () => setFeedForm({ username: "", nombre: "", bio: "", website: "", followers: 0, following: 0, photoURL: null, folderId: "" })

  const handleCreateFeed = async () => {
    if (!feedForm.username.trim()) return
    await addDoc(collection(db, "feeds"), {
      uid: user.uid,
      username: feedForm.username,
      nombre: feedForm.nombre || "",
      bio: feedForm.bio || "",
      website: feedForm.website || "",
      followers: feedForm.followers,
      following: feedForm.following,
      photoURL: feedForm.photoURL || null,
      folderId: feedForm.folderId || null,
      creadoEn: new Date()
    })
    setFeedModalOpen(false)
    resetFeedForm()
    fetchFeeds()
  }

  const handleEditFeed = async () => {
    if (!editingFeed || !feedForm.username.trim()) return
    const updated = {
      username: feedForm.username,
      nombre: feedForm.nombre || "",
      bio: feedForm.bio || "",
      website: feedForm.website || "",
      followers: feedForm.followers,
      following: feedForm.following,
      photoURL: feedForm.photoURL || null,
      folderId: feedForm.folderId || null,
    }
    await updateDoc(doc(db, "feeds", editingFeed.id), updated)
    const updatedFeed = { ...editingFeed, ...updated }
    setSelectedFeed(updatedFeed)
    setFeeds(fs => fs.map(f => f.id === editingFeed.id ? updatedFeed : f))
    setFeedModalOpen(false)
    setEditingFeed(null)
    resetFeedForm()
  }

  const handleDeleteFeed = async (feed) => {
    await deleteDoc(doc(db, "feeds", feed.id))
    if (selectedFeed?.id === feed.id) {
      setSelectedFeed(null)
      setItems([])
    }
    setFeeds(fs => fs.filter(f => f.id !== feed.id))
  }

  /* ── Avatar upload ── */
  const handleAvatarUpload = async (file, forHeader = false) => {
    if (!file || !user) return
    setAvatarUploading(true)
    try {
      const compressed = await compressImage(file)
      const feedId = editingFeed?.id || (forHeader ? selectedFeed?.id : "new_" + Date.now())
      const storageRef = ref(storage, `profile/${user.uid}/${feedId}/avatar`)
      await uploadBytes(storageRef, compressed)
      const url = await getDownloadURL(storageRef)
      if (forHeader && selectedFeed) {
        await updateDoc(doc(db, "feeds", selectedFeed.id), { photoURL: url })
        const updated = { ...selectedFeed, photoURL: url }
        setSelectedFeed(updated)
        setFeeds(fs => fs.map(f => f.id === selectedFeed.id ? updated : f))
      } else {
        setFeedForm(f => ({ ...f, photoURL: url }))
      }
    } catch (err) { console.error(err) }
    setAvatarUploading(false)
  }

  /* ── Post upload ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    if (!isImage && !isVideo) { alert("Solo se permiten imágenes o videos"); e.target.value = ""; return }
    if (isImage) {
      const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!ALLOWED.includes(file.type)) { alert("Solo se permiten imágenes JPG, PNG, WEBP o GIF"); e.target.value = ""; return }
      if (file.size > 10 * 1024 * 1024) { alert("La imagen no puede superar 10 MB"); e.target.value = ""; return }
    }
    if (isVideo) {
      if (file.size > 100 * 1024 * 1024) { alert("El video no puede superar 100 MB"); e.target.value = ""; return }
    }
    setMediaType(isVideo ? "video" : "photo")
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setPostModalOpen(true)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user || !selectedFeed) return
    setUploading(true)
    try {
      const fileToUpload = mediaType === "photo" ? await compressImage(selectedFile) : selectedFile
      const storageRef = ref(storage, `feed/${user.uid}/${selectedFeed.id}/${Date.now()}_${fileToUpload.name}`)
      await uploadBytes(storageRef, fileToUpload)
      const url = await getDownloadURL(storageRef)
      await addDoc(collection(db, "feed_posts"), {
        uid: user.uid, feedId: selectedFeed.id,
        url, caption, type: mediaType, orden: items.length,
        storagePath: storageRef.fullPath, creadoEn: new Date()
      })
      setPostModalOpen(false); setCaption(""); setSelectedFile(null); setPreview(null); setMediaType("photo")
      fetchItems(selectedFeed.id)
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  const handleDelete = async (item) => {
    try {
      await deleteDoc(doc(db, "feed_posts", item.id))
      if (item.storagePath) await deleteObject(ref(storage, item.storagePath))
      fetchItems(selectedFeed.id)
    } catch (err) { console.error(err) }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({ ...item, orden: index }))
    setItems(newItems)
    for (const item of newItems) await updateDoc(doc(db, "feed_posts", item.id), { orden: item.orden })
  }

  const emptySlots = items.length % 3 === 0 ? 0 : 3 - (items.length % 3)

  /* ── Helpers ── */
  const openEditFeed = (feed, e) => {
    if (e) e.stopPropagation()
    setEditingFeed(feed)
    setFeedForm({
      username: feed.username,
      nombre: feed.nombre || "",
      bio: feed.bio || "",
      website: feed.website || "",
      followers: feed.followers || 0,
      following: feed.following || 0,
      photoURL: feed.photoURL || null,
      folderId: feed.folderId || "",
    })
    setFeedModalOpen(true)
  }

  /* ── Render ── */
  return (
    <DashboardLayout>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">Feed Preview 📱</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            {feeds.length} {feeds.length === 1 ? "cuenta" : "cuentas"} conectadas
          </p>
        </div>
        <button
          onClick={() => { resetFeedForm(); setEditingFeed(null); setFeedModalOpen(true) }}
          className="bg-primary text-white font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm flex-shrink-0"
        >
          + Nuevo
        </button>
      </div>

      {/* ── Cuentas: horizontal scroll en mobile ── */}
      <div className="md:hidden mb-4">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          <button
            onClick={() => { resetFeedForm(); setEditingFeed(null); setFeedModalOpen(true) }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center">
              <span className="text-primary-light text-2xl font-light">+</span>
            </div>
            <span className="text-[10px] text-text-muted">Nuevo</span>
          </button>
          {feeds.map(feed => {
            const isActive = selectedFeed?.id === feed.id
            return (
              <button key={feed.id} onClick={() => setSelectedFeed(feed)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 transition"
                  style={{
                    padding: "2px",
                    background: isActive
                      ? "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"
                      : "var(--border)",
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-bg-card">
                    {feed.photoURL
                      ? <img src={feed.photoURL} alt={feed.username} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-bg-hover flex items-center justify-center text-lg">👤</div>
                    }
                  </div>
                </div>
                <span className={`text-[10px] truncate w-16 text-center leading-tight ${isActive ? "text-primary-light font-semibold" : "text-text-muted"}`}>
                  @{feed.username}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

        {/* ── Sidebar desktop: account list ── */}
        <div className="hidden md:block md:col-span-1 space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">Mis cuentas</p>

          {feeds.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
              <span className="text-3xl mb-2 block">📱</span>
              <p className="text-text-muted text-xs mb-3">Sin cuentas</p>
              <button
                onClick={() => { resetFeedForm(); setEditingFeed(null); setFeedModalOpen(true) }}
                className="text-xs bg-primary/10 border border-primary/20 text-primary-light px-3 py-1.5 rounded-lg hover:bg-primary/20 transition"
              >
                + Añadir cuenta
              </button>
            </div>
          ) : (
            feeds.map(feed => {
              const folder = folders.find(f => f.id === feed.folderId)
              const isActive = selectedFeed?.id === feed.id
              return (
                <div
                  key={feed.id}
                  onClick={() => setSelectedFeed(feed)}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition ${
                    isActive ? "bg-primary/10 border-primary/30" : "bg-bg-card border-border hover:bg-bg-hover"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2 transition"
                    style={{ borderColor: isActive ? "var(--primary)" : "var(--border)" }}
                  >
                    {feed.photoURL
                      ? <img src={feed.photoURL} alt={feed.username} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-bg-hover flex items-center justify-center text-sm">👤</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-main font-medium truncate">@{feed.username}</p>
                    {folder ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color }} />
                        <span className="text-[10px] text-text-muted truncate">{folder.nombre}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-text-muted/50 mt-0.5">Sin carpeta</p>
                    )}
                  </div>
                  <button onClick={e => openEditFeed(feed, e)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary-light transition text-xs">✏️</button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteFeed(feed) }} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition text-xs">🗑️</button>
                </div>
              )
            })
          )}
        </div>

        {/* ── Main: feed content ── */}
        <div className="col-span-1 md:col-span-3">
          {!selectedFeed ? (
            <div className="bg-bg-card border border-border rounded-2xl p-10 sm:p-16 text-center">
              <span className="text-5xl mb-4 block">📱</span>
              <p className="text-text-muted mb-4 text-sm sm:text-base">Selecciona o crea un feed para empezar</p>
              <button
                onClick={() => { resetFeedForm(); setEditingFeed(null); setFeedModalOpen(true) }}
                className="bg-primary text-white font-medium px-5 py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                + Crear primer feed
              </button>
            </div>
          ) : (
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">

              {/* Folder badge */}
              {(() => {
                const folder = folders.find(f => f.id === selectedFeed.folderId)
                if (!folder) return null
                return (
                  <div
                    className="px-5 py-2 border-b border-border flex items-center gap-2"
                    style={{ backgroundColor: folder.color + "18" }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: folder.color }} />
                    <span className="text-xs font-medium" style={{ color: folder.color }}>
                      Carpeta: {folder.nombre}
                    </span>
                  </div>
                )
              })()}

              {/* Upload row */}
              <div className="px-5 pt-4 flex justify-end gap-2">
                {/* Input oculto para el "+" del grid */}
                <input
                  ref={gridUploadRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label className="flex items-center gap-2 bg-bg-input border border-border text-text-main font-semibold px-4 py-2 rounded-xl hover:bg-bg-hover transition cursor-pointer text-xs">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Foto
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                <label className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/25 cursor-pointer text-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6.857A1.857 1.857 0 0 1 3.857 5h16.286A1.857 1.857 0 0 1 22 6.857v10.286A1.857 1.857 0 0 1 20.143 19H3.857A1.857 1.857 0 0 1 2 17.143V6.857zM9.5 9.5v5l5-2.5-5-2.5z"/>
                  </svg>
                  Video
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {/* Profile header */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border flex items-center gap-4 sm:gap-5">
                <div className="relative flex-shrink-0 group">
                  <Avatar photoURL={selectedFeed.photoURL} size="md" />
                  <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition cursor-pointer">
                    {avatarUploading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : (
                        <svg className="opacity-0 group-hover:opacity-100 transition" width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      )
                    }
                    <input
                      ref={avatarHeaderRef}
                      type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files[0]; if (f) handleAvatarUpload(f, true) }}
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="font-semibold text-text-main text-base">{selectedFeed.username}</span>
                    <button
                      onClick={() => openEditFeed(selectedFeed)}
                      className="text-xs bg-bg-input border border-border text-text-main px-4 py-1.5 rounded-lg font-medium hover:bg-bg-hover transition"
                    >
                      Editar perfil
                    </button>
                  </div>
                  <div className="flex gap-3 sm:gap-5 text-xs sm:text-sm mb-3">
                    <div className="text-center sm:text-left">
                      <span className="block font-semibold text-text-main">{items.length}</span>
                      <span className="text-text-muted">posts</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="block font-semibold text-text-main">{(selectedFeed.followers || 0).toLocaleString()}</span>
                      <span className="text-text-muted">seguidores</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="block font-semibold text-text-main">{(selectedFeed.following || 0).toLocaleString()}</span>
                      <span className="text-text-muted">siguiendo</span>
                    </div>
                  </div>
                  {selectedFeed.nombre && (
                    <p className="text-sm font-semibold text-text-main leading-tight">{selectedFeed.nombre}</p>
                  )}
                  {selectedFeed.bio && (
                    <p className="text-sm text-text-main mt-1 leading-snug whitespace-pre-wrap">{selectedFeed.bio}</p>
                  )}
                  {selectedFeed.website && (
                    <p className="text-sm text-blue-400 mt-1 font-medium">{selectedFeed.website}</p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("grid")}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-semibold tracking-widest transition border-t-2 ${
                    activeTab === "grid" ? "border-text-main text-text-main" : "border-transparent text-text-muted hover:text-text-main"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z"/>
                  </svg>
                  CUADRÍCULA
                </button>
                <button
                  onClick={() => setActiveTab("reels")}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-semibold tracking-widest transition border-t-2 ${
                    activeTab === "reels" ? "border-text-main text-text-main" : "border-transparent text-text-muted hover:text-text-main"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6.857A1.857 1.857 0 0 1 3.857 5h16.286A1.857 1.857 0 0 1 22 6.857v10.286A1.857 1.857 0 0 1 20.143 19H3.857A1.857 1.857 0 0 1 2 17.143V6.857zM9.5 9.5v5l5-2.5-5-2.5z"/>
                  </svg>
                  REELS
                </button>
              </div>

              {/* GRID VIEW */}
              {activeTab === "grid" && (
                <>
                  {items.length === 0 ? (
                    <div className="grid grid-cols-3 gap-px bg-border">
                      {Array.from({ length: 9 }).map((_, i) => (
                        i === 4 ? (
                          <div
                            key={i}
                            className="aspect-square bg-bg-card flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-bg-hover transition"
                            onClick={() => gridUploadRef.current?.click()}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                              <svg width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                            </div>
                            <span className="text-[10px] text-text-muted text-center px-2">Sube tu primera foto o video</span>
                          </div>
                        ) : (
                          <div key={i} className="aspect-square bg-bg-card" />
                        )
                      ))}
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 gap-px bg-border">
                          {items.map((item, index) => (
                            <SortableImage key={item.id} item={item} onDelete={handleDelete} onPreview={setPreviewItem} index={index} />
                          ))}
                          {Array.from({ length: emptySlots }).map((_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="aspect-square bg-bg-card flex flex-col items-center justify-center gap-1 text-text-muted/30 cursor-pointer hover:bg-bg-hover hover:text-text-muted/60 transition"
                              onClick={() => gridUploadRef.current?.click()}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                            </div>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </>
              )}

              {/* REELS VIEW */}
              {activeTab === "reels" && (() => {
                const reelItems = items.filter(i => i.type === "video")
                return (
                  <div>
                    {reelItems.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="text-4xl mb-3">🎬</div>
                        <p className="text-text-muted text-sm mb-1">No hay reels todavía</p>
                        <p className="text-text-muted/50 text-xs mb-4">Solo los videos aparecen aquí</p>
                        <label className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl cursor-pointer hover:bg-primary-light transition shadow-lg shadow-primary/30">
                          + Subir video
                          <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-px bg-border">
                        {reelItems.map((item) => (
                          <div key={item.id} className="relative aspect-[9/16] overflow-hidden bg-black group">
                            <video src={item.url} muted playsInline preload="metadata"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />
                            <div className="absolute top-2 right-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pointer-events-none">
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/60 flex-shrink-0 bg-bg-card">
                                  {selectedFeed.photoURL
                                    ? <img src={selectedFeed.photoURL} alt="av" className="w-full h-full object-cover" />
                                    : <span className="text-[8px] flex items-center justify-center h-full">👤</span>
                                  }
                                </div>
                                <span className="text-white text-[10px] font-semibold truncate">{selectedFeed.username}</span>
                              </div>
                              {item.caption && <p className="text-white/90 text-[10px] leading-tight line-clamp-2">{item.caption}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                  {(Math.floor(Math.random() * 900) + 100).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                  {(Math.floor(Math.random() * 90) + 10)}
                                </span>
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button onClick={() => setPreviewItem(item)}
                                className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/30 transition font-medium border border-white/30">
                                Ver
                              </button>
                              <button onClick={() => handleDelete(item)}
                                className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-400 transition font-medium">
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {items.length > 0 && activeTab === "grid" && selectedFeed && (
            <p className="text-center text-text-muted text-xs mt-4">
              💡 Arrastra las fotos/videos para reordenar · Haz clic en "Ver" para previsualizar y copiar la descripción
            </p>
          )}
        </div>
      </div>

      {/* ── Feed create/edit modal ── */}
      {feedModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
              <h2 className="text-text-main font-semibold">{editingFeed ? "Editar feed" : "Nuevo feed"}</h2>
              <button onClick={() => { setFeedModalOpen(false); setEditingFeed(null); resetFeedForm() }}
                className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">

            {/* Avatar */}
            <div className="flex justify-center mb-5">
              <div className="relative group">
                <Avatar photoURL={feedForm.photoURL} size="lg" />
                <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition cursor-pointer">
                  {avatarUploading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : (
                      <div className="opacity-0 group-hover:opacity-100 transition flex flex-col items-center gap-1">
                        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span className="text-white text-[10px]">Cambiar foto</span>
                      </div>
                    )
                  }
                  <input ref={avatarModalRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files[0]; if (f) handleAvatarUpload(f, false) }} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Usuario de Instagram</label>
                <input type="text" value={feedForm.username}
                  onChange={e => setFeedForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="tu_usuario"
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40" />
              </div>

              {/* Nombre completo */}
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Nombre completo</label>
                <input type="text" value={feedForm.nombre}
                  onChange={e => setFeedForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Restaurante La Empanada"
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40" />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Biografía</label>
                <textarea value={feedForm.bio}
                  onChange={e => setFeedForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Ej: 🍕 Comida artesanal · 📍 Madrid&#10;Pedidos por DM"
                  rows={3}
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40 resize-none" />
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Sitio web / Link en bio</label>
                <input type="text" value={feedForm.website}
                  onChange={e => setFeedForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="Ej: linktr.ee/tu_usuario"
                  className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40" />
              </div>

              {/* Followers / Following */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Seguidores</label>
                  <input type="number" value={feedForm.followers} min="0"
                    onChange={e => setFeedForm(f => ({ ...f, followers: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Siguiendo</label>
                  <input type="number" value={feedForm.following} min="0"
                    onChange={e => setFeedForm(f => ({ ...f, following: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Folder assignment */}
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Carpeta (opcional)</label>
                {folders.length === 0 ? (
                  <p className="text-xs text-text-muted/60 italic px-1">
                    No tienes carpetas creadas. Ve a Carpetas para crear una.
                  </p>
                ) : (
                  <>
                    <div className="relative">
                      <select
                        value={feedForm.folderId}
                        onChange={e => setFeedForm(f => ({ ...f, folderId: e.target.value }))}
                        className="w-full bg-bg-input border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                      >
                        <option value="">Sin carpeta</option>
                        {folders.map(folder => (
                          <option key={folder.id} value={folder.id}>{folder.nombre}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                    {feedForm.folderId && (() => {
                      const folder = folders.find(f => f.id === feedForm.folderId)
                      if (!folder) return null
                      return (
                        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg border"
                          style={{ backgroundColor: folder.color + "18", borderColor: folder.color + "44" }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: folder.color }} />
                          <span className="text-xs font-medium" style={{ color: folder.color }}>{folder.nombre}</span>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            </div>

            </div>{/* end scrollable */}

            <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => { setFeedModalOpen(false); setEditingFeed(null); resetFeedForm() }}
                className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={editingFeed ? handleEditFeed : handleCreateFeed}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                {editingFeed ? "Guardar cambios" : "Crear feed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post upload modal ── */}
      {postModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-text-main font-semibold text-sm">
                {mediaType === "video" ? "Nuevo reel" : "Nueva publicación"}
              </h2>
              <button onClick={() => { setPostModalOpen(false); setPreview(null); setMediaType("photo") }}
                className="text-text-muted hover:text-text-main transition text-xl leading-none">✕</button>
            </div>
            {preview && (
              <div className={`w-full overflow-hidden bg-black ${mediaType === "video" ? "aspect-[9/16] max-h-64" : "aspect-square"}`}>
                {mediaType === "video" ? (
                  <video src={preview} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <Avatar photoURL={selectedFeed?.photoURL} size="sm" />
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Escribe una descripción..."
                  rows={3}
                  className="flex-1 bg-transparent text-text-main text-sm resize-none focus:outline-none placeholder:text-text-muted/40"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setPostModalOpen(false); setPreview(null); setMediaType("photo") }}
                  className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleUpload} disabled={uploading}
                  className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50">
                  {uploading ? "Subiendo..." : "Compartir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Post preview modal ── */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in"
          onClick={() => { setPreviewItem(null); setCopiedCaption(false) }}>
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Avatar photoURL={selectedFeed?.photoURL} size="sm" />
              <span className="text-text-main text-sm font-semibold flex-1">{selectedFeed?.username}</span>
              <button onClick={() => { setPreviewItem(null); setCopiedCaption(false) }}
                className="text-text-muted hover:text-text-main transition text-xl leading-none">✕</button>
            </div>
            {/* Media */}
            <div className={`w-full overflow-hidden bg-black ${previewItem.type === "video" ? "aspect-[9/16] max-h-72" : "aspect-square"}`}>
              {previewItem.type === "video" ? (
                <video src={previewItem.url} controls className="w-full h-full object-contain" />
              ) : (
                <img src={previewItem.url} alt={previewItem.caption || ""} className="w-full h-full object-cover" />
              )}
            </div>
            {/* Action icons bar */}
            <div className="px-4 py-2.5 flex items-center gap-4 border-b border-border">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-main cursor-pointer hover:text-red-400 transition">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-main cursor-pointer hover:text-primary-light transition">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-main cursor-pointer hover:text-primary-light transition">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </div>
            {/* Caption + copy */}
            <div className="px-4 py-3">
              {previewItem.caption ? (
                <p className="text-text-main text-sm mb-3 leading-relaxed">
                  <span className="font-semibold mr-1.5">{selectedFeed?.username}</span>
                  <span className="whitespace-pre-wrap">{previewItem.caption}</span>
                </p>
              ) : (
                <p className="text-text-muted/50 text-sm italic mb-3">Sin descripción</p>
              )}
              <button
                onClick={async () => {
                  if (!previewItem.caption) return
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(previewItem.caption)
                    } else {
                      // Fallback para Android WebView antiguo
                      const el = document.createElement("textarea")
                      el.value = previewItem.caption
                      el.style.cssText = "position:fixed;opacity:0"
                      document.body.appendChild(el)
                      el.focus(); el.select()
                      document.execCommand("copy")
                      document.body.removeChild(el)
                    }
                    setCopiedCaption(true)
                    setTimeout(() => setCopiedCaption(false), 2000)
                  } catch { /* silencioso */ }
                }}
                disabled={!previewItem.caption}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                  copiedCaption
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-bg-input border-border text-text-main hover:bg-bg-hover"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {copiedCaption ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copiar descripción
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}

export default Feed
