'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required.'); return }
    if (!password) { setError('Password is required.'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid')) {
          setError('Wrong email or password.')
        } else if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Email not verified. Contact your administrator.')
        } else {
          setError(authError.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-pattern" aria-hidden="true" />

      <div className="auth-container">
        {/* Wordmark */}
        <div className="auth-wordmark">
          <span className="wordmark-text" aria-label="JOBFLOW">JOBFLOW</span>
          <p className="wordmark-sub">Stop retyping. Start applying.</p>
        </div>

        {/* Card */}
        <div className="auth-card" role="main">
          <div className="auth-card-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your account.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-label="Sign in form" className="auth-form">
            <div className="field-group">
              <label htmlFor="email" className="field-label">Email address</label>
              <input
                id="email" type="email" autoComplete="email"
                aria-required="true" aria-invalid={error !== null}
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="field-input" disabled={loading}
              />
            </div>

            <div className="field-group">
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password" type="password" autoComplete="current-password"
                aria-required="true" aria-invalid={error !== null}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" className="field-input" disabled={loading}
              />
            </div>

            {error && (
              <div role="alert" aria-live="polite" className="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} aria-busy={loading} className="auth-btn">
              {loading ? (
                <><span className="auth-spinner" aria-hidden="true" /> Signing in…</>
              ) : 'Sign in →'}
            </button>
          </form>

          <p className="auth-switch">
            No account?{' '}
            <Link href="/signup" className="auth-link">Create one free</Link>
          </p>
        </div>

        <p className="auth-footer">JOBFLOW — built with AI, for humans</p>
      </div>

      <style>{authStyles}</style>
    </div>
  )
}

const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap');

  .auth-page {
    min-height: 100dvh;
    background: oklch(0.11 0.008 55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    position: relative;
    overflow: hidden;
    font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  }

  .auth-bg-pattern {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 20% 20%, oklch(0.45 0.12 75 / 0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 80% 80%, oklch(0.45 0.12 75 / 0.05) 0%, transparent 60%);
    pointer-events: none;
  }

  .auth-container {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    position: relative;
    z-index: 1;
  }

  .auth-wordmark { text-align: center; }

  .wordmark-text {
    display: block;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: oklch(0.78 0.16 75);
    line-height: 1;
  }

  .wordmark-sub {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: oklch(0.62 0.01 55);
    letter-spacing: 0.01em;
  }

  .auth-card {
    width: 100%;
    background: oklch(0.15 0.008 55);
    border: 1px solid oklch(0.24 0.008 55);
    border-radius: 1rem;
    padding: 2rem;
  }

  .auth-card-header { margin-bottom: 1.75rem; }

  .auth-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: oklch(0.96 0.005 55);
    margin: 0 0 0.375rem;
    letter-spacing: -0.02em;
  }

  .auth-subtitle {
    font-size: 0.875rem;
    color: oklch(0.62 0.01 55);
    margin: 0;
  }

  .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }

  .field-group { display: flex; flex-direction: column; gap: 0.375rem; }

  .field-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: oklch(0.72 0.01 55);
  }

  .field-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: oklch(0.19 0.008 55);
    border: 1px solid oklch(0.27 0.008 55);
    border-radius: 0.5rem;
    font-size: 0.9375rem;
    color: oklch(0.96 0.005 55);
    font-family: inherit;
    min-height: 48px;
    transition: border-color 120ms, box-shadow 120ms;
    -webkit-appearance: none;
  }

  .field-input::placeholder { color: oklch(0.45 0.008 55); }

  .field-input:focus {
    outline: none;
    border-color: oklch(0.72 0.15 75);
    box-shadow: 0 0 0 3px oklch(0.72 0.15 75 / 0.15);
  }

  .field-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .field-input[aria-invalid="true"] {
    border-color: oklch(0.62 0.18 25);
    box-shadow: 0 0 0 3px oklch(0.62 0.18 25 / 0.12);
  }

  .auth-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: oklch(0.22 0.05 25);
    border: 1px solid oklch(0.38 0.1 25);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: oklch(0.82 0.1 25);
    line-height: 1.4;
  }

  .auth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    min-height: 48px;
    background: oklch(0.72 0.15 75);
    color: oklch(0.12 0.01 55);
    border: none;
    border-radius: 0.5rem;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: background 120ms, transform 80ms;
    margin-top: 0.25rem;
    width: 100%;
  }

  .auth-btn:hover:not(:disabled) { background: oklch(0.78 0.16 75); }
  .auth-btn:active:not(:disabled) { transform: scale(0.98); }
  .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .auth-btn:focus-visible {
    outline: 3px solid oklch(0.72 0.15 75);
    outline-offset: 2px;
  }

  .auth-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid oklch(0.12 0.01 55 / 0.3);
    border-top-color: oklch(0.12 0.01 55);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .auth-switch {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: oklch(0.55 0.01 55);
  }

  .auth-link {
    color: oklch(0.78 0.16 75);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 120ms;
  }
  .auth-link:hover { color: oklch(0.88 0.14 75); }

  .auth-footer {
    font-size: 0.75rem;
    color: oklch(0.42 0.01 55);
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .auth-spinner { animation-duration: 1.5s; }
    .auth-btn { transition: none; }
    .field-input { transition: none; }
  }
`
