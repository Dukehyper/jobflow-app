'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  Play,
  Loader2,
  Clock,
  X,
  Check,
} from 'lucide-react'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import type { CollectionItem, CollectionStatus, Job } from '@/types'

interface CollectionItemCardProps {
  item: CollectionItem
  onUpdate: (id: string, updates: Partial<Pick<CollectionItem, 'title' | 'company' | 'notes' | 'status'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function StatusBadge({ status }: { status: CollectionStatus }) {
  if (status === 'shortlisted') {
    return (
      <span className="badge bg-blue-950 text-blue-400" aria-label="Status: Shortlisted">
        shortlisted
      </span>
    )
  }
  return (
    <span className="badge bg-zinc-800 text-zinc-400" aria-label="Status: Saved">
      saved
    </span>
  )
}

export function CollectionItemCard({ item, onUpdate, onDelete }: CollectionItemCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isStartingApp, setIsStartingApp] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [editTitle, setEditTitle] = useState(item.title)
  const [editCompany, setEditCompany] = useState(item.company ?? '')
  const [editNotes, setEditNotes] = useState(item.notes ?? '')

  const daysSaved = differenceInDays(new Date(), new Date(item.saved_at))
  const isOld = daysSaved >= 7
  const savedAgo = formatDistanceToNow(new Date(item.saved_at), { addSuffix: true })

  async function handleToggleStatus() {
    setIsTogglingStatus(true)
    const nextStatus: CollectionStatus = item.status === 'saved' ? 'shortlisted' : 'saved'
    try {
      await onUpdate(item.id, { status: nextStatus })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  async function handleSaveEdit() {
    if (!editTitle.trim()) return
    setIsSavingEdit(true)
    try {
      await onUpdate(item.id, {
        title: editTitle.trim(),
        company: editCompany.trim() || undefined,
        notes: editNotes.trim() || undefined,
      })
      setIsEditing(false)
    } finally {
      setIsSavingEdit(false)
    }
  }

  function handleCancelEdit() {
    setEditTitle(item.title)
    setEditCompany(item.company ?? '')
    setEditNotes(item.notes ?? '')
    setIsEditing(false)
  }

  async function handleDelete() {
    setIsDeletingItem(true)
    try {
      await onDelete(item.id)
    } finally {
      setIsDeletingItem(false)
      setConfirmDelete(false)
    }
  }

  async function handleStartApplication() {
    setIsStartingApp(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          company: item.company ?? 'Unknown Company',
          source_url: item.url ?? undefined,
          notes: item.notes ?? undefined,
        }),
      })

      const json = (await res.json()) as { data: Job | null; error: string | null }

      if (!res.ok || !json.data) {
        console.error('[StartApplication] Failed:', json.error)
        return
      }

      router.push(`/tracker/${json.data.id}`)
    } catch (err) {
      console.error('[StartApplication] Unhandled error:', err)
    } finally {
      setIsStartingApp(false)
    }
  }

  return (
    <article
      className={[
        'card p-4 flex flex-col gap-3 transition-all duration-200',
        isOld
          ? 'border-l-4 border-l-amber-500 bg-amber-950/10'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Job: ${item.title}${item.company ? ` at ${item.company}` : ''}`}
    >
      {/* Graveyard nudge */}
      {isOld && (
        <div
          className="flex items-center gap-1.5 text-amber-400 text-xs font-mono"
          role="status"
          aria-live="polite"
        >
          <Clock size={12} aria-hidden="true" />
          <span>Saved {daysSaved} days ago — still interested?</span>
        </div>
      )}

      {/* Card body — editing vs display */}
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor={`edit-title-${item.id}`} className="label">Job Title *</label>
            <input
              id={`edit-title-${item.id}`}
              className="input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Job title"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor={`edit-company-${item.id}`} className="label">Company</label>
            <input
              id={`edit-company-${item.id}`}
              className="input"
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              placeholder="Company name"
            />
          </div>
          <div>
            <label htmlFor={`edit-notes-${item.id}`} className="label">Notes</label>
            <textarea
              id={`edit-notes-${item.id}`}
              className="textarea min-h-[80px]"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Any notes..."
            />
          </div>
          <div className="flex gap-2">
            <button
              className="btn-primary flex-1"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editTitle.trim()}
              aria-busy={isSavingEdit}
            >
              {isSavingEdit ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Check size={14} aria-hidden="true" />
              )}
              Save
            </button>
            <button
              className="btn-secondary"
              onClick={handleCancelEdit}
              disabled={isSavingEdit}
            >
              <X size={14} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {item.company && (
                <p className="text-xs font-mono text-[#71717A] mb-0.5 truncate">
                  {item.company}
                </p>
              )}
              <h3 className="font-semibold text-[#FAFAFA] leading-snug break-words">
                {item.title}
              </h3>
            </div>
            <StatusBadge status={item.status} />
          </div>

          {/* URL */}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors truncate group"
              aria-label={`Open job listing for ${item.title} in new tab`}
            >
              <ExternalLink
                size={11}
                className="shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{item.url}</span>
            </a>
          )}

          {/* Notes */}
          {item.notes && (
            <p className="text-sm text-[#A1A1AA] line-clamp-2 leading-relaxed">
              {item.notes}
            </p>
          )}

          {/* Footer: date + actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-[#71717A] font-mono">
              Saved {savedAgo}
            </span>

            {/* Icon action buttons */}
            <div className="flex items-center gap-1">
              {/* Toggle shortlist */}
              <button
                className={[
                  'btn-ghost min-h-[44px] min-w-[44px] p-0 rounded-lg',
                  item.status === 'shortlisted' ? 'text-blue-400 hover:text-blue-300' : '',
                ].join(' ')}
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                aria-label={
                  item.status === 'shortlisted'
                    ? 'Remove from shortlist'
                    : 'Add to shortlist'
                }
                aria-pressed={item.status === 'shortlisted'}
              >
                {isTogglingStatus ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Star
                    size={16}
                    aria-hidden="true"
                    fill={item.status === 'shortlisted' ? 'currentColor' : 'none'}
                  />
                )}
              </button>

              {/* Edit */}
              <button
                className="btn-ghost min-h-[44px] min-w-[44px] p-0 rounded-lg"
                onClick={() => setIsEditing(true)}
                aria-label={`Edit ${item.title}`}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>

              {/* Delete / confirm */}
              {confirmDelete ? (
                <div className="flex items-center gap-1" role="group" aria-label="Confirm deletion">
                  <button
                    className="btn-danger text-xs px-2 min-h-[44px]"
                    onClick={handleDelete}
                    disabled={isDeletingItem}
                    aria-busy={isDeletingItem}
                  >
                    {isDeletingItem ? (
                      <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    ) : null}
                    Yes, delete
                  </button>
                  <button
                    className="btn-ghost text-xs px-2 min-h-[44px]"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeletingItem}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn-ghost min-h-[44px] min-w-[44px] p-0 rounded-lg text-[#71717A] hover:text-red-400"
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Start Application CTA */}
          <button
            className="btn-primary w-full mt-1"
            onClick={handleStartApplication}
            disabled={isStartingApp}
            aria-busy={isStartingApp}
            aria-label={`Start application for ${item.title}${item.company ? ` at ${item.company}` : ''}`}
          >
            {isStartingApp ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Play size={16} aria-hidden="true" />
            )}
            {isStartingApp ? 'Creating application…' : 'Start Application'}
          </button>
        </>
      )}
    </article>
  )
}
