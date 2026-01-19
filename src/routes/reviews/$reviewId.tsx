import { createFileRoute } from '@tanstack/react-router'
import ReviewPage from '../../components/ReviewPage'

export const Route = createFileRoute('/reviews/$reviewId')({
  component: ReviewRoute,
})

function ReviewRoute() {
  const { reviewId } = Route.useParams()
  return <ReviewPage reviewId={reviewId} />
}
