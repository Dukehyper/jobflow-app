'use client'

import { useState, useCallback } from 'react'
import type { CVType } from '@/types'

interface CVTypeSelectorProps {
  jobId: string
  cvType: CVType | null
  onCVTypeChange: (cvType: CVType) => void
}

const CV_TYPES: { value: CVType; label: string; description: string }[] = [
  {
    value: 'career',
    label: 'Career',
    description: 'Professional, achievement-focused',
  },
  {
    value: 'temp',
    label: 'Temp',
    description: 'Practical, reliability-focused',
  },
]

export function CVTypeSelector({ jobId, cvType, onCVTypeChange }: CVTypeSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = useCallback(
    async (selected: CVType) => {
      if (selected === cvType || isUpdating) return

      setIsUpdating(true)
      setError(null)

      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cv_type: selected }),
        })
        const json = await res.json()
        if (!res.ok || json.error) {
          setError(json.error ?? 'Failed to update CV type')
          return
        }
        onCVTypeChange(selected)
      } catch {
        setError('Network error — please try again')
      } finally {
        setIsUpdating(false)
      }
    },
    [jobId, cvType, isUpdating, onCVTypeChange]
  )

  return (
    <section
      aria-labelledby="cv-type-heading"
      className="card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2 id="cv-type-heading" className="section-title">
          CV Type
        </h2>
        {isUpdating && (
          <div
            className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin"
            role="status"
            aria-label="Saving CV type"
          />
        )}
      </div>

      <div
        role="group"
        aria-label="Select CV type"
        className="flex gap-2"
      >
        {CV_TYPES.map((type) => {
          const isActive = cvType === type.value
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleSelect(type.value)}
              disabled={isUpdating}
              aria-pressed={isActive}
              aria-label={`${type.label}: ${type.description}`}
              className={`
                flex-1 flex flex-col items-start gap-0.5 px-4 py-3 rounded-lg border text-left
                transition-all duration-150 focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]
                disabled:cursor-not-allowed min-h-[44px]
                ${
                  isActive
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#FAFAFA]'
                }
              `}
            >
              <span className="text-sm font-mono font-semibold">{type.label}</span>
              <span
                className={`text-xs leading-snug ${
                  isActive ? 'text-blue-100' : 'text-[#71717A]'
                }`}
              >
                {type.description}
              </span>
            </button>
          )
        })}
      </div>

      {!cvType && (
        <p className="text-xs text-amber-400/80 font-mono">
          Select a CV type before generating content
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </section>
  )
}
