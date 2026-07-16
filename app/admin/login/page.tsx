'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const input = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  background: 'var(--bg-surface, #111)',
  border: '1px solid var(--border, #333)',
  borderRadius: 6,
  color: 'var(--text, #f0f0f0)',
} as const

function LoginForm() {
  const params = useSearchParams()
  const expired = params.get('error') === 'expired'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong — try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6 }}>
        If the details were correct, a sign-in link is on its way to <strong>{email}</strong>.
        It expires in 15 minutes.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {expired && (
        <p style={{ color: 'var(--amber, #fbbf24)', fontSize: 12, margin: 0 }}>
          That link is invalid or expired. Request a new one.
        </p>
      )}
      <input
        type="email"
        placeholder="Email"
        aria-label="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="username"
        style={input}
      />
      <input
        type="password"
        placeholder="Password"
        aria-label="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        style={input}
      />
      {error && <p style={{ color: 'var(--red, #f87171)', fontSize: 12, margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '10px 12px',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: 'var(--green, #46f0a2)',
          color: '#000',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <main style={{ maxWidth: 380, margin: '80px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>🔒 Admin Sign-In</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
