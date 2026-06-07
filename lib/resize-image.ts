// Browser-only: downscale a chosen photo before upload so we don't store (and
// pay for) full-resolution phone images. A 12 MP photo (~4 MB) becomes a
// ~1200px JPEG of a few hundred KB with no visible quality loss on the map.
// Returns the original file untouched if anything goes wrong (e.g. HEIC that the
// canvas can't decode — the upload route still accepts those).
export async function downscaleImage(
  file: File,
  maxDim = 1200,
  quality = 0.82,
): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) return file

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file // undecodable (e.g. some HEIC) — let the server take the original
  }

  try {
    const { width, height } = bitmap
    // Already within bounds: no point re-encoding.
    if (width <= maxDim && height <= maxDim) return file

    const scale = maxDim / Math.max(width, height)
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } finally {
    bitmap.close?.()
  }
}
