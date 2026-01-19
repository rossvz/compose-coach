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
