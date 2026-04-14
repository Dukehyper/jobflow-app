'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, Loader2, Clock } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { StatusBadge } from './status-badge'
import type { Job, JobStatus, CVType } from '@/types'

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'saved',     label: 'Saved' },
  { value: 'applied',   label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected',  label: 'Rejected' },
]

const CV_TYPE_LABELS: Record<CVType, string> = {
  career: 'Career',
  temp:   'Temp',
}

interface JobCardProps {
  job: Job
  onStatusChange: (id: string, status: JobStatus) => void
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const [updating, setUpdating] = useState(false)

  async function handleStatusChange(status: JobStatus) {
    if (status === job.status) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        onStatusChange(job.id, status)
      }
    } finally {
      setUpdating(false)
    }
  }

  const appliedText = job.applied_at
    ? formatDistanceToNow(new Date(job.applied_at), { addSuffix: true })
    : null

  return (
    <div className="card hover:bg-[#18181B] transition-colors duration-100 relative">
      {/* Clickable area — link covers most of the card */}
      <Link
        href={`/tracker/${job.id}`}
        className="block p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-xl"
        aria-label={`View ${job.title} at ${job.company}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-[#FAFAFA] leading-snug truncate">{job.company}</p>
            <p className="text-sm text-[#A1A1AA] mt-0.5 truncate">{job.title}</p>
          </div>
          <StatusBadge status={job.status} className="flex-shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {job.cv_type && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-[#71717A] bg-[#27272A]">
              {CV_TYPE_LABELS[job.cv_type]}
            </span>
          )}
          {appliedText && (
            <span className="inline-flex items-center gap-1 text-xs text-[#52525B] font-mono">
              <Clock size={11} />
              {appliedText}
            </span>
          )}
        </div>
      </Link>

      {/* Status change dropdown — outside the link */}
      <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="inline-flex items-center gap-1 px-2 py-1.5 min-h-[36px] rounded-md text-xs text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
              aria-label={`Change status for ${job.title}`}
              disabled={updating}
            >
              {updating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[140px] card-elevated shadow-xl py-1 rounded-lg border border-[#27272A]"
              align="end"
              sideOffset={4}
            >
              {STATUS_OPTIONS.map(opt => (
                <DropdownMenu.Item
                  key={opt.value}
                  className={`flex items-center px-3 py-2 text-sm cursor-pointer outline-none transition-colors focus:bg-[#27272A] ${
                    job.status === opt.value
                      ? 'text-blue-400 font-medium'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]'
                  }`}
                  onSelect={() => handleStatusChange(opt.value)}
                >
                  {opt.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}
