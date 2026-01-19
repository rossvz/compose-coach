import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReviewItem } from '../lib/types'
import { extractExifSummary } from '../lib/exif'
import { blobToBase64, fileToDataUrl } from '../lib/file'
import { createThumbnail, getImageDimensions } from '../lib/image'
import { reviewPhoto } from '../server/reviewPhoto'
import { getSupabase } from '../lib/supabaseClient'

const REVIEWS_LIMIT = 20
const SIGNED_URL_TTL = 60 * 60
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function useReviewUpload(
  userId?: string,
  options?: { onReviewCreated?: (reviewId: string) => void },
) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedReview = useMemo(
    () =>
      reviews.find(
        (review) => review.reviewId === selectedId || review.id === selectedId,
      ) ?? reviews[0] ?? null,
    [reviews, selectedId],
  )

  useEffect(() => {
    if (!userId) {
      setReviews([])
      setSelectedId(null)
      setError(null)
      setLoadingExisting(false)
      return
    }

    let active = true

    const loadExisting = async () => {
      setLoadingExisting(true)
      setError(null)
      const supabase = getSupabase()
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(
          'id, created_at, review_text, ai_title, model, photo:photos(id, storage_path, thumbnail_path, thumbnail_mime_type, original_name, mime_type, exif, created_at)',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(REVIEWS_LIMIT)

      if (!active) return

      if (fetchError) {
        console.error('Failed to load reviews', fetchError)
        setError(fetchError.message)
        setLoadingExisting(false)
        return
      }

      const mapped: ReviewItem[] = []

      for (const row of data ?? []) {
        const photo = row.photo as {
          id: string
          storage_path: string
          thumbnail_path: string | null
          thumbnail_mime_type: string | null
          original_name: string | null
          mime_type: string | null
          exif: Record<string, unknown> | null
          created_at: string
        } | null

        let previewUrl = ''
        let thumbnailUrl = ''
        if (photo?.thumbnail_path) {
          const { data: signedThumb, error: thumbError } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.thumbnail_path, SIGNED_URL_TTL)
          if (thumbError) {
            console.warn('Failed to sign thumbnail URL', thumbError)
          }
          thumbnailUrl = signedThumb?.signedUrl ?? ''
        }
        if (photo?.storage_path) {
          const { data: signed, error: signedError } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, SIGNED_URL_TTL)
          if (signedError) {
            console.warn('Failed to sign photo URL', signedError)
          }
          previewUrl = signed?.signedUrl ?? ''
        }

        mapped.push({
          id: row.id,
          title: row.ai_title || photo?.original_name || 'Uploaded photo',
          createdAt: new Date(row.created_at).toLocaleString(),
          previewUrl,
          thumbnailUrl,
          exif: (photo?.exif as ReviewItem['exif']) ?? undefined,
          mimeType: photo?.mime_type ?? undefined,
          feedback: row.review_text,
          status: 'ready',
          photoId: photo?.id,
          storagePath: photo?.storage_path,
          reviewId: row.id,
        })
      }

      setReviews(mapped)
      setSelectedId((current) => current ?? mapped[0]?.id ?? null)
      setLoadingExisting(false)
    }

    loadExisting()

    return () => {
      active = false
    }
  }, [userId])

  const handlePickFile = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const processFile = async (file: File) => {
    if (!userId) {
      setError('Sign in to upload photos.')
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, GIF, or WEBP image.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Please upload an image under 8MB.')
      return
    }

    const dataUrl = await fileToDataUrl(file)
    const [meta, base64] = dataUrl.split(',')
    if (!base64) {
      setError('Could not read image data.')
      return
    }
    const mimeType = meta?.match(/data:(.*);base64/)?.[1] ?? file.type
    const exif = await extractExifSummary(file)
    const { width, height } = await getImageDimensions(file)
    let thumbnail: { blob: Blob; type: string } | null = null
    let thumbnailObjectUrl: string | undefined
    try {
      const created = await createThumbnail(file)
      thumbnail = { blob: created.blob, type: created.type }
      thumbnailObjectUrl = URL.createObjectURL(created.blob)
    } catch (thumbError) {
      console.warn('Thumbnail generation failed', thumbError)
    }

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `review-${Date.now()}`

    const newReview: ReviewItem = {
      id,
      title: file.name || 'Untitled upload',
      createdAt: new Date().toLocaleString(),
      previewUrl: dataUrl,
      thumbnailUrl: thumbnailObjectUrl,
      exif,
      mimeType,
      feedback: '',
      status: 'loading',
    }

    setReviews((prev) => [newReview, ...prev])
    setSelectedId(id)
    setError(null)

    try {
      const safeName = (file.name || 'photo').replace(/[^\w.-]+/g, '-')
      const storagePath = `${userId}/${id}-${safeName}`

      const supabase = getSupabase()
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) {
        throw uploadError
      }

      let thumbnailPath: string | null = null
      if (thumbnail) {
        thumbnailPath = `${userId}/thumb-${id}.jpg`
        const { error: thumbUploadError } = await supabase.storage
          .from('photos')
          .upload(thumbnailPath, thumbnail.blob, { contentType: thumbnail.type })

        if (thumbUploadError) {
          throw thumbUploadError
        }
      }

      const { data: photoRow, error: photoError } = await supabase
        .from('photos')
        .insert({
          user_id: userId,
          storage_bucket: 'photos',
          storage_path: storagePath,
          thumbnail_path: thumbnailPath,
          thumbnail_mime_type: thumbnail?.type ?? null,
          mime_type: file.type,
          original_name: file.name,
          file_size: file.size,
          width,
          height,
          exif,
        })
        .select('id')
        .single()

      if (photoError) {
        throw photoError
      }

      const { data: reviewRow, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          photo_id: photoRow.id,
          review_text: 'Generating review...',
          ai_title: null,
          model: 'openai',
        })
        .select('id, created_at')
        .single()

      if (reviewError) {
        throw reviewError
      }

      setReviews((prev) =>
        prev.map((review) =>
          review.id === id
            ? {
                ...review,
                reviewId: reviewRow.id,
                createdAt: reviewRow.created_at
                  ? new Date(reviewRow.created_at).toLocaleString()
                  : review.createdAt,
              }
            : review,
        ),
      )
      setSelectedId(reviewRow.id)
      options?.onReviewCreated?.(reviewRow.id)

      const result = await reviewPhoto({
        data: {
          imageBase64: base64,
          mimeType,
          fileName: file.name,
          exif,
        },
      })

      const { error: reviewUpdateError } = await supabase
        .from('reviews')
        .update({
          review_text: result.review,
          ai_title: result.title ?? null,
        })
        .eq('id', reviewRow.id)
        .eq('user_id', userId)

      if (reviewUpdateError) {
        throw reviewUpdateError
      }

      const { data: signed } = await supabase.storage
        .from('photos')
        .createSignedUrl(storagePath, SIGNED_URL_TTL)
      const { data: signedThumb } = thumbnailPath
        ? await supabase.storage.from('photos').createSignedUrl(thumbnailPath, SIGNED_URL_TTL)
        : { data: null }

      setReviews((prev) =>
        prev.map((review) =>
          review.id === id
            ? {
                ...review,
                title: result.title || review.title,
                feedback: result.review,
                status: 'ready',
                photoId: photoRow.id,
                reviewId: reviewRow.id,
                storagePath,
                previewUrl: signed?.signedUrl ?? review.previewUrl,
                thumbnailUrl: signedThumb?.signedUrl ?? review.thumbnailUrl,
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
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
    event.target.value = ''
  }

  const handleDropFile = async (file: File) => {
    await processFile(file)
  }

  const regenerateReview = async (review: ReviewItem) => {
    if (!userId) {
      setError('Sign in to regenerate reviews.')
      return
    }

    if (!review.storagePath) {
      setError('Missing original photo for this review.')
      return
    }

    setError(null)
    setReviews((prev) =>
      prev.map((item) =>
        item.id === review.id
          ? { ...item, status: 'loading', error: undefined }
          : item,
      ),
    )

    try {
      const supabase = getSupabase()
      const { data: signed, error: signedError } = await supabase.storage
        .from('photos')
        .createSignedUrl(review.storagePath, SIGNED_URL_TTL)

      if (signedError || !signed?.signedUrl) {
        throw signedError ?? new Error('Could not access stored photo.')
      }

      const response = await fetch(signed.signedUrl)
      if (!response.ok) {
        throw new Error('Failed to download stored photo.')
      }
      const blob = await response.blob()
      const mimeType = review.mimeType || blob.type || 'image/jpeg'
      const base64 = await blobToBase64(blob)

      const result = await reviewPhoto({
        data: {
          imageBase64: base64,
          mimeType,
          fileName: review.title,
          exif: review.exif,
        },
      })

      const reviewId = review.reviewId ?? review.id
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          review_text: result.review,
          ai_title: result.title ?? null,
        })
        .eq('id', reviewId)
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }

      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id
            ? {
                ...item,
                title: result.title || item.title,
                feedback: result.review,
                status: 'ready',
              }
            : item,
        ),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id
            ? {
                ...item,
                status: 'error',
                error: message,
              }
            : item,
        ),
      )
      setError(message)
    }
  }

  return {
    reviews,
    selectedReview,
    selectedId,
    error,
    loadingExisting,
    fileInputRef,
    setSelectedId,
    handlePickFile,
    handleFileChange,
    handleDropFile,
    regenerateReview,
  }
}
