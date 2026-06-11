import { getFounderStatus } from '@/lib/founders'

/**
 * Founding Guardian hero — server-rendered with the live slot count so the
 * scarcity number is accurate on first paint (no client flash). Hidden once the
 * 1,000-member cohort fills.
 */
export default async function FoundingBanner() {
  const { taken, remaining, total, open } = await getFounderStatus()
  if (!open) return null

  const pct = Math.min(100, Math.round((taken / total) * 100))

  return (
    <section
      aria-label="Founding Guardian offer"
      style={{
        border: '1px solid var(--green)',
        borderRadius: 10,
        padding: '22px 24px',
        marginBottom: 28,
        background: 'linear-gradient(180deg, var(--green-dim, rgba(0,255,136,0.06)), transparent)',
        boxShadow: '0 0 28px var(--green-glow, rgba(0,255,136,0.12))',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'var(--green)',
          marginBottom: 8,
        }}
      >
        ⚡ Founding offer — limited to 1,000 members
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, lineHeight: 1.25 }}>
        Lock in founding pricing — <span style={{ color: 'var(--green)' }}>for life</span>
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 16px' }}>
        The first 1,000 Guardians keep today&apos;s price forever. Stay subscribed and your rate never
        rises — even when Guardian goes to <strong style={{ color: 'var(--text)' }}>$8/mo</strong> or{' '}
        <strong style={{ color: 'var(--text)' }}>$80/yr</strong>.
      </p>

      {/* Price chips */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        {[
          { now: '$5', cad: '/mo', was: '$8' },
          { now: '$50', cad: '/yr', was: '$80' },
        ].map(c => (
          <div
            key={c.cad}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 14px',
              background: 'var(--bg-card)',
              fontFamily: 'var(--mono)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'line-through', marginRight: 6 }}>
              {c.was}
            </span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{c.now}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.cad}</span>
            <span style={{ fontSize: 11, color: 'var(--green)', display: 'block', marginTop: 2 }}>locked for life</span>
          </div>
        ))}
      </div>

      {/* Progress toward the 1,000 cap */}
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(pct, 1.5)}%`,
              height: '100%',
              borderRadius: 999,
              background: 'var(--green)',
              boxShadow: '0 0 10px var(--green)',
            }}
          />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          <strong style={{ color: 'var(--green)' }}>{remaining.toLocaleString()}</strong> of{' '}
          {total.toLocaleString()} founding spots left
        </div>
      </div>
    </section>
  )
}
