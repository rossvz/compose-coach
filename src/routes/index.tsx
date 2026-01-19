import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import ReviewSidebar from '../components/ReviewSidebar'
import UploadPanel from '../components/UploadPanel'
import ReviewPanel from '../components/ReviewPanel'
import { useReviewUpload } from '../hooks/useReviewUpload'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const {
    reviews,
    selectedReview,
    selectedId,
    error,
    fileInputRef,
    setSelectedId,
    handlePickFile,
    handleFileChange,
  } = useReviewUpload()

  return (
    <div className="app-shell">
      <ReviewSidebar
        reviews={reviews}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewReview={handlePickFile}
      />
      <main className="main">
        <div className="hero">
          <h2>Photo feedback that is direct and usable.</h2>
          <p>
            Upload a photo and get one consolidated critique focused on composition, lighting,
            focus, and tone.
          </p>
        </div>
        <UploadPanel
          selectedReview={selectedReview}
          onPickFile={handlePickFile}
          onFileChange={handleFileChange}
          error={error}
        />
        <ReviewPanel selectedReview={selectedReview} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </main>
    </div>
  )
}
