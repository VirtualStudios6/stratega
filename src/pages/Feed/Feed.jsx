import { useState, useEffect } from "react"
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
import { askGroq } from "../../services/groq"

const SortableImage = ({ item, onDelete, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group aspect-square overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <img
        src={item.url}
        alt={item.caption || "feed"}
        className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 p-3">
        {item.caption && (
          <p className="text-white text-xs text-center leading-relaxed line-clamp-3 pointer-events-none">
            {item.caption}
          </p>
        )}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onDelete(item)}
          className="bg-red-500 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-red-400 transition font-medium"
        >
          Eliminar
        </button>
      </div>

      {/* Position badge */}
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
        {index + 1}
      </div>

      {isDragging && (
        <div className="absolute inset-0 border-2 border-primary pointer-events-none" />
      )}
    </div>
  )
}

const Feed = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [caption, setCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [loadingAi, setLoadingAi] = useState(false)
  const [activeTab, setActiveTab] = useState("grid")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchItems = async () => {
    if (!user) return
    const q = query(collection(db, "feed_posts"), where("uid", "==", user.uid))
    const snap = await getDocs(q)
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.orden - b.orden)
    setItems(data)
  }

  useEffect(() => { fetchItems() }, [user])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setModalOpen(true)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return
    setUploading(true)
    try {
      const storageRef = ref(storage, `feed/${user.uid}/${Date.now()}_${selectedFile.name}`)
      await uploadBytes(storageRef, selectedFile)
      const url = await getDownloadURL(storageRef)
      await addDoc(collection(db, "feed_posts"), {
        uid: user.uid,
        url,
        caption,
        orden: items.length,
        storagePath: storageRef.fullPath,
        creadoEn: new Date()
      })
      setModalOpen(false)
      setCaption("")
      setSelectedFile(null)
      setPreview(null)
      fetchItems()
    } catch (err) {
      console.error(err)
    }
    setUploading(false)
  }

  const handleDelete = async (item) => {
    try {
      await deleteDoc(doc(db, "feed_posts", item.id))
      if (item.storagePath) {
        await deleteObject(ref(storage, item.storagePath))
      }
      fetchItems()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item, orden: index
    }))
    setItems(newItems)
    for (const item of newItems) {
      await updateDoc(doc(db, "feed_posts", item.id), { orden: item.orden })
    }
  }

  const handleAiSuggestion = async () => {
    if (items.length < 2) {
      setAiSuggestion("Sube al menos 2 imágenes para que la IA pueda sugerirte una organización.")
      return
    }
    setLoadingAi(true)
    setAiSuggestion("")
    try {
      const descripcionFeed = items.map((item, i) =>
        `Imagen ${i + 1}: ${item.caption || "sin descripción"}`
      ).join("\n")

      const prompt = `Tengo un feed de Instagram con ${items.length} imágenes en este orden:\n${descripcionFeed}\n\n¿Cómo debería organizarlas para que el feed se vea más atractivo y cohesivo? Dame sugerencias específicas de orden y estrategia visual.`

      const respuesta = await askGroq(prompt, `Eres un experto en estrategia visual para Instagram y redes sociales.
      Analizas feeds y das sugerencias concretas y accionables para mejorar la estética y el engagement.
      Responde en español, de forma concisa y con consejos prácticos. Usa emojis para hacer la respuesta más dinámica.`)

      setAiSuggestion(respuesta)
    } catch (err) {
      setAiSuggestion("❌ Error al conectar con la IA. Intenta de nuevo.")
    }
    setLoadingAi(false)
  }

  const emptySlots = items.length % 3 === 0 ? 0 : 3 - (items.length % 3)

  return (
    <DashboardLayout>

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Feed Preview</h1>
          <p className="text-text-muted text-sm mt-1">
            {items.length} {items.length === 1 ? "publicación" : "publicaciones"} · Arrastra para reordenar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAiSuggestion}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-primary/15 border border-primary/25 text-primary-light text-sm px-4 py-2.5 rounded-xl hover:bg-primary/25 transition disabled:opacity-50"
          >
            <span>🤖</span>
            {loadingAi ? "Analizando..." : "Analizar con IA"}
          </button>
          <label className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/25 cursor-pointer text-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Subir imagen
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      {/* AI SUGGESTION */}
      {aiSuggestion && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
                🤖
              </div>
              <div>
                <p className="text-primary-light text-sm font-semibold mb-1">Sugerencia de Strat AI</p>
                <p className="text-text-main text-sm whitespace-pre-line leading-relaxed">{aiSuggestion}</p>
              </div>
            </div>
            <button onClick={() => setAiSuggestion("")} className="text-text-muted hover:text-text-main transition text-lg flex-shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* INSTAGRAM MOCKUP */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">

        {/* Profile header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-5">
          <div className="w-16 h-16 rounded-full p-0.5 flex-shrink-0" style={{background:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"}}>
            <div className="w-full h-full rounded-full bg-bg-card flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-semibold text-text-main text-base">tu_usuario</span>
              <button className="text-xs bg-bg-input border border-border text-text-main px-4 py-1.5 rounded-lg font-medium hover:bg-bg-hover transition">
                Editar perfil
              </button>
            </div>
            <div className="flex gap-5 text-sm">
              <span className="text-text-main">
                <span className="font-semibold">{items.length}</span>
                <span className="text-text-muted ml-1">publicaciones</span>
              </span>
              <span className="text-text-main">
                <span className="font-semibold">0</span>
                <span className="text-text-muted ml-1">seguidores</span>
              </span>
              <span className="text-text-main">
                <span className="font-semibold">0</span>
                <span className="text-text-muted ml-1">siguiendo</span>
              </span>
            </div>
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
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-semibold tracking-widest transition border-t-2 ${
              activeTab === "list" ? "border-text-main text-text-main" : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            LISTA
          </button>
        </div>

        {/* GRID VIEW */}
        {activeTab === "grid" && (
          <>
            {items.length === 0 ? (
              <div className="grid grid-cols-3 gap-0.5 bg-border">
                {Array.from({ length: 9 }).map((_, i) => (
                  i === 4 ? (
                    <label key={i} className="aspect-square bg-bg-card flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-bg-hover transition">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                        <svg width="20" height="20" fill="none" stroke="#6022EC" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </div>
                      <span className="text-xs text-text-muted">Sube tu primera imagen</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div key={i} className="aspect-square bg-bg-card" />
                  )
                ))}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 gap-0.5 bg-border">
                    {items.map((item, index) => (
                      <SortableImage key={item.id} item={item} onDelete={handleDelete} index={index} />
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <label key={`empty-${i}`} className="aspect-square bg-bg-card flex items-center justify-center cursor-pointer hover:bg-bg-hover transition group">
                        <div className="flex flex-col items-center gap-1.5 text-text-muted group-hover:text-text-main transition">
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                          <span className="text-xs">Agregar</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}

        {/* LIST VIEW */}
        {activeTab === "list" && (
          <div>
            {items.length === 0 ? (
              <div className="py-16 text-center text-text-muted text-sm">No hay publicaciones todavía</div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-bg-hover transition">
                    <span className="text-text-muted text-sm w-5 text-center font-medium">{index + 1}</span>
                    <img src={item.url} alt={item.caption} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-main text-sm font-medium truncate">{item.caption || "Sin descripción"}</p>
                      <p className="text-text-muted text-xs mt-0.5">Posición #{index + 1}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-text-muted hover:text-red-400 transition p-2 rounded-lg hover:bg-red-500/10"
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <p className="text-center text-text-muted text-xs mt-4">
          💡 Arrastra las imágenes en la cuadrícula para reordenar tu feed
        </p>
      )}

      {/* UPLOAD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-text-main font-semibold text-sm">Nueva publicación</h2>
              <button
                onClick={() => { setModalOpen(false); setPreview(null) }}
                className="text-text-muted hover:text-text-main transition text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {preview && (
              <div className="aspect-square w-full overflow-hidden">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full p-0.5 flex-shrink-0" style={{background:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"}}>
                  <div className="w-full h-full rounded-full bg-bg-card flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                </div>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Escribe una descripción..."
                  rows={3}
                  className="flex-1 bg-transparent text-text-main text-sm resize-none focus:outline-none placeholder:text-text-muted/40"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setModalOpen(false); setPreview(null) }}
                  className="flex-1 bg-bg-input border border-border text-text-muted py-2.5 rounded-xl hover:bg-bg-hover transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : "Compartir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}

export default Feed
