# Compose Coach — Technical Spec

## Summary
Compose Coach is a single‑upload photo review app. Users authenticate with a magic link, upload a recent photo, and receive a single consolidated AI critique focused on composition, lighting, focus, and tone. The UI mirrors a ChatGPT layout: sidebar history + main conversation panel.

## Goals
- Simple auth flow with magic links and cookie‑based sessions.
- One‑off review per upload (no multi‑turn chat in v1).
- Fast, clear feedback sections (composition, lighting, focus, color, suggestions).

## Non‑Goals (v1)
- Multi‑turn chat or iterative critique threads.
- Social sharing, public galleries, or community features.
- Advanced EXIF analytics beyond basic parsing.
- Mobile native apps.
- Batch uploads.

## Target Stack
- **App framework**: TanStack Start (React + Vite + file‑based routing).
- **Auth**: Magic link + cookie session (Supabase Auth planned).
- **DB**: Postgres (Supabase or Neon).
- **Storage**: Supabase Storage (preferred) or S3‑compatible.
- **AI**: OpenAI vision model via server route.

## High‑Level Architecture
- **Frontend**
  - Login page (email input + “check your inbox”).
  - Home page with sidebar review list and main panel.
  - Upload action to create a new review.
- **Backend (TanStack Start server routes)**
  - `POST /api/auth/magic-link` → send link
  - `GET /api/auth/callback` → create session cookie
  - `POST /api/reviews` → upload image + request AI critique
  - `GET /api/reviews` → list user reviews
  - `GET /api/reviews/:id` → fetch single review

## Data Model (draft)
- **users**: id, email, created_at
- **sessions**: id, user_id, expires_at
- **photos**: id, user_id, storage_url, created_at, metadata_json
- **reviews**: id, user_id, photo_id, review_text, model, created_at

## Core Workflow
1. **Auth**
   - User enters email → magic link sent.
   - User clicks link → session cookie stored.
2. **Upload**
   - Client selects image → sends to server route.
   - Server validates type/size, uploads to storage, creates `photos` row.
3. **AI Review**
   - Server calls vision model with prompt + image.
   - Parse response into a single consolidated review.
   - Store in `reviews` and return to client.

## AI Prompting Contract
- One response per upload.
- Sections: Composition, Lighting, Focus/Sharpness, Color/Tone, Suggestions.
- Must avoid unsafe content; handle low‑quality images gracefully.

## UI Notes
- ChatGPT‑like layout.
- Sidebar: “New Review” button + previous reviews (timestamp + thumbnail).
- Main: upload dropzone + review result.
- Auth screens: minimal, no heavy branding.

## Pitfalls / Risks
- Image upload sizes and format conversion (HEIC handling).
- AI latency; needs optimistic loading UI.
- Cost control for AI + storage.
- Deliverability of magic links; fallback to resend.
- Legal/privacy handling for image storage.

## Unknowns / Decisions Needed
- Auth provider selection (Supabase Auth vs. Lucia + email provider).
- Storage provider selection (Supabase Storage vs. S3/R2).
- Vision model selection + prompt format.
- Retention policy for uploaded images.
- Whether to support EXIF parsing in v1.

## Research To‑Do
- TanStack Start recommendations for auth/session handling.
- OpenAI vision model constraints + pricing.
- Image upload limits and best practices.
- HEIC conversion pipeline (if needed).

## Won’t‑Do (v1)
- Live coaching or continuous chat threads.
- Social/community features.
- Advanced editing tools.
- Mobile native clients.

## Vertical Slice Notes (current)
- Auth omitted for now.
- Reviews are stored in client memory only.
- Images are sent directly to the vision model; no persistent storage yet.
- Supabase integration will be added alongside auth + storage.
