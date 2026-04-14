import Link from 'next/link'
import { ArrowRight, Bell, CheckCircle2 } from 'lucide-react'
import type { FollowUp } from '@/types'

interface PendingFollowUpsWidgetProps {
  followUps: FollowUp[]
}

function formatDueDate(dueDateStr: string | null): { label: string; isOverdue: boolean } {
  if (!dueDateStr) return { label: 'No due date', isOverdue: false }

  const dueDate = new Date(dueDateStr)
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const isOverdue = diffMs < 0

  if (isOverdue) {
    const overdueDays = Math.abs(diffDays)
    if (overdueDays === 0) return { label: 'Due today (overdue)', isOverdue: true }
    if (overdueDays === 1) return { label: 'Overdue by 1 day', isOverdue: true }
    return { label: `Overdue by ${overdueDays} days`, isOverdue: true }
  }

  if (diffDays === 0) return { label: 'Due today', isOverdue: false }
  if (diffDays === 1) return { label: 'Due tomorrow', isOverdue: false }
  return { label: `Due in ${diffDays} days`, isOverdue: false }
}

export function PendingFollowUpsWidget({ followUps }: PendingFollowUpsWidgetProps) {
  const visible = followUps.slice(0, 3)

  return (
    <section aria-labelledby="followups-heading" className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 id="followups-heading" className="section-title flex items-center gap-2">
          <Bell size={16} className="text-[#71717A]" aria-hidden="true" />
          Pending Follow-ups
        </h2>
        {followUps.length > 0 && (
          <Link
            href="/follow-ups"
            className="inline-flex items-center gap-1 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="View all follow-ups"
          >
            View all
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Empty state */}
      {visible.length === 0 ? (
        <div
          className="flex items-center gap-3 py-4 text-sm text-[#71717A]"
          role="status"
          aria-label="No pending follow-ups"
        >
          <CheckCircle2 size={16} className="text-[#52525B] shrink-0" aria-hidden="true" />
          <span>No follow-ups due — you&apos;re all caught up.</span>
        </div>
      ) : (
        <ol
          className="flex flex-col divide-y divide-[#1F1F23]"
          aria-label="Pending follow-ups list"
        >
          {visible.map((fu) => {
            const { label: dueDateLabel, isOverdue } = formatDueDate(fu.due_at)

            // Job details come from the joined query
            const jobData = fu.job as { title?: string; company?: string } | undefined
            const roleTitle = jobData?.title ?? 'Unknown role'
            const company = jobData?.company ?? 'Unknown company'

            return (
              <li
                key={fu.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* Left: dot indicator */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span
                    className={[
                      'mt-1.5 inline-block w-2 h-2 rounded-full shrink-0',
                      isOverdue ? 'bg-red-500' : 'bg-amber-400',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#FAFAFA] truncate leading-snug">
                      {roleTitle}
                    </p>
                    <p className="text-xs text-[#71717A] font-mono truncate mt-0.5">
                      {company}
                    </p>
                  </div>
                </div>

                {/* Right: due date */}
                <div className="shrink-0">
                  {fu.due_at && (
                    <time
                      dateTime={fu.due_at}
                      className={[
                        'text-xs font-mono',
                        isOverdue ? 'text-red-400 font-semibold' : 'text-amber-400',
                      ].join(' ')}
                      aria-label={dueDateLabel}
                    >
                      {dueDateLabel}
                    </time>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {/* Show count if more than 3 */}
      {followUps.length > 3 && (
        <div className="mt-3 pt-3 border-t border-[#1F1F23]">
          <Link
            href="/follow-ups"
            className="text-xs text-[#71717A] font-mono hover:text-[#A1A1AA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            + {followUps.length - 3} more pending
          </Link>
        </div>
      )}
    </section>
  )
}
