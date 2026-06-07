import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { moderateImage } from '@/lib/moderation'

// Photo upload for lost-dog reports. Accepts a single image via multipart form
// data and stores it in Vercel Blob, returning the public URL. Photos are the
// only file we accept and they're capped well below the serverless body limit.
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

// Mirror the report endpoint's CORS handling so the bare apex can upload too.
const ALLOWED_ORIGINS = new Set([
  'https://parvomaps.us',
  'https://www.parvomaps.us',
])

function corsHeaders(origin: string | null): Record<string, string> {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      'Access-Control-Allow-Origin':  origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary':                         'Origin',
    }
  }
  return {}
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'))

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: 'Photo uploads are not configured yet.' },
      { status: 503, headers: cors },
    )
  }

  try {
    const form = await req.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400, headers: cors })
    }
    if (!ALLOWED.has(file.type)) {
      return Response.json({ error: 'Please upload a JPG, PNG, or WebP image.' }, { status: 400, headers: cors })
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'Image must be under 5 MB.' }, { status: 400, headers: cors })
    }

    // Screen for NSFW / gore BEFORE writing to Blob. Rejected images never get
    // a public URL. (Fails open if moderation is unconfigured or the API errors.)
    const bytes = await file.arrayBuffer()
    const verdict = await moderateImage(bytes, file.type)
    if (!verdict.ok) {
      console.warn('Upload rejected by moderation:', verdict.flagged)
      return Response.json(
        { error: 'This image can’t be uploaded. Please choose a photo of the dog.' },
        { status: 422, headers: cors },
      )
    }

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const blob = await put(`lost-dogs/${crypto.randomUUID()}.${ext}`, bytes, {
      access:      'public',
      contentType: file.type,
    })

    return Response.json({ url: blob.url }, { headers: cors })
  } catch (e) {
    console.error('Upload error:', e)
    return Response.json({ error: 'Upload failed — please try again.' }, { status: 500, headers: cors })
  }
}
