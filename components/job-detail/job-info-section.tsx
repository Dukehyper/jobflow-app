'use client'

import { useState, useRef, useCallback } from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { Job } from '@/types'

const DESCRIPTION_CHAR_LIMIT = 250

interface JobInfoSectionProps {
  job: Job
  onNotesSave: (notes: string) => void
}

export function JobInfoSection({ job, onNotesSave }: JobInfoSectionProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [notes, setNotes] = useState(job.notes ?? '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const description = job.description ?? ''
  const isLongDescription = description.length > DESCRIPTION_CHAR_LIMIT
  const displayedDescription =
    isLongDescription && !descriptionExpanded
      ? description.slice(0, DESCRIPTION_CHAR_LIMIT) + '…'
      : description

  const truncatedUrl = job.source_url
    ? job.source_url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60) +
      (job.source_url.replace(/^https?:\/\/(www\.)?/, '').length > 60 ? '…' : '')
    : null

  const handleNotesBlur = useCallback(async () => {
    // Don't save if unchanged
    if (notes === (job.notes ?? '')) return

    setIsSavingNotes(true)
    setNotesError(null)

    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setNotesError(json.error ?? 'Failed to save notes')
        return
      }
      onNotesSave(notes)

      // Show "Saved" briefly
      setNotesSaved(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setNotesSaved(false), 2000)
    } catch {
      setNotesError('Network error — please try again')
    } finally {
      setIsSavingNotes(false)
    }
  }, [notes, job.id, job.notes, onNotesSave])

  return (
    <section aria-labelledby="job-info-heading" className="card p-5 flex flex-col gap-5">
      {/* Company + title */}
      <div>
        <p className="text-xs font-mono text-[#71717A] uppercase tracking-wider mb-0.5">
          {job.company}
        </p>
        <h2
          id="job-info-heading"
          className="text-2xl font-mono font-semibold text-[#FAFAFA] leading-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {job.title}
        </h2>
      </div>

      {/* Source URL */}
      {job.source_url && (
        <div>
          <p className="label">Job Listing</p>
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors underline-offset-2 hover:underline truncate max-w-full"
            aria-label={`Open job listing for ${job.title} at ${job.company} in new tab`}
          >
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{truncatedUrl}</span>
          </a>
        </div>
      )}

      {/* Description */}
      {description && (
        <div>
          <p className="label">Job Description</p>
          <div className="text-sm text-[#D4D4D8] leading-relaxed">
            {displayedDescription}
          </div>
          {isLongDescription && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-expanded={descriptionExpanded}
              aria-controls="job-description-content"
            >
              {descriptionExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="divider" />

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="job-notes" className="label mb-0">
            Notes
          </label>
          <div className="flex items-center gap-2 h-5">
            {isSavingNotes && (
              <span className="text-xs text-[#71717A] font-mono">Saving…</span>
            )}
            {notesSaved && !isSavingNotes && (
              <span
                className="text-xs text-green-400 font-mono"
                role="status"
                aria-live="polite"
              >
                Saved
              </span>
            )}
          </div>
        </div>
        <textarea
          id="job-notes"
          className="textarea text-sm"
          placeholder="Add your personal notes about this job…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={4}
          aria-describedby={notesError ? 'notes-error' : undefined}
        />
        {notesError && (
          <p
            id="notes-error"
            role="alert"
            className="mt-1 text-xs text-red-400"
          >
            {notesError}
          </p>
        )}
      </div>
    </section>
  )
}
