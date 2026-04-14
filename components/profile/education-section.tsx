'use client'

import { useState } from 'react'
import type { Education } from '@/types'
import { Plus, Trash2, Loader2, AlertCircle, Pencil, X } from 'lucide-react'

interface EducationSectionProps {
  education: Education[]
  onAdd: (edu: Education) => void
  onUpdate: (edu: Education) => void
  onDelete: (id: string) => void
}

type EducationFormData = Omit<Education, 'id' | 'user_id'>

const EMPTY_EDU: EducationFormData = {
  institution: '',
  degree: '',
  field: '',
  start_date: '',
  end_date: null,
}

interface EducationCardProps {
  education: Education
  onUpdate: (edu: Education) => void
  onDelete: (id: string) => void
}

function EducationCard({ education, onUpdate, onDelete }: EducationCardProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EducationFormData>({
    institution: education.institution,
    degree: education.degree,
    field: education.field,
    start_date: education.start_date,
    end_date: education.end_date,
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'deleting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async () => {
    if (!form.institution.trim() || !form.degree.trim()) return
    setStatus('saving')
    try {
      const res = await fetch(`/api/profile/education/${education.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = (await res.json()) as { data: Education | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Save failed')
      onUpdate(json.data!)
      setEditing(false)
      setStatus('idle')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed')
      setStatus('error')
    }
  }

  const handleDelete = async () => {
    setStatus('deleting')
    try {
      const res = await fetch(`/api/profile/education/${education.id}`, { method: 'DELETE' })
      const json = (await res.json()) as { error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Delete failed')
      onDelete(education.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed')
      setStatus('error')
      setConfirmDelete(false)
    }
  }

  if (editing) {
    return (
      <div className="card-elevated rounded-xl p-4 space-y-4">
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-xs" role="alert">
            <AlertCircle size={13} aria-hidden="true" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor={`institution-${education.id}`} className="label">
              Institution
            </label>
            <input
              id={`institution-${education.id}`}
              type="text"
              className="input"
              placeholder="University of London"
              value={form.institution}
              onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor={`degree-${education.id}`} className="label">
              Degree
            </label>
            <input
              id={`degree-${education.id}`}
              type="text"
              className="input"
              placeholder="Bachelor of Science"
              value={form.degree}
              onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor={`field-${education.id}`} className="label">
              Field of Study
            </label>
            <input
              id={`field-${education.id}`}
              type="text"
              className="input"
              placeholder="Computer Science"
              value={form.field}
              onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor={`edu-start-${education.id}`} className="label">
              Start Date
            </label>
            <input
              id={`edu-start-${education.id}`}
              type="month"
              className="input"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor={`edu-end-${education.id}`} className="label">
              End Date
            </label>
            <input
              id={`edu-end-${education.id}`}
              type="month"
              className="input"
              value={form.end_date ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, end_date: e.target.value || null }))
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
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
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
              Cancel
            </button>
          </div>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn-danger"
              aria-label="Delete education"
            >
              <Trash2 size={13} aria-hidden="true" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Sure?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={status === 'deleting'}
                className="btn-danger"
              >
                {status === 'deleting' ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card-elevated rounded-xl flex items-start gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-semibold text-[#FAFAFA]">{education.institution}</p>
        <p className="text-xs text-[#A1A1AA]">
          {education.degree}
          {education.field ? ` · ${education.field}` : ''}
        </p>
        <p className="text-xs text-[#71717A] mt-0.5">
          {education.start_date}
          {education.end_date ? ` — ${education.end_date}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="btn-ghost px-2 py-1 min-h-[36px] shrink-0"
        aria-label={`Edit ${education.institution}`}
      >
        <Pencil size={13} aria-hidden="true" />
      </button>
    </div>
  )
}

interface AddEducationFormProps {
  onAdd: (edu: Education) => void
  onCancel: () => void
}

function AddEducationForm({ onAdd, onCancel }: AddEducationFormProps) {
  const [form, setForm] = useState<EducationFormData>(EMPTY_EDU)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!form.institution.trim() || !form.degree.trim()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/profile/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = (await res.json()) as { data: Education | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to add')
      onAdd(json.data!)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add')
      setStatus('error')
    }
  }

  return (
    <div className="card border-blue-800/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#71717A] font-mono uppercase tracking-wider">New Education</p>
        <button type="button" onClick={onCancel} className="btn-ghost px-2 py-1 min-h-[36px]">
          <X size={13} aria-hidden="true" />
        </button>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-xs" role="alert">
          <AlertCircle size={13} aria-hidden="true" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="new-institution" className="label">
            Institution
          </label>
          <input
            id="new-institution"
            type="text"
            className="input"
            placeholder="University of London"
            value={form.institution}
            onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="new-degree" className="label">
            Degree
          </label>
          <input
            id="new-degree"
            type="text"
            className="input"
            placeholder="Bachelor of Science"
            value={form.degree}
            onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="new-field" className="label">
            Field of Study
          </label>
          <input
            id="new-field"
            type="text"
            className="input"
            placeholder="Computer Science"
            value={form.field}
            onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="new-edu-start" className="label">
            Start Date
          </label>
          <input
            id="new-edu-start"
            type="month"
            className="input"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="new-edu-end" className="label">
            End Date
          </label>
          <input
            id="new-edu-end"
            type="month"
            className="input"
            value={form.end_date ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_date: e.target.value || null }))
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'saving' || !form.institution.trim() || !form.degree.trim()}
          className="btn-primary"
        >
          {status === 'saving' && (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          )}
          {status === 'saving' ? 'Adding…' : 'Add Education'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function EducationSection({ education, onAdd, onUpdate, onDelete }: EducationSectionProps) {
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (edu: Education) => {
    onAdd(edu)
    setShowForm(false)
  }

  return (
    <section aria-labelledby="education-heading" className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="education-heading" className="section-title">
          Education
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

      {education.length === 0 && !showForm && (
        <p className="text-sm text-[#71717A] italic">No education added yet.</p>
      )}

      <div className="space-y-3">
        {education.map((edu) => (
          <EducationCard key={edu.id} education={edu} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>

      {showForm && <AddEducationForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />}
    </section>
  )
}
