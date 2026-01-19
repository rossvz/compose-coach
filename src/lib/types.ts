export type ReviewRequest = {
  imageBase64: string
  mimeType: string
  fileName: string
  exif?: {
    cameraMake?: string
    cameraModel?: string
    lensModel?: string
    focalLengthMm?: number
    focalLength35mm?: number
    aperture?: number
    shutterSpeed?: string
    iso?: number
    exposureCompensation?: number
    whiteBalance?: string
    flash?: string
    takenAt?: string
  }
}

export type ReviewResponse = {
  review: string
  title?: string
}

export type ParsedReview = {
  good: string[]
  needsImprovement: string[]
  technical: string[]
  artistic: string[]
  score: string | null
}

export type ReviewItem = {
  id: string
  title: string
  createdAt: string
  previewUrl: string
  exif?: ReviewRequest['exif']
  mimeType?: string
  photoId?: string
  storagePath?: string
  reviewId?: string
  feedback: string
  status: 'ready' | 'loading' | 'error'
  error?: string
}
