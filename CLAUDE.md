# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on port 5000
npm run build    # Production build
npm run test     # Run Vitest tests
```

## Architecture

Compose Coach is a photography review app that uses AI (OpenAI Vision) to analyze photos and provide structured feedback. Built with TanStack React Start (full-stack React + Nitro) and Supabase.

### Data Flow

1. User uploads photo → client extracts EXIF + generates thumbnail
2. Original photo + thumbnail uploaded to Supabase Storage
3. Photo/review records created in Supabase database
4. `reviewPhoto()` server function calls OpenAI Vision API with structured prompt
5. AI response parsed into sections (The Good, Needs Improvement, Technical/Artistic Suggestions, Score)
6. Review stored and displayed

### Key Directories

- `src/routes/` - File-based routing (TanStack Router). Dynamic segments use `$param` syntax
- `src/server/` - Server functions (run on Nitro). `reviewPhoto.ts` is the main AI endpoint
- `src/hooks/` - Custom hooks. `useReviewUpload.ts` manages the upload/review workflow, `useSupabaseAuth.ts` handles auth state
- `src/lib/` - Utilities and types. `reviewPrompt.ts` contains the OpenAI system prompt
- `src/styles/` - Modularized CSS files imported via `App.css`

### Database (Supabase)

- `photos` table: storage_path, thumbnail_path, exif, dimensions
- `reviews` table: photo_id (FK), review_text, ai_title, model
- Storage bucket: `photos` (originals and thumbnails)

## Environment Variables

```
OPENAI_API_KEY              # Required
OPENAI_MODEL=gpt-4.1-mini   # Default model
MAX_IMAGE_MB=8              # Upload limit
VITE_SUPABASE_URL           # Supabase project URL
VITE_SUPABASE_ANON_KEY      # Supabase anon key
```

## Conventions

- TypeScript strict mode enabled
- Path alias: `@/*` → `./src/*`
- State managed via hooks, lifted to `ReviewPage` component
- Image processing (EXIF via exifr, thumbnails via Canvas) happens client-side before upload
