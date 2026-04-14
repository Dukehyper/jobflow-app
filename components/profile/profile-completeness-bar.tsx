'use client'

import type { ProfileCompleteness } from '@/types'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ProfileCompletenessBarProps {
  completeness: ProfileCompleteness
}

export function ProfileCompletenessBar({ completeness }: ProfileCompletenessBarProps) {
  const { score, missing } = completeness
  const isLow = score < 60
  const isComplete = score >= 100

  const barColor =
    score < 40
      ? 'bg-red-500'
      : score < 60
        ? 'bg-amber-500'
        : score < 80
          ? 'bg-blue-500'
          : 'bg-emerald-500'

  return (
    <div className="card p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label mb-0.5">Profile Strength</p>
          <p className="text-[#71717A] text-xs mt-1">
            {isComplete
              ? 'Your profile is complete — AI generation is fully unlocked.'
              : `${missing.length} item${missing.length !== 1 ? 's' : ''} needed to unlock full AI quality.`}
          </p>
        </div>
        <span
          className="font-mono text-4xl font-bold leading-none shrink-0"
          aria-label={`Profile completeness: ${score} percent`}
          style={{
            color:
              score < 40
                ? '#EF4444'
                : score < 60
                  ? '#F59E0B'
                  : score < 80
                    ? '#2563EB'
                    : '#10B981',
          }}
        >
          {score}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-2.5 bg-[#27272A] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completeness progress"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Warning */}
      {isLow && (
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 px-3 py-2.5">
          <AlertTriangle
            size={15}
            className="text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-amber-300 leading-relaxed">
            Complete your profile to unlock AI generation — CVs, cover letters, and interview
            answers are only as good as the data you provide here.
          </p>
        </div>
      )}

      {/* Missing items */}
      {missing.length > 0 && (
        <div>
          <p className="label mb-2">What&apos;s missing</p>
          <ul className="space-y-1.5" aria-label="Missing profile items">
            {missing.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#3F3F46] shrink-0"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Complete state */}
      {isComplete && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>All sections complete — AI features are fully powered.</span>
        </div>
      )}
    </div>
  )
}
