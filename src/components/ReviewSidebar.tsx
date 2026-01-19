import type { ReviewItem } from '../lib/types'

export default function ReviewSidebar({
  reviews,
  selectedId,
  onSelect,
  onNewReview,
  userEmail,
  onSignOut,
}: {
  reviews: ReviewItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewReview: () => void
  userEmail?: string | null
  onSignOut?: () => void
}) {
  const selectedReview = reviews.find((review) => review.id === selectedId) ?? reviews[0]

  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Compose Coach</h1>
        <p>Single-shot critiques for smarter photos.</p>
      </div>
      <button className="new-review" onClick={onNewReview}>
        New review
      </button>
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
        {reviews.map((review) => (
          <button
            key={review.id}
            className={`review-card${review.id === selectedReview?.id ? ' active' : ''}`}
            onClick={() => onSelect(review.id)}
            type="button"
          >
            <div className="review-thumb">
              {review.previewUrl ? (
                <img src={review.previewUrl} alt={review.title} />
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
        ))}
      </div>
    </aside>
  )
}
