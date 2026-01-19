import { parseReview } from '../lib/parseReview'

export default function StructuredReview({ review }: { review: string }) {
  const parsed = parseReview(review)

  return (
    <div className="structured-review">
      <section>
        <h4>The Good</h4>
        {parsed.good.length > 0 ? (
          <ul>
            {parsed.good.map((item, index) => (
              <li key={`good-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="review-meta">No highlights extracted.</p>
        )}
      </section>
      <section>
        <h4>Needs Improvement</h4>
        {parsed.needsImprovement.length > 0 ? (
          <ul>
            {parsed.needsImprovement.map((item, index) => (
              <li key={`needs-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="review-meta">No issues extracted.</p>
        )}
      </section>
      <section>
        <h4>Technical Suggestions</h4>
        {parsed.technical.length > 0 ? (
          <ul>
            {parsed.technical.map((item, index) => (
              <li key={`tech-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="review-meta">No technical suggestions extracted.</p>
        )}
      </section>
      <section>
        <h4>Artistic Suggestions</h4>
        {parsed.artistic.length > 0 ? (
          <ul>
            {parsed.artistic.map((item, index) => (
              <li key={`art-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="review-meta">No suggestions extracted.</p>
        )}
      </section>
      <section className="score-row">
        <h4>Overall Score</h4>
        <div className="score-value">{parsed.score ?? 'Not provided'}</div>
      </section>
    </div>
  )
}
