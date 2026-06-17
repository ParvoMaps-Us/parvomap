import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyMagicToken, readClinicSession, CLINIC_SESSION_COOKIE } from '@/lib/magic-link'
import { isProClinic } from '@/lib/alerts'
import { CLINIC_DEMO, DEMO_CLINIC_EMAIL } from '@/lib/demo-data'
import { getDashboardData, getFilterOptions, type Bucket } from '@/lib/dashboard'
import { getDiseaseName, DISEASE_MAP } from '@/lib/diseases'
import type { Report } from '@/lib/redis'
import RequestDiseaseForm from './RequestDiseaseForm'
import DiseaseChips from './DiseaseChips'
import ReportBugForm from './ReportBugForm'
import TrendChart from './TrendChart'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Pro Clinic dashboard — ParvoMaps',
  robots: { index: false, follow: false },
}

const wrap = { maxWidth: 1000, margin: '40px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const card = { border: '1px solid var(--border)', borderRadius: 6, padding: 16, background: 'var(--bg-card)' } as const

function fmt(ts: number): string {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ ...card, minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function BarList({ title, buckets, accent }: { title: string; buckets: Bucket[]; accent: string }) {
  const max = buckets[0]?.count ?? 1
  return (
    <div style={card}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>{title}</div>
      {buckets.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No data yet.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {buckets.slice(0, 12).map(b => (
          <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 130, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</div>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(4, (b.count / max) * 100)}%`, height: '100%', background: accent }} />
            </div>
            <div style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{b.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentTable({ rows, lost }: { rows: Report[]; lost?: boolean }) {
  if (rows.length === 0) return <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No reports in this region yet.</div>
  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: 'var(--text-dim)', textAlign: 'left' }}>
            <th style={{ padding: '4px 8px' }}>{lost ? 'Dog / kind' : 'Disease'}</th>
            <th style={{ padding: '4px 8px' }}>Location</th>
            <th style={{ padding: '4px 8px' }}>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--border-dim, var(--border))' }}>
              <td style={{ padding: '6px 8px' }}>
                {lost
                  ? `${r.dogName || 'Unnamed'} · ${r.lostKind === 'sighting' ? 'sighting' : 'owner'}`
                  : getDiseaseName(r.disease)}
                {r.verifiedClinic && (
                  <span title="Reported by a verified Pro Clinic" style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--green)', border: '1px solid var(--green)', borderRadius: 4, padding: '1px 5px' }}>✓ clinic</span>
                )}
              </td>
              <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                {[r.city, r.state].filter(Boolean).join(', ') || r.zip || '—'}
              </td>
              <td style={{ padding: '6px 8px', color: 'var(--text-dim)' }}>{fmt(r.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function ClinicDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; exp?: string; t?: string; state?: string; county?: string; city?: string; disease?: string | string[] }>
}) {
  const { e, exp, t, state, county, city, disease } = await searchParams
  // `disease` arrives as a string (one checkbox) or array (several). Empty = all.
  const diseases = (Array.isArray(disease) ? disease : disease ? [disease] : []).filter(Boolean)

  const denied = (
    <main style={{ maxWidth: 620, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>🔒 Session expired or not a Pro Clinic</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
        Your dashboard session has expired or this email isn’t tied to an active Pro Clinic plan.
      </p>
      <Link href="/clinic" style={{ color: 'var(--green)', fontSize: 13 }}>← Request a fresh link</Link>
    </main>
  )

  // Demo mode (CLINIC_DEMO=1, Preview env only) skips auth + Stripe and serves
  // synthetic data, so a preview deploy is shareable without real credentials.
  let email: string
  if (CLINIC_DEMO) {
    email = DEMO_CLINIC_EMAIL
  } else {
    // Auth: prefer the session cookie. A legacy magic-link token (e/exp/t) is
    // upgraded by bouncing through the login route, which sets the cookie.
    const cookieStore = await cookies()
    const sessionEmail = readClinicSession(cookieStore.get(CLINIC_SESSION_COOKIE)?.value)

    if (!sessionEmail) {
      if (verifyMagicToken((e ?? '').trim().toLowerCase(), Number(exp), t ?? '')) {
        redirect(`/api/clinic/login?e=${encodeURIComponent((e ?? '').trim().toLowerCase())}&exp=${Number(exp)}&t=${encodeURIComponent(t ?? '')}`)
      }
      return denied
    }

    email = sessionEmail
    // Re-check live status so a cancelled clinic loses access even mid-session.
    if (!(await isProClinic(email))) return denied
  }

  const filter = { state: state || undefined, county: county || undefined, city: city || undefined, diseases }
  const [data, options] = await Promise.all([
    getDashboardData(filter),
    getFilterOptions(state),
  ])

  const filterQs = [
    state && `state=${encodeURIComponent(state)}`,
    county && `county=${encodeURIComponent(county)}`,
    city && `city=${encodeURIComponent(city)}`,
    ...diseases.map(d => `disease=${encodeURIComponent(d)}`),
  ].filter(Boolean).join('&')
  const csvHref = `/api/clinic/export${filterQs ? `?${filterQs}` : ''}`

  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 } as const
  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 } as const
  const regionLabel = [city, county, state].filter(Boolean).join(', ') || 'all regions'

  return (
    <main style={wrap}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      {CLINIC_DEMO && (
        <div style={{ ...card, marginBottom: 16, borderColor: 'var(--amber)', color: 'var(--amber)', fontSize: 12, fontWeight: 700 }}>
          🧪 Demo mode — synthetic sample data, not real reports.
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🏥 Pro Clinic dashboard</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 16 }}>
        {email} · {regionLabel} · generated {fmt(data.generatedAt)}
      </p>

      {/* ─── How-to (collapsible) ─── */}
      <details style={{ ...card, marginBottom: 20, fontSize: 13, lineHeight: 1.7 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--green)' }}>
          ℹ️ How to use this dashboard
        </summary>
        <ol style={{ margin: '12px 0 0', paddingLeft: 20, color: 'var(--text-muted)', listStyleType: 'decimal' }}>
          <li><strong style={{ color: 'var(--text)' }}>Filter by region</strong> — pick a State, County, or City, then <em>Apply</em>. Leave them on “All” to see every region.</li>
          <li><strong style={{ color: 'var(--text)' }}>Filter by disease</strong> — tap the disease chips to focus on specific ones. None selected = all diseases.</li>
          <li><strong style={{ color: 'var(--text)' }}>Read the data</strong> — the tiles show counts over time, the trend chart plots cases day-by-day (hover for any day, toggle 30d/90d/1y, or split into one line per disease), and the bar charts break cases down by disease, state, county, and reporter type.</li>
          <li><strong style={{ color: 'var(--text)' }}>Export</strong> — <em>Export CSV</em> downloads the filtered case data. Labs/pharma can pull it programmatically via an API key — just ask.</li>
          <li><strong style={{ color: 'var(--text)' }}>Track something new</strong> — use “Track a specific disease” at the bottom; we begin tracking within 24–72 hours.</li>
        </ol>
        <p style={{ margin: '12px 0 0', color: 'var(--text-dim)', fontSize: 12 }}>
          You stay signed in on this device for 30 days — request a fresh link anytime from <Link href="/clinic" style={{ color: 'var(--green)' }}>parvomaps.us/clinic</Link>.
        </p>
      </details>

      {/* ─── Region + disease filter ─── */}
      <form method="GET" style={{ ...card, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 5 }}>State</label>
            <select name="state" defaultValue={state ?? ''} aria-label="Filter by state" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, minWidth: 120 }}>
              <option value="">All states</option>
              {options.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 5 }}>County</label>
            <select name="county" defaultValue={county ?? ''} aria-label="Filter by county" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, minWidth: 150 }}>
              <option value="">All counties{state ? ` in ${state}` : ''}</option>
              {options.counties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 5 }}>City</label>
            <select name="city" defaultValue={city ?? ''} aria-label="Filter by city" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, minWidth: 140 }}>
              <option value="">All cities{state ? ` in ${state}` : ''}</option>
              {options.cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: '9px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}>
            Apply
          </button>
          <a href={csvHref} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid var(--green)', textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--green)', marginLeft: 'auto' }}>
            ⬇ Export CSV
          </a>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
            Diseases <span style={{ color: 'var(--text-muted)' }}>· none selected = all diseases</span>
          </label>
          <DiseaseChips
            options={Object.entries(DISEASE_MAP).map(([key, info]) => ({ key, name: info.name }))}
            initialSelected={diseases}
          />
        </div>
      </form>

      {/* ─── Diseases ─── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>🦠 Disease & hazard reports</h2>
      <div style={{ ...grid3, marginBottom: 14 }}>
        <StatTile label="All time" value={data.disease.total} />
        <StatTile label="Last 48 h" value={data.disease.last48} />
        <StatTile label="Last 7 days" value={data.disease.last7} />
        <StatTile label="Last 30 days" value={data.disease.last30} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <TrendChart data={data.disease.trend} byDisease={data.disease.trendByDisease} accent="var(--green)" />
      </div>
      <div style={{ ...grid2, marginBottom: 14 }}>
        <BarList title="By disease" buckets={data.disease.byDisease} accent="var(--d-parvo, var(--green))" />
        <BarList title="By state" buckets={data.disease.byState} accent="var(--amber)" />
        <BarList title="By county" buckets={data.disease.byCounty} accent="#a78bfa" />
        <BarList title="By reporter type" buckets={data.disease.byReporter} accent="var(--green)" />
      </div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>Most recent</div>
        <RecentTable rows={data.disease.recent} />
      </div>

      {/* ─── Lost dogs ─── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>🐶 Lost-dog reports</h2>
      <div style={{ ...grid3, marginBottom: 14 }}>
        <StatTile label="All time" value={data.lost.total} />
        <StatTile label="Last 7 days" value={data.lost.last7} />
        <StatTile label="Owner reports" value={data.lost.owner} />
        <StatTile label="Sightings" value={data.lost.sighting} />
      </div>
      <div style={{ ...grid2, marginBottom: 14 }}>
        <BarList title="By state" buckets={data.lost.byState} accent="#60a5fa" />
      </div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>Most recent</div>
        <RecentTable rows={data.lost.recent} lost />
      </div>

      {/* ─── Request a disease to track ─── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>🧪 Track a specific disease</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
        Need data on something not on the list above? Tell us what to track — new strains,
        emerging conditions, or a region-specific concern. We typically begin tracking within
        <strong style={{ color: 'var(--text)' }}> 24–72 hours</strong> and email you when it’s live.
      </p>
      <div style={{ ...card, marginBottom: 36 }}>
        <RequestDiseaseForm />
      </div>

      {/* ─── Report a bug ─── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: 0 }}>
          Something not working right? Let us know and we’ll fix it.
        </p>
        <ReportBugForm />
      </div>
    </main>
  )
}
