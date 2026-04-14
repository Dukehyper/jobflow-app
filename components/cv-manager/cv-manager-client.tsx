'use client'

import { useState, useCallback } from 'react'
import type { CV, CVType, MasterProfile } from '@/types'
import { TemplateSelector } from './template-selector'
import type { TemplateId } from './template-selector'
import { CVBaseEditor } from './cv-base-editor'
import { CVPreview } from './cv-preview'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CVManagerClientProps {
  careerCV: CV | null
  tempCV: CV | null
  masterProfile: MasterProfile
}

// ---------------------------------------------------------------------------
// CV type metadata
// ---------------------------------------------------------------------------
const CV_TABS: { type: CVType; label: string; description: string }[] = [
  {
    type: 'career',
    label: 'Career CV',
    description: 'Professional, achievement-focused. Use this for permanent roles.',
  },
  {
    type: 'temp',
    label: 'Temp CV',
    description: 'Practical, reliability-focused. Use this for contract and temporary work.',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CVManagerClient({
  careerCV: initialCareerCV,
  tempCV: initialTempCV,
  masterProfile,
}: CVManagerClientProps) {
  const [activeTab, setActiveTab] = useState<CVType>('career')

  // Local CV state — optimistically updated after saves
  const [careerCV, setCareerCV] = useState<CV | null>(initialCareerCV)
  const [tempCV, setTempCV] = useState<CV | null>(initialTempCV)

  const activeCV = activeTab === 'career' ? careerCV : tempCV
  const setActiveCV = activeTab === 'career' ? setCareerCV : setTempCV

  // ── Upsert CV to API ───────────────────────────────────────────────────────
  async function upsertCV(patch: {
    type: CVType
    template_id?: string
    base_content?: Record<string, unknown>
  }): Promise<CV> {
    const res = await fetch('/api/cvs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const json = (await res.json()) as { error?: string }
      throw new Error(json.error ?? 'Failed to save CV')
    }
    const json = (await res.json()) as { data: CV; error: null }
    return json.data
  }

  // ── Template select handler ────────────────────────────────────────────────
  const handleTemplateSelect = useCallback(
    async (templateId: TemplateId) => {
      const updated = await upsertCV({ type: activeTab, template_id: templateId })
      setActiveCV(updated)
    },
    [activeTab, setActiveCV]
  )

  // ── Base content save handler ──────────────────────────────────────────────
  const handleBaseContentSave = useCallback(
    async (content: Record<string, unknown>) => {
      const updated = await upsertCV({ type: activeTab, base_content: content })
      setActiveCV(updated)
    },
    [activeTab, setActiveCV]
  )

  return (
    <div className="page-container">
      {/* Page header */}
      <header className="mb-6">
        <h1 className="section-title text-2xl mb-1">CV Manager</h1>
        <p className="text-sm text-[#71717A]">
          Maintain your base CVs and choose templates. AI tailors them per job application.
        </p>
      </header>

      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 rounded-xl bg-[#111113] border border-[#27272A] w-fit mb-6"
        role="tablist"
        aria-label="CV type"
      >
        {CV_TABS.map(({ type, label }) => (
          <button
            key={type}
            role="tab"
            id={`tab-${type}`}
            aria-selected={activeTab === type}
            aria-controls={`tabpanel-${type}`}
            onClick={() => setActiveTab(type)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium font-mono transition-all duration-150 min-h-[40px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#111113]',
              activeTab === type
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {CV_TABS.map(({ type, description }) => {
        const cv = type === 'career' ? careerCV : tempCV
        const isActive = activeTab === type
        return (
          <div
            key={type}
            id={`tabpanel-${type}`}
            role="tabpanel"
            aria-labelledby={`tab-${type}`}
            hidden={!isActive}
            className={isActive ? 'block' : 'hidden'}
          >
            {/* Description */}
            <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-[#111113] border border-[#27272A] flex items-start gap-2">
              <span
                aria-hidden="true"
                className={[
                  'shrink-0 mt-0.5 inline-block w-2 h-2 rounded-full',
                  type === 'career' ? 'bg-blue-500' : 'bg-amber-400',
                ].join(' ')}
              />
              <p className="text-sm text-[#A1A1AA]">{description}</p>
            </div>

            {/* Template selector */}
            <div className="card p-4 mb-4">
              <TemplateSelector
                cvType={type}
                selectedTemplateId={(cv?.template_id as TemplateId) ?? null}
                onSelect={handleTemplateSelect}
              />
            </div>

            {/* Two-column layout: editor (60%) + preview (40%) */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left — editor (60%) */}
              <div className="flex-[3] min-w-0">
                <div className="card p-4 h-full">
                  <CVBaseEditor
                    cvType={type}
                    initialContent={cv?.base_content ?? null}
                    updatedAt={cv?.updated_at ?? null}
                    onSave={handleBaseContentSave}
                  />
                </div>
              </div>

              {/* Right — preview (40%) */}
              <div className="flex-[2] min-w-0">
                <div className="card p-4 h-full">
                  <CVPreview
                    masterProfile={masterProfile}
                    templateId={(cv?.template_id as TemplateId) ?? null}
                    baseText={
                      typeof cv?.base_content?.text === 'string'
                        ? cv.base_content.text
                        : ''
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
