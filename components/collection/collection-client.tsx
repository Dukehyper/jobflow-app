'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus, Bookmark, Search } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import type { CollectionItem, CollectionStatus } from '@/types'
import { CollectionItemCard } from './collection-item-card'
import { AddCollectionModal } from './add-collection-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | CollectionStatus
type SortValue = 'newest' | 'oldest' | 'company'

interface CollectionClientProps {
  initialItems: CollectionItem[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CollectionClient({ initialItems }: CollectionClientProps) {
  const [items, setItems] = useState<CollectionItem[]>(initialItems)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [sort, setSort] = useState<SortValue>('newest')
  const [showModal, setShowModal] = useState(false)
  const [emptyStateUrl, setEmptyStateUrl] = useState('')

  // ─── Derived / sorted list ─────────────────────────────────────────────────

  const displayedItems = useMemo<CollectionItem[]>(() => {
    let result = items.slice()

    if (filter !== 'all') {
      result = result.filter((i) => i.status === filter)
    }

    result.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
      }
      if (sort === 'oldest') {
        return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime()
      }
      // company
      const ac = (a.company ?? '').toLowerCase()
      const bc = (b.company ?? '').toLowerCase()
      return ac < bc ? -1 : ac > bc ? 1 : 0
    })

    return result
  }, [items, filter, sort])

  const graveyardCount = useMemo(
    () => items.filter((i) => differenceInDays(new Date(), new Date(i.saved_at)) >= 7).length,
    [items]
  )

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleAdded(newItem: CollectionItem) {
    setItems((prev) => [newItem, ...prev])
  }

  const handleUpdate = useCallback(
    async (
      id: string,
      updates: Partial<Pick<CollectionItem, 'title' | 'company' | 'notes' | 'status'>>
    ) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )

      try {
        const res = await fetch(`/api/collection/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        const json = (await res.json()) as { data: CollectionItem | null; error: string | null }

        if (!res.ok || !json.data) {
          // Revert optimistic update
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? initialItems.find((i) => i.id === id) ?? item : item
            )
          )
          console.error('[CollectionClient] Update failed:', json.error)
          return
        }

        // Apply server-confirmed data
        setItems((prev) =>
          prev.map((item) => (item.id === id ? (json.data as CollectionItem) : item))
        )
      } catch (err) {
        // Revert
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? initialItems.find((i) => i.id === id) ?? item : item
          )
        )
        console.error('[CollectionClient] Update error:', err)
      }
    },
    [initialItems]
  )

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic remove
    setItems((prev) => prev.filter((item) => item.id !== id))

    try {
      const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // If delete fails, we could restore — for now log and leave
        console.error('[CollectionClient] Delete failed for id:', id)
      }
    } catch (err) {
      console.error('[CollectionClient] Delete error:', err)
    }
  }, [])

  function handleEmptyStateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (emptyStateUrl.trim()) {
      setShowModal(true)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title text-2xl mb-1">Job Collection</h1>
          <p className="text-sm text-[#71717A]">
            Save jobs you&apos;re interested in, then start applications when ready.
          </p>
          {graveyardCount > 0 && (
            <p
              className="mt-2 text-xs text-amber-400 font-mono"
              role="status"
              aria-live="polite"
            >
              {graveyardCount} job{graveyardCount !== 1 ? 's' : ''} saved 7+ days — worth revisiting?
            </p>
          )}
        </div>

        <button
          className="btn-primary shrink-0"
          onClick={() => {
            setEmptyStateUrl('')
            setShowModal(true)
          }}
          aria-label="Add a new job link to collection"
        >
          <Plus size={16} aria-hidden="true" />
          Add Job Link
        </button>
      </header>

      {/* Controls */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {/* Filter pills */}
          <div
            className="flex gap-1.5"
            role="group"
            aria-label="Filter by status"
          >
            {(
              [
                { value: 'all', label: 'All' },
                { value: 'saved', label: 'Saved' },
                { value: 'shortlisted', label: 'Shortlisted' },
              ] as { value: FilterValue; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={[
                  'btn text-xs px-3 min-h-[36px]',
                  filter === value ? 'btn-primary' : 'btn-secondary',
                ].join(' ')}
                aria-pressed={filter === value}
                aria-label={`Filter: ${label}`}
              >
                {label}
                {value === 'all' && (
                  <span className="ml-1 text-[#71717A] font-mono">({items.length})</span>
                )}
                {value !== 'all' && (
                  <span className="ml-1 text-[#71717A] font-mono">
                    ({items.filter((i) => i.status === value).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <label
              htmlFor="collection-sort"
              className="text-xs text-[#71717A] font-mono whitespace-nowrap"
            >
              Sort by
            </label>
            <select
              id="collection-sort"
              className="input min-h-[36px] text-xs py-0 pr-8 w-auto cursor-pointer"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              aria-label="Sort collection items"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>
      )}

      {/* Item grid or empty state */}
      {displayedItems.length > 0 ? (
        <section aria-label="Saved jobs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedItems.map((item) => (
              <CollectionItemCard
                key={item.id}
                item={item}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Filtered empty */}
          {displayedItems.length === 0 && filter !== 'all' && (
            <div className="text-center py-16 text-[#71717A]">
              <p className="text-sm">No {filter} jobs yet.</p>
            </div>
          )}
        </section>
      ) : (
        <EmptyState
          url={emptyStateUrl}
          onUrlChange={setEmptyStateUrl}
          onSubmit={handleEmptyStateSubmit}
          onOpenModal={() => setShowModal(true)}
          filter={filter}
          hasItems={items.length > 0}
        />
      )}

      {/* Add modal */}
      {showModal && (
        <AddCollectionModal
          initialUrl={emptyStateUrl}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  url: string
  onUrlChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onOpenModal: () => void
  filter: FilterValue
  hasItems: boolean
}

function EmptyState({
  url,
  onUrlChange,
  onSubmit,
  onOpenModal,
  filter,
  hasItems,
}: EmptyStateProps) {
  // If there are items but filter returns nothing
  if (hasItems && filter !== 'all') {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-center">
        <Bookmark size={40} className="text-[#27272A]" aria-hidden="true" />
        <p className="text-[#71717A] text-sm">No {filter} jobs match this filter.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-20 gap-6 text-center max-w-md mx-auto">
      <div
        className="w-16 h-16 rounded-2xl bg-[#111113] border border-[#27272A] flex items-center justify-center"
        aria-hidden="true"
      >
        <Bookmark size={28} className="text-[#52525B]" />
      </div>

      <div>
        <p className="text-[#FAFAFA] font-semibold text-lg mb-1">No saved jobs yet</p>
        <p className="text-[#71717A] text-sm leading-relaxed">
          Paste a job link to save it for later, or add a job manually.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full flex flex-col sm:flex-row gap-2"
        aria-label="Quick-add job by URL"
      >
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]"
            aria-hidden="true"
          />
          <input
            type="url"
            className="input pl-8"
            placeholder="Paste a job URL…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            aria-label="Job URL to save"
          />
        </div>
        <button
          type="submit"
          className="btn-primary shrink-0"
          disabled={!url.trim()}
        >
          <Plus size={16} aria-hidden="true" />
          Save
        </button>
      </form>

      <button
        className="btn-secondary w-full"
        onClick={onOpenModal}
      >
        <Plus size={16} aria-hidden="true" />
        Add Job Manually
      </button>
    </div>
  )
}
