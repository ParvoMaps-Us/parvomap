import type { Metadata } from 'next'
import Link from 'next/link'
import { verifyMagicToken } from '@/lib/magic-link'
import { getAlertPrefs } from '@/lib/alerts'
import { DISEASE_MAP } from '@/lib/diseases'
import PreferencesForm from './PreferencesForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Manage alerts — ParvoMaps',
  robots: { index: false, follow: false },
}

const wrap = { maxWidth: 620, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const

export default async function ManageAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; exp?: string; t?: string }>
}) {
  const { e, exp, t } = await searchParams
  const email = (e ?? '').trim().toLowerCase()
  const expNum = Number(exp)

  if (!verifyMagicToken(email, expNum, t ?? '')) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>🔒 Link expired</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          This alert-management link is invalid or has expired (they last 24 hours).
        </p>
        <Link href="/alerts" style={{ color: 'var(--green)', fontSize: 13 }}>← Request a fresh link</Link>
      </main>
    )
  }

  const prefs = await getAlertPrefs(email)
  const diseaseOptions = Object.entries(DISEASE_MAP).map(([key, info]) => ({ key, name: info.name }))

  return (
    <main style={wrap}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>🔔 Alert preferences</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
        Signed in as <strong style={{ color: 'var(--text)' }}>{email}</strong>. Choose where and what to watch.
      </p>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 22, background: 'var(--bg-card)' }}>
        <PreferencesForm
          email={email}
          exp={expNum}
          token={t ?? ''}
          diseaseOptions={diseaseOptions}
          initial={prefs ? { zip: prefs.zip, radiusMiles: prefs.radiusMiles, diseases: prefs.diseases, lostDogs: prefs.lostDogs } : null}
        />
      </div>
    </main>
  )
}
