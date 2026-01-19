import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/up')({
  server: {
    handlers: {
      GET: async () =>
        new Response('ok', {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
    },
  },
})
