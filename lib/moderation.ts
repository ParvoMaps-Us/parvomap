// Image moderation for user-uploaded lost-dog photos. Uses OpenAI's
// omni-moderation endpoint (free) to screen for nudity, sexual content, gore,
// and graphic violence before a photo is ever written to Blob storage.

export interface ModerationResult {
  /** true = safe to store, false = rejected */
  ok: boolean
  /** category keys that tripped the threshold, for logging */
  flagged: string[]
}

// Categories we reject for a public pet-photo surface. We deliberately ignore
// categories like "harassment" or "self-harm/intent" that don't apply to an
// image of a dog, to avoid false positives.
const REJECT_CATEGORIES = [
  'sexual',
  'sexual/minors',
  'violence',
  'violence/graphic',
]

/**
 * Screen an image. Returns ok=true when the image passes (or when moderation
 * is not configured / the API call fails — we fail OPEN so an outage doesn't
 * block every legitimate upload; the 🚩 flag → dashboard flow is the backstop).
 */
export async function moderateImage(bytes: ArrayBuffer, contentType: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set — skipping image moderation')
    return { ok: true, flagged: [] }
  }

  try {
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: [{ type: 'image_url', image_url: { url: dataUrl } }],
      }),
    })

    if (!res.ok) {
      console.error('Moderation API error:', res.status, await res.text().catch(() => ''))
      return { ok: true, flagged: [] } // fail open
    }

    const data = await res.json()
    const result = data?.results?.[0]
    if (!result) return { ok: true, flagged: [] }

    const categories: Record<string, boolean> = result.categories ?? {}
    const flagged = REJECT_CATEGORIES.filter(c => categories[c])

    return { ok: flagged.length === 0, flagged }
  } catch (e) {
    console.error('Moderation failed:', e)
    return { ok: true, flagged: [] } // fail open
  }
}
