'use client'

import { useState, useCallback } from 'react'
import { Trash2, Pencil, Loader2, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import type { InterviewPrep, InterviewRound } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const ROUND_BORDER_COLORS: Record<InterviewRound, string> = {
  basic: 'border-l-blue-500',
  intermediate: 'border-l-amber-500',
  advanced: 'border-l-red-500',
}

const ROUND_LABELS: Record<InterviewRound, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const ROUND_BADGE_CLASSES: Record<InterviewRound, string> = {
  basic: 'bg-blue-950 text-blue-400',
  intermediate: 'bg-amber-950 text-amber-400',
  advanced: 'bg-red-950 text-red-400',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: InterviewPrep
  round: InterviewRound
  practiceMode: boolean
  onAnswerGenerated: (questionId: string, answer: string) => void
  onAnswerEdited: (questionId: string, answer: string) => void
  onDeleted: (questionId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuestionCard({
  question,
  round,
  practiceMode,
  onAnswerGenerated,
  onAnswerEdited,
  onDeleted,
}: QuestionCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAnswerExpanded, setIsAnswerExpanded] = useState(false)
  const [editText, setEditText] = useState(question.answer ?? '')
  const [localError, setLocalError] = useState<string | null>(null)

  // ─── Generate Answer ───────────────────────────────────────────────────────

  const handleGenerateAnswer = useCallback(async () => {
    setIsGeneratingAnswer(true)
    setLocalError(null)
    try {
      const res = await fetch('/api/ai/generate-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: question.job_id,
          question_id: question.id,
        }),
      })
      const json = (await res.json()) as { data: string | null; error: string | null }
      if (!res.ok || !json.data) {
        setLocalError(json.error ?? 'Failed to generate answer')
        return
      }
      onAnswerGenerated(question.id, json.data)
      setEditText(json.data)
      setIsAnswerExpanded(true)
    } catch {
      setLocalError('Network error. Please try again.')
    } finally {
      setIsGeneratingAnswer(false)
    }
  }, [question.id, question.job_id, onAnswerGenerated])

  // ─── Save Edit ─────────────────────────────────────────────────────────────

  const handleSaveEdit = useCallback(async () => {
    if (!editText.trim()) return
    setIsSavingEdit(true)
    setLocalError(null)
    try {
      const res = await fetch(`/api/interview-prep/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: editText }),
      })
      const json = (await res.json()) as { data: unknown; error: string | null }
      if (!res.ok) {
        setLocalError(json.error ?? 'Failed to save')
        return
      }
      onAnswerEdited(question.id, editText)
      setIsEditing(false)
      setIsAnswerExpanded(true)
    } catch {
      setLocalError('Network error. Please try again.')
    } finally {
      setIsSavingEdit(false)
    }
  }, [question.id, editText, onAnswerEdited])

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/interview-prep/${question.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onDeleted(question.id)
      } else {
        const json = (await res.json()) as { error: string | null }
        setLocalError(json.error ?? 'Failed to delete')
        setIsDeleting(false)
      }
    } catch {
      setLocalError('Network error.')
      setIsDeleting(false)
    }
  }, [question.id, onDeleted])

  // ─── Cancel Edit ───────────────────────────────────────────────────────────

  const handleCancelEdit = useCallback(() => {
    setEditText(question.answer ?? '')
    setIsEditing(false)
    setLocalError(null)
  }, [question.answer])

  // ─── Render ────────────────────────────────────────────────────────────────

  const hasAnswer = Boolean(question.answer)
  const displayAnswer = question.answer ?? ''

  return (
    <div
      className={[
        'card border-l-2 p-4 space-y-3 transition-opacity duration-200',
        ROUND_BORDER_COLORS[round],
        isDeleting ? 'opacity-40 pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className={[
              'badge shrink-0 mt-0.5',
              ROUND_BADGE_CLASSES[round],
            ].join(' ')}
          >
            {ROUND_LABELS[round]}
          </span>
          <p className="text-base font-medium text-[#FAFAFA] leading-snug">
            {question.question}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {hasAnswer && !practiceMode && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true)
                setEditText(question.answer ?? '')
              }}
              aria-label="Edit answer"
              title="Edit answer"
              className="btn-ghost p-2 min-h-[44px] min-w-[44px]"
            >
              <Pencil size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete question"
            title="Delete question"
            className="btn-ghost p-2 min-h-[44px] min-w-[44px] text-[#71717A] hover:text-red-400"
          >
            {isDeleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {localError && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {localError}
        </p>
      )}

      {/* Answer area */}
      {!hasAnswer && !isEditing && (
        <button
          type="button"
          onClick={handleGenerateAnswer}
          disabled={isGeneratingAnswer}
          className="btn-secondary text-sm gap-2 w-full sm:w-auto"
        >
          {isGeneratingAnswer ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating answer…
            </>
          ) : (
            'Generate Answer'
          )}
        </button>
      )}

      {hasAnswer && !isEditing && !practiceMode && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsAnswerExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors"
          >
            {isAnswerExpanded ? (
              <>
                <ChevronUp size={14} />
                Hide answer
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Show answer
              </>
            )}
          </button>

          {isAnswerExpanded && (
            <div className="card-elevated p-3 rounded-lg">
              <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                {displayAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      {hasAnswer && !isEditing && practiceMode && (
        <div className="space-y-2">
          {!isRevealed ? (
            <button
              type="button"
              onClick={() => setIsRevealed(true)}
              className="btn-secondary text-sm gap-2"
            >
              <Eye size={14} />
              Reveal Answer
            </button>
          ) : (
            <div className="card-elevated p-3 rounded-lg animate-fade-in">
              <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                {displayAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="textarea text-sm"
            placeholder="Write your answer here…"
            rows={5}
            aria-label="Edit answer"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editText.trim()}
              className="btn-primary text-sm gap-2"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSavingEdit}
              className="btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
