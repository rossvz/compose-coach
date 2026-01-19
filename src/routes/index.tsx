import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import ReviewSidebar from '../components/ReviewSidebar'
import UploadPanel from '../components/UploadPanel'
import ReviewPanel from '../components/ReviewPanel'
import AuthPanel from '../components/AuthPanel'
import { useReviewUpload } from '../hooks/useReviewUpload'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { supabase } from '../lib/supabaseClient'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const acceptTypes = 'image/jpeg,image/png,image/gif,image/webp'
  const { user, loading } = useSupabaseAuth()
  const {
    reviews,
    selectedReview,
    selectedId,
    error,
    loadingExisting,
    fileInputRef,
    setSelectedId,
    handlePickFile,
    handleFileChange,
  } = useReviewUpload(user?.id)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="auth-panel">
        <h2>Loading</h2>
        <p className="review-meta">Checking your session...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPanel />
  }

  return (
    <div className="app-shell">
      <ReviewSidebar
        reviews={reviews}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewReview={handlePickFile}
        userEmail={user.email}
        onSignOut={handleSignOut}
      />
      <main className="main">
        <div className="hero">
          {selectedReview ? (
            <>
              <h2>{selectedReview.title}</h2>
              <p>{selectedReview.createdAt}</p>
            </>
          ) : (
            <>
              <h2>Upload a photo to get started.</h2>
              <p>We’ll analyze composition, lighting, focus, and tone.</p>
            </>
          )}
        </div>
        <div className="content-panels">
        <UploadPanel
          selectedReview={selectedReview}
          onPickFile={handlePickFile}
          onFileChange={handleFileChange}
          error={error}
          acceptTypes={acceptTypes}
        />
        {loadingExisting ? (
            <section className="review-panel">
              <h3>Review</h3>
              <p className="review-meta">Loading your saved reviews...</p>
            </section>
          ) : (
            <ReviewPanel selectedReview={selectedReview} />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </main>
    </div>
  )
}
