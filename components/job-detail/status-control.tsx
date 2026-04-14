'use client'

import { useState, useCallback } from 'react'
import type { JobStatus } from '@/types'

const STEPS: { value: JobStatus; label: string }[] = [
  { value: 'saved',     label: 'Saved' },
  { value: 'applied',   label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected',  label: 'Rejected' },
]

const STATUS_INDEX: Record<JobStatus, number> = {
  saved:     0,
  applied:   1,
  interview: 2,
  rejected:  3,
}

// Color configs per step
const STEP_COLORS: Record<JobStatus, { active: string; ring: string; label: string }> = {
  saved:     { active: 'bg-zinc-500',   ring: 'ring-zinc-500',   label: 'text-zinc-300' },
  applied:   { active: 'bg-blue-500',   ring: 'ring-blue-500',   label: 'text-blue-300' },
  interview: { active: 'bg-amber-400',  ring: 'ring-amber-400',  label: 'text-amber-300' },
  rejected:  { active: 'bg-red-500',    ring: 'ring-red-500',    label: 'text-red-400' },
}

interface StatusControlProps {
  jobId: string
  status: JobStatus
  onStatusChange: (status: JobStatus) => void
}

export function StatusControl({ jobId, status, onStatusChange }: StatusControlProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentIndex = STATUS_INDEX[status]

  const handleStepClick = useCallback(
    async (newStatus: JobStatus) => {
      if (newStatus === status || isUpdating) return

      setIsUpdating(true)
      setError(null)

      try {
        const body: Record<string, string> = { status: newStatus }
        if (newStatus === 'applied') {
          body.applied_at = new Date().toISOString()
        }

        const res = await fetch(`/api/jobs/${jobId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok || json.error) {
          setError(json.error ?? 'Failed to update status')
          return
        }
        onStatusChange(newStatus)
      } catch {
        setError('Network error — please try again')
      } finally {
        setIsUpdating(false)
      }
    },
    [jobId, status, isUpdating, onStatusChange]
  )

  return (
    <section
      aria-labelledby="status-control-heading"
      className="card p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 id="status-control-heading" className="section-title">
          Application Status
        </h2>
        {isUpdating && (
          <div
            className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin"
            role="status"
            aria-label="Updating status"
          />
        )}
      </div>

      <div
        role="group"
        aria-label="Status steps"
        className="flex items-start justify-between gap-1"
      >
        {STEPS.map((step, index) => {
          const isPast    = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture  = index > currentIndex
          const colors    = STEP_COLORS[step.value]

          return (
            <div
              key={step.value}
              className="flex flex-col items-center gap-2 flex-1 min-w-0"
            >
              {/* Connector + circle row */}
              <div className="flex items-center w-full">
                {/* Left connector */}
                {index > 0 && (
                  <div
                    className={`flex-1 h-0.5 transition-colors duration-300 ${
                      index <= currentIndex ? 'bg-[#3F3F46]' : 'bg-[#27272A]'
                    }`}
                    aria-hidden="true"
                  />
                )}

                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => handleStepClick(step.value)}
                  disabled={isUpdating}
                  aria-label={`Set status to ${step.label}`}
                  aria-pressed={isCurrent}
                  className={`
                    relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]
                    disabled:cursor-not-allowed min-h-[44px] min-w-[44px]
                    ${isCurrent
                      ? `${colors.active} ${colors.ring} ring-2 ring-offset-2 ring-offset-[#111113] shadow-lg`
                      : isPast
                      ? 'bg-[#3F3F46] hover:bg-[#52525B]'
                      : 'bg-[#27272A] hover:bg-[#3F3F46]'
                    }
                  `}
                >
                  {isPast ? (
                    // Checkmark for past steps
                    <svg
                      className="w-3.5 h-3.5 text-[#A1A1AA]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : isCurrent ? (
                    // Filled dot for current
                    <span className="w-2.5 h-2.5 rounded-full bg-white" aria-hidden="true" />
                  ) : (
                    // Empty dot for future
                    <span className="w-2 h-2 rounded-full bg-[#52525B]" aria-hidden="true" />
                  )}
                </button>

                {/* Right connector */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 transition-colors duration-300 ${
                      index < currentIndex ? 'bg-[#3F3F46]' : 'bg-[#27272A]'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-mono text-center truncate w-full ${
                  isCurrent
                    ? colors.label + ' font-semibold'
                    : isPast
                    ? 'text-[#71717A]'
                    : 'text-[#52525B]'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}

      {/* Contextual hint */}
      <p className="text-xs text-[#52525B] font-mono">
        Current:{' '}
        <span className={STEP_COLORS[status].label + ' font-medium'}>
          {STEPS[currentIndex].label}
        </span>
        {' '}— click a step to update
      </p>
    </section>
  )
}
