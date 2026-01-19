export async function getImageDimensions(file: File) {
  try {
    const bitmap = await createImageBitmap(file)
    const width = bitmap.width
    const height = bitmap.height
    if ('close' in bitmap) {
      bitmap.close()
    }
    return { width, height }
  } catch (error) {
    console.warn('Failed to read image dimensions', error)
    return { width: undefined, height: undefined }
  }
}

export async function createThumbnail(
  file: File,
  options: { maxSize?: number; type?: string; quality?: number } = {},
) {
  const { maxSize = 240, type = 'image/jpeg', quality = 0.82 } = options
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    if ('close' in bitmap) bitmap.close()
    throw new Error('Canvas not available')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  if ('close' in bitmap) bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('No thumbnail'))),
      type,
      quality,
    )
  })

  return { blob, width, height, type }
}
