'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, Sparkles, Loader2, Send, RefreshCw } from 'lucide-react'
import type { FollowUp, JobStatus } from '@/types'

interface FollowUpSectionProps {
  jobId: string
  jobStatus: JobStatus
  followUp: FollowUp | null
  onFollowUpChange: (followUp: FollowUp | null) => void
}

export function FollowUpSection({
  jobId,
  jobStatus,
  followUp,
  onFollowUpChange,
}: FollowUpSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isMarkingSent, setIsMarkingSent] = useState(false)
  const [markSentError, setMarkSentError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const canGenerate = jobStatus === 'applied' || jobStatus === 'interview'
  const isSent = followUp?.status === 'sent'
  const hasEmail = !!followUp?.generated_email

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGenerateError(null)
    setShowRegenerateConfirm(false)

    try {
      const res = await fetch('/api/ai/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setGenerateError(json.error ?? 'Failed to generate follow-up email')
        return
      }
      // The API returns the generated email text; we need to re-fetch the full follow_up row
      // or construct a minimal object. We'll fetch from follow_ups API to get the id.
      // For now, use the returned email + construct a minimal FollowUp object.
      // The actual saved row will have an id we can use for mark-as-sent.
      // Re-fetch the follow-up for this job to get the actual row with id.
      const followUpRes = await fetch(`/api/jobs/${jobId}`)
      const followUpJson = await followUpRes.json()
      if (followUpJson.data?.follow_up) {
        onFollowUpChange(followUpJson.data.follow_up as FollowUp)
      } else {
        // Fallback: create a minimal local object (won't have proper id for mark-as-sent)
        onFollowUpChange({
          id: '',
          job_id: jobId,
          user_id: '',
          generated_email: json.data as string,
          status: 'pending',
          due_at: null,
          sent_at: null,
        })
      }
    } catch {
      setGenerateError('Network error — please try again')
    } finally {
      setIsGenerating(false)
    }
  }, [jobId, onFollowUpChange])

  const handleRegenerateClick = useCallback(() => {
    if (hasEmail) {
      setShowRegenerateConfirm(true)
    } else {
      handleGenerate()
    }
  }, [hasEmail, handleGenerate])

  const handleCopy = useCallback(async () => {
    if (!followUp?.generated_email) return
    try {
      await navigator.clipboard.writeText(followUp.generated_email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API failed — silently ignore (no error shown for copy)
    }
  }, [followUp?.generated_email])

  const handleMarkSent = useCallback(async () => {
    if (!followUp?.id || isSent) return

    setIsMarkingSent(true)
    setMarkSentError(null)

    try {
      const res = await fetch(`/api/follow-ups/${followUp.id}`, {
        method: 'PUT',
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setMarkSentError(json.error ?? 'Failed to mark as sent')
        return
      }
      onFollowUpChange({
        ...followUp,
        status: 'sent',
        sent_at: json.data?.sent_at ?? new Date().toISOString(),
      })
    } catch {
      setMarkSentError('Network error — please try again')
    } finally {
      setIsMarkingSent(false)
    }
  }, [followUp, isSent, onFollowUpChange])

  return (
    <section
      aria-labelledby="followup-section-heading"
      className="card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 id="followup-section-heading" className="section-title">
          Follow-up Email
        </h2>
        {isSent && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-green-950 text-green-400 border border-green-800/50"
            aria-label="Follow-up email marked as sent"
          >
            <Check className="w-3 h-3" aria-hidden="true" />
            Sent
          </span>
        )}
      </div>

      {/* Sent date if sent */}
      {isSent && followUp?.sent_at && (
        <p className="text-xs text-[#71717A] font-mono">
          Sent on {new Date(followUp.sent_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}

      {/* Not eligible hint */}
      {!canGenerate && !hasEmail && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A]">
          <svg
            className="w-4 h-4 text-[#52525B] flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <p className="text-xs text-[#71717A] leading-relaxed">
            Apply to this job first before generating a follow-up email
          </p>
        </div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-8"
          role="status"
          aria-live="polite"
          aria-label="Generating follow-up email"
        >
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" aria-hidden="true" />
          <p className="text-sm text-[#A1A1AA]">Generating follow-up email…</p>
        </div>
      )}

      {/* No email yet + eligible */}
      {!hasEmail && !isGenerating && canGenerate && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-primary gap-2 self-start"
          aria-label="Generate follow-up email"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Generate Follow-up Email
        </button>
      )}

      {generateError && (
        <p role="alert" className="text-xs text-red-400">
          {generateError}
        </p>
      )}

      {/* Email display */}
      {hasEmail && !isGenerating && (
        <div className="flex flex-col gap-3">
          {/* Regenerate confirm */}
          {showRegenerateConfirm && (
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-amber-950/40 border border-amber-800/40"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-amber-300 flex-1">
                Regenerate the follow-up email?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs px-3 py-2 min-h-[44px]"
                  onClick={() => setShowRegenerateConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger text-xs px-3 py-2 min-h-[44px]"
                  onClick={handleGenerate}
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Email content */}
          <pre
            className="whitespace-pre-wrap font-mono text-xs text-[#D4D4D8] bg-[#0A0A0B] border border-[#27272A] rounded-lg p-4 overflow-auto max-h-64 leading-relaxed"
            aria-label="Generated follow-up email content"
          >
            {followUp?.generated_email}
          </pre>

          {/* Action row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="btn-secondary text-xs px-3 py-2 min-h-[44px] gap-1.5"
              aria-label="Copy email to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy Email
                </>
              )}
            </button>

            {/* Mark as sent */}
            {!isSent && followUp?.id && (
              <button
                type="button"
                onClick={handleMarkSent}
                disabled={isMarkingSent}
                className="btn-secondary text-xs px-3 py-2 min-h-[44px] gap-1.5"
                aria-label="Mark follow-up email as sent"
              >
                {isMarkingSent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    Marking…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    Mark as Sent
                  </>
                )}
              </button>
            )}

            {/* Regenerate */}
            {!isSent && canGenerate && !showRegenerateConfirm && (
              <button
                type="button"
                onClick={handleRegenerateClick}
                disabled={isGenerating}
                className="btn-ghost text-xs px-3 py-2 min-h-[44px] gap-1.5"
                aria-label="Regenerate follow-up email"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Regenerate
              </button>
            )}
          </div>

          {markSentError && (
            <p role="alert" className="text-xs text-red-400">
              {markSentError}
            </p>
          )}

          {/* Due date hint */}
          {followUp?.due_at && !isSent && (
            <p className="text-xs text-[#52525B] font-mono">
              Suggested send by:{' '}
              {new Date(followUp.due_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
