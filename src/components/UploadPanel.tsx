import ExifList from './ExifList'
import type { ReviewItem } from '../lib/types'

export default function UploadPanel({
  selectedReview,
  onPickFile,
  onFileChange,
  error,
}: {
  selectedReview: ReviewItem | null
  onPickFile: () => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  error: string | null
}) {
  return (
    <section className="upload-panel">
      {selectedReview?.previewUrl ? (
        <>
          <div className="status-pill">Current photo</div>
          <div className="photo-preview">
            <img src={selectedReview.previewUrl} alt={selectedReview.title} />
          </div>
          <div className="exif-panel">
            <h4>EXIF Details</h4>
            <ExifList exif={selectedReview.exif} />
          </div>
          <button className="new-review" onClick={onPickFile}>
            Upload another
          </button>
        </>
      ) : (
        <>
          <div className="status-pill">Step 1 · Upload a recent photo</div>
          <input type="file" accept="image/*" onChange={onFileChange} />
          <p className="review-meta">
            JPEG/PNG/HEIC recommended · max 8MB · one review per upload.
          </p>
        </>
      )}
      {error && <div className="error">{error}</div>}
    </section>
  )
}
