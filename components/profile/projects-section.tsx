'use client'

import { useState, useRef, useCallback } from 'react'
import type { Project } from '@/types'
import { Plus, Trash2, Loader2, AlertCircle, Pencil, X, ExternalLink } from 'lucide-react'

interface ProjectsSectionProps {
  projects: Project[]
  onAdd: (project: Project) => void
  onUpdate: (project: Project) => void
  onDelete: (id: string) => void
}

type ProjectFormData = Omit<Project, 'id' | 'user_id'>

const EMPTY_PROJECT: ProjectFormData = {
  name: '',
  description: '',
  tech_stack: [],
  outcome: null,
  url: null,
}

interface TechTagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  inputId: string
}

function TechTagInput({ tags, onChange, inputId }: TechTagInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (!trimmed || tags.includes(trimmed)) return
      onChange([...tags, trimmed])
      setValue('')
    },
    [tags, onChange]
  )

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(value)
    } else if (e.key === 'Backspace' && !value && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5 p-2 bg-[#18181B] border border-[#27272A] rounded-lg min-h-[44px] cursor-text focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        onClick={() => inputRef.current?.focus()}
        role="group"
        aria-label="Tech stack tags"
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-950 text-blue-300 font-mono"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-100 focus-visible:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className="flex-1 min-w-[120px] bg-transparent text-sm text-[#FAFAFA] placeholder:text-[#71717A] outline-none py-1 px-1"
          placeholder={tags.length === 0 ? 'React, TypeScript, Postgres…' : 'Add more…'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => value.trim() && addTag(value)}
        />
      </div>
      <p className="mt-1 text-xs text-[#71717A]">Press Enter or comma to add each technology</p>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  onUpdate: (project: Project) => void
  onDelete: (id: string) => void
}

function ProjectCard({ project, onUpdate, onDelete }: ProjectCardProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ProjectFormData>({
    name: project.name,
    description: project.description,
    tech_stack: project.tech_stack,
    outcome: project.outcome,
    url: project.url,
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'deleting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) return
    setStatus('saving')
    try {
      const res = await fetch(`/api/profile/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = (await res.json()) as { data: Project | null; error: string | null }
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
      const res = await fetch(`/api/profile/projects/${project.id}`, { method: 'DELETE' })
      const json = (await res.json()) as { error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Delete failed')
      onDelete(project.id)
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

        <div className="space-y-3">
          <div>
            <label htmlFor={`proj-name-${project.id}`} className="label">
              Project Name
            </label>
            <input
              id={`proj-name-${project.id}`}
              type="text"
              className="input"
              placeholder="My Portfolio Site"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor={`proj-desc-${project.id}`} className="label">
              Description
            </label>
            <textarea
              id={`proj-desc-${project.id}`}
              className="textarea"
              placeholder="What you built and why — be specific about your role and decisions."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor={`proj-tech-${project.id}`} className="label">
              Tech Stack
            </label>
            <TechTagInput
              inputId={`proj-tech-${project.id}`}
              tags={form.tech_stack}
              onChange={(tags) => setForm((f) => ({ ...f, tech_stack: tags }))}
            />
          </div>

          <div>
            <label htmlFor={`proj-outcome-${project.id}`} className="label">
              Outcome / Result
            </label>
            <input
              id={`proj-outcome-${project.id}`}
              type="text"
              className="input"
              placeholder="e.g. 2,000 monthly visitors, featured in TechCrunch"
              value={form.outcome ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, outcome: e.target.value || null }))
              }
            />
          </div>

          <div>
            <label htmlFor={`proj-url-${project.id}`} className="label">
              Project URL
            </label>
            <input
              id={`proj-url-${project.id}`}
              type="url"
              className="input"
              placeholder="https://github.com/you/project"
              value={form.url ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value || null }))}
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
              aria-label="Delete project"
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
    <div className="card-elevated rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-semibold text-[#FAFAFA]">{project.name}</p>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#71717A] hover:text-blue-400 transition-colors"
                aria-label={`Visit ${project.name} (opens in new tab)`}
              >
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-2">{project.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-ghost px-2 py-1 min-h-[36px] shrink-0"
          aria-label={`Edit ${project.name}`}
        >
          <Pencil size={13} aria-hidden="true" />
        </button>
      </div>

      {project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.tech_stack.map((tech) => (
            <span
              key={tech}
              className="inline-block px-1.5 py-0.5 rounded text-xs bg-blue-950 text-blue-300 font-mono"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {project.outcome && (
        <p className="text-xs text-emerald-400 italic">{project.outcome}</p>
      )}
    </div>
  )
}

interface AddProjectFormProps {
  onAdd: (project: Project) => void
  onCancel: () => void
}

function AddProjectForm({ onAdd, onCancel }: AddProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>(EMPTY_PROJECT)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = (await res.json()) as { data: Project | null; error: string | null }
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
        <p className="text-xs text-[#71717A] font-mono uppercase tracking-wider">New Project</p>
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

      <div className="space-y-3">
        <div>
          <label htmlFor="new-proj-name" className="label">
            Project Name
          </label>
          <input
            id="new-proj-name"
            type="text"
            className="input"
            placeholder="Portfolio Website"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="new-proj-desc" className="label">
            Description
          </label>
          <textarea
            id="new-proj-desc"
            className="textarea"
            placeholder="Describe what you built, your role, and the key technical decisions."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="new-proj-tech" className="label">
            Tech Stack
          </label>
          <TechTagInput
            inputId="new-proj-tech"
            tags={form.tech_stack}
            onChange={(tags) => setForm((f) => ({ ...f, tech_stack: tags }))}
          />
        </div>

        <div>
          <label htmlFor="new-proj-outcome" className="label">
            Outcome / Result
            <span className="ml-1 text-[#71717A] normal-case font-sans tracking-normal">
              (optional)
            </span>
          </label>
          <input
            id="new-proj-outcome"
            type="text"
            className="input"
            placeholder="e.g. Shipped to 500+ users, reduced load time by 2s"
            value={form.outcome ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value || null }))}
          />
        </div>

        <div>
          <label htmlFor="new-proj-url" className="label">
            Project URL
            <span className="ml-1 text-[#71717A] normal-case font-sans tracking-normal">
              (optional)
            </span>
          </label>
          <input
            id="new-proj-url"
            type="url"
            className="input"
            placeholder="https://github.com/you/project"
            value={form.url ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value || null }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'saving' || !form.name.trim() || !form.description.trim()}
          className="btn-primary"
        >
          {status === 'saving' && (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          )}
          {status === 'saving' ? 'Adding…' : 'Add Project'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function ProjectsSection({ projects, onAdd, onUpdate, onDelete }: ProjectsSectionProps) {
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (project: Project) => {
    onAdd(project)
    setShowForm(false)
  }

  return (
    <section aria-labelledby="projects-heading" className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="projects-heading" className="section-title">
          Projects
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

      {projects.length === 0 && !showForm && (
        <p className="text-sm text-[#71717A] italic">No projects added yet.</p>
      )}

      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>

      {showForm && <AddProjectForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />}
    </section>
  )
}
