/**
 * Comprime una imagen antes de subir a Firebase Storage.
 * Reduce imágenes grandes a max 1080px de ancho con calidad 0.78 JPEG.
 * Ahorra ~70-85% en tamaño de almacenamiento y ancho de banda.
 */
const compressImage = (file, maxWidth = 1080, quality = 0.78) => {
  return new Promise((resolve) => {
    // Solo comprimir imágenes (no GIFs animados ni SVG)
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
      resolve(file)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      if (width <= maxWidth) {
        // Ya es pequeña — solo re-encodear para reducir metadata
        if (file.size < 200 * 1024) { resolve(file); return }
      } else {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement("canvas")
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
        },
        "image/jpeg",
        quality
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

export default compressImage
