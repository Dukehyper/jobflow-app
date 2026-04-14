'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type FormState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'verify_email' }

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formState, setFormState] = useState<FormState>({ status: 'idle' })

  const loading = formState.status === 'loading'
  const error = formState.status === 'error' ? formState.message : null

  function validate(): string | null {
    if (!fullName.trim()) return 'Full name is required.'
    if (fullName.trim().length < 2) return 'Full name must be at least 2 characters.'
    if (!email.trim()) return 'Email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.'
    }
    if (!password) return 'Password is required.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (!confirmPassword) return 'Please confirm your password.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      setFormState({ status: 'error', message: validationError })
      return
    }

    setFormState({ status: 'loading' })

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setFormState({
            status: 'error',
            message: 'An account with this email already exists. Try signing in instead.',
          })
        } else if (authError.message.toLowerCase().includes('password')) {
          setFormState({
            status: 'error',
            message: 'Password is too weak. Please choose a stronger password.',
          })
        } else {
          setFormState({ status: 'error', message: authError.message })
        }
        return
      }

      // If Supabase auto-confirms (session present), go straight to /profile
      if (data.session) {
        router.push('/profile')
        router.refresh()
        return
      }

      // Otherwise user must confirm via email
      setFormState({ status: 'verify_email' })
    } catch {
      setFormState({
        status: 'error',
        message: 'A network error occurred. Please check your connection and try again.',
      })
    }
  }

  // Success / verify-email view
  if (formState.status === 'verify_email') {
    return (
      <div
        className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center px-4 py-12"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 60%)',
        }}
      >
        <div className="mb-8 text-center">
          <span className="font-mono text-2xl font-bold tracking-tight text-[#2563EB]" aria-label="JOBFLOW">
            JOBFLOW
          </span>
          <p className="mt-2 text-sm text-[#A1A1AA] font-sans">
            Your AI job application system
          </p>
        </div>

        <div className="w-full max-w-[400px] bg-[#111113] border border-[#27272A] rounded-xl p-8 text-center">
          <div
            className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="w-6 h-6 text-[#2563EB]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h1 className="font-mono text-lg font-semibold text-[#FAFAFA] mb-2">
            Check your email
          </h1>
          <p className="text-sm text-[#A1A1AA] font-sans leading-relaxed mb-6">
            We&apos;ve sent a verification link to{' '}
            <span className="text-[#FAFAFA] font-medium">{email}</span>.
            Click the link to activate your account.
          </p>
          <p className="text-sm text-[#A1A1AA] font-sans">
            Already verified?{' '}
            <Link
              href="/login"
              className="text-[#2563EB] hover:text-blue-400 transition-colors duration-150 underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-8 text-xs text-[#52525B] font-sans">
          &copy; JOBFLOW &mdash; built with Claude
        </p>
      </div>
    )
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
          Create your account
        </h1>

        <form onSubmit={handleSubmit} noValidate aria-label="Create account form">
          {/* Full Name */}
          <div className="mb-4">
            <label htmlFor="fullName" className="label">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              aria-label="Full name"
              aria-required="true"
              aria-invalid={error !== null}
              aria-describedby={error ? 'form-error' : undefined}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="input"
              disabled={loading}
            />
          </div>

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
          <div className="mb-4">
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-label="Password"
              aria-required="true"
              aria-describedby={
                [error ? 'form-error' : '', 'password-hint'].filter(Boolean).join(' ') || undefined
              }
              aria-invalid={error !== null}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              disabled={loading}
            />
            <p id="password-hint" className="mt-1.5 text-xs text-[#71717A] font-sans">
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-label="Confirm password"
              aria-required="true"
              aria-invalid={error !== null && password !== confirmPassword}
              aria-describedby={error ? 'form-error' : undefined}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Creating account…</span>
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Link to login */}
        <p className="mt-6 text-center text-sm text-[#A1A1AA] font-sans">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#2563EB] hover:text-blue-400 transition-colors duration-150 underline underline-offset-2"
          >
            Sign in
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
