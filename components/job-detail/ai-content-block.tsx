'use client'

import { useState, useRef, useCallback } from 'react'
import { Pencil, RefreshCw, Sparkles } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIContentBlockProps {
  title: string
  content: string | null            // The AI-generated original
  editedContent: string | null      // User-edited version (null if not edited)
  manuallyEdited: boolean
  isGenerating: boolean
  cvTypeSelected: boolean           // false if cv_type not set yet
  onGenerate: () => Promise<void>
  onSaveEdit: (text: string) => Promise<void>
}

type ViewState = 'display' | 'edit'

// ─── Word count helper ────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIContentBlock({
  title,
  content,
  editedContent,
  manuallyEdited,
  isGenerating,
  cvTypeSelected,
  onGenerate,
  onSaveEdit,
}: AIContentBlockProps) {
  // The displayed content: edited takes priority over original
  const displayContent = editedContent ?? content

  const [viewState, setViewState] = useState<ViewState>('display')
  const [editText, setEditText] = useState(displayContent ?? '')
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleEditClick = useCallback(() => {
    setEditText(displayContent ?? '')
    setSaveError(null)
    setViewState('edit')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [displayContent])

  const handleCancelEdit = useCallback(() => {
    setViewState('display')
    setEditText(displayContent ?? '')
    setSaveError(null)
  }, [displayContent])

  const handleSaveEdit = useCallback(async () => {
    setIsSavingEdit(true)
    setSaveError(null)
    try {
      await onSaveEdit(editText)
      setViewState('display')
    } catch {
      setSaveError('Failed to save edits — please try again')
    } finally {
      setIsSavingEdit(false)
    }
  }, [editText, onSaveEdit])

  const handleRegenerateClick = useCallback(() => {
    if (manuallyEdited) {
      setShowRegenerateConfirm(true)
    } else {
      onGenerate()
    }
  }, [manuallyEdited, onGenerate])

  const handleConfirmRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false)
    setViewState('display')
    onGenerate()
  }, [onGenerate])

  const handleCancelRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // STATE 1 — Empty (no content yet) + not currently generating
  // ─────────────────────────────────────────────────────────────────────────────

  if (!displayContent && !isGenerating) {
    return (
      <div
        className={`
          card-elevated flex flex-col items-center justify-center min-h-[180px] gap-4
          text-center p-8 border-2 border-dashed border-[#27272A] rounded-xl
        `}
        aria-label={`${title} — not generated yet`}
      >
        <div className="w-12 h-12 rounded-full bg-[#111113] border border-[#27272A] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#52525B]" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#71717A]">
            No {title.toLowerCase()} generated yet
          </p>
          {!cvTypeSelected && (
            <p className="text-xs text-amber-400/80 font-mono">
              Select a CV type above before generating
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!cvTypeSelected || isGenerating}
          className="btn-primary gap-2"
          aria-label={`Generate ${title}`}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Generate {title}
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GENERATING / loading state
  // ─────────────────────────────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div
        className="card-elevated flex flex-col items-center justify-center min-h-[180px] gap-4 text-center p-8"
        role="status"
        aria-live="polite"
        aria-label={`Generating ${title}`}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#A1A1AA]">Generating {title}…</p>
          <p className="text-xs text-[#52525B]">This may take a moment</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATE 3 — Edit mode
  // ─────────────────────────────────────────────────────────────────────────────

  if (viewState === 'edit') {
    return (
      <div className="card-elevated flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Edit {title}</h3>
          <span
            className="text-xs text-[#52525B] font-mono tabular-nums"
            aria-live="polite"
            aria-label={`${editText.length.toLocaleString()} characters`}
          >
            {editText.length.toLocaleString()} chars
          </span>
        </div>

        <textarea
          ref={textareaRef}
          className="textarea font-mono text-xs leading-relaxed resize-y"
          style={{ minHeight: '400px' }}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          aria-label={`Edit ${title} content`}
          aria-describedby={saveError ? 'edit-save-error' : undefined}
        />

        {saveError && (
          <p id="edit-save-error" role="alert" className="text-xs text-red-400">
            {saveError}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancelEdit}
            disabled={isSavingEdit}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSaveEdit}
            disabled={isSavingEdit || editText === displayContent}
          >
            {isSavingEdit ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATE 2 — Display mode (content exists)
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="card-elevated flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="section-title">{title}</h3>
          {manuallyEdited && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-950 text-amber-300 border border-amber-800/50"
              aria-label="Manually edited version"
            >
              Edited
            </span>
          )}
        </div>

        {/* Action buttons — only shown when NOT in regenerate confirm */}
        {!showRegenerateConfirm && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              className="btn-ghost text-xs px-3 py-2 min-h-[44px] gap-1.5"
              onClick={handleEditClick}
              aria-label={`Edit ${title}`}
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              className="btn-ghost text-xs px-3 py-2 min-h-[44px] gap-1.5"
              onClick={handleRegenerateClick}
              disabled={!cvTypeSelected || isGenerating}
              aria-label={`Regenerate ${title}`}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Manually edited warning banner */}
      {manuallyEdited && (
        <div
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-950/60 border border-amber-800/50"
          role="note"
          aria-label="Content has been manually edited"
        >
          <svg
            className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"
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
          <p className="text-xs text-amber-300/90 leading-relaxed">
            You&apos;ve manually edited this. Regenerating will replace your changes.
          </p>
        </div>
      )}

      {/* Inline regenerate confirmation (replaces action bar) */}
      {showRegenerateConfirm && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-amber-950/40 border border-amber-800/40"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-amber-300 flex-1">
            Your edits will be replaced. Are you sure?
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn-secondary text-xs px-3 py-2 min-h-[44px]"
              onClick={handleCancelRegenerate}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger text-xs px-3 py-2 min-h-[44px]"
              onClick={handleConfirmRegenerate}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Content display */}
      <pre
        className="whitespace-pre-wrap font-sans text-sm text-[#FAFAFA] bg-[#18181B] border border-[#27272A] rounded-lg p-4 overflow-auto max-h-96 leading-relaxed"
        aria-label={`${title} content`}
      >
        {displayContent}
      </pre>

      {/* Footer: word count */}
      <p className="text-xs text-[#52525B] font-mono">
        {wordCount(displayContent ?? '').toLocaleString()} words
        {manuallyEdited && (
          <span className="ml-2 text-amber-500/70">· showing edited version</span>
        )}
      </p>
    </div>
  )
}
