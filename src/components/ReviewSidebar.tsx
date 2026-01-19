import { useEffect, useState } from 'react'
import type { ReviewItem } from '../lib/types'

export default function ReviewSidebar({
  reviews,
  selectedId,
  onSelectReview,
  onNewReview,
  userEmail,
  onSignOut,
  onDropFile,
  onDeleteReview,
}: {
  reviews: ReviewItem[]
  selectedId: string | null
  onSelectReview: (reviewId: string) => void
  onNewReview: () => void
  userEmail?: string | null
  onSignOut?: () => void
  onDropFile: (file: File) => void
  onDeleteReview: (review: ReviewItem) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const selectedReview =
    reviews.find((review) => review.reviewId === selectedId) ??
    reviews.find((review) => review.id === selectedId) ??
    reviews[0]

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      onDropFile(file)
    }
  }

  useEffect(() => {
    const handler = () => setIsOpen((prev) => !prev)
    window.addEventListener('toggle-sidebar', handler)
    return () => window.removeEventListener('toggle-sidebar', handler)
  }, [])

  useEffect(() => {
    if (selectedId) {
      setIsOpen(false)
    }
  }, [selectedId])

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <button
        type="button"
        className="sidebar-close"
        onClick={() => setIsOpen(false)}
        aria-label="Close menu"
      >
        ✕
      </button>
      <div className="brand">
        <h1>Compose Coach</h1>
        <p>Single-shot critiques for smarter photos.</p>
      </div>
      <button className="new-review" onClick={onNewReview}>
        New review
      </button>
      <div
        className={`drop-zone${isDragging ? ' dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-zone-title">Drop a photo here</div>
        <div className="review-meta">JPG, PNG, GIF, or WEBP</div>
      </div>
      {userEmail && (
        <div className="user-block">
          <div className="review-meta">Signed in as</div>
          <div className="user-email">{userEmail}</div>
          {onSignOut && (
            <button className="link-button" type="button" onClick={onSignOut}>
              Sign out
            </button>
          )}
        </div>
      )}
      <div className="review-list">
        {reviews.length === 0 && (
          <div className="review-meta">No reviews yet.</div>
        )}
        {reviews.map((review) => {
          const reviewKey = review.reviewId ?? review.id
          const isActive = reviewKey === selectedId
          return (
            <div
              key={review.id}
              className={`review-card${isActive ? ' active' : ''}`}
            >
              <button
                className="review-card-main"
                onClick={() => onSelectReview(reviewKey)}
                type="button"
              >
                <div className="review-thumb">
                  {review.thumbnailUrl || review.previewUrl ? (
                    <img
                      src={review.thumbnailUrl ?? review.previewUrl}
                      alt={review.title}
                    />
                  ) : (
                    'Preview'
                  )}
                </div>
                <div>
                  <div className="review-title">{review.title}</div>
                  <div className="review-meta">{review.createdAt}</div>
                  <div className="review-meta">
                    {review.status === 'loading'
                      ? 'Analyzing...'
                      : review.status === 'error'
                        ? 'Needs retry'
                        : 'Ready'}
                  </div>
                </div>
              </button>
              <button
                className="review-delete"
                type="button"
                onClick={() => onDeleteReview(review)}
                aria-label={`Delete ${review.title}`}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
