'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { FollowUp } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FollowUpCardProps {
  followUp: FollowUp
  jobId: string
  onMarkSent: (id: string) => Promise<void>
  onViewEmail: (followUp: FollowUp) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'No due date'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowUpCard({ followUp, jobId, onMarkSent, onViewEmail }: FollowUpCardProps) {
  const [isMarking, setIsMarking] = useState(false)

  const isOverdue =
    followUp.due_at != null
      ? new Date(followUp.due_at) < new Date() && followUp.status === 'pending'
      : false

  const isPending = followUp.status === 'pending'
  const company = followUp.job?.company ?? 'Unknown Company'
  const title = followUp.job?.title ?? 'Unknown Role'

  async function handleMarkSent() {
    setIsMarking(true)
    try {
      await onMarkSent(followUp.id)
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <article
      className={[
        'card p-4 flex flex-col gap-3 transition-colors duration-150',
        isOverdue ? 'border-l-4 border-l-amber-500 bg-amber-950/10' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Follow-up for ${title} at ${company}`}
    >
      {/* Top row: company + title + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/tracker/${jobId}`}
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <p className="text-xs font-mono text-[#71717A] group-hover:text-[#A1A1AA] transition-colors truncate">
              {company}
            </p>
            <h3 className="text-sm font-semibold text-[#FAFAFA] group-hover:text-blue-400 transition-colors leading-snug mt-0.5 truncate">
              {title}
            </h3>
          </Link>
        </div>

        {/* Status badge */}
        {isPending ? (
          <span className="badge bg-amber-950 text-amber-400 shrink-0 mt-0.5" role="status">
            Pending
          </span>
        ) : (
          <span className="badge bg-green-950 text-green-400 shrink-0 mt-0.5" role="status">
            Sent
          </span>
        )}
      </div>

      {/* Due date row */}
      <div className="flex items-center gap-1.5">
        {isOverdue ? (
          <>
            {/* Pulsing dot for overdue */}
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <AlertCircle size={12} className="text-amber-400 shrink-0" aria-hidden="true" />
            <p className="text-xs font-mono text-amber-400" aria-label="Overdue follow-up">
              Overdue — Due {formatDueDate(followUp.due_at)}
            </p>
          </>
        ) : (
          <>
            <Clock size={12} className="text-[#71717A] shrink-0" aria-hidden="true" />
            <p className="text-xs font-mono text-[#71717A]">
              Due {formatDueDate(followUp.due_at)}
            </p>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          className="btn-secondary text-xs px-3 min-h-[40px] flex-1"
          onClick={() => onViewEmail(followUp)}
          aria-label={`View email template for ${title} at ${company}`}
        >
          <Mail size={13} aria-hidden="true" />
          View Email
        </button>

        {isPending && (
          <button
            type="button"
            className="btn-primary text-xs px-3 min-h-[40px] flex-1"
            onClick={handleMarkSent}
            disabled={isMarking}
            aria-busy={isMarking}
            aria-label={`Mark follow-up for ${title} at ${company} as sent`}
          >
            {isMarking ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={13} aria-hidden="true" />
            )}
            {isMarking ? 'Saving…' : 'Mark as Sent'}
          </button>
        )}
      </div>
    </article>
  )
}
