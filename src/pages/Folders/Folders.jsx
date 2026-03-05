import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { db, storage } from "../../firebase/config"
import {
  collection, addDoc, getDocs, query,
  where, deleteDoc, doc
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useAuth } from "../../context/AuthContext"

const COLORES = [
  { name: "Morado", value: "#6022EC" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#10B981" },
  { name: "Rojo", value: "#EF4444" },
  { name: "Amarillo", value: "#F59E0B" },
  { name: "Rosa", value: "#EC4899" },
]

const Folders = () => {
  const { user } = useAuth()
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [files, setFiles] = useState([])
  const [modalFolder, setModalFolder] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [folderForm, setFolderForm] = useState({ nombre: "", color: "#6022EC" })

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

  useEffect(() => { fetchFolders() }, [user])
  useEffect(() => { if (selectedFolder) fetchFiles(selectedFolder.id) }, [selectedFolder])

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
      const storageRef = ref(storage, `folders/${user.uid}/${selectedFolder.id}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
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

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Carpetas 📁</h1>
          <p className="text-text-muted text-sm mt-1">{folders.length} carpetas creadas</p>
        </div>
        <button
          onClick={() => setModalFolder(true)}
          className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-lg shadow-primary/30 text-sm"
        >
          + Nueva carpeta
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">

        <div className="col-span-1 space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Mis carpetas</p>
          {folders.length === 0 ? (
            <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 text-center">
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
                    : "bg-[#13131F] border-[#2A2A3E] hover:bg-[#1E1E2E]"
                }`}
              >
                <span className="text-xl" style={{ color: folder.color }}>📁</span>
                <span className="text-sm text-text-main flex-1 truncate">{folder.nombre}</span>
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

        <div className="col-span-3">
          {!selectedFolder ? (
            <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-16 text-center">
              <span className="text-5xl mb-4 block">👈</span>
              <p className="text-text-muted">Selecciona una carpeta para ver su contenido</p>
            </div>
          ) : (
            <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" style={{ color: selectedFolder.color }}>📁</span>
                  <div>
                    <h2 className="text-text-main font-semibold">{selectedFolder.nombre}</h2>
                    <p className="text-text-muted text-xs">{files.length} archivos</p>
                  </div>
                </div>
                <label className={`bg-primary/20 border border-primary/30 text-primary-light text-sm px-4 py-2 rounded-xl hover:bg-primary/30 transition cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? "Subiendo..." : "+ Subir archivo"}
                  <input type="file" className="hidden" onChange={handleUploadFile} />
                </label>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-3 block">📄</span>
                  <p className="text-text-muted text-sm">Esta carpeta está vacía</p>
                  <p className="text-text-muted/50 text-xs mt-1">Sube archivos o imágenes</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {files.map(file => (
                    <div key={file.id} className="group relative bg-[#0D0D18] border border-[#2A2A3E] rounded-xl overflow-hidden">
                      {isImage(file.tipo) ? (
                        <div className="aspect-square">
                          <img src={file.url} alt={file.nombre} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-square flex flex-col items-center justify-center p-4">
                          <span className="text-4xl mb-2">📄</span>
                          <p className="text-text-muted text-xs text-center truncate w-full">{file.nombre}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-primary/80 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary transition"
                          onClick={e => e.stopPropagation()}
                        >
                          Ver archivo
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="bg-red-500/80 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-500 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="p-2 border-t border-[#2A2A3E]">
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

      {modalFolder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131F] border border-[#2A2A3E] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-text-main font-semibold">Nueva carpeta</h2>
              <button onClick={() => setModalFolder(false)} className="text-text-muted hover:text-text-main text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={folderForm.nombre}
                  onChange={e => setFolderForm({ ...folderForm, nombre: e.target.value })}
                  placeholder="Ej: Cliente Nike"
                  className="w-full bg-[#0D0D18] border border-[#2A2A3E] text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/40"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setFolderForm({ ...folderForm, color: c.value })}
                      className={`w-8 h-8 rounded-full border-2 transition ${folderForm.color === c.value ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#0D0D18] border border-[#2A2A3E] rounded-xl px-4 py-3">
                <span style={{ color: folderForm.color }} className="text-xl">📁</span>
                <span className="text-text-main text-sm">{folderForm.nombre || "Vista previa"}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalFolder(false)}
                className="flex-1 bg-[#0D0D18] border border-[#2A2A3E] text-text-muted py-2.5 rounded-xl hover:bg-[#1E1E2E] transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary-light transition text-sm shadow-lg shadow-primary/30"
              >
                Crear carpeta
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Folders
