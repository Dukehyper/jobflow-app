import Link from 'next/link'
import { ArrowRight, Inbox } from 'lucide-react'
import type { Job, JobStatus } from '@/types'

interface RecentJobsProps {
  jobs: Job[]
}

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
}

const STATUS_BADGE_CLASS: Record<JobStatus, string> = {
  saved: 'badge-saved',
  applied: 'badge-applied',
  interview: 'badge-interview',
  rejected: 'badge-rejected',
}

function formatDaysAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

export function RecentJobs({ jobs }: RecentJobsProps) {
  const recent = jobs.slice(0, 5)

  return (
    <section aria-labelledby="recent-jobs-heading" className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 id="recent-jobs-heading" className="section-title">
          Recent Applications
        </h2>
        {jobs.length > 0 && (
          <Link
            href="/tracker"
            className="inline-flex items-center gap-1 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="View all applications in tracker"
          >
            View all
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Empty state */}
      {recent.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 gap-3 text-center"
          role="status"
          aria-label="No applications yet"
        >
          <div className="w-10 h-10 rounded-full bg-[#18181B] flex items-center justify-center" aria-hidden="true">
            <Inbox size={18} className="text-[#52525B]" />
          </div>
          <div>
            <p className="text-sm text-[#A1A1AA] mb-1">No applications yet.</p>
            <p className="text-xs text-[#52525B]">
              Start from your{' '}
              <Link
                href="/collection"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
              >
                collection
              </Link>
              {' '}or add one manually.
            </p>
          </div>
        </div>
      ) : (
        <ol
          className="flex flex-col divide-y divide-[#1F1F23]"
          aria-label="Recent job applications"
        >
          {recent.map((job) => {
            const dateRef = job.applied_at ?? job.created_at
            return (
              <li
                key={job.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* Company + role */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#FAFAFA] truncate leading-snug">
                    {job.title}
                  </p>
                  <p className="text-xs text-[#71717A] font-mono truncate mt-0.5">
                    {job.company}
                  </p>
                </div>

                {/* Status + date */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={STATUS_BADGE_CLASS[job.status]} aria-label={`Status: ${STATUS_LABELS[job.status]}`}>
                    {STATUS_LABELS[job.status]}
                  </span>
                  <time
                    dateTime={dateRef}
                    className="text-xs font-mono text-[#52525B] min-w-[52px] text-right"
                    title={dateRef ? new Date(dateRef).toLocaleDateString() : undefined}
                  >
                    {formatDaysAgo(dateRef)}
                  </time>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
