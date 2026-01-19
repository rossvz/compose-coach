import { useMemo, useRef, useState } from 'react'
import type { ReviewItem } from '../lib/types'
import { extractExifSummary } from '../lib/exif'
import { fileToDataUrl } from '../lib/file'
import { reviewPhoto } from '../server/reviewPhoto'

export function useReviewUpload() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedId) ?? reviews[0] ?? null,
    [reviews, selectedId],
  )

  const handlePickFile = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      setError('Please upload an image under 8MB.')
      event.target.value = ''
      return
    }

    const dataUrl = await fileToDataUrl(file)
    const [meta, base64] = dataUrl.split(',')
    if (!base64) {
      setError('Could not read image data.')
      event.target.value = ''
      return
    }
    const mimeType = meta?.match(/data:(.*);base64/)?.[1] ?? file.type
    const exif = await extractExifSummary(file)

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `review-${Date.now()}`

    const newReview: ReviewItem = {
      id,
      title: file.name || 'Untitled upload',
      createdAt: new Date().toLocaleString(),
      previewUrl: dataUrl,
      exif,
      feedback: '',
      status: 'loading',
    }

    setReviews((prev) => [newReview, ...prev])
    setSelectedId(id)
    setError(null)

    try {
      const result = await reviewPhoto({
        data: {
          imageBase64: base64,
          mimeType,
          fileName: file.name,
          exif,
        },
      })

      setReviews((prev) =>
        prev.map((review) =>
          review.id === id
            ? {
                ...review,
                feedback: result.review,
                status: 'ready',
              }
            : review,
        ),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setReviews((prev) =>
        prev.map((review) =>
          review.id === id
            ? {
                ...review,
                feedback: '',
                status: 'error',
                error: message,
              }
            : review,
        ),
      )
      setError(message)
    } finally {
      event.target.value = ''
    }
  }

  return {
    reviews,
    selectedReview,
    selectedId,
    error,
    fileInputRef,
    setSelectedId,
    handlePickFile,
    handleFileChange,
  }
}
