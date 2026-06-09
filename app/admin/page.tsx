import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listFlags, getVerifiedRaw, type Report } from '@/lib/redis'
import { getAdminFromCookies } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Moderation — ParvoMaps',
  robots: { index: false, follow: false },
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function AdminPage() {
  // Gate on the admin session cookie (set via /admin/login magic link).
  const sessionEmail = await getAdminFromCookies()
  if (!sessionEmail) {
    redirect('/admin/login')
  }

  const [flags, verified] = await Promise.all([listFlags(), getVerifiedRaw()])
  const byId = new Map<string, Report>(verified.map(v => [v.report.id, v.report]))

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>🚩 Moderation</h1>
        {sessionEmail && (
          <form action="/api/admin/logout" method="post" style={{ margin: 0 }}>
            <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              {sessionEmail} · sign out
            </button>
          </form>
        )}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 24 }}>
        {flags.length} flagged report{flags.length !== 1 ? 's' : ''} · most recently flagged first
      </p>

      {flags.length === 0 && (
        <p style={{ color: 'var(--green)', fontSize: 13 }}>✓ Nothing flagged. All clear.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {flags.map(f => {
          const r = byId.get(f.id)
          const gone = !r
          return (
            <div key={f.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 16, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{f.summary}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {f.count} flag{f.count !== 1 ? 's' : ''} · first {fmt(f.firstAt)} · last {fmt(f.lastAt)}
                  </div>
                  {r?.contact && (
                    <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 4 }}>contact: {r.contact}</div>
                  )}
                  {gone && (
                    <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4 }}>
                      ⚠ Report no longer on the map (expired or already removed).
                    </div>
                  )}
                </div>
                {r?.kind === 'lost' && r.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt="flagged" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)', flex: 'none' }} />
                )}
              </div>

              {f.reasons.length > 0 && (
                <ul style={{ margin: '10px 0 0', padding: '0 0 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                  {f.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <a
                  href={`/api/admin/remove?id=${encodeURIComponent(f.id)}`}
                  style={{ background: 'var(--red)', color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 700, padding: '7px 14px', borderRadius: 4 }}
                >
                  🗑 Remove from map
                </a>
                <a
                  href={`/api/admin/dismiss?id=${encodeURIComponent(f.id)}`}
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: 11, padding: '7px 14px', borderRadius: 4 }}
                >
                  Dismiss flag
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
