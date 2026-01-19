import { createServerFn } from '@tanstack/react-start'
import type { ReviewRequest, ReviewResponse } from '../lib/types'
import { buildReviewPrompt } from '../lib/reviewPrompt'

export const reviewPhoto = createServerFn({ method: 'POST' })
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

    const prompt = buildReviewPrompt(data.exif)

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
      payload?.output?.[0]?.content?.find(
        (item: { type?: string }) => item.type === 'output_text',
      )?.text ??
      payload?.output_text ??
      ''

    if (!outputText) {
      throw new Error('No review text returned from model')
    }

    const { title, review } = splitTitle(outputText)

    return { review, title } satisfies ReviewResponse
  })

function splitTitle(text: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let title: string | undefined
  const rest: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      rest.push(line)
      continue
    }
    if (!title && /^title\s*:/i.test(trimmed)) {
      title = trimmed.replace(/^title\s*:/i, '').trim()
      continue
    }
    rest.push(line)
  }

  return { title, review: rest.join('\n').trim() }
}
