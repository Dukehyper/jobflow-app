'use client'

import type { InterviewRound } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const ROUND_LABELS: Record<InterviewRound, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoundTabProps {
  round: InterviewRound
  count: number
  isActive: boolean
  onClick: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoundTab({ round, count, isActive, onClick }: RoundTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
        'transition-all duration-150 whitespace-nowrap min-h-[44px] min-w-[44px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]',
        isActive
          ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
          : 'bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1F1F23]',
      ].join(' ')}
    >
      <span>{ROUND_LABELS[round]}</span>
      <span
        className={[
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-xs font-mono font-semibold',
          isActive
            ? 'bg-blue-800 text-blue-200'
            : 'bg-[#27272A] text-[#71717A]',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  )
}
