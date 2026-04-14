'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Loader2,
  ExternalLink,
  FlaskConical,
} from 'lucide-react'
import type { Job, InterviewPrep, InterviewRound } from '@/types'
import { QuestionCard } from './question-card'
import { RoundTab } from './round-tab'

// ─── Constants ───────────────────────────────────────────────────────────────

const ROUNDS: InterviewRound[] = ['basic', 'intermediate', 'advanced']

const ROUND_LABELS: Record<InterviewRound, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  saved: 'badge-saved',
  applied: 'badge-applied',
  interview: 'badge-interview',
  rejected: 'badge-rejected',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InterviewPrepClientProps {
  jobs: Job[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InterviewPrepClient({ jobs }: InterviewPrepClientProps) {
  // ─── State ─────────────────────────────────────────────────────────────────

  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [activeRound, setActiveRound] = useState<InterviewRound>('basic')
  const [questions, setQuestions] = useState<InterviewPrep[]>([])
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [practiceMode, setPracticeMode] = useState(false)
  const [generatingRound, setGeneratingRound] = useState<InterviewRound | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [lastGeneratedCount, setLastGeneratedCount] = useState<number | null>(null)

  // ─── Derived ───────────────────────────────────────────────────────────────

  const selectedJob = useMemo<Job | null>(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  )

  const questionsByRound = useMemo<Record<InterviewRound, InterviewPrep[]>>(
    () => ({
      basic: questions.filter((q) => q.round === 'basic'),
      intermediate: questions.filter((q) => q.round === 'intermediate'),
      advanced: questions.filter((q) => q.round === 'advanced'),
    }),
    [questions]
  )

  const activeQuestions = useMemo(
    () => questionsByRound[activeRound],
    [questionsByRound, activeRound]
  )

  const revealedCount = useMemo(
    () => activeQuestions.filter((q) => Boolean(q.answer)).length,
    [activeQuestions]
  )

  // ─── Fetch questions on job change ─────────────────────────────────────────

  const fetchQuestions = useCallback(async (jobId: string) => {
    if (!jobId) {
      setQuestions([])
      return
    }
    setIsFetchingQuestions(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/interview-prep?job_id=${encodeURIComponent(jobId)}`)
      const json = (await res.json()) as { data: InterviewPrep[] | null; error: string | null }
      if (!res.ok || !json.data) {
        setFetchError(json.error ?? 'Failed to load questions')
        setQuestions([])
        return
      }
      setQuestions(json.data)
    } catch {
      setFetchError('Network error. Please try again.')
      setQuestions([])
    } finally {
      setIsFetchingQuestions(false)
    }
  }, [])

  useEffect(() => {
    if (selectedJobId) {
      fetchQuestions(selectedJobId)
    } else {
      setQuestions([])
    }
  }, [selectedJobId, fetchQuestions])

  // ─── Job selector change ────────────────────────────────────────────────────

  const handleJobChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedJobId(e.target.value)
    setActiveRound('basic')
    setPracticeMode(false)
    setLastGeneratedCount(null)
    setGenerateError(null)
  }, [])

  // ─── Generate questions ────────────────────────────────────────────────────

  const handleGenerateQuestions = useCallback(async (round: InterviewRound) => {
    if (!selectedJobId) return
    setGeneratingRound(round)
    setGenerateError(null)
    setLastGeneratedCount(null)
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: selectedJobId, round }),
      })
      const json = (await res.json()) as { data: InterviewPrep[] | null; error: string | null }
      if (!res.ok || !json.data) {
        setGenerateError(json.error ?? 'Failed to generate questions')
        return
      }
      // Replace questions for this round (API deletes old ones and inserts new)
      setQuestions((prev) => [
        ...prev.filter((q) => q.round !== round),
        ...json.data!,
      ])
      setLastGeneratedCount(json.data.length)
    } catch {
      setGenerateError('Network error. Please try again.')
    } finally {
      setGeneratingRound(null)
    }
  }, [selectedJobId])

  // ─── Question event handlers ───────────────────────────────────────────────

  const handleAnswerGenerated = useCallback((questionId: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answer } : q))
    )
  }, [])

  const handleAnswerEdited = useCallback((questionId: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answer } : q))
    )
  }, [])

  const handleDeleted = useCallback((questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId))
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  const hasQuestionsForActiveRound = activeQuestions.length > 0
  const isGeneratingActive = generatingRound === activeRound

  return (
    <div className="page-container space-y-6">
      {/* ─── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="section-title">Interview Prep</h1>
            <p className="text-xs text-[#71717A] mt-0.5">
              Generate and practice interview questions
            </p>
          </div>
        </div>

        {/* Practice mode toggle */}
        <button
          type="button"
          onClick={() => setPracticeMode((prev) => !prev)}
          aria-pressed={practiceMode}
          className={[
            'btn gap-2 text-sm font-medium',
            practiceMode
              ? 'bg-amber-950 border border-amber-700 text-amber-300 hover:bg-amber-900'
              : 'btn-secondary',
          ].join(' ')}
        >
          <FlaskConical size={15} />
          {practiceMode ? 'Exit Practice' : 'Practice Mode'}
          <span
            className={[
              'w-2 h-2 rounded-full shrink-0',
              practiceMode ? 'bg-amber-400 animate-pulse' : 'bg-[#3F3F46]',
            ].join(' ')}
          />
        </button>
      </div>

      {/* ─── Practice mode banner ─────────────────────────────────────────── */}
      {practiceMode && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-800">
          <div className="flex items-center gap-2">
            <FlaskConical size={15} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 font-medium">Practice Mode Active</p>
            <span className="text-xs text-amber-500">— answers are hidden until revealed</span>
          </div>
          {activeQuestions.length > 0 && (
            <span className="text-xs font-mono text-amber-400 bg-amber-950 border border-amber-800 px-2 py-1 rounded-md shrink-0">
              {revealedCount} / {activeQuestions.length} revealed
            </span>
          )}
        </div>
      )}

      {/* ─── Job selector ─────────────────────────────────────────────────── */}
      <div className="card p-4 space-y-3">
        <label htmlFor="job-selector" className="label">
          Select Job
        </label>
        <select
          id="job-selector"
          value={selectedJobId}
          onChange={handleJobChange}
          className="input"
          aria-label="Select a job for interview prep"
        >
          <option value="">— General prep (no specific job) —</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.company} — {job.title}
            </option>
          ))}
        </select>

        {jobs.length === 0 && (
          <p className="text-xs text-[#71717A]">
            No jobs with &quot;applied&quot; or &quot;interview&quot; status found.{' '}
            <Link href="/tracker" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Add jobs in the tracker
            </Link>
            .
          </p>
        )}
      </div>

      {/* ─── Selected job card ────────────────────────────────────────────── */}
      {selectedJob && (
        <div className="card-elevated p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-[#27272A] flex items-center justify-center shrink-0 text-sm font-mono font-semibold text-[#A1A1AA]">
              {selectedJob.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-[#FAFAFA]">{selectedJob.title}</p>
              <p className="text-xs text-[#71717A]">{selectedJob.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={STATUS_BADGE_CLASSES[selectedJob.status] ?? 'badge'}>
              {selectedJob.status}
            </span>
            <Link
              href={`/tracker/${selectedJob.id}`}
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] min-w-[44px] justify-center sm:justify-start"
            >
              Open job
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Empty: no job selected ───────────────────────────────────────── */}
      {!selectedJobId && (
        <div className="card p-8 text-center space-y-2">
          <p className="text-base text-[#71717A]">
            Select a job above to start preparing, or choose &quot;General&quot; for practice without a specific role.
          </p>
        </div>
      )}

      {/* ─── Questions area ───────────────────────────────────────────────── */}
      {selectedJobId && (
        <div className="space-y-5">
          {/* Round tabs */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            role="tablist"
            aria-label="Interview rounds"
          >
            {ROUNDS.map((round) => (
              <RoundTab
                key={round}
                round={round}
                count={questionsByRound[round].length}
                isActive={activeRound === round}
                onClick={() => {
                  setActiveRound(round)
                  setLastGeneratedCount(null)
                  setGenerateError(null)
                }}
              />
            ))}
          </div>

          {/* Loading questions */}
          {isFetchingQuestions && (
            <div className="flex items-center gap-3 text-sm text-[#71717A] py-4">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              Loading questions…
            </div>
          )}

          {/* Fetch error */}
          {fetchError && !isFetchingQuestions && (
            <div className="card p-4 border-red-900">
              <p className="text-sm text-red-400">{fetchError}</p>
            </div>
          )}

          {/* Round content */}
          {!isFetchingQuestions && !fetchError && (
            <div
              role="tabpanel"
              aria-label={`${ROUND_LABELS[activeRound]} questions`}
              className="space-y-4"
            >
              {/* Generate questions button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGenerateQuestions(activeRound)}
                  disabled={isGeneratingActive}
                  className="btn-secondary text-sm gap-2"
                >
                  {isGeneratingActive ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating {ROUND_LABELS[activeRound]} questions…
                    </>
                  ) : hasQuestionsForActiveRound ? (
                    `Regenerate ${ROUND_LABELS[activeRound]} Questions (replaces existing)`
                  ) : (
                    `Generate ${ROUND_LABELS[activeRound]} Questions`
                  )}
                </button>

                {/* Generated count feedback */}
                {lastGeneratedCount !== null && generatingRound === null && (
                  <span className="text-xs text-[#71717A] font-mono">
                    Generated {lastGeneratedCount} question{lastGeneratedCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Generate error */}
              {generateError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                  {generateError}
                </p>
              )}

              {/* Empty state */}
              {!hasQuestionsForActiveRound && !isGeneratingActive && (
                <div className="card p-6 text-center">
                  <p className="text-sm text-[#71717A]">
                    No questions yet. Generate them for each round below.
                  </p>
                </div>
              )}

              {/* Question cards */}
              {hasQuestionsForActiveRound && (
                <div className="space-y-3">
                  {activeQuestions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      round={activeRound}
                      practiceMode={practiceMode}
                      onAnswerGenerated={handleAnswerGenerated}
                      onAnswerEdited={handleAnswerEdited}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
