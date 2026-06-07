import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { readClinicSession, CLINIC_SESSION_COOKIE } from '@/lib/magic-link'
import { isProClinic } from '@/lib/alerts'
import { sendBugReport } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  let message = ''
  try {
    const body = await req.json()
    message = String(body?.message ?? '').trim().slice(0, 4000)
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Gate on the clinic session cookie.
  const cookieStore = await cookies()
  const email = readClinicSession(cookieStore.get(CLINIC_SESSION_COOKIE)?.value)
  if (!email || !(await isProClinic(email))) {
    return Response.json({ error: 'Not authorized.' }, { status: 401 })
  }

  if (!message) {
    return Response.json({ error: 'Describe the bug first.' }, { status: 400 })
  }

  try {
    await sendBugReport(email, message)
  } catch (e) {
    console.error('bug-report email failed:', e)
    return Response.json({ error: 'Could not send. Try again.' }, { status: 502 })
  }

  return Response.json({ ok: true })
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
