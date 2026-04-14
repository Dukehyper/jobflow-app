'use client'

import { useState } from 'react'
import type { Experience } from '@/types'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'

interface ExperienceSectionProps {
  experiences: Experience[]
  onAdd: (exp: Experience) => void
  onUpdate: (exp: Experience) => void
  onDelete: (id: string) => void
}

type ExperienceFormData = Omit<Experience, 'id' | 'user_id'>

const EMPTY_FORM: ExperienceFormData = {
  role: '',
  company: '',
  start_date: '',
  end_date: null,
  is_current: false,
  bullets: [''],
}

interface ExperienceCardProps {
  experience: Experience
  onUpdate: (exp: Experience) => void
  onDelete: (id: string) => void
}

function ExperienceCard({ experience, onUpdate, onDelete }: ExperienceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ExperienceFormData>({
    role: experience.role,
    company: experience.company,
    start_date: experience.start_date,
    end_date: experience.end_date,
    is_current: experience.is_current,
    bullets: experience.bullets.length > 0 ? experience.bullets : [''],
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'deleting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async () => {
    if (!form.role.trim() || !form.company.trim() || !form.start_date) return
    setStatus('saving')
    const payload: ExperienceFormData = {
      ...form,
      end_date: form.is_current ? null : form.end_date,
      bullets: form.bullets.filter((b) => b.trim().length > 0),
    }
    try {
      const res = await fetch(`/api/profile/experiences/${experience.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { data: Experience | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Save failed')
      onUpdate(json.data!)
      setEditing(false)
      setStatus('idle')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save')
      setStatus('error')
    }
  }

  const handleDelete = async () => {
    setStatus('deleting')
    try {
      const res = await fetch(`/api/profile/experiences/${experience.id}`, {
        method: 'DELETE',
      })
      const json = (await res.json()) as { error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Delete failed')
      onDelete(experience.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete')
      setStatus('error')
      setConfirmDelete(false)
    }
  }

  const addBullet = () => setForm((f) => ({ ...f, bullets: [...f.bullets, ''] }))

  const removeBullet = (i: number) =>
    setForm((f) => ({ ...f, bullets: f.bullets.filter((_, idx) => idx !== i) }))

  const updateBullet = (i: number, val: string) =>
    setForm((f) => {
      const bullets = [...f.bullets]
      bullets[i] = val
      return { ...f, bullets }
    })

  const dateRange = experience.is_current
    ? `${experience.start_date} — Present`
    : `${experience.start_date}${experience.end_date ? ` — ${experience.end_date}` : ''}`

  return (
    <div className="card-elevated rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-semibold text-[#FAFAFA] truncate">
            {experience.role || 'Untitled Role'}
          </p>
          <p className="text-xs text-[#A1A1AA] truncate">
            {experience.company} · {dateRange}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditing((e) => !e)
              setExpanded(true)
            }}
            className="btn-ghost px-2 py-1 text-xs min-h-[36px]"
            aria-label={editing ? 'Cancel editing' : 'Edit experience'}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="btn-ghost px-2 py-1 min-h-[36px]"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronUp size={15} aria-hidden="true" />
            ) : (
              <ChevronDown size={15} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#27272A] px-4 py-4">
          {editing ? (
            <div className="space-y-4">
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-xs" role="alert">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`role-${experience.id}`} className="label">
                    Job Title / Role
                  </label>
                  <input
                    id={`role-${experience.id}`}
                    type="text"
                    className="input"
                    placeholder="Software Engineer"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor={`company-${experience.id}`} className="label">
                    Company
                  </label>
                  <input
                    id={`company-${experience.id}`}
                    type="text"
                    className="input"
                    placeholder="Acme Corp"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor={`start-${experience.id}`} className="label">
                    Start Date
                  </label>
                  <input
                    id={`start-${experience.id}`}
                    type="month"
                    className="input"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor={`end-${experience.id}`} className="label">
                    End Date
                  </label>
                  <input
                    id={`end-${experience.id}`}
                    type="month"
                    className="input"
                    value={form.end_date ?? ''}
                    disabled={form.is_current}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_date: e.target.value || null }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`current-${experience.id}`}
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#27272A] bg-[#18181B] accent-blue-600"
                  checked={form.is_current}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_current: e.target.checked, end_date: null }))
                  }
                />
                <label
                  htmlFor={`current-${experience.id}`}
                  className="text-sm text-[#A1A1AA] cursor-pointer"
                >
                  I currently work here
                </label>
              </div>

              {/* Bullets */}
              <div>
                <p className="label mb-2">Achievements / Responsibilities</p>
                <div className="space-y-2">
                  {form.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#71717A] mt-2.5 text-xs shrink-0" aria-hidden="true">
                        •
                      </span>
                      <input
                        type="text"
                        className="input flex-1"
                        placeholder="e.g. Led migration of monolith to microservices, reducing latency by 40%"
                        value={bullet}
                        onChange={(e) => updateBullet(i, e.target.value)}
                        aria-label={`Bullet point ${i + 1}`}
                      />
                      {form.bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBullet(i)}
                          className="btn-ghost px-2 py-2 min-h-[44px] text-red-400 hover:text-red-300 mt-0"
                          aria-label={`Remove bullet ${i + 1}`}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBullet}
                  className="btn-ghost mt-2 text-xs px-2 py-1.5 min-h-[36px]"
                >
                  <Plus size={13} aria-hidden="true" />
                  Add bullet
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={status === 'saving'}
                    className="btn-primary"
                  >
                    {status === 'saving' && (
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                    )}
                    {status === 'saving' ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>

                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="btn-danger"
                    aria-label="Delete this experience"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Are you sure?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={status === 'deleting'}
                      className="btn-danger"
                    >
                      {status === 'deleting' ? (
                        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      ) : (
                        'Confirm Delete'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ul className="space-y-1.5" aria-label="Experience bullets">
              {experience.bullets.length > 0 ? (
                experience.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#A1A1AA]">
                    <span className="text-[#71717A] shrink-0 mt-0.5" aria-hidden="true">
                      •
                    </span>
                    {b}
                  </li>
                ))
              ) : (
                <li className="text-xs text-[#71717A] italic">
                  No bullet points yet — click Edit to add achievements.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

interface AddExperienceFormProps {
  onAdd: (exp: Experience) => void
  onCancel: () => void
}

function AddExperienceForm({ onAdd, onCancel }: AddExperienceFormProps) {
  const [form, setForm] = useState<ExperienceFormData>(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!form.role.trim() || !form.company.trim() || !form.start_date) return
    setStatus('saving')
    const payload: ExperienceFormData = {
      ...form,
      end_date: form.is_current ? null : form.end_date,
      bullets: form.bullets.filter((b) => b.trim().length > 0),
    }
    try {
      const res = await fetch('/api/profile/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { data: Experience | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to add')
      onAdd(json.data!)
      setStatus('idle')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add')
      setStatus('error')
    }
  }

  const addBullet = () => setForm((f) => ({ ...f, bullets: [...f.bullets, ''] }))
  const removeBullet = (i: number) =>
    setForm((f) => ({ ...f, bullets: f.bullets.filter((_, idx) => idx !== i) }))
  const updateBullet = (i: number, val: string) =>
    setForm((f) => {
      const bullets = [...f.bullets]
      bullets[i] = val
      return { ...f, bullets }
    })

  return (
    <div className="card border-blue-800/40 p-4 space-y-4">
      <p className="text-xs text-[#71717A] font-mono uppercase tracking-wider">New Experience</p>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-xs" role="alert">
          <AlertCircle size={13} aria-hidden="true" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="new-role" className="label">
            Job Title / Role
          </label>
          <input
            id="new-role"
            type="text"
            className="input"
            placeholder="Software Engineer"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="new-company" className="label">
            Company
          </label>
          <input
            id="new-company"
            type="text"
            className="input"
            placeholder="Acme Corp"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="new-start" className="label">
            Start Date
          </label>
          <input
            id="new-start"
            type="month"
            className="input"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="new-end" className="label">
            End Date
          </label>
          <input
            id="new-end"
            type="month"
            className="input"
            value={form.end_date ?? ''}
            disabled={form.is_current}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_date: e.target.value || null }))
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="new-current"
          type="checkbox"
          className="w-4 h-4 rounded border-[#27272A] bg-[#18181B] accent-blue-600"
          checked={form.is_current}
          onChange={(e) =>
            setForm((f) => ({ ...f, is_current: e.target.checked, end_date: null }))
          }
        />
        <label htmlFor="new-current" className="text-sm text-[#A1A1AA] cursor-pointer">
          I currently work here
        </label>
      </div>

      <div>
        <p className="label mb-2">Achievements / Responsibilities</p>
        <div className="space-y-2">
          {form.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#71717A] mt-2.5 text-xs shrink-0" aria-hidden="true">
                •
              </span>
              <input
                type="text"
                className="input flex-1"
                placeholder="e.g. Reduced deployment time by 60% via CI/CD pipeline automation"
                value={bullet}
                onChange={(e) => updateBullet(i, e.target.value)}
                aria-label={`Bullet point ${i + 1}`}
              />
              {form.bullets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBullet(i)}
                  className="btn-ghost px-2 py-2 min-h-[44px] text-red-400 hover:text-red-300"
                  aria-label={`Remove bullet ${i + 1}`}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addBullet}
          className="btn-ghost mt-2 text-xs px-2 py-1.5 min-h-[36px]"
        >
          <Plus size={13} aria-hidden="true" />
          Add bullet
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'saving' || !form.role.trim() || !form.company.trim()}
          className="btn-primary"
        >
          {status === 'saving' && (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          )}
          {status === 'saving' ? 'Adding…' : 'Add Experience'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function ExperienceSection({ experiences, onAdd, onUpdate, onDelete }: ExperienceSectionProps) {
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (exp: Experience) => {
    onAdd(exp)
    setShowForm(false)
  }

  return (
    <section aria-labelledby="experience-heading" className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="experience-heading" className="section-title">
          Work Experience
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-secondary text-xs px-3"
          >
            <Plus size={13} aria-hidden="true" />
            Add
          </button>
        )}
      </div>

      {experiences.length === 0 && !showForm && (
        <p className="text-sm text-[#71717A] italic">
          No work experience added yet. Click Add to get started.
        </p>
      )}

      <div className="space-y-3">
        {experiences.map((exp) => (
          <ExperienceCard
            key={exp.id}
            experience={exp}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>

      {showForm && (
        <AddExperienceForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      )}
    </section>
  )
}
