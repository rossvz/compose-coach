import type { ParsedReview } from './types'

export function parseReview(text: string): ParsedReview {
  const sections: ParsedReview = {
    good: [],
    needsImprovement: [],
    technical: [],
    artistic: [],
    score: null,
  }

  const normalized = text.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n').map((line) => line.trim())

  type SectionKey = 'good' | 'needsImprovement' | 'technical' | 'artistic'
  let current: SectionKey | null = null

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
    if (heading.startsWith('technical suggestions')) {
      current = 'technical'
      continue
    }
    if (heading.startsWith('artistic suggestions')) {
      current = 'artistic'
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

    if (current) {
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
