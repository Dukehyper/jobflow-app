'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, Loader2 } from 'lucide-react'
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

function daysAgo(job: Job): string {
  if (!job.applied_at) return '—'
  return formatDistanceToNow(new Date(job.applied_at), { addSuffix: true })
}

interface JobRowProps {
  job: Job
  onStatusChange: (id: string, status: JobStatus) => void
}

export function JobRow({ job, onStatusChange }: JobRowProps) {
  const router = useRouter()
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

  function handleRowClick(e: React.MouseEvent) {
    // Don't navigate if clicking the action dropdown
    const target = e.target as HTMLElement
    if (target.closest('[data-no-navigate]')) return
    router.push(`/tracker/${job.id}`)
  }

  function handleRowKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/tracker/${job.id}`)
    }
  }

  return (
    <tr
      className="group border-b border-[#27272A] hover:bg-[#18181B] transition-colors duration-100 cursor-pointer"
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
      role="row"
      aria-label={`${job.title} at ${job.company}, status: ${job.status}`}
    >
      {/* Company */}
      <td className="px-4 py-3.5 text-sm font-medium text-[#FAFAFA] whitespace-nowrap">
        {job.company}
      </td>

      {/* Role */}
      <td className="px-4 py-3.5 text-sm text-[#A1A1AA] max-w-[220px]">
        <span className="line-clamp-1">{job.title}</span>
      </td>

      {/* Type */}
      <td className="px-4 py-3.5 text-sm text-[#71717A] whitespace-nowrap">
        {job.cv_type ? CV_TYPE_LABELS[job.cv_type] : <span className="text-[#3F3F46]">—</span>}
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={job.status} />
      </td>

      {/* Days since applied */}
      <td className="px-4 py-3.5 text-sm text-[#71717A] whitespace-nowrap font-mono">
        {daysAgo(job)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right" data-no-navigate>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-md text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
              aria-label={`Change status for ${job.title}`}
              disabled={updating}
              data-no-navigate
              onClick={e => e.stopPropagation()}
            >
              {updating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Status
                  <ChevronDown size={12} />
                </>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[140px] card-elevated shadow-xl py-1 rounded-lg border border-[#27272A]"
              align="end"
              sideOffset={4}
              onClick={e => e.stopPropagation()}
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
      </td>
    </tr>
  )
}
