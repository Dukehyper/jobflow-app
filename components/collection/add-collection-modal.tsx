'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2, Link as LinkIcon } from 'lucide-react'
import type { CollectionItem, CollectionStatus } from '@/types'

interface AddCollectionModalProps {
  initialUrl?: string
  onClose: () => void
  onAdded: (item: CollectionItem) => void
}

export function AddCollectionModal({
  initialUrl = '',
  onClose,
  onAdded,
}: AddCollectionModalProps) {
  const [url, setUrl] = useState(initialUrl)
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<CollectionStatus>('saved')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => firstInputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  // Trap focus within modal
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const capturedModal: HTMLDivElement = modal

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = capturedModal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
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

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleUrlBlur() {
    const trimmed = url.trim()
    if (!trimmed || title) return

    try {
      new URL(trimmed)
    } catch {
      return
    }

    setIsFetchingTitle(true)
    try {
      const res = await fetch(
        `/api/fetch-page-title?url=${encodeURIComponent(trimmed)}`
      ).catch(() => null)

      if (res?.ok) {
        const json = (await res.json()) as { title?: string }
        if (json.title && !title) {
          setTitle(json.title)
          setTimeout(() => titleInputRef.current?.focus(), 50)
        }
      }
    } catch {
      // Title auto-fetch is best-effort — ignore errors
    } finally {
      setIsFetchingTitle(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Job title is required.')
      titleInputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || undefined,
          title: title.trim(),
          company: company.trim() || undefined,
          notes: notes.trim() || undefined,
          status,
        }),
      })

      const json = (await res.json()) as { data: CollectionItem | null; error: string | null }

      if (!res.ok || !json.data) {
        setError(json.error ?? 'Failed to save job. Please try again.')
        return
      }

      onAdded(json.data)
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-collection-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        className="relative card-elevated w-full max-w-lg p-6 flex flex-col gap-5 shadow-2xl"
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id="add-collection-modal-title"
            className="section-title"
          >
            Save Job
          </h2>
          <button
            className="btn-ghost min-h-[44px] min-w-[44px] p-0 rounded-lg"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* URL field */}
          <div>
            <label htmlFor="add-col-url" className="label">
              Job URL
              <span className="ml-1 text-[#52525B] normal-case font-sans font-normal tracking-normal">
                (optional)
              </span>
            </label>
            <div className="relative">
              <LinkIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]"
                aria-hidden="true"
              />
              <input
                ref={firstInputRef}
                id="add-col-url"
                type="url"
                className="input pl-8"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com/jobs/123"
                autoComplete="off"
              />
              {isFetchingTitle && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#71717A]"
                  aria-hidden="true"
                />
              )}
            </div>
            {isFetchingTitle && (
              <p className="text-xs text-[#71717A] mt-1" aria-live="polite">
                Fetching page title…
              </p>
            )}
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="add-col-title" className="label">
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="add-col-title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              required
              aria-required="true"
              aria-invalid={error !== null && !title.trim()}
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="add-col-company" className="label">Company</label>
            <input
              id="add-col-company"
              type="text"
              className="input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="add-col-notes" className="label">Notes</label>
            <textarea
              id="add-col-notes"
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember about this role…"
            />
          </div>

          {/* Status toggle */}
          <div>
            <p className="label" id="add-col-status-label">Status</p>
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-labelledby="add-col-status-label"
            >
              {(['saved', 'shortlisted'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={[
                    'btn min-h-[44px] flex-1 capitalize',
                    status === s ? 'btn-primary' : 'btn-secondary',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400" role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full mt-1"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? 'Saving…' : 'Save Job'}
          </button>
        </form>
      </div>
    </div>
  )
}
