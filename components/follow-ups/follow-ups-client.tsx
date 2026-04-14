'use client'

import { useState, useMemo, useCallback } from 'react'
import { Mail, Info } from 'lucide-react'
import type { FollowUp, FollowUpStatus } from '@/types'
import { FollowUpCard } from './follow-up-card'
import { FollowUpEmailModal } from './follow-up-email-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | FollowUpStatus

interface FollowUpsClientProps {
  initialFollowUps: FollowUp[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts the job_id from a follow-up. The joined jobs table includes the id
 * when selecting `jobs(id, title, company, applied_at)`.
 */
function getJobId(followUp: FollowUp): string {
  // The join returns jobs as an object with id included
  const job = followUp.job as (FollowUp['job'] & { id?: string }) | undefined
  return job?.id ?? followUp.job_id
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowUpsClient({ initialFollowUps }: FollowUpsClientProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [activeModal, setActiveModal] = useState<FollowUp | null>(null)

  // ─── Derived lists ────────────────────────────────────────────────────────

  const displayedFollowUps = useMemo<FollowUp[]>(() => {
    if (filter === 'all') return followUps
    return followUps.filter((fu) => fu.status === filter)
  }, [followUps, filter])

  const pendingCount = useMemo(
    () => followUps.filter((fu) => fu.status === 'pending').length,
    [followUps]
  )

  // ─── Mark as sent ─────────────────────────────────────────────────────────

  const handleMarkSent = useCallback(async (id: string) => {
    // Optimistic update
    setFollowUps((prev) =>
      prev.map((fu) =>
        fu.id === id
          ? { ...fu, status: 'sent' as FollowUpStatus, sent_at: new Date().toISOString() }
          : fu
      )
    )

    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() }),
      })

      const json = (await res.json()) as { data: FollowUp | null; error: string | null }

      if (!res.ok || !json.data) {
        // Revert optimistic update
        setFollowUps((prev) =>
          prev.map((fu) =>
            fu.id === id
              ? initialFollowUps.find((i) => i.id === id) ?? fu
              : fu
          )
        )
        console.error('[FollowUpsClient] Mark sent failed:', json.error)
        return
      }

      // Apply server-confirmed data — preserve joined job data
      setFollowUps((prev) =>
        prev.map((fu) =>
          fu.id === id
            ? { ...fu, ...json.data, job: fu.job }
            : fu
        )
      )
    } catch (err) {
      // Revert
      setFollowUps((prev) =>
        prev.map((fu) =>
          fu.id === id
            ? initialFollowUps.find((i) => i.id === id) ?? fu
            : fu
        )
      )
      console.error('[FollowUpsClient] Mark sent error:', err)
    }
  }, [initialFollowUps])

  // ─── Filter pills config ──────────────────────────────────────────────────

  const filterOptions: { value: FilterValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      {/* Page header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="section-title text-2xl">Follow-ups</h1>
          {pendingCount > 0 && (
            <span
              className="badge bg-amber-950 text-amber-400"
              aria-label={`${pendingCount} pending follow-ups`}
            >
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-[#71717A]">
          Copy and send these from your own email client.
        </p>

        {/* Info banner */}
        <div className="flex items-start gap-2.5 mt-4 card p-3 bg-blue-950/20 border-blue-900/50">
          <Info size={15} className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-xs text-blue-300 leading-relaxed">
            Follow-ups are suggested 5–7 days after applying with no status update.
          </p>
        </div>
      </header>

      {/* Filter pills */}
      {followUps.length > 0 && (
        <div
          className="flex gap-1.5 mb-6"
          role="group"
          aria-label="Filter follow-ups by status"
        >
          {filterOptions.map(({ value, label }) => {
            const count =
              value === 'all'
                ? followUps.length
                : followUps.filter((fu) => fu.status === value).length

            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={[
                  'btn text-xs px-3 min-h-[36px]',
                  filter === value ? 'btn-primary' : 'btn-secondary',
                ].join(' ')}
                aria-pressed={filter === value}
                aria-label={`Filter: ${label} (${count})`}
              >
                {label}
                <span className="ml-1 font-mono opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Follow-up list */}
      {displayedFollowUps.length > 0 ? (
        <section aria-label="Follow-up list">
          <div className="flex flex-col gap-3">
            {displayedFollowUps.map((followUp) => (
              <FollowUpCard
                key={followUp.id}
                followUp={followUp}
                jobId={getJobId(followUp)}
                onMarkSent={handleMarkSent}
                onViewEmail={setActiveModal}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState filter={filter} hasItems={followUps.length > 0} />
      )}

      {/* Email modal */}
      {activeModal !== null && (
        <FollowUpEmailModal
          followUp={activeModal}
          onClose={() => setActiveModal(null)}
          onMarkSent={handleMarkSent}
        />
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  filter: FilterValue
  hasItems: boolean
}

function EmptyState({ filter, hasItems }: EmptyStateProps) {
  if (hasItems && filter !== 'all') {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-center">
        <Mail size={40} className="text-[#27272A]" aria-hidden="true" />
        <p className="text-[#71717A] text-sm">
          No {filter} follow-ups match this filter.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-20 gap-6 text-center max-w-md mx-auto">
      <div
        className="w-16 h-16 rounded-2xl bg-[#111113] border border-[#27272A] flex items-center justify-center"
        aria-hidden="true"
      >
        <Mail size={28} className="text-[#52525B]" />
      </div>
      <div>
        <p className="text-[#FAFAFA] font-semibold text-lg mb-1">No follow-ups yet</p>
        <p className="text-[#71717A] text-sm leading-relaxed">
          They appear automatically when you apply to a job.
        </p>
      </div>
    </div>
  )
}
