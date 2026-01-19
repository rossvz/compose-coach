import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import '../App.css'
import ReviewSidebar from './ReviewSidebar'
import UploadPanel from './UploadPanel'
import ReviewPanel from './ReviewPanel'
import AuthPanel from './AuthPanel'
import { useReviewUpload } from '../hooks/useReviewUpload'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { getSupabase } from '../lib/supabaseClient'

export default function ReviewPage({ reviewId }: { reviewId?: string }) {
  const acceptTypes = 'image/jpeg,image/png,image/gif,image/webp'
  const navigate = useNavigate()
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
    handleDropFile,
    regenerateReview,
  } = useReviewUpload(user?.id)

  useEffect(() => {
    if (!reviewId) return
    if (selectedId !== reviewId) {
      setSelectedId(reviewId)
    }
  }, [reviewId, selectedId, setSelectedId])

  useEffect(() => {
    if (!reviewId && selectedReview?.reviewId) {
      navigate({ to: '/reviews/$reviewId', params: { reviewId: selectedReview.reviewId } })
    }
  }, [reviewId, selectedReview?.reviewId, navigate])

  const handleSignOut = async () => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut()
    if (error) {
      await supabase.auth.signOut({ scope: 'local' })
    }
  }

  const handleSelectReview = (reviewIdValue: string) => {
    setSelectedId(reviewIdValue)
    navigate({ to: '/reviews/$reviewId', params: { reviewId: reviewIdValue } })
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
        onSelectReview={handleSelectReview}
        onNewReview={handlePickFile}
        onDropFile={handleDropFile}
        userEmail={user.email}
        onSignOut={handleSignOut}
      />
      <main className="main">
        <div className="hero">
          {loadingExisting && !selectedReview ? (
            <>
              <h2>Loading review...</h2>
              <p>Preparing your critique view.</p>
            </>
          ) : selectedReview ? (
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
            isLoading={loadingExisting && !selectedReview}
          />
          {loadingExisting ? (
            <section className="review-panel">
              <h3>Review</h3>
              <p className="review-meta">Loading your saved reviews...</p>
            </section>
          ) : (
            <ReviewPanel
              selectedReview={selectedReview}
              onRegenerate={regenerateReview}
            />
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
