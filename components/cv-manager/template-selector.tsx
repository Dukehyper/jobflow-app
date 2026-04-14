'use client'

import { useState } from 'react'
import type { CVType } from '@/types'

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------
export type TemplateId = 'classic' | 'modern' | 'compact' | 'minimal'

interface Template {
  id: TemplateId
  name: string
  description: string
}

const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Two-column header, single-column body. Clean and traditional.',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Full-width header with blue accent bar, timeline experience.',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense information layout — maximises space on one page.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Maximum whitespace, centred name. Stark and refined.',
  },
]

// ---------------------------------------------------------------------------
// Mock visual previews — pure CSS/div representations of each template layout
// ---------------------------------------------------------------------------
function ClassicPreview() {
  return (
    <div className="w-full h-full flex flex-col gap-1 p-2" aria-hidden="true">
      {/* Two-column header */}
      <div className="flex gap-1 pb-1 border-b border-zinc-600">
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="h-1.5 w-16 bg-zinc-300 rounded-sm" />
          <div className="h-1 w-10 bg-zinc-500 rounded-sm" />
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="h-1 w-12 bg-zinc-500 rounded-sm" />
          <div className="h-1 w-10 bg-zinc-500 rounded-sm" />
        </div>
      </div>
      {/* Single-column body */}
      <div className="flex flex-col gap-0.5 mt-0.5">
        <div className="h-1 w-8 bg-zinc-500 rounded-sm" />
        <div className="h-1 w-full bg-zinc-600 rounded-sm" />
        <div className="h-1 w-full bg-zinc-600 rounded-sm" />
        <div className="h-1 w-3/4 bg-zinc-600 rounded-sm" />
      </div>
      <div className="flex flex-col gap-0.5 mt-0.5">
        <div className="h-1 w-8 bg-zinc-500 rounded-sm" />
        <div className="h-1 w-full bg-zinc-600 rounded-sm" />
        <div className="h-1 w-5/6 bg-zinc-600 rounded-sm" />
      </div>
    </div>
  )
}

function ModernPreview() {
  return (
    <div className="w-full h-full flex flex-col gap-1" aria-hidden="true">
      {/* Full-width blue accent header */}
      <div className="w-full bg-blue-600 p-2 flex flex-col gap-0.5">
        <div className="h-2 w-16 bg-white/80 rounded-sm" />
        <div className="h-1 w-10 bg-blue-200 rounded-sm" />
        <div className="h-1 w-14 bg-blue-200 rounded-sm" />
      </div>
      {/* Timeline experience rows */}
      <div className="flex-1 flex flex-col gap-1 px-2 pt-0.5">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-1.5 items-start">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {i === 1 && <div className="w-px h-3 bg-zinc-600" />}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="h-1 w-12 bg-zinc-400 rounded-sm" />
              <div className="h-1 w-8 bg-zinc-600 rounded-sm" />
              <div className="h-1 w-16 bg-zinc-600 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompactPreview() {
  return (
    <div className="w-full h-full flex flex-col gap-0.5 p-2" aria-hidden="true">
      {/* Dense header */}
      <div className="flex items-center justify-between pb-0.5 border-b border-zinc-600">
        <div className="h-1.5 w-12 bg-zinc-300 rounded-sm" />
        <div className="flex gap-1">
          <div className="h-1 w-8 bg-zinc-500 rounded-sm" />
          <div className="h-1 w-6 bg-zinc-500 rounded-sm" />
        </div>
      </div>
      {/* Dense rows — smaller gaps */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-1 items-center">
          <div className="h-1 w-6 bg-zinc-500 rounded-sm shrink-0" />
          <div className="h-1 flex-1 bg-zinc-600 rounded-sm" />
          <div className="h-1 w-8 bg-zinc-700 rounded-sm shrink-0" />
        </div>
      ))}
      <div className="mt-0.5 flex flex-wrap gap-0.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-1.5 w-5 bg-zinc-600 rounded" />
        ))}
      </div>
    </div>
  )
}

function MinimalPreview() {
  return (
    <div className="w-full h-full flex flex-col items-center gap-1.5 p-2 justify-center" aria-hidden="true">
      {/* Centered name — stark */}
      <div className="h-2 w-14 bg-zinc-200 rounded-sm" />
      <div className="h-px w-full bg-zinc-500" />
      {/* Wide-spaced content blocks */}
      <div className="flex flex-col items-center gap-0.5 mt-0.5">
        <div className="h-1 w-8 bg-zinc-500 rounded-sm" />
        <div className="h-1 w-16 bg-zinc-700 rounded-sm" />
        <div className="h-1 w-12 bg-zinc-700 rounded-sm" />
      </div>
      <div className="h-px w-3/4 bg-zinc-700" />
      <div className="flex flex-col items-center gap-0.5">
        <div className="h-1 w-6 bg-zinc-500 rounded-sm" />
        <div className="h-1 w-14 bg-zinc-700 rounded-sm" />
      </div>
    </div>
  )
}

const PREVIEW_MAP: Record<TemplateId, React.FC> = {
  classic: ClassicPreview,
  modern: ModernPreview,
  compact: CompactPreview,
  minimal: MinimalPreview,
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TemplateSelectorProps {
  cvType: CVType
  selectedTemplateId: TemplateId | null
  onSelect: (templateId: TemplateId) => Promise<void>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TemplateSelector({
  cvType: _cvType,
  selectedTemplateId,
  onSelect,
}: TemplateSelectorProps) {
  const [saving, setSaving] = useState<TemplateId | null>(null)
  const [savedId, setSavedId] = useState<TemplateId | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(id: TemplateId) {
    if (id === selectedTemplateId || saving) return
    setSaving(id)
    setError(null)
    try {
      await onSelect(id)
      setSavedId(id)
      setTimeout(() => setSavedId(null), 2000)
    } catch {
      setError('Failed to save template. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <section aria-label="Template selector">
      <p className="label mb-3">Choose a template</p>

      {/* Horizontal scroll on mobile, 4-col grid on desktop */}
      <div
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
        role="radiogroup"
        aria-label="CV templates"
      >
        {TEMPLATES.map((tpl) => {
          const PreviewComp = PREVIEW_MAP[tpl.id]
          const isSelected = selectedTemplateId === tpl.id
          const isSaving = saving === tpl.id
          const justSaved = savedId === tpl.id

          return (
            <button
              key={tpl.id}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${tpl.name} template: ${tpl.description}`}
              onClick={() => handleSelect(tpl.id)}
              disabled={!!saving}
              className={[
                'group relative flex-shrink-0 w-36 md:w-auto flex flex-col rounded-xl border-2 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                isSelected
                  ? 'border-blue-500 bg-[#111113]'
                  : 'border-[#27272A] bg-[#111113] hover:border-[#3F3F46]',
              ].join(' ')}
            >
              {/* Visual mock preview */}
              <div
                className={[
                  'w-full h-28 rounded-t-[10px] overflow-hidden bg-zinc-800',
                  isSelected ? 'ring-0' : '',
                ].join(' ')}
              >
                <PreviewComp />
              </div>

              {/* Label area */}
              <div className="px-2.5 py-2 text-left">
                <p
                  className={[
                    'text-xs font-mono font-semibold',
                    isSelected ? 'text-blue-400' : 'text-[#FAFAFA]',
                  ].join(' ')}
                >
                  {tpl.name}
                  {isSaving && (
                    <span className="ml-1 text-zinc-400 font-normal">saving…</span>
                  )}
                  {justSaved && !isSaving && (
                    <span className="ml-1 text-emerald-400 font-normal">saved</span>
                  )}
                </p>
                <p className="text-[10px] text-[#71717A] leading-snug mt-0.5">
                  {tpl.description}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"
                >
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 10 10"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="1.5,5 4,7.5 8.5,2.5" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </section>
  )
}
