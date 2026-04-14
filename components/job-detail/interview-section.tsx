'use client'

import { useState, useCallback } from 'react'
import { Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import type { InterviewPrep, InterviewRound } from '@/types'

// ─── Round config ─────────────────────────────────────────────────────────────

const ROUNDS: { value: InterviewRound; label: string; border: string; badge: string }[] = [
  {
    value: 'basic',
    label: 'Basic',
    border: 'border-l-blue-500',
    badge: 'bg-blue-950 text-blue-300',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    border: 'border-l-amber-400',
    badge: 'bg-amber-950 text-amber-300',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    border: 'border-l-red-500',
    badge: 'bg-red-950 text-red-400',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface InterviewSectionProps {
  jobId: string
  interviewPrep: InterviewPrep[]
  onInterviewPrepChange: (prep: InterviewPrep[]) => void
}

// ─── Question card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  item: InterviewPrep
  borderClass: string
  practiceMode: boolean
  onUpdateAnswer: (id: string, answer: string) => void
  onDelete: (id: string) => void
  onGenerateAnswer: (id: string) => Promise<void>
}

function QuestionCard({
  item,
  borderClass,
  practiceMode,
  onUpdateAnswer,
  onDelete,
  onGenerateAnswer,
}: QuestionCardProps) {
  const [answerExpanded, setAnswerExpanded] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [isEditingAnswer, setIsEditingAnswer] = useState(false)
  const [editAnswerText, setEditAnswerText] = useState(item.answer ?? '')
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [isDeletingAnswer, setIsDeletingAnswer] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const showAnswer = practiceMode ? revealed : answerExpanded

  async function handleGenerateAnswer() {
    setIsGeneratingAnswer(true)
    setAnswerError(null)
    try {
      await onGenerateAnswer(item.id)
    } catch {
      setAnswerError('Failed to generate answer')
    } finally {
      setIsGeneratingAnswer(false)
    }
  }

  async function handleDeleteQuestion() {
    if (isDeletingAnswer) return
    setIsDeletingAnswer(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/interview-prep/${item.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setDeleteError(json.error ?? 'Failed to delete question')
        return
      }
      onDelete(item.id)
    } catch {
      setDeleteError('Network error')
    } finally {
      setIsDeletingAnswer(false)
    }
  }

  async function handleSaveAnswer() {
    try {
      const res = await fetch(`/api/interview-prep/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: editAnswerText }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setAnswerError(json.error ?? 'Failed to save answer')
        return
      }
      onUpdateAnswer(item.id, editAnswerText)
      setIsEditingAnswer(false)
    } catch {
      setAnswerError('Network error — please try again')
    }
  }

  return (
    <article
      className={`card-elevated border-l-4 ${borderClass} rounded-xl overflow-hidden`}
      aria-label={`Question: ${item.question}`}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Question text + delete */}
        <div className="flex items-start gap-2 justify-between">
          <p className="text-sm font-medium text-[#FAFAFA] leading-snug flex-1">
            {item.question}
          </p>
          <button
            type="button"
            onClick={handleDeleteQuestion}
            disabled={isDeletingAnswer}
            className="btn-ghost p-2 min-h-[44px] min-w-[44px] text-[#52525B] hover:text-red-400 flex-shrink-0"
            aria-label="Delete question"
          >
            {isDeletingAnswer ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {deleteError && (
          <p role="alert" className="text-xs text-red-400">
            {deleteError}
          </p>
        )}

        {/* Answer area */}
        {item.answer ? (
          <div className="flex flex-col gap-2">
            {/* Practice mode reveal / normal expand toggle */}
            {practiceMode ? (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className="btn-ghost text-xs px-3 py-2 min-h-[44px] self-start gap-1.5"
                aria-expanded={revealed}
              >
                {revealed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    Hide Answer
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    Reveal Answer
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAnswerExpanded((v) => !v)}
                className="btn-ghost text-xs px-3 py-2 min-h-[44px] self-start gap-1.5"
                aria-expanded={answerExpanded}
              >
                {answerExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                    Collapse Answer
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    View Answer
                  </>
                )}
              </button>
            )}

            {showAnswer && (
              <>
                {isEditingAnswer ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="textarea text-xs font-mono"
                      style={{ minHeight: '140px' }}
                      value={editAnswerText}
                      onChange={(e) => setEditAnswerText(e.target.value)}
                      aria-label="Edit answer"
                    />
                    {answerError && (
                      <p role="alert" className="text-xs text-red-400">
                        {answerError}
                      </p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        className="btn-ghost text-xs px-3 py-2 min-h-[44px]"
                        onClick={() => {
                          setIsEditingAnswer(false)
                          setEditAnswerText(item.answer ?? '')
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary text-xs px-3 py-2 min-h-[44px]"
                        onClick={handleSaveAnswer}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-[#D4D4D8] leading-relaxed bg-[#0A0A0B] rounded-lg p-3 border border-[#27272A] whitespace-pre-wrap font-mono">
                      {item.answer}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost text-xs px-3 py-2 min-h-[44px] self-start"
                      onClick={() => {
                        setEditAnswerText(item.answer ?? '')
                        setIsEditingAnswer(true)
                      }}
                    >
                      Edit Answer
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          /* No answer yet */
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGenerateAnswer}
              disabled={isGeneratingAnswer}
              className="btn-secondary text-xs px-3 py-2 min-h-[44px] self-start gap-1.5"
              aria-label="Generate answer for this question"
            >
              {isGeneratingAnswer ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Generate Answer
                </>
              )}
            </button>
            {answerError && (
              <p role="alert" className="text-xs text-red-400">
                {answerError}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

// ─── Main section component ───────────────────────────────────────────────────

export function InterviewSection({
  jobId,
  interviewPrep,
  onInterviewPrepChange,
}: InterviewSectionProps) {
  const [activeRound, setActiveRound] = useState<InterviewRound>('basic')
  const [practiceMode, setPracticeMode] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const questionsForRound = interviewPrep.filter((p) => p.round === activeRound)
  const hasQuestionsForRound = questionsForRound.length > 0

  // Count for each round badge
  const countByRound = (round: InterviewRound) =>
    interviewPrep.filter((p) => p.round === round).length

  // Revealed count in practice mode
  // (Track per-question reveal state at question card level — here we show total answered)
  const answeredCount = questionsForRound.filter((p) => p.answer !== null).length

  async function handleGenerateQuestions(force = false) {
    if (!force && hasQuestionsForRound) {
      setShowRegenerateConfirm(true)
      return
    }

    setIsGeneratingQuestions(true)
    setGenerateError(null)
    setShowRegenerateConfirm(false)

    try {
      // Delete existing questions for this round first (if regenerating)
      if (hasQuestionsForRound) {
        await Promise.all(
          questionsForRound.map((q) =>
            fetch(`/api/interview-prep/${q.id}`, { method: 'DELETE' })
          )
        )
        onInterviewPrepChange(interviewPrep.filter((p) => p.round !== activeRound))
      }

      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, round: activeRound }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setGenerateError(json.error ?? 'Failed to generate questions')
        return
      }
      const newQuestions = json.data as InterviewPrep[]
      onInterviewPrepChange([
        ...interviewPrep.filter((p) => p.round !== activeRound),
        ...newQuestions,
      ])
    } catch {
      setGenerateError('Network error — please try again')
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  function handleDeleteQuestion(id: string) {
    onInterviewPrepChange(interviewPrep.filter((p) => p.id !== id))
  }

  function handleUpdateAnswer(id: string, answer: string) {
    onInterviewPrepChange(
      interviewPrep.map((p) => (p.id === id ? { ...p, answer } : p))
    )
  }

  async function handleGenerateAnswer(questionId: string) {
    const res = await fetch('/api/ai/generate-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, question_id: questionId }),
    })
    const json = await res.json()
    if (!res.ok || json.error) {
      throw new Error(json.error ?? 'Failed to generate answer')
    }
    const answer = json.data as string
    onInterviewPrepChange(
      interviewPrep.map((p) => (p.id === questionId ? { ...p, answer } : p))
    )
  }

  const activeRoundConfig = ROUNDS.find((r) => r.value === activeRound)!

  return (
    <section
      aria-labelledby="interview-section-heading"
      className="card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 id="interview-section-heading" className="section-title">
          Interview Prep
        </h2>
        <button
          type="button"
          onClick={() => setPracticeMode((v) => !v)}
          className={`
            text-xs font-mono px-3 py-1.5 rounded-lg border transition-all min-h-[44px]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            ${
              practiceMode
                ? 'bg-amber-950 border-amber-800 text-amber-300'
                : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46]'
            }
          `}
          aria-pressed={practiceMode}
          aria-label={practiceMode ? 'Exit practice mode' : 'Enter practice mode'}
        >
          {practiceMode ? '🎯 Practice On' : 'Practice Mode'}
        </button>
      </div>

      {/* Practice mode banner */}
      {practiceMode && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-950/50 border border-amber-800/50"
          role="status"
          aria-live="polite"
        >
          <span className="text-amber-300 text-sm font-mono">
            Practice Mode — click to reveal answers
          </span>
          <span className="ml-auto text-xs text-amber-400/70 font-mono">
            {answeredCount} answered of {questionsForRound.length}
          </span>
        </div>
      )}

      {/* Round tabs */}
      <div
        role="tablist"
        aria-label="Interview rounds"
        className="flex gap-1.5"
      >
        {ROUNDS.map((round) => {
          const count = countByRound(round.value)
          const isActive = activeRound === round.value
          return (
            <button
              key={round.value}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => {
                setActiveRound(round.value)
                setShowRegenerateConfirm(false)
                setGenerateError(null)
              }}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium
                transition-all duration-150 min-h-[44px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${
                  isActive
                    ? 'bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]'
                    : 'text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#18181B]'
                }
              `}
            >
              {round.label}
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${round.badge}`}
                  aria-label={`${count} questions`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Generate / Regenerate button row */}
      {showRegenerateConfirm ? (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-amber-950/40 border border-amber-800/40"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-amber-300 flex-1">
            Regenerate? This will replace existing questions.
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
              onClick={() => handleGenerateQuestions(true)}
            >
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => handleGenerateQuestions(false)}
          disabled={isGeneratingQuestions}
          className="btn-secondary gap-2 self-start"
          aria-label={
            hasQuestionsForRound
              ? `Regenerate ${activeRoundConfig.label} questions`
              : `Generate ${activeRoundConfig.label} questions`
          }
        >
          {isGeneratingQuestions ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {hasQuestionsForRound ? 'Regenerate Questions' : 'Generate Questions'}
            </>
          )}
        </button>
      )}

      {generateError && (
        <p role="alert" className="text-xs text-red-400">
          {generateError}
        </p>
      )}

      {/* Question list */}
      {questionsForRound.length > 0 ? (
        <div
          role="tabpanel"
          aria-label={`${activeRoundConfig.label} questions`}
          className="flex flex-col gap-3"
        >
          {questionsForRound.map((item) => (
            <QuestionCard
              key={item.id}
              item={item}
              borderClass={activeRoundConfig.border}
              practiceMode={practiceMode}
              onUpdateAnswer={handleUpdateAnswer}
              onDelete={handleDeleteQuestion}
              onGenerateAnswer={handleGenerateAnswer}
            />
          ))}
        </div>
      ) : (
        !isGeneratingQuestions && (
          <div className="text-center py-6">
            <p className="text-sm text-[#52525B] font-mono">
              No {activeRoundConfig.label.toLowerCase()} questions yet
            </p>
          </div>
        )
      )}

      {/* Generating skeleton */}
      {isGeneratingQuestions && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Generating questions"
          className="flex flex-col gap-3"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="card-elevated border-l-4 border-l-[#27272A] rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-[#27272A] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#27272A] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
