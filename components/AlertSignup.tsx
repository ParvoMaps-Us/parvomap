'use client'

import { useEffect, useId, useRef, useState } from 'react'

// Free ZIP alerts signup: email + ZIP, then a confirmation email (double opt-in).
// `zip` pre-fills and hides the ZIP field (used right after a ZIP search).
// `placement` tags the GA4 event so we can see which spot earns signups. The
// event carries no email or ZIP.
export default function AlertSignup({
  placement,
  zip: fixedZip,
  variant = 'box',
}: {
  placement: string
  zip?: string
  variant?: 'box' | 'inline'
}) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [zip, setZip] = useState('')
  const [hp, setHp] = useState('') // honeypot, hidden from people
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<{ field: 'email' | 'zip'; text: string } | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const zipRef = useRef<HTMLInputElement>(null)
  const doneRef = useRef<HTMLParagraphElement>(null)

  const useZip = fixedZip ?? zip

  // The form is replaced by the "check your email" note; move focus there so
  // keyboard and screen-reader users are not left on a removed button.
  useEffect(() => {
    if (state === 'sent') doneRef.current?.focus()
  }, [state])

  function fail(field: 'email' | 'zip', text: string) {
    setError({ field, text })
    setState('idle')
    // With a fixed ZIP there is no ZIP field to send people to.
    ;(field === 'zip' && !fixedZip ? zipRef : emailRef).current?.focus()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return fail('email', 'Enter a valid email.')
    if (!/^\d{5}$/.test(useZip)) return fail('zip', 'Enter a 5-digit ZIP code.')

    setState('sending')
    try {
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), zip: useZip, hp_note: hp }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const text = String(data.error || 'Something went wrong. Please try again.')
        return fail(/zip/i.test(text) ? 'zip' : 'email', text)
      }
      try {
        const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
        gtag?.('event', 'alert_signup_submit', { cta_location: placement })
      } catch {
        /* ignore */
      }
      setState('sent')
    } catch {
      fail('email', 'Network error. Please try again.')
    }
  }

  const title = fixedZip
    ? `Get an email when a new case is added to the map near ${fixedZip}`
    : 'Get an email when a new case is added to the map near you'
  const errorId = `${id}-error`
  const emailBad = error?.field === 'email' || (error?.field === 'zip' && !!fixedZip)
  const zipBad = error?.field === 'zip' && !fixedZip

  return (
    <section className={`alert-signup alert-signup--${variant}`} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="alert-signup-title">{title}</h2>

      {state === 'sent' ? (
        <p className="alert-signup-done" role="status" tabIndex={-1} ref={doneRef}>
          <strong>Check your email.</strong> We sent a link to {email.trim()}. Tap it to turn your alerts on. No
          link, no alerts.
        </p>
      ) : (
        <>
          <p className="alert-signup-lead">
            Free alerts for cases within about 10 miles of your ZIP, plus pet food recalls. Stop any time.
          </p>
          <form onSubmit={submit} className="alert-signup-form" noValidate>
            <div className="alert-signup-field alert-signup-field--email">
              <label htmlFor={`${id}-email`}>Email</label>
              <input
                id={`${id}-email`}
                ref={emailRef}
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-invalid={emailBad || undefined}
                aria-describedby={emailBad ? errorId : undefined}
              />
            </div>
            {!fixedZip && (
              <div className="alert-signup-field alert-signup-field--zip">
                <label htmlFor={`${id}-zip`}>ZIP code</label>
                <input
                  id={`${id}-zip`}
                  ref={zipRef}
                  name="zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  required
                  placeholder="84101"
                  value={zip}
                  onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
                  aria-invalid={zipBad || undefined}
                  aria-describedby={zipBad ? errorId : undefined}
                />
              </div>
            )}
            {/* Honeypot: off-screen, skipped by keyboard and screen readers. The odd
                name keeps browsers from autofilling it for a real person. */}
            <div className="alert-signup-hp" aria-hidden="true">
              <label htmlFor={`${id}-hp`}>Leave this empty</label>
              <input
                id={`${id}-hp`}
                name="hp_note"
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={e => setHp(e.target.value)}
              />
            </div>
            <button type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Email me alerts'}
            </button>
          </form>
          {error && <p id={errorId} className="alert-signup-error" role="alert">{error.text}</p>}
          <p className="alert-signup-fine">
            We send a link to confirm first. We never sell your email.{' '}
            <a href="/privacy">Privacy</a>
          </p>
        </>
      )}
    </section>
  )
}
