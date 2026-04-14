'use client'

import { useEffect, useRef, useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeleteAccountModalProps {
  onClose: () => void
  onConfirm: () => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeleteAccountModal({ onClose, onConfirm }: DeleteAccountModalProps) {
  const [confirmValue, setConfirmValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isConfirmed = confirmValue === 'DELETE'

  // ─── Focus input on mount ─────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  // ─── Keyboard: Escape + focus trap ────────────────────────────────────────

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!isDeleting) onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = modal!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!first || !last) return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isDeleting])

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!isConfirmed || isDeleting) return

    setError(null)
    setIsDeleting(true)

    try {
      await onConfirm()
    } catch {
      setError('Failed to delete your account. Please try again.')
      setIsDeleting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-warning"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => { if (!isDeleting) onClose() }}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        ref={modalRef}
        className="relative bg-[#111113] border border-red-900/60 rounded-xl p-6 max-w-md w-full flex flex-col gap-5 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/50 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <h2
              id="delete-account-title"
              className="font-mono font-semibold text-[#FAFAFA] text-base"
            >
              Delete Account
            </h2>
          </div>
          <button
            type="button"
            className="btn-ghost min-h-[44px] min-w-[44px] p-0 rounded-lg shrink-0"
            onClick={() => { if (!isDeleting) onClose() }}
            aria-label="Close delete account modal"
            disabled={isDeleting}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Warning text */}
        <div
          id="delete-account-warning"
          className="bg-red-950/20 border border-red-800/40 rounded-lg p-4"
        >
          <p className="text-sm text-red-300 leading-relaxed">
            This will permanently delete <strong className="text-red-200">ALL</strong> your data
            including your profile, all job applications, CVs, and interview prep.{' '}
            <strong className="text-red-200">This cannot be undone.</strong>
          </p>
        </div>

        {/* Confirm input */}
        <div>
          <label htmlFor="delete-confirm-input" className="label text-red-400">
            Type &quot;DELETE&quot; to confirm
          </label>
          <input
            ref={inputRef}
            id="delete-confirm-input"
            type="text"
            className="input font-mono"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="delete-confirm-hint"
            disabled={isDeleting}
          />
          <p
            id="delete-confirm-hint"
            className="text-xs text-[#71717A] mt-1.5 font-mono"
          >
            Must match exactly: DELETE (all caps)
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            className="btn-danger flex-1"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            aria-busy={isDeleting}
            aria-disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <AlertTriangle size={15} aria-hidden="true" />
            )}
            {isDeleting ? 'Deleting…' : 'Delete My Account'}
          </button>
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
