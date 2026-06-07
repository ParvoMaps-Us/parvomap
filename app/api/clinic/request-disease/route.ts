import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMagicToken, readClinicSession, CLINIC_SESSION_COOKIE } from '@/lib/magic-link'
import { isProClinic, saveDiseaseRequest } from '@/lib/alerts'
import { sendDiseaseTrackRequest } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  let disease = '', note = '', bodyEmail = '', exp = 0, token = ''
  try {
    const body = await req.json()
    disease   = String(body?.disease ?? '').trim().slice(0, 120)
    note      = String(body?.note ?? '').trim().slice(0, 1000)
    bodyEmail = String(body?.email ?? '').trim().toLowerCase()
    exp       = Number(body?.exp)
    token     = String(body?.token ?? '')
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Auth: prefer the session cookie; fall back to a magic-link token in the body.
  const cookieStore = await cookies()
  const email = readClinicSession(cookieStore.get(CLINIC_SESSION_COOKIE)?.value)
    || (verifyMagicToken(bodyEmail, exp, token) ? bodyEmail : '')

  if (!email || !(await isProClinic(email))) {
    return Response.json({ error: 'Not authorized.' }, { status: 401 })
  }

  if (!disease) {
    return Response.json({ error: 'Enter a disease to track.' }, { status: 400 })
  }

  try {
    await saveDiseaseRequest({ email, disease, note, ts: Date.now() })
  } catch (e) {
    console.error('saveDiseaseRequest failed:', e)
  }
  try {
    await sendDiseaseTrackRequest(email, disease, note)
  } catch (e) {
    console.error('disease-request email failed:', e)
  }

  return Response.json({ ok: true })
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
