import StructuredReview from './StructuredReview'
import type { ReviewItem } from '../lib/types'

export default function ReviewPanel({
  selectedReview,
  onRegenerate,
}: {
  selectedReview: ReviewItem | null
  onRegenerate: (review: ReviewItem) => void
}) {
  return (
    <section className="review-panel">
      <div className="review-header">
        <h3>Review</h3>
        {selectedReview && (
          <button
            className="link-button"
            type="button"
            onClick={() => onRegenerate(selectedReview)}
            disabled={selectedReview.status === 'loading'}
          >
            Regenerate review
          </button>
        )}
      </div>
      {!selectedReview && (
        <p className="review-meta">Your critique will appear here after an upload.</p>
      )}
      {selectedReview?.status === 'loading' && (
        <p className="review-meta">Analyzing the image and drafting notes...</p>
      )}
      {selectedReview?.status === 'error' && (
        <div className="error">{selectedReview.error}</div>
      )}
      {selectedReview?.status === 'ready' && (
        <StructuredReview review={selectedReview.feedback} />
      )}
    </section>
  )
}
