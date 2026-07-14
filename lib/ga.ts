import { SignJWT, importPKCS8 } from 'jose'

/**
 * Minimal GA4 Data API client for the morning brief — pulls "new users" counts.
 *
 * Auth is a service-account JWT signed with jose (already a dependency), so no
 * googleapis SDK is needed. Everything is gated on env vars: if any are missing
 * the functions return null and the brief simply omits the analytics section.
 *
 * Required env vars (set in Vercel):
 *   GA_PROPERTY_ID   numeric GA4 property id (NOT the "G-..." measurement id)
 *   GA_CLIENT_EMAIL  service-account email, granted Viewer on the GA4 property
 *   GA_PRIVATE_KEY   the service account's private key (PEM; \n may be escaped)
 */

const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID || ''
const GA_CLIENT_EMAIL = process.env.GA_CLIENT_EMAIL || ''
// Vercel env values store newlines as literal "\n" — restore real newlines.
const GA_PRIVATE_KEY = (process.env.GA_PRIVATE_KEY || '').replace(/\\n/g, '\n')

export interface GaStats {
  yesterday: number
  last7: number
}

async function getAccessToken(): Promise<string | null> {
  const key = await importPKCS8(GA_PRIVATE_KEY, 'RS256')
  const now = Math.floor(Date.now() / 1000)
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(GA_CLIENT_EMAIL)
    .setSubject(GA_CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) return null
  const d = await res.json()
  return d.access_token ?? null
}

async function runNewUsers(
  token: string,
  startDate: string,
  endDate: string
): Promise<number | null> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'newUsers' }],
      }),
    }
  )
  if (!res.ok) return null
  const d = await res.json()
  const v = d?.rows?.[0]?.metricValues?.[0]?.value
  return v == null ? 0 : Number(v)
}

/** Returns new-user counts, or null if GA isn't configured / the call fails. */
export async function getGaNewUsers(): Promise<GaStats | null> {
  if (!GA_PROPERTY_ID || !GA_CLIENT_EMAIL || !GA_PRIVATE_KEY) return null
  try {
    const token = await getAccessToken()
    if (!token) return null
    const [yesterday, last7] = await Promise.all([
      runNewUsers(token, 'yesterday', 'yesterday'),
      runNewUsers(token, '7daysAgo', 'yesterday'),
    ])
    if (yesterday == null && last7 == null) return null
    return { yesterday: yesterday ?? 0, last7: last7 ?? 0 }
  } catch (e) {
    console.error('GA fetch failed:', e)
    return null
  }
}
