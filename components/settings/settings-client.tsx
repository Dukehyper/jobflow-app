'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertTriangle, Download } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { DeleteAccountModal } from './delete-account-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsClientProps {
  user: Pick<User, 'id' | 'email'>
}

type EmailState = 'idle' | 'loading' | 'success' | 'error'
type PasswordState = 'idle' | 'loading' | 'success' | 'error'
type ExportState = 'idle' | 'loading' | 'error'

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ExpandableSectionProps {
  id: string
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function ExpandableSection({ id, title, isOpen, onToggle, children }: ExpandableSectionProps) {
  return (
    <div className="border-t border-[#27272A] first:border-t-0">
      <button
        type="button"
        id={`${id}-toggle`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        className="w-full flex items-center justify-between py-4 text-left hover:text-[#FAFAFA] transition-colors min-h-[44px]"
      >
        <span className="text-sm font-medium text-[#A1A1AA]">{title}</span>
        {isOpen ? (
          <ChevronUp size={15} className="text-[#71717A] shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown size={15} className="text-[#71717A] shrink-0" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          id={`${id}-content`}
          role="region"
          aria-labelledby={`${id}-toggle`}
          className="pb-4"
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // ── Section open state ────────────────────────────────────────────────────
  const [emailOpen, setEmailOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // ── Email update ──────────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState('')
  const [emailState, setEmailState] = useState<EmailState>('idle')
  const [emailError, setEmailError] = useState<string | null>(null)

  // ── Password update ───────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordState, setPasswordState] = useState<PasswordState>('idle')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // ── Export ────────────────────────────────────────────────────────────────
  const [exportState, setExportState] = useState<ExportState>('idle')
  const [exportError, setExportError] = useState<string | null>(null)

  // ─── Email update handler ─────────────────────────────────────────────────

  async function handleUpdateEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailError(null)

    const trimmed = newEmail.trim()
    if (!trimmed) {
      setEmailError('Please enter a new email address.')
      return
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setEmailState('loading')
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed })

      if (error) {
        setEmailError(error.message)
        setEmailState('error')
        return
      }

      setEmailState('success')
      setNewEmail('')
    } catch {
      setEmailError('Failed to update email. Please try again.')
      setEmailState('error')
    }
  }

  // ─── Password update handler ───────────────────────────────────────────────

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordState('loading')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        setPasswordError(error.message)
        setPasswordState('error')
        return
      }

      setPasswordState('success')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordError('Failed to update password. Please try again.')
      setPasswordState('error')
    }
  }

  // ─── Export handler ────────────────────────────────────────────────────────

  async function handleExport() {
    setExportError(null)
    setExportState('loading')

    try {
      // Fetch all user data in parallel
      const [
        jobsRes,
        followUpsRes,
        collectionRes,
        profileRes,
        experiencesRes,
        skillsRes,
        educationRes,
        projectsRes,
      ] = await Promise.all([
        supabase.from('jobs').select('*').eq('user_id', user.id),
        supabase.from('follow_ups').select('*').eq('user_id', user.id),
        supabase.from('collection').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('experiences').select('*').eq('user_id', user.id),
        supabase.from('skills').select('*').eq('user_id', user.id),
        supabase.from('education').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
      ])

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data ?? null,
        jobs: jobsRes.data ?? [],
        follow_ups: followUpsRes.data ?? [],
        collection: collectionRes.data ?? [],
        experiences: experiencesRes.data ?? [],
        skills: skillsRes.data ?? [],
        education: educationRes.data ?? [],
        projects: projectsRes.data ?? [],
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobflow-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      setExportState('idle')
    } catch {
      setExportError('Failed to export data. Please try again.')
      setExportState('error')
    }
  }

  // ─── Delete account handler ────────────────────────────────────────────────

  async function handleDeleteAccount() {
    const res = await fetch('/api/account', { method: 'DELETE' })

    if (!res.ok) {
      const json = (await res.json()) as { error: string | null }
      throw new Error(json.error ?? 'Failed to delete account')
    }

    // Sign out and redirect
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="section-title text-2xl mb-1">Settings</h1>
        <p className="text-sm text-[#71717A]">
          Manage your account, data, and preferences.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {/* ── Section 1: Account ─────────────────────────────────────────── */}
        <section aria-labelledby="account-section-title">
          <div className="card p-6">
            <h2
              id="account-section-title"
              className="font-mono font-semibold text-[#FAFAFA] text-base mb-5"
            >
              Account
            </h2>

            {/* Current email (read-only) */}
            <div className="mb-4">
              <p className="label">Current Email</p>
              <p className="text-sm text-[#FAFAFA] font-mono bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2.5 min-h-[44px] flex items-center">
                {user.email ?? 'No email on record'}
              </p>
            </div>

            {/* Change email expandable */}
            <ExpandableSection
              id="change-email"
              title="Change Email"
              isOpen={emailOpen}
              onToggle={() => {
                setEmailOpen((v) => !v)
                setEmailError(null)
                setEmailState('idle')
              }}
            >
              {emailState === 'success' ? (
                <div
                  className="flex items-center gap-2 text-green-400 text-sm p-3 bg-green-950/20 border border-green-800/40 rounded-lg"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 size={15} aria-hidden="true" />
                  Check your new email to confirm the change.
                </div>
              ) : (
                <form onSubmit={handleUpdateEmail} noValidate className="flex flex-col gap-3">
                  <div>
                    <label htmlFor="new-email" className="label">
                      New Email Address
                    </label>
                    <input
                      id="new-email"
                      type="email"
                      className="input"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value)
                        setEmailError(null)
                        setEmailState('idle')
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={emailState === 'error'}
                      aria-describedby={emailError ? 'email-error' : undefined}
                    />
                    {emailError && (
                      <p
                        id="email-error"
                        className="text-xs text-red-400 mt-1.5"
                        role="alert"
                        aria-live="assertive"
                      >
                        {emailError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn-primary self-start"
                    disabled={emailState === 'loading' || !newEmail.trim()}
                    aria-busy={emailState === 'loading'}
                  >
                    {emailState === 'loading' && (
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    )}
                    {emailState === 'loading' ? 'Updating…' : 'Update Email'}
                  </button>
                </form>
              )}
            </ExpandableSection>

            {/* Divider */}
            <div className="divider" />

            {/* Change password expandable */}
            <ExpandableSection
              id="change-password"
              title="Change Password"
              isOpen={passwordOpen}
              onToggle={() => {
                setPasswordOpen((v) => !v)
                setPasswordError(null)
                setPasswordState('idle')
              }}
            >
              {passwordState === 'success' ? (
                <div
                  className="flex items-center gap-2 text-green-400 text-sm p-3 bg-green-950/20 border border-green-800/40 rounded-lg"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 size={15} aria-hidden="true" />
                  Password updated successfully.
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} noValidate className="flex flex-col gap-3">
                  <div>
                    <label htmlFor="new-password" className="label">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className="input"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setPasswordError(null)
                        setPasswordState('idle')
                      }}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      aria-required="true"
                      aria-invalid={passwordState === 'error'}
                      aria-describedby={passwordError ? 'password-error' : undefined}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="label">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setPasswordError(null)
                        setPasswordState('idle')
                      }}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={passwordState === 'error'}
                    />
                    {passwordError && (
                      <p
                        id="password-error"
                        className="text-xs text-red-400 mt-1.5"
                        role="alert"
                        aria-live="assertive"
                      >
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary self-start"
                    disabled={passwordState === 'loading' || !newPassword || !confirmPassword}
                    aria-busy={passwordState === 'loading'}
                  >
                    {passwordState === 'loading' && (
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    )}
                    {passwordState === 'loading' ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              )}
            </ExpandableSection>
          </div>
        </section>

        {/* ── Section 2: Data Export ─────────────────────────────────────── */}
        <section aria-labelledby="export-section-title">
          <div className="card p-6">
            <h2
              id="export-section-title"
              className="font-mono font-semibold text-[#FAFAFA] text-base mb-2"
            >
              Export Data
            </h2>
            <p className="text-sm text-[#71717A] mb-5 leading-relaxed">
              Download all your profile and job data as JSON.
            </p>

            {exportError && (
              <p
                className="text-sm text-red-400 mb-4 flex items-center gap-2"
                role="alert"
                aria-live="assertive"
              >
                <AlertTriangle size={14} aria-hidden="true" />
                {exportError}
              </p>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={handleExport}
              disabled={exportState === 'loading'}
              aria-busy={exportState === 'loading'}
            >
              {exportState === 'loading' ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <Download size={15} aria-hidden="true" />
              )}
              {exportState === 'loading' ? 'Exporting…' : 'Export All Data'}
            </button>
          </div>
        </section>

        {/* ── Section 3: Danger Zone ─────────────────────────────────────── */}
        <section aria-labelledby="danger-section-title">
          <div className="border border-red-800 rounded-xl p-6">
            <h2
              id="danger-section-title"
              className="font-mono font-semibold text-red-400 text-base mb-2"
            >
              Danger Zone
            </h2>
            <p className="text-sm text-[#71717A] mb-5 leading-relaxed">
              Irreversible and destructive actions.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-red-950/10 border border-red-900/40 rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#FAFAFA]">Delete Account</p>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Permanently delete your account and all data. Cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="btn-danger shrink-0"
                onClick={() => setShowDeleteModal(true)}
                aria-haspopup="dialog"
              >
                <AlertTriangle size={15} aria-hidden="true" />
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  )
}
