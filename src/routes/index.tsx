import { useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import '../App.css'

type ReviewRequest = {
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

type ReviewResponse = {
  review: string
}

type ParsedReview = {
  good: string[]
  needsImprovement: string[]
  technical: string[]
  artistic: string[]
  score: string | null
}

function parseReview(text: string): ParsedReview {
  const sections: ParsedReview = {
    good: [],
    needsImprovement: [],
    technical: [],
    artistic: [],
    score: null,
  }

  const normalized = text.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n').map((line) => line.trim())

  let current: keyof ParsedReview | null = null

  for (const line of lines) {
    if (!line) continue

    const heading = line.toLowerCase()
    if (heading.startsWith('the good')) {
      current = 'good'
      continue
    }
    if (heading.startsWith('needs improvement')) {
      current = 'needsImprovement'
      continue
    }
    if (heading.startsWith('artistic suggestions')) {
      current = 'artistic'
      continue
    }
    if (heading.startsWith('technical suggestions')) {
      current = 'technical'
      continue
    }
    if (heading.startsWith('overall score')) {
      const scoreMatch = line.match(/(\d+(?:\.\d+)?\s*\/\s*10)/i)
      sections.score =
        scoreMatch
          ? scoreMatch[1]
          : line.replace(/overall score\s*:?/i, '').trim() || null
      current = null
      continue
    }

    if (current && current !== 'score') {
      const cleaned = line.replace(/^[-•*]\s*/, '')
      if (cleaned) {
        if (current === 'good') sections.good.push(cleaned)
        if (current === 'needsImprovement') sections.needsImprovement.push(cleaned)
        if (current === 'technical') sections.technical.push(cleaned)
        if (current === 'artistic') sections.artistic.push(cleaned)
      }
    }
  }

  return sections
}

const reviewPhoto = createServerFn({ method: 'POST' })
  .inputValidator((d: ReviewRequest) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment')
    }

    const maxMb = Number(process.env.MAX_IMAGE_MB ?? '8')
    const byteLength = Buffer.from(data.imageBase64, 'base64').byteLength
    if (byteLength > maxMb * 1024 * 1024) {
      throw new Error(`Image exceeds ${maxMb}MB limit`)
    }

    const exifSummary = data.exif
      ? `EXIF metadata: ${JSON.stringify(data.exif)}`
      : 'EXIF metadata: none provided.'

    const prompt = [
      'You are a photography coach.',
      exifSummary,
      'Return a structured critique with these headings exactly:',
      'The Good: (bullet points)',
      'Needs Improvement: (bullet points, be objective)',
      'Technical Suggestions: (bullet points, camera settings or mechanics)',
      'Artistic Suggestions: (bullet points, more creative/subjective)',
      'Overall Score: x/10 (single line)',
      'Be positive but not flattering. Be direct and specific about weaknesses. Avoid simply describing the photo.',
    ].join('\n')

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              {
                type: 'input_image',
                image_url: `data:${data.mimeType};base64,${data.imageBase64}`,
              },
            ],
          },
        ],
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'OpenAI request failed')
    }

    const payload = await response.json()
    const outputText =
      payload?.output?.[0]?.content?.find((item: { type?: string }) => item.type === 'output_text')
        ?.text ??
      payload?.output_text ??
      ''

    if (!outputText) {
      throw new Error('No review text returned from model')
    }

    return { review: outputText } satisfies ReviewResponse
  })

export const Route = createFileRoute('/')({ component: App })

type ReviewItem = {
  id: string
  title: string
  createdAt: string
  previewUrl: string
  feedback: string
  status: 'ready' | 'loading' | 'error'
  error?: string
}

function App() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedId) ?? reviews[0] ?? null,
    [reviews, selectedId],
  )

  const handlePickFile = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      setError('Please upload an image under 8MB.')
      event.target.value = ''
      return
    }

    const dataUrl = await fileToDataUrl(file)
    const exif = await extractExifSummary(file)
    const [meta, base64] = dataUrl.split(',')
    if (!base64) {
      setError('Could not read image data.')
      event.target.value = ''
      return
    }
    const mimeType = meta?.match(/data:(.*);base64/)?.[1] ?? file.type

    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `review-${Date.now()}`

    const newReview: ReviewItem = {
      id,
      title: file.name || 'Untitled upload',
      createdAt: new Date().toLocaleString(),
      previewUrl: dataUrl,
      feedback: '',
      status: 'loading',
    }

    setReviews((prev) => [newReview, ...prev])
    setSelectedId(id)
    setError(null)

    try {
      const result = await reviewPhoto({
        data: {
          imageBase64: base64,
          mimeType,
          fileName: file.name,
          exif,
        },
      })

      setReviews((prev) =>
        prev.map((review) =>
          review.id === id
            ? {
                ...review,
                feedback: result.review,
                status: 'ready',
              }
            : review,
        ),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setReviews((prev) =>
        prev.map((review) =>
          review.id === id
            ? {
                ...review,
                feedback: '',
                status: 'error',
                error: message,
              }
            : review,
        ),
      )
      setError(message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Compose Coach</h1>
          <p>Single-shot critiques for smarter photos.</p>
        </div>
        <button className="new-review" onClick={handlePickFile}>
          New review
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div className="review-list">
          {reviews.length === 0 && (
            <div className="review-meta">No reviews yet.</div>
          )}
          {reviews.map((review) => (
            <button
              key={review.id}
              className={`review-card${review.id === selectedReview?.id ? ' active' : ''}`}
              onClick={() => setSelectedId(review.id)}
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

      <main className="main">
        <div className="hero">
          <h2>Photo feedback that is direct and usable.</h2>
          <p>
            Upload a photo and get one consolidated critique focused on composition, lighting,
            focus, and tone.
          </p>
        </div>

        <section className="upload-panel">
          <div className="status-pill">Step 1 · Upload a recent photo</div>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <p className="review-meta">
            JPEG/PNG/HEIC recommended · max 8MB · one review per upload.
          </p>
          {error && <div className="error">{error}</div>}
        </section>

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
      </main>
    </div>
  )
}

function StructuredReview({ review }: { review: string }) {
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

async function extractExifSummary(
  file: File,
): Promise<ReviewRequest['exif'] | undefined> {
  try {
    const exifr = await import('exifr')
    const data = await exifr.parse(file)
    if (!data) return undefined

    const exposureTime = data.ExposureTime ?? data.exposureTime
    let shutterSpeed: string | undefined
    if (typeof exposureTime === 'number') {
      shutterSpeed =
        exposureTime >= 1
          ? `${exposureTime.toFixed(2)}s`
          : `1/${Math.round(1 / exposureTime)}s`
    } else if (typeof exposureTime === 'string') {
      shutterSpeed = exposureTime
    }

    const aperture =
      typeof data.FNumber === 'number'
        ? Number(data.FNumber.toFixed(1))
        : typeof data.ApertureValue === 'number'
          ? Number(data.ApertureValue.toFixed(1))
          : undefined

    const whiteBalance =
      data.WhiteBalance === 0
        ? 'Auto'
        : data.WhiteBalance === 1
          ? 'Manual'
          : undefined

    const flash =
      data.Flash === 0
        ? 'No flash'
        : typeof data.Flash === 'number'
          ? 'Flash fired'
          : undefined

    const takenAt =
      data.DateTimeOriginal instanceof Date
        ? data.DateTimeOriginal.toISOString()
        : undefined

    const summary = {
      cameraMake: data.Make || data.make,
      cameraModel: data.Model || data.model,
      lensModel: data.LensModel || data.lensModel,
      focalLengthMm:
        typeof data.FocalLength === 'number'
          ? Number(data.FocalLength.toFixed(1))
          : undefined,
      focalLength35mm:
        typeof data.FocalLengthIn35mmFilm === 'number'
          ? Number(data.FocalLengthIn35mmFilm.toFixed(1))
          : undefined,
      aperture,
      shutterSpeed,
      iso:
        typeof data.ISO === 'number'
          ? data.ISO
          : typeof data.PhotographicSensitivity === 'number'
            ? data.PhotographicSensitivity
            : undefined,
      exposureCompensation:
        typeof data.ExposureCompensation === 'number'
          ? Number(data.ExposureCompensation.toFixed(2))
          : undefined,
      whiteBalance,
      flash,
      takenAt,
    }

    const hasValues = Object.values(summary).some(
      (value) => value !== undefined && value !== null && value !== '',
    )

    return hasValues ? summary : undefined
  } catch (error) {
    console.warn('EXIF parse failed', error)
    return undefined
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
