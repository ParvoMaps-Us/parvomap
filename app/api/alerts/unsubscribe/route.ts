import { NextRequest } from 'next/server'
import { deleteAlertPrefs } from '@/lib/alerts'
import { verifyUnsubToken } from '@/lib/magic-link'

export async function POST(req: NextRequest) {
  let email = ''
  let token = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
    token = String(body?.token ?? '')
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!verifyUnsubToken(email, token)) {
    return Response.json({ error: 'Invalid or expired link.' }, { status: 401 })
  }

  try {
    await deleteAlertPrefs(email)
    return Response.json({ ok: true })
  } catch (e) {
    console.error('Unsubscribe error:', e)
    return Response.json({ error: 'Could not unsubscribe. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
