'use client'

import { useState, useRef, useCallback } from 'react'
import type { Skill } from '@/types'
import { X, Loader2, AlertCircle } from 'lucide-react'

interface SkillsSectionProps {
  skills: Skill[]
  onAdd: (skill: Skill) => void
  onDelete: (id: string) => void
}

const SKILL_CATEGORIES = [
  'Technical',
  'Programming Languages',
  'Frameworks',
  'Tools & Platforms',
  'Soft Skills',
  'Design',
  'Data & Analytics',
  'Management',
  'Other',
]

// Group skills by category
function groupSkills(skills: Skill[]): Record<string, Skill[]> {
  return skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {})
}

interface SkillTagProps {
  skill: Skill
  onDelete: (id: string) => void
}

function SkillTag({ skill, onDelete }: SkillTagProps) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')

  const handleRemove = async () => {
    setRemoving(true)
    setError('')
    try {
      const res = await fetch(`/api/profile/skills/${skill.id}`, { method: 'DELETE' })
      const json = (await res.json()) as { error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to remove')
      onDelete(skill.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      setRemoving(false)
    }
  }

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono',
        'bg-[#18181B] border border-[#27272A] text-[#A1A1AA]',
        'transition-colors duration-150',
        error ? 'border-red-800 text-red-400' : '',
      ].join(' ')}
      title={error || skill.name}
    >
      {skill.name}
      <button
        type="button"
        onClick={handleRemove}
        disabled={removing}
        className={[
          'inline-flex items-center justify-center w-3.5 h-3.5 rounded-full',
          'text-[#71717A] hover:text-red-400 hover:bg-red-950/50',
          'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
          'disabled:opacity-40',
        ].join(' ')}
        aria-label={`Remove ${skill.name}`}
      >
        {removing ? (
          <Loader2 size={10} className="animate-spin" aria-hidden="true" />
        ) : (
          <X size={10} aria-hidden="true" />
        )}
      </button>
    </span>
  )
}

export function SkillsSection({ skills, onAdd, onDelete }: SkillsSectionProps) {
  const [inputValue, setInputValue] = useState('')
  const [category, setCategory] = useState<string>('Technical')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const grouped = groupSkills(skills)
  const categories = Object.keys(grouped).sort()

  const addSkill = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      // Prevent duplicates
      if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
        setError(`"${trimmed}" already added`)
        return
      }
      setAdding(true)
      setError('')
      try {
        const res = await fetch('/api/profile/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed, category }),
        })
        const json = (await res.json()) as { data: Skill | null; error: string | null }
        if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to add')
        onAdd(json.data!)
        setInputValue('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add')
      } finally {
        setAdding(false)
        inputRef.current?.focus()
      }
    },
    [skills, category, onAdd]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill(inputValue)
    } else if (e.key === 'Escape') {
      setInputValue('')
    }
  }

  return (
    <section aria-labelledby="skills-heading" className="card p-5 space-y-5">
      <h2 id="skills-heading" className="section-title">
        Skills
      </h2>

      {/* Add skill input */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label htmlFor="skill-input" className="label">
              Skill Name
              <span className="ml-1 text-[#71717A] normal-case font-sans tracking-normal">
                (press Enter to add)
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="skill-input"
                type="text"
                className="input pr-12"
                placeholder="e.g. TypeScript, React, Docker…"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  if (error) setError('')
                }}
                onKeyDown={handleKeyDown}
                disabled={adding}
                aria-describedby={error ? 'skill-error' : undefined}
              />
              {adding && (
                <Loader2
                  size={14}
                  className="absolute right-3 animate-spin text-[#71717A]"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
          <div className="sm:w-48">
            <label htmlFor="skill-category" className="label">
              Category
            </label>
            <select
              id="skill-category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:self-end">
            <button
              type="button"
              onClick={() => addSkill(inputValue)}
              disabled={adding || !inputValue.trim()}
              className="btn-secondary w-full sm:w-auto"
              aria-label="Add skill"
            >
              Add
            </button>
          </div>
        </div>

        {error && (
          <p id="skill-error" className="flex items-center gap-1.5 text-xs text-red-400" role="alert">
            <AlertCircle size={12} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>

      {/* Skills display */}
      {skills.length === 0 ? (
        <p className="text-sm text-[#71717A] italic">
          No skills added yet. Type a skill above and press Enter.
        </p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="label mb-2">{cat}</p>
              <div
                className="flex flex-wrap gap-2"
                role="list"
                aria-label={`${cat} skills`}
              >
                {grouped[cat].map((skill) => (
                  <div key={skill.id} role="listitem">
                    <SkillTag skill={skill} onDelete={onDelete} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && skills.length < 5 && (
        <p className="text-xs text-amber-400">
          Add {5 - skills.length} more skill{5 - skills.length !== 1 ? 's' : ''} to meet the
          minimum for AI generation.
        </p>
      )}
    </section>
  )
}
