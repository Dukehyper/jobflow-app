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

    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid')) {
          setError('Invalid email or password. Please try again.')
        } else if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Please verify your email address before signing in.')
        } else {
          setError(authError.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('A network error occurred. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 60%)',
      }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <span
          className="font-mono text-2xl font-bold tracking-tight text-[#2563EB]"
          aria-label="JOBFLOW"
        >
          JOBFLOW
        </span>
        <p className="mt-2 text-sm text-[#A1A1AA] font-sans">
          Your AI job application system
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-[#111113] border border-[#27272A] rounded-xl p-8">
        <h1 className="font-mono text-lg font-semibold text-[#FAFAFA] mb-6">
          Sign in to your account
        </h1>

        <form onSubmit={handleSubmit} noValidate aria-label="Sign in form">
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-label="Email address"
              aria-required="true"
              aria-invalid={error !== null}
              aria-describedby={error ? 'form-error' : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-label="Password"
              aria-required="true"
              aria-invalid={error !== null}
              aria-describedby={error ? 'form-error' : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              disabled={loading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              id="form-error"
              role="alert"
              aria-live="polite"
              className="mb-4 px-3 py-2.5 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm font-sans"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Link to signup */}
        <p className="mt-6 text-center text-sm text-[#A1A1AA] font-sans">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-[#2563EB] hover:text-blue-400 transition-colors duration-150 underline underline-offset-2"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#52525B] font-sans">
        &copy; JOBFLOW &mdash; built with Claude
      </p>
    </div>
  )
}
