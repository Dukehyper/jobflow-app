import type { JobStatus } from '@/types'

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  saved:     { label: 'Saved',     className: 'badge-saved' },
  applied:   { label: 'Applied',   className: 'badge-applied' },
  interview: { label: 'Interview', className: 'badge-interview' },
  rejected:  { label: 'Rejected',  className: 'badge-rejected' },
}

interface StatusBadgeProps {
  status: JobStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`${config.className}${className ? ` ${className}` : ''}`}>
      {config.label}
    </span>
  )
}
