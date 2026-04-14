'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { Job, InterviewPrep, FollowUp, CVType, JobStatus } from '@/types'
import { JobInfoSection } from './job-info-section'
import { StatusControl } from './status-control'
import { CVTypeSelector } from './cv-type-selector'
import { AIContentBlock } from './ai-content-block'
import { InterviewSection } from './interview-section'
import { FollowUpSection } from './followup-section'

// ─── Status badge helper ─────────────────────────────────────────────────────

function StatusBadgeLarge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { cls: string; label: string }> = {
    saved:     { cls: 'badge-saved',     label: 'Saved' },
    applied:   { cls: 'badge-applied',   label: 'Applied' },
    interview: { cls: 'badge-interview', label: 'Interview' },
    rejected:  { cls: 'badge-rejected',  label: 'Rejected' },
  }
  const { cls, label } = map[status]
  return (
    <span className={`${cls} text-sm px-3 py-1`}>
      {label}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface JobDetailClientProps {
  job: Job
  initialInterviewPrep: InterviewPrep[]
  initialFollowUp: FollowUp | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JobDetailClient({
  job: initialJob,
  initialInterviewPrep,
  initialFollowUp,
}: JobDetailClientProps) {
  const router = useRouter()

  // ── Core job state ─────────────────────────────────────────────────────────
  const [job, setJob] = useState<Job>(initialJob)
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep[]>(initialInterviewPrep)
  const [followUp, setFollowUp] = useState<FollowUp | null>(initialFollowUp)

  // ── AI generation states ───────────────────────────────────────────────────
  const [isGeneratingCV, setIsGeneratingCV] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [cvError, setCvError] = useState<string | null>(null)
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null)

  // ── CV type ────────────────────────────────────────────────────────────────
  const cvTypeSelected = job.cv_type !== null

  // ── Patch job helper ───────────────────────────────────────────────────────
  const patchJob = useCallback((partial: Partial<Job>) => {
    setJob((prev) => ({ ...prev, ...partial }))
  }, [])

  // ── Generate CV ────────────────────────────────────────────────────────────
  const handleGenerateCV = useCallback(async () => {
    if (!job.cv_type) return
    setIsGeneratingCV(true)
    setCvError(null)
    try {
      const res = await fetch('/api/ai/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, cv_type: job.cv_type }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setCvError(json.error ?? 'Failed to generate CV')
        return
      }
      patchJob({
        generated_cv: json.data as string,
        generated_cv_edited: null,
        cv_manually_edited: false,
      })
    } catch {
      setCvError('Network error — please try again')
    } finally {
      setIsGeneratingCV(false)
    }
  }, [job.id, job.cv_type, patchJob])

  // ── Save CV edit ───────────────────────────────────────────────────────────
  const handleSaveCVEdit = useCallback(async (text: string) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generated_cv_edited: text,
          cv_manually_edited: true,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setCvError(json.error ?? 'Failed to save CV edits')
        return
      }
      patchJob({ generated_cv_edited: text, cv_manually_edited: true })
    } catch {
      setCvError('Network error — please try again')
    }
  }, [job.id, patchJob])

  // ── Generate Cover Letter ──────────────────────────────────────────────────
  const handleGenerateCoverLetter = useCallback(async () => {
    if (!job.cv_type) return
    setIsGeneratingCoverLetter(true)
    setCoverLetterError(null)
    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, cv_type: job.cv_type }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setCoverLetterError(json.error ?? 'Failed to generate cover letter')
        return
      }
      patchJob({
        generated_cover_letter: json.data as string,
        generated_cover_letter_edited: null,
        cover_letter_manually_edited: false,
      })
    } catch {
      setCoverLetterError('Network error — please try again')
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }, [job.id, job.cv_type, patchJob])

  // ── Save Cover Letter edit ─────────────────────────────────────────────────
  const handleSaveCoverLetterEdit = useCallback(async (text: string) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generated_cover_letter_edited: text,
          cover_letter_manually_edited: true,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setCoverLetterError(json.error ?? 'Failed to save cover letter edits')
        return
      }
      patchJob({ generated_cover_letter_edited: text, cover_letter_manually_edited: true })
    } catch {
      setCoverLetterError('Network error — please try again')
    }
  }, [job.id, patchJob])

  // ── Handle status change ───────────────────────────────────────────────────
  const handleStatusChange = useCallback((status: JobStatus) => {
    patchJob({ status })
    if (status === 'applied') {
      patchJob({ applied_at: new Date().toISOString() })
    }
  }, [patchJob])

  // ── Handle CV type change ──────────────────────────────────────────────────
  const handleCVTypeChange = useCallback((cvType: CVType) => {
    patchJob({ cv_type: cvType })
  }, [patchJob])

  // ── Handle notes save ──────────────────────────────────────────────────────
  const handleNotesSave = useCallback((notes: string) => {
    patchJob({ notes })
  }, [patchJob])

  return (
    <div className="page-container">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => router.push('/tracker')}
          className="btn-ghost p-2 min-h-[44px] min-w-[44px] flex-shrink-0"
          aria-label="Back to tracker"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs font-mono text-[#71717A] uppercase tracking-wider truncate">
                {job.company}
              </p>
              <h1 className="text-xl font-mono font-semibold text-[#FAFAFA] truncate leading-tight">
                {job.title}
              </h1>
            </div>
            <StatusBadgeLarge status={job.status} />
          </div>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Job info */}
          <JobInfoSection
            job={job}
            onNotesSave={handleNotesSave}
          />

          {/* Generated CV */}
          <section aria-labelledby="cv-section-heading">
            <h2
              id="cv-section-heading"
              className="section-title mb-3"
            >
              Generated CV
            </h2>
            {cvError && (
              <div
                role="alert"
                className="mb-3 px-3 py-2 rounded-lg bg-red-950/60 border border-red-800/50 text-sm text-red-400"
              >
                {cvError}
              </div>
            )}
            <AIContentBlock
              title="CV"
              content={job.generated_cv}
              editedContent={job.generated_cv_edited}
              manuallyEdited={job.cv_manually_edited}
              isGenerating={isGeneratingCV}
              cvTypeSelected={cvTypeSelected}
              onGenerate={handleGenerateCV}
              onSaveEdit={handleSaveCVEdit}
            />
          </section>

          {/* Generated Cover Letter */}
          <section aria-labelledby="cover-letter-section-heading">
            <h2
              id="cover-letter-section-heading"
              className="section-title mb-3"
            >
              Generated Cover Letter
            </h2>
            {coverLetterError && (
              <div
                role="alert"
                className="mb-3 px-3 py-2 rounded-lg bg-red-950/60 border border-red-800/50 text-sm text-red-400"
              >
                {coverLetterError}
              </div>
            )}
            <AIContentBlock
              title="Cover Letter"
              content={job.generated_cover_letter}
              editedContent={job.generated_cover_letter_edited}
              manuallyEdited={job.cover_letter_manually_edited}
              isGenerating={isGeneratingCoverLetter}
              cvTypeSelected={cvTypeSelected}
              onGenerate={handleGenerateCoverLetter}
              onSaveEdit={handleSaveCoverLetterEdit}
            />
          </section>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Status control */}
          <StatusControl
            jobId={job.id}
            status={job.status}
            onStatusChange={handleStatusChange}
          />

          {/* CV type selector */}
          <CVTypeSelector
            jobId={job.id}
            cvType={job.cv_type}
            onCVTypeChange={handleCVTypeChange}
          />

          {/* Interview prep */}
          <InterviewSection
            jobId={job.id}
            interviewPrep={interviewPrep}
            onInterviewPrepChange={setInterviewPrep}
          />

          {/* Follow-up */}
          <FollowUpSection
            jobId={job.id}
            jobStatus={job.status}
            followUp={followUp}
            onFollowUpChange={setFollowUp}
          />
        </div>
      </div>
    </div>
  )
}
