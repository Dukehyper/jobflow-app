'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Copy, CheckCircle2, Loader2 } from 'lucide-react'
import type { FollowUp } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FollowUpEmailModalProps {
  followUp: FollowUp
  onClose: () => void
  onMarkSent: (id: string) => Promise<void>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Splits the generated email into subject line and body. */
function parseEmail(raw: string | null): { subject: string; body: string } {
  if (!raw) {
    return {
      subject: 'Follow-up on my application',
      body: 'No email content was generated for this follow-up.',
    }
  }

  const lines = raw.split('\n')
  const subjectLine = lines[0] ?? ''
  const body = lines.slice(1).join('\n').trimStart()

  return {
    subject: subjectLine.replace(/^Subject:\s*/i, '').trim() || 'Follow-up on my application',
    body: body || raw,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowUpEmailModal({ followUp, onClose, onMarkSent }: FollowUpEmailModalProps) {
  const [copied, setCopied] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const copyButtonRef = useRef<HTMLButtonElement>(null)

  const { subject, body } = parseEmail(followUp.generated_email)
  const company = followUp.job?.company ?? 'this company'
  const jobTitle = followUp.job?.title ?? 'the role'
  const isPending = followUp.status === 'pending'

  // ─── Focus management ─────────────────────────────────────────────────────

  useEffect(() => {
    // Focus close button on open
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  // ─── Keyboard: Escape + focus trap ────────────────────────────────────────

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
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
  }, [onClose])

  // ─── Copy to clipboard ────────────────────────────────────────────────────

  async function handleCopy() {
    const fullEmail = followUp.generated_email ?? `${subject}\n\n${body}`
    try {
      await navigator.clipboard.writeText(fullEmail)
      setCopied(true)
      copyButtonRef.current?.focus()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = fullEmail
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ─── Mark as sent ─────────────────────────────────────────────────────────

  async function handleMarkSent() {
    setIsMarking(true)
    try {
      await onMarkSent(followUp.id)
      onClose()
    } finally {
      setIsMarking(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        ref={modalRef}
        className="relative bg-[#111113] border border-[#27272A] rounded-xl p-6 max-w-lg w-full flex flex-col gap-5 shadow-2xl"
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2
              id="email-modal-title"
              className="section-title"
            >
              Email Template
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5 truncate font-mono">
              {jobTitle} at {company}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn-ghost min-h-[44px] min-w-[44px] p-0 rounded-lg shrink-0"
            onClick={onClose}
            aria-label="Close email modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Subject line */}
        <div>
          <p className="label">Subject</p>
          <p className="font-mono text-sm text-[#FAFAFA] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 break-words">
            {subject}
          </p>
        </div>

        {/* Email body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="label mb-0">Body</p>
            <button
              ref={copyButtonRef}
              type="button"
              className="btn-ghost text-xs min-h-[36px] px-3 gap-1.5"
              onClick={handleCopy}
              aria-label={copied ? 'Copied to clipboard' : 'Copy email to clipboard'}
              aria-live="polite"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={13} className="text-green-400" aria-hidden="true" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm text-[#FAFAFA] bg-[#18181B] border border-[#27272A] rounded-lg p-4 overflow-auto max-h-80">
            {body}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {isPending && (
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={handleMarkSent}
              disabled={isMarking}
              aria-busy={isMarking}
            >
              {isMarking ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={15} aria-hidden="true" />
              )}
              {isMarking ? 'Saving…' : 'Mark as Sent'}
            </button>
          )}
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
