'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { CVType } from '@/types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CVBaseEditorProps {
  cvType: CVType
  initialContent: Record<string, unknown> | null
  updatedAt: string | null
  onSave: (content: Record<string, unknown>) => Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never saved'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function extractText(content: Record<string, unknown> | null): string {
  if (!content) return ''
  if (typeof content.text === 'string') return content.text
  // Fallback: JSON stringify if not a text field
  return Object.values(content).filter(Boolean).join('\n')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CVBaseEditor({
  cvType,
  initialContent,
  updatedAt,
  onSave,
}: CVBaseEditorProps) {
  const [text, setText] = useState<string>(() => extractText(initialContent))
  const [lastSavedText, setLastSavedText] = useState<string>(() => extractText(initialContent))
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(updatedAt)
  const [relativeTime, setRelativeTime] = useState<string>(() => formatRelativeTime(updatedAt))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = countWords(text)
  const isDirty = text !== lastSavedText

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastSavedAt))
    }, 60_000)
    return () => clearInterval(interval)
  }, [lastSavedAt])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const handleSave = useCallback(async () => {
    if (isSaving) return
    setIsSaving(true)
    setSaveStatus('idle')
    setSaveError(null)
    try {
      const content: Record<string, unknown> = { text }
      await onSave(content)
      setLastSavedText(text)
      const now = new Date().toISOString()
      setLastSavedAt(now)
      setRelativeTime(formatRelativeTime(now))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, text, onSave])

  // Ctrl/Cmd + S shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty) handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDirty, handleSave])

  const typeLabel = cvType === 'career' ? 'Career' : 'Temp'

  return (
    <section aria-label={`${typeLabel} CV base content editor`} className="flex flex-col gap-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 px-3.5 py-3 rounded-lg bg-blue-950/40 border border-blue-800/50">
        <svg
          aria-hidden="true"
          className="shrink-0 w-4 h-4 text-blue-400 mt-0.5"
          fill="none"
          viewBox="0 0 16 16"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7v4M8 5.5v.01" strokeLinecap="round" />
        </svg>
        <p className="text-xs text-blue-300 leading-relaxed">
          This is your base {typeLabel} CV. When you apply to a job, AI will tailor this content
          for that specific role and company.
        </p>
      </div>

      {/* Editor */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor={`cv-base-${cvType}`} className="label mb-0">
            Base CV content
          </label>
          <span className="text-xs font-mono text-[#71717A]" aria-live="polite">
            {wordCount.toLocaleString()} word{wordCount !== 1 ? 's' : ''}
          </span>
        </div>

        <textarea
          id={`cv-base-${cvType}`}
          ref={textareaRef}
          className="textarea min-h-[280px] font-mono text-xs leading-relaxed"
          placeholder={`Paste your base ${typeLabel} CV here — work history, skills, education, achievements.\n\nAI will adapt this for each specific job you apply to.`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-describedby={`cv-base-${cvType}-hint`}
          spellCheck={false}
        />

        <p id={`cv-base-${cvType}-hint`} className="text-[11px] text-[#71717A]">
          Plain text preferred. Use clear headings like EXPERIENCE, SKILLS, EDUCATION.
          Keyboard shortcut: <kbd className="font-mono px-1 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] text-[10px]">Ctrl+S</kbd> to save.
        </p>
      </div>

      {/* Footer: save status + button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Last saved info */}
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-[#71717A]" aria-live="polite" aria-atomic="true">
            Last saved:{' '}
            <span className="text-[#A1A1AA]">{relativeTime}</span>
          </p>
          {isDirty && (
            <p className="text-[11px] text-amber-400" role="status">
              Unsaved changes
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save status feedback */}
          {saveStatus === 'success' && (
            <span role="status" className="text-xs text-emerald-400 flex items-center gap-1">
              <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
                <polyline points="2,7 5.5,10.5 12,3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span role="alert" className="text-xs text-red-400">
              {saveError}
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="btn-primary text-sm px-4"
            aria-busy={isSaving}
          >
            {isSaving ? (
              <>
                <svg aria-hidden="true" className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                  <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                </svg>
                Saving…
              </>
            ) : (
              'Save Base CV'
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
