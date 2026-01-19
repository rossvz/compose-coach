import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const RETENTION_DAYS = 30
const PAGE_SIZE = 100

Deno.serve(async () => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

  let deletedPhotos = 0
  let deletedObjects = 0
  let page = 0

  while (true) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, storage_path')
      .lt('created_at', cutoff.toISOString())
      .range(from, to)

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      )
    }

    if (!photos || photos.length === 0) break

    const storagePaths = photos
      .map((photo) => photo.storage_path)
      .filter(Boolean)

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove(storagePaths)

      if (storageError) {
        return new Response(
          JSON.stringify({ ok: false, error: storageError.message }),
          { status: 500, headers: { 'content-type': 'application/json' } },
        )
      }
      deletedObjects += storagePaths.length
    }

    const photoIds = photos.map((photo) => photo.id)
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .in('id', photoIds)

    if (deleteError) {
      return new Response(
        JSON.stringify({ ok: false, error: deleteError.message }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      )
    }

    deletedPhotos += photoIds.length
    page += 1
  }

  return new Response(
    JSON.stringify({
      ok: true,
      deletedPhotos,
      deletedObjects,
      retentionDays: RETENTION_DAYS,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
})
