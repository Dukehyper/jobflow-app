'use client'

import { useEffect, useRef } from 'react'

interface RegenerateConfirmDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  message?: string
}

export function RegenerateConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Replace manual edits?',
  message = 'Your manual edits will be replaced. This cannot be undone. Regenerate anyway?',
}: RegenerateConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return

    // Focus the cancel button on open (safer default)
    cancelBtnRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
        return
      }

      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled])'
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

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
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rcd-title"
      aria-describedby="rcd-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative card-elevated w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Warning icon */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="rcd-title"
              className="text-base font-mono font-semibold text-[#FAFAFA] mb-2"
            >
              {title}
            </h2>
            <p id="rcd-desc" className="text-sm text-[#A1A1AA] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="btn-danger"
            onClick={onConfirm}
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  )
}
