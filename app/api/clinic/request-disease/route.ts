import { NextRequest } from 'next/server'
import { verifyMagicToken } from '@/lib/magic-link'
import { isProClinic, saveDiseaseRequest } from '@/lib/alerts'
import { sendDiseaseTrackRequest } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  let email = '', exp = 0, token = '', disease = '', note = ''
  try {
    const body = await req.json()
    email   = String(body?.email ?? '').trim().toLowerCase()
    exp     = Number(body?.exp)
    token   = String(body?.token ?? '')
    disease = String(body?.disease ?? '').trim().slice(0, 120)
    note    = String(body?.note ?? '').trim().slice(0, 1000)
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Gate on the same Pro Clinic magic link that opened the dashboard.
  if (!verifyMagicToken(email, exp, token) || !(await isProClinic(email))) {
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
