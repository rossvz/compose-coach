import type { ReviewRequest } from './types'

export function buildReviewPrompt(exif?: ReviewRequest['exif']) {
  const exifSummary = exif
    ? `EXIF metadata: ${JSON.stringify(exif)}`
    : 'EXIF metadata: none provided.'

  return [
    'You are a photography coach. The user is providing a photo for learning the skill of photography',
    exifSummary,
    'Return a structured critique with these headings exactly:',
    'The Good: (bullet points)',
    'Needs Improvement: (bullet points, be objective)',
    'Technical Suggestions: (bullet points, camera settings or mechanics)',
    'Artistic Suggestions: (bullet points, more creative/subjective)',
    'Overall Score: x/10 (single line)',
    'Be positive but not flattering. Be direct and specific about weaknesses. Avoid simply describing the photo.',
  ].join('\n')
}
