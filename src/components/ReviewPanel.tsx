import StructuredReview from './StructuredReview'
import type { ReviewItem } from '../lib/types'

export default function ReviewPanel({
  selectedReview,
}: {
  selectedReview: ReviewItem | null
}) {
  return (
    <section className="review-panel">
      <h3>Review</h3>
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
