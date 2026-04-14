'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Plus, SlidersHorizontal, FileX } from 'lucide-react'
import { JobRow } from './job-row'
import { JobCard } from './job-card'
import { AddJobModal } from './add-job-modal'
import type { Job, JobStatus, CVType } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = JobStatus | 'all'
type TypeFilter = CVType | 'all'
type SortOption = 'newest' | 'oldest' | 'company_asc' | 'company_desc' | 'status'

const STATUS_PILLS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'saved',     label: 'Saved' },
  { value: 'applied',   label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected',  label: 'Rejected' },
]

const TYPE_PILLS: { value: TypeFilter; label: string }[] = [
  { value: 'all',    label: 'All' },
  { value: 'career', label: 'Career' },
  { value: 'temp',   label: 'Temp' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',       label: 'Newest' },
  { value: 'oldest',       label: 'Oldest' },
  { value: 'company_asc',  label: 'Company A–Z' },
  { value: 'company_desc', label: 'Company Z–A' },
  { value: 'status',       label: 'Status' },
]

const STATUS_SORT_ORDER: Record<JobStatus, number> = {
  interview: 0,
  applied:   1,
  saved:     2,
  rejected:  3,
}

// ─── Sort helper ──────────────────────────────────────────────────────────────

function sortJobs(jobs: Job[], sort: SortOption): Job[] {
  return [...jobs].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'company_asc':
        return a.company.localeCompare(b.company)
      case 'company_desc':
        return b.company.localeCompare(a.company)
      case 'status':
        return STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]
    }
  })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TrackerClientProps {
  initialJobs: Job[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackerClient({ initialJobs }: TrackerClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Derive filter state from URL search params
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter
  const typeFilter = (searchParams.get('type') ?? 'all') as TypeFilter
  const sortOption = (searchParams.get('sort') ?? 'newest') as SortOption

  // Local job list (starts from server-fetched data)
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [modalOpen, setModalOpen] = useState(false)

  // ── URL param helpers ────────────────────────────────────────────────────

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === 'all' || v === 'newest') {
        params.delete(k)
      } else {
        params.set(k, v)
      }
    })
    const qs = params.toString()
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    })
  }

  // ── Filtering + sorting (client-side) ────────────────────────────────────

  const filtered = useMemo(() => {
    let list = jobs
    if (statusFilter !== 'all') {
      list = list.filter(j => j.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      list = list.filter(j => j.cv_type === typeFilter)
    }
    return sortJobs(list, sortOption)
  }, [jobs, statusFilter, typeFilter, sortOption])

  // ── Callbacks ────────────────────────────────────────────────────────────

  const handleJobAdded = useCallback((job: Job) => {
    setJobs(prev => [job, ...prev])
  }, [])

  const handleStatusChange = useCallback((id: string, status: JobStatus) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === id
          ? {
              ...j,
              status,
              applied_at:
                status === 'applied' && !j.applied_at
                  ? new Date().toISOString()
                  : j.applied_at,
            }
          : j
      )
    )
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  const hasJobs = filtered.length > 0

  return (
    <div className="page-container space-y-6">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title text-xl">Job Tracker</h1>
          <p className="text-sm text-[#71717A] mt-1">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'application' : 'applications'}
            {statusFilter !== 'all' || typeFilter !== 'all' ? ' matching filters' : ' total'}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setModalOpen(true)}
          aria-label="Add a job manually"
        >
          <Plus size={16} />
          Add Job
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
          <span className="text-xs font-mono text-[#52525B] mr-1 uppercase tracking-wider">Status</span>
          {STATUS_PILLS.map(pill => (
            <button
              key={pill.value}
              onClick={() => updateParams({ status: pill.value })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                statusFilter === pill.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46]'
              }`}
              aria-pressed={statusFilter === pill.value}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Type pills + sort */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by CV type">
            <span className="text-xs font-mono text-[#52525B] mr-1 uppercase tracking-wider">Type</span>
            {TYPE_PILLS.map(pill => (
              <button
                key={pill.value}
                onClick={() => updateParams({ type: pill.value })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  typeFilter === pill.value
                    ? 'bg-[#3F3F46] text-[#FAFAFA]'
                    : 'bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46]'
                }`}
                aria-pressed={typeFilter === pill.value}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#52525B]" aria-hidden="true" />
            <label htmlFor="sort-select" className="sr-only">Sort by</label>
            <select
              id="sort-select"
              className="bg-[#18181B] border border-[#27272A] text-sm text-[#A1A1AA] rounded-lg px-3 py-1.5 min-h-[36px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors appearance-none pr-8"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              value={sortOption}
              onChange={e => updateParams({ sort: e.target.value })}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── Job list ───────────────────────────────────────────────────────── */}
      {hasJobs ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#27272A]">
            <table className="w-full border-collapse" role="table" aria-label="Job applications">
              <thead>
                <tr className="bg-[#111113] border-b border-[#27272A]">
                  {(['Company', 'Role', 'Type', 'Status', 'Applied', 'Actions'] as const).map(col => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-mono font-medium text-[#52525B] uppercase tracking-wider whitespace-nowrap sticky top-0 bg-[#111113]"
                      scope="col"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup">
                {filtered.map(job => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3" role="list" aria-label="Job applications">
            {filtered.map(job => (
              <div key={job.id} role="listitem">
                <JobCard job={job} onStatusChange={handleStatusChange} />
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ── Empty state ─────────────────────────────────────────────────── */
        <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center mb-4">
            <FileX size={24} className="text-[#52525B]" aria-hidden="true" />
          </div>
          <h2 className="section-title text-base mb-2">
            {statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No matching applications'
              : 'No applications yet'}
          </h2>
          <p className="text-sm text-[#71717A] max-w-xs text-balance">
            {statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Start by adding a job from your collection or manually.'}
          </p>
          <div className="mt-6 flex gap-3 flex-wrap justify-center">
            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                className="btn-secondary"
                onClick={() => {
                  startTransition(() => {
                    router.replace(pathname, { scroll: false })
                  })
                }}
              >
                Clear filters
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={16} />
              Add Job Manually
            </button>
          </div>
        </div>
      )}

      {/* ── Add job modal ─────────────────────────────────────────────────── */}
      <AddJobModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onJobAdded={handleJobAdded}
      />
    </div>
  )
}
