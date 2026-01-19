import { useEffect, useState } from 'react'
import ExifList from './ExifList'
import type { ReviewItem } from '../lib/types'

export default function UploadPanel({
  selectedReview,
  onPickFile,
  onFileChange,
  error,
  acceptTypes,
  isLoading,
}: {
  selectedReview: ReviewItem | null
  onPickFile: () => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  error: string | null
  acceptTypes: string
  isLoading: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  return (
    <section className="upload-panel">
      {selectedReview?.previewUrl ? (
        <>
          <button
            type="button"
            className="photo-preview"
            onClick={() => setIsOpen(true)}
            aria-label="Open full screen preview"
          >
            <img src={selectedReview.previewUrl} alt={selectedReview.title} />
          </button>
          <div className="exif-panel">
            <h4>EXIF Details</h4>
            <ExifList exif={selectedReview.exif} />
          </div>
        </>
      ) : (
        <>
          {isLoading ? (
            <div className="loading-panel">
              <div className="spinner" aria-hidden="true" />
              <div className="status-pill">Loading your review...</div>
              <p className="review-meta">Fetching your saved reviews.</p>
            </div>
          ) : (
            <>
              <div className="status-pill">Step 1 · Upload a recent photo</div>
              <input type="file" accept={acceptTypes} onChange={onFileChange} />
              <p className="review-meta">
                JPG/PNG/GIF/WEBP · max 8MB · stored for 30 days.
              </p>
            </>
          )}
        </>
      )}
      {error && <div className="error">{error}</div>}
      {isOpen && selectedReview?.previewUrl && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            className="modal-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close preview"
          >
            Close
          </button>
          <img
            className="modal-image"
            src={selectedReview.previewUrl}
            alt={selectedReview.title}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
